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

  let body: { action?: unknown };
  try {
    body = await request.json();
  } catch {
    return respond({ error: 'Request body must be valid JSON' }, 400);
  }
  if (body.action !== 'list') return respond({ error: 'Unsupported action' }, 400);

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  const [{ data: posts, error: postsError }, { data: publications, error: publicationsError }] = await Promise.all([
    serviceClient.from('freedom_posts').select('id, message, status, created_at').order('created_at', { ascending: false }).limit(200),
    serviceClient.from('freedom_post_publications').select('freedom_post_id, status, error_message')
  ]);
  if (postsError) return respond({ error: `Could not load Freedom Wall posts: ${postsError.message}` }, 500);
  if (publicationsError) return respond({ error: `Could not load publishing status: ${publicationsError.message}` }, 500);

  const publicationByPost = new Map((publications ?? []).map((item) => [item.freedom_post_id, item]));
  return respond({
    posts: (posts ?? []).map((post) => {
      const publication = publicationByPost.get(post.id);
      return {
        ...post,
        facebook_publish_status: publication?.status ?? 'pending',
        facebook_publish_error: publication?.error_message ?? null
      };
    })
  });
});
