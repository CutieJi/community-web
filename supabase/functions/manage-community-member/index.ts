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

  let body: { action?: unknown; userId?: unknown };
  try {
    body = await request.json();
  } catch {
    return respond({ error: 'Request body must be valid JSON' }, 400);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);
  if (body.action === 'list') {
    const { data, error } = await serviceClient.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) return respond({ error: `Could not load community members: ${error.message}` }, 500);
    const userIds = data.users.map((member) => member.id);
    const { data: profiles, error: profilesError } = userIds.length
      ? await serviceClient.from('profiles').select('id, username').in('id', userIds)
      : { data: [], error: null };
    if (profilesError) return respond({ error: `Could not load member profiles: ${profilesError.message}` }, 500);
    const usernameById = new Map((profiles ?? []).map((profile) => [profile.id, profile.username]));
    const members = data.users.map((member) => ({
      id: member.id,
      email: member.email ?? null,
      username: usernameById.get(member.id) ?? member.user_metadata?.username ?? null,
      created_at: member.created_at,
      isAdmin: member.app_metadata?.role === 'admin',
      suspended: Boolean(member.banned_until && Date.parse(member.banned_until) > Date.now())
    }));
    return respond({ members });
  }

  if ((body.action !== 'suspend' && body.action !== 'restore') || typeof body.userId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.userId)) {
    return respond({ error: 'A valid action and userId are required' }, 400);
  }
  if (body.userId === user.id) return respond({ error: 'You cannot suspend or restore your own account' }, 400);

  const { data: target, error: targetError } = await serviceClient.auth.admin.getUserById(body.userId);
  if (targetError) return respond({ error: `Could not load member: ${targetError.message}` }, 500);
  if (!target.user) return respond({ error: 'Member not found' }, 404);
  if (target.user.app_metadata?.role === 'admin') return respond({ error: 'Admin accounts must be managed through Supabase' }, 403);

  const { error: updateError } = await serviceClient.auth.admin.updateUserById(body.userId, {
    ban_duration: body.action === 'suspend' ? '876000h' : 'none'
  });
  if (updateError) return respond({ error: `Could not update member access: ${updateError.message}` }, 500);
  return respond({ updated: true, suspended: body.action === 'suspend' });
});
