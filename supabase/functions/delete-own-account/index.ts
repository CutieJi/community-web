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

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return respond({ error: 'Authentication required' }, 401);
  if (user.app_metadata?.role === 'admin') {
    return respond({ error: 'Admin accounts must be managed through Supabase after admin access is transferred.' }, 403);
  }
  if (!user.email) return respond({ error: 'This account has no email address to verify.' }, 400);

  let parsedBody: unknown;
  try {
    parsedBody = await request.json();
  } catch {
    return respond({ error: 'Request body must be valid JSON' }, 400);
  }
  if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
    return respond({ error: 'Request body must be a JSON object' }, 400);
  }
  const body = parsedBody as { token?: unknown; confirmationEmail?: unknown };
  if (typeof body.token !== 'string' || typeof body.confirmationEmail !== 'string') {
    return respond({ error: 'A verification code and email confirmation are required.' }, 400);
  }
  if (body.confirmationEmail.trim().toLowerCase() !== user.email.toLowerCase()) {
    return respond({ error: 'The confirmation email does not match the signed-in account.' }, 400);
  }

  const otpClient = createClient(supabaseUrl, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { data: verification, error: verificationError } = await otpClient.auth.verifyOtp({
    email: user.email,
    token: body.token.trim(),
    type: 'recovery'
  });
  if (verificationError || verification.user?.id !== user.id) {
    return respond({ error: 'The verification code is invalid, expired, or for a different account.' }, 403);
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  const { error: deleteError } = await serviceClient.auth.admin.deleteUser(user.id);
  if (deleteError) return respond({ error: `Could not delete the account: ${deleteError.message}` }, 500);

  return respond({ deleted: true });
});
