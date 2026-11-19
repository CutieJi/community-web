import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function respond(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);

  const authorization = request.headers.get('Authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!authorization || !supabaseUrl || !anonKey || !serviceRoleKey) {
    return respond({ error: 'Supabase function configuration is incomplete' }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return respond({ error: 'Authentication required' }, 401);
  if (user.app_metadata?.role !== 'admin') return respond({ error: 'Admin access required' }, 403);

  let body: { postId?: unknown };
  try {
    body = await request.json();
  } catch {
    return respond({ error: 'Request body must be valid JSON' }, 400);
  }
  if (typeof body.postId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.postId)) {
    return respond({ error: 'A valid postId is required' }, 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: post, error: postError } = await serviceClient
    .from('freedom_posts')
    .select('id, message, status')
    .eq('id', body.postId)
    .maybeSingle();
  if (postError) return respond({ error: `Could not load Freedom Wall post: ${postError.message}` }, 500);
  if (!post || post.status !== 'approved') return respond({ error: 'Approved Freedom Wall post not found' }, 404);
  const { data: publication, error: publicationError } = await serviceClient
    .from('freedom_post_publications')
    .select('status, facebook_post_id')
    .eq('freedom_post_id', post.id)
    .maybeSingle();
  if (publicationError) return respond({ error: `Could not load Facebook publication status: ${publicationError.message}` }, 500);
  if (publication?.status === 'published') {
    return respond({ alreadyPublished: true, facebookPostId: publication.facebook_post_id });
  }

  const { error: seedError } = await serviceClient.from('freedom_post_publications')
    .upsert({ freedom_post_id: post.id, status: 'pending' }, { onConflict: 'freedom_post_id', ignoreDuplicates: true });
  if (seedError) return respond({ error: `Could not initialize Facebook publication status: ${seedError.message}` }, 500);

  const pageId = Deno.env.get('META_PAGE_ID');
  const pageToken = Deno.env.get('META_PAGE_ACCESS_TOKEN');
  const apiVersion = Deno.env.get('META_GRAPH_API_VERSION');
  if (!pageId || !pageToken || !apiVersion || !/^v\d+\.\d+$/.test(apiVersion)) {
    const message = 'Meta Page ID, Page access token, and a valid Graph API version must be configured.';
    const { error } = await serviceClient.from('freedom_post_publications')
      .update({ status: 'failed', error_message: message, updated_at: new Date().toISOString() })
      .eq('freedom_post_id', post.id);
    if (error) return respond({ error: `${message} Status update failed: ${error.message}` }, 500);
    return respond({ error: message }, 503);
  }

  const { data: claim, error: claimError } = await serviceClient.from('freedom_post_publications')
    .update({ status: 'publishing', error_message: null, updated_at: new Date().toISOString() })
    .eq('freedom_post_id', post.id)
    .in('status', ['pending', 'failed'])
    .select('freedom_post_id')
    .maybeSingle();
  if (claimError) return respond({ error: `Could not claim the post for publishing: ${claimError.message}` }, 500);
  if (!claim) return respond({ error: 'This post is already being published. Refresh and check its status.' }, 409);

  let graphResponse: Response;
  try {
    graphResponse = await fetch(`https://graph.facebook.com/${apiVersion}/${encodeURIComponent(pageId)}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ message: post.message, access_token: pageToken })
    });
  } catch (error) {
    const message = `Facebook request failed: ${error instanceof Error ? error.message : 'network error'}`;
    const { error: saveError } = await serviceClient.from('freedom_post_publications')
      .update({ status: 'failed', error_message: message, updated_at: new Date().toISOString() })
      .eq('freedom_post_id', post.id);
    if (saveError) return respond({ error: `${message}; status update failed: ${saveError.message}` }, 502);
    return respond({ error: message }, 502);
  }

  let graphResult: { id?: string; error?: { message?: string } };
  try {
    graphResult = await graphResponse.json();
  } catch {
    graphResult = {};
  }
  if (!graphResponse.ok || !graphResult.id) {
    const message = graphResult.error?.message || `Facebook returned HTTP ${graphResponse.status} without a post ID.`;
    const { error: saveError } = await serviceClient.from('freedom_post_publications')
      .update({ status: 'failed', error_message: message, updated_at: new Date().toISOString() })
      .eq('freedom_post_id', post.id);
    if (saveError) return respond({ error: `${message} Status update failed: ${saveError.message}` }, 502);
    return respond({ error: message }, 502);
  }

  const { error: saveError } = await serviceClient.from('freedom_post_publications')
    .update({
      status: 'published',
      facebook_post_id: graphResult.id,
      facebook_published_at: new Date().toISOString(),
      error_message: null,
      updated_at: new Date().toISOString()
    })
    .eq('freedom_post_id', post.id);
  if (saveError) {
    return respond({ error: `Facebook post ${graphResult.id} was created, but its status could not be saved: ${saveError.message}` }, 502);
  }
  return respond({ published: true, facebookPostId: graphResult.id });
});
