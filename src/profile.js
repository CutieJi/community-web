import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from './supabase.js';
const byId = (id) => document.getElementById(id);
let currentUser = null;
let sessionVersion = 0;

function feedback(target, message, error = false) {
  if (!target) return;
  target.textContent = message;
  target.classList.toggle('is-error', error);
  target.classList.toggle('is-visible', Boolean(message));
}

function setBusy(form, busy) {
  form.querySelectorAll('button[type="submit"]').forEach((button) => {
    button.disabled = busy;
  });
}

function formatProviders(user) {
  const providers = user.app_metadata?.providers || [user.app_metadata?.provider].filter(Boolean);
  return [...new Set(providers)].map((provider) => provider === 'email'
    ? 'Email and password'
    : provider.charAt(0).toUpperCase() + provider.slice(1)).join(', ') || 'Not available';
}

function showProfile(user) {
  byId('profile-heading').textContent = user.user_metadata?.username || 'Your account';
  byId('profile-current-email').textContent = user.email || 'Email not available';
  byId('profile-email').value = user.email || '';
  byId('profile-created-at').textContent = user.created_at
    ? new Date(user.created_at).toLocaleDateString()
    : 'Not available';
  byId('profile-providers').textContent = formatProviders(user);

  const isAdmin = user.app_metadata?.role === 'admin';
  byId('delete-account-card').classList.toggle('hidden', isAdmin);
  byId('admin-delete-notice').classList.toggle('hidden', !isAdmin);
}

async function renderProfile(user) {
  const gate = byId('profile-auth-gate');
  const content = byId('profile-content');
  if (!gate || !content) return;

  if (!user) {
    sessionVersion += 1;
    currentUser = null;
    gate.classList.remove('hidden');
    content.classList.add('hidden');
    return;
  }

  const sameUser = currentUser?.id === user.id;
  currentUser = user;
  gate.classList.add('hidden');
  content.classList.remove('hidden');
  showProfile(user);
  if (sameUser) return;

  const version = ++sessionVersion;
  const { data, error } = await supabase.from('profiles').select('username').eq('id', user.id).single();
  if (version !== sessionVersion || currentUser?.id !== user.id) return;
  if (error) {
    feedback(byId('profile-info-feedback'), `Couldn't load your profile: ${error.message}`, true);
    return;
  }
  byId('profile-current-username').textContent = data.username;
  byId('profile-username').value = data.username;
  byId('profile-heading').textContent = data.username;
}

