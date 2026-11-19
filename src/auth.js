import { supabase } from './supabase.js';
import './styles.css';

const isSignup = document.body.dataset.authMode === 'signup';
const form = document.getElementById('auth-form');
const feedback = document.getElementById('auth-feedback');

function showFeedback(message, error = false) {
  feedback.textContent = message;
  feedback.classList.toggle('is-error', error);
  feedback.classList.toggle('is-visible', Boolean(message));
}

document.querySelectorAll('.oauth-button').forEach((button) => {
  button.addEventListener('click', async () => {
    if (!supabase) {
      showFeedback('Supabase is not configured. Add your project URL and anon key to .env.', true);
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: button.dataset.provider,
      options: { redirectTo: `${window.location.origin}/index.html` }
    });
    if (error) showFeedback(error.message, true);
  });
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) {
    showFeedback('Supabase is not configured. Add your project URL and anon key to .env.', true);
    return;
  }

  const button = document.getElementById('auth-submit');
  button.disabled = true;
  showFeedback('');
  const email = form.elements.email.value.trim();
  const password = form.elements.password.value;
  const result = isSignup
    ? await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: form.elements.username.value.trim() } }
    })
    : await supabase.auth.signInWithPassword({ email, password });
  button.disabled = false;

  if (result.error) {
    showFeedback(result.error.message, true);
    return;
  }
  if (isSignup && !result.data.session) {
    showFeedback('Check your email to confirm your account, then log in.');
    return;
  }
  window.location.assign('/index.html');
});