function initializeProfilePage() {
  if (!supabase) {
    feedback(byId('profile-gate-feedback'), 'Supabase is not configured. Add the project URL and publishable/anon key to .env.', true);
    return;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => {
      void renderProfile(session?.user ?? null);
    }, 0);
  });
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      feedback(byId('profile-gate-feedback'), `Couldn't check your sign-in status: ${error.message}`, true);
      return;
    }
    void renderProfile(data.session?.user ?? null);
  });

  byId('profile-logout').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const { error } = await supabase.auth.signOut();
    button.disabled = false;
    if (error) feedback(byId('profile-info-feedback'), `Couldn't log out: ${error.message}`, true);
  });

  byId('profile-username-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser) return;
    const form = event.currentTarget;
    const username = form.elements.username.value.trim();
    if (username.length < 2 || username.length > 32) {
      feedback(byId('profile-info-feedback'), 'Username must be between 2 and 32 characters.', true);
      return;
    }
    setBusy(form, true);
    const { data, error } = await supabase.from('profiles').update({ username })
      .eq('id', currentUser.id).select('id').maybeSingle();
    setBusy(form, false);
    if (error) {
      feedback(byId('profile-info-feedback'), `Couldn't save your username: ${error.message}`, true);
      return;
    }
    if (!data) {
      feedback(byId('profile-info-feedback'), 'Your profile could not be found. Please sign out and back in.', true);
      return;
    }
    byId('profile-current-username').textContent = username;
    byId('profile-heading').textContent = username;
    feedback(byId('profile-info-feedback'), 'Username updated.');
  });

  byId('profile-email-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser?.email) {
      feedback(byId('profile-info-feedback'), 'This account does not have an email address to update.', true);
      return;
    }
    const form = event.currentTarget;
    const email = form.elements.email.value.trim();
    if (email.toLowerCase() === currentUser.email.toLowerCase()) {
      feedback(byId('profile-info-feedback'), 'Enter a different email address.', true);
      return;
    }
    setBusy(form, true);
    const { error } = await supabase.auth.updateUser(
      { email },
      { emailRedirectTo: `${window.location.origin}/profile.html` }
    );
    setBusy(form, false);
    if (error) {
      feedback(byId('profile-info-feedback'), `Couldn't start the email change: ${error.message}`, true);
      return;
    }
    feedback(byId('profile-info-feedback'), 'Check the verification email(s) before the new address takes effect.');
  });

  byId('password-start').addEventListener('click', () => {
    byId('password-request-form').classList.remove('hidden');
    byId('password-otp-form').classList.add('hidden');
    byId('password-update-form').classList.add('hidden');
    feedback(byId('password-request-feedback'), '');
    feedback(byId('password-otp-feedback'), '');
    feedback(byId('password-update-feedback'), '');
  });

  byId('password-request-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser?.email) {
      feedback(byId('password-request-feedback'), 'No email address is available for this account.', true);
      return;
    }
    const form = event.currentTarget;
    setBusy(form, true);
    const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email);
    setBusy(form, false);
    if (error) {
      feedback(byId('password-request-feedback'), `Couldn't send a verification code: ${error.message}`, true);
      return;
    }
    byId('password-otp-form').classList.remove('hidden');
    feedback(byId('password-request-feedback'), `A verification code was sent to ${currentUser.email}.`);
  });

  byId('password-resend').addEventListener('click', async (event) => {
    if (!currentUser?.email) return;
    const button = event.currentTarget;
    button.disabled = true;
    const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email);
    button.disabled = false;
    if (error) {
      feedback(byId('password-otp-feedback'), `Couldn't resend the code: ${error.message}`, true);
      return;
    }
    feedback(byId('password-otp-feedback'), 'A new code was sent. Use the newest code in your email.');
  });

  byId('password-otp-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser?.email) return;
    const form = event.currentTarget;
    setBusy(form, true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: currentUser.email,
      token: form.elements.token.value.trim(),
      type: 'recovery'
    });
    setBusy(form, false);
    if (error) {
      feedback(byId('password-otp-feedback'), `That code could not be verified: ${error.message}`, true);
      return;
    }
    if (!data.session || data.user?.id !== currentUser.id) {
      feedback(byId('password-otp-feedback'), 'The code did not verify this account. Request a new code and try again.', true);
      return;
    }
    byId('password-update-form').classList.remove('hidden');
    form.classList.add('hidden');
  });

  byId('password-update-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const password = form.elements.password.value;
    if (password.length < 8) {
      feedback(byId('password-update-feedback'), 'Use a password with at least 8 characters.', true);
      return;
    }
    if (password !== form.elements.confirmPassword.value) {
      feedback(byId('password-update-feedback'), 'The passwords do not match.', true);
      return;
    }
    setBusy(form, true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(form, false);
    if (error) {
      feedback(byId('password-update-feedback'), `Couldn't update your password: ${error.message}`, true);
      return;
    }
    form.reset();
    byId('password-request-form').classList.add('hidden');
    feedback(byId('password-update-feedback'), 'Your password has been updated.');
  });

  byId('delete-start').addEventListener('click', () => {
    byId('delete-request-form').classList.remove('hidden');
    byId('delete-confirm-form').classList.add('hidden');
    feedback(byId('delete-request-feedback'), '');
    feedback(byId('delete-confirm-feedback'), '');
  });

  byId('delete-request-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser?.email) {
      feedback(byId('delete-request-feedback'), 'This account does not have an email address for verification.', true);
      return;
    }
    const form = event.currentTarget;
    setBusy(form, true);
    const { error } = await supabase.auth.resetPasswordForEmail(currentUser.email);
    setBusy(form, false);
    if (error) {
      feedback(byId('delete-request-feedback'), `Couldn't send a verification code: ${error.message}`, true);
      return;
    }
    byId('delete-confirm-form').classList.remove('hidden');
    byId('delete-email-confirm').value = currentUser.email;
    feedback(byId('delete-request-feedback'), `A verification code was sent to ${currentUser.email}.`);
  });

  byId('delete-confirm-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!currentUser?.email) return;
    const form = event.currentTarget;
    const confirmationEmail = form.elements.confirmationEmail.value.trim();
    if (confirmationEmail.toLowerCase() !== currentUser.email.toLowerCase()) {
      feedback(byId('delete-confirm-feedback'), 'Enter the email address currently on your account.', true);
      return;
    }
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    const { data, error } = await supabase.functions.invoke('delete-own-account', {
      body: { token: form.elements.token.value.trim(), confirmationEmail }
    });
    button.disabled = false;
    if (error) {
      let message = error.message;
      if (error instanceof FunctionsHttpError) {
        const responseBody = await error.context.json().catch(() => null);
        if (typeof responseBody?.error === 'string') message = responseBody.error;
      }
      feedback(byId('delete-confirm-feedback'), `Couldn't delete the account: ${message}`, true);
      return;
    }
    if (data?.deleted !== true) {
      feedback(byId('delete-confirm-feedback'), 'The server did not confirm account deletion. Please try again.', true);
      return;
    }
    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' });
    if (signOutError) {
      feedback(byId('delete-confirm-feedback'), `Account deleted, but this browser session could not be cleared: ${signOutError.message}`, true);
      return;
    }
    window.location.replace('/index.html');
  });
}

initializeProfilePage();
