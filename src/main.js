import { createClient } from '@supabase/supabase-js';
import './styles.css';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;
const byId = (id) => document.getElementById(id);
let isSignup = false;
let chatChannel;
let toastTimeout;

function feedback(target, message, error = false) {
  target.textContent = message;
  target.classList.toggle('is-error', error);
  target.classList.toggle('is-visible', Boolean(message));
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function toast(message) {
  const element = byId('toast');
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove('is-visible'), 3500);
}

function setAuthMode(signup) {
  isSignup = signup;
  byId('auth-title').textContent = signup ? 'Make yourself at home.' : 'Come on in.';
  byId('auth-description').textContent = signup ? 'Create an account and find your people.' : 'Sign in to find your people.';
  byId('auth-submit').innerHTML = `${signup ? 'Create account' : 'Log in'} <span>↗</span>`;
  byId('auth-password').autocomplete = signup ? 'new-password' : 'current-password';
  document.querySelector('.auth-username').classList.toggle('hidden', !signup);
  byId('auth-username').required = signup;
  byId('auth-switch').innerHTML = signup
    ? 'Already one of us? <button type="button" id="auth-toggle">Log in</button>'
    : 'New around here? <button type="button" id="auth-toggle">Create an account</button>';
  byId('auth-toggle').addEventListener('click', () => setAuthMode(!isSignup));
  feedback(byId('auth-feedback'), '');
}

function openAuth(signup = false) {
  if (!supabase) {
    toast('Set up Supabase in .env to enable accounts and community features.');
    return;
  }
  setAuthMode(signup);
  byId('auth-dialog').showModal();
}

function renderWall(posts) {
  const list = byId('wall-list');
  const sampleNotes = list.querySelectorAll('.wall-note');
  sampleNotes.forEach((note) => note.remove());
  byId('wall-empty').classList.toggle('hidden', posts.length > 0);
  for (const post of posts) {
    const article = document.createElement('article');
    article.className = 'wall-note';
    const quote = document.createElement('span');
    quote.className = 'note-mark';
    quote.textContent = '“';
    const message = document.createElement('p');
    message.textContent = post.message;
    const tag = document.createElement('span');
    tag.className = 'note-tag';
    tag.textContent = 'FROM THE COMMUNITY';
    article.append(quote, message, tag);
    list.insertBefore(article, byId('wall-empty'));
  }
}

async function loadWall() {
  if (!supabase) return;
  const { data, error } = await supabase.from('freedom_posts').select('id, message, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(6);
  if (error) {
    toast(`Couldn't load the Freedom Wall: ${error.message}`);
    return;
  }
  renderWall(data ?? []);
}

async function loadPromotions() {
  if (!supabase) return;
  const { data, error } = await supabase.from('promotions').select('id, title, description, url, category').eq('published', true).order('created_at', { ascending: false }).limit(6);
  if (error) {
    toast(`Couldn't load community promotions: ${error.message}`);
    return;
  }
  if (!data?.length) return;
  const list = byId('promotion-list');
  list.replaceChildren();
  for (const [index, item] of data.entries()) {
    const card = document.createElement('article');
    card.className = 'promo-card';
    const visual = document.createElement('div');
    visual.className = `promo-visual ${['visual-studio', 'visual-creator', 'visual-community'][index % 3]}`;
    const visualText = document.createElement('span');
    visualText.textContent = item.category || 'COMMUNITY PICK';
    const visualIcon = document.createElement('i');
    visualIcon.textContent = ['✳', '↗', '♡'][index % 3];
    visual.append(visualText, visualIcon);
    const info = document.createElement('div');
    info.className = 'promo-info';
    const details = document.createElement('div');
    const category = document.createElement('span');
    category.className = 'promo-type';
    category.textContent = item.category || 'COMMUNITY PICK';
    const title = document.createElement('h3');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.className = 'promo-description';
    description.textContent = item.description;
    details.append(category, title, description);
    info.append(details);
    const href = safeExternalUrl(item.url);
    if (href) {
      const link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = '↗';
      link.setAttribute('aria-label', `Visit ${item.title}`);
      info.append(link);
    }
    card.append(visual, info);
    list.append(card);
  }
}

async function loadAnnouncements() {
  if (!supabase) return;
  const { data, error } = await supabase.from('announcements').select('id, title, description, url, created_at').eq('published', true).order('created_at', { ascending: false }).limit(3);
  if (error) {
    toast(`Couldn't load announcements: ${error.message}`);
    return;
  }
  const list = byId('announcement-list');
  if (!data?.length) return;
  list.replaceChildren();
  for (const item of data) {
    const article = document.createElement('article');
    article.className = 'announcement-card';
    const meta = document.createElement('span');
    meta.className = 'card-index';
    meta.textContent = new Date(item.created_at).toLocaleDateString();
    const title = document.createElement('h3');
    title.textContent = item.title;
    const description = document.createElement('p');
    description.textContent = item.description;
    article.append(meta, title, description);
    const href = safeExternalUrl(item.url);
    if (href) {
      const link = document.createElement('a');
      link.href = href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Read more ↗';
      article.append(link);
    }
    list.append(article);
  }
}

async function startChat() {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    toast('Log in to join the community chat.');
    openAuth();
    return;
  }
  byId('chat-panel').classList.remove('hidden');
  const { data, error } = await supabase.from('discussion_messages').select('id, user_id, body, created_at, profiles(username)').order('created_at', { ascending: false }).limit(80);
  if (error) {
    feedback(byId('chat-feedback'), `Couldn't load the chat: ${error.message}`, true);
    return;
  }
  renderChat((data ?? []).reverse(), user.id);
  if (chatChannel) await supabase.removeChannel(chatChannel);
  chatChannel = supabase.channel('community-discussion')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'discussion_messages' }, async (payload) => {
      const { data: message, error: messageError } = await supabase.from('discussion_messages').select('id, user_id, body, created_at, profiles(username)').eq('id', payload.new.id).single();
      if (messageError) {
        feedback(byId('chat-feedback'), `Couldn't load the new message: ${messageError.message}`, true);
        return;
      }
      appendChatMessage(message, user.id);
    })
    .subscribe();
}

function appendChatMessage(message, currentUserId) {
  const row = document.createElement('div');
  row.className = `chat-row${message.user_id === currentUserId ? ' own-message' : ''}`;
  const name = document.createElement('strong');
  name.textContent = message.profiles?.username || 'Community member';
  const body = document.createElement('p');
  body.textContent = message.body;
  row.append(name, body);
  byId('chat-messages').append(row);
  byId('chat-messages').scrollTop = byId('chat-messages').scrollHeight;
}

function renderChat(messages, currentUserId) {
  byId('chat-messages').replaceChildren();
  messages.forEach((message) => appendChatMessage(message, currentUserId));
}

function setMenuOpen(open) {
  document.querySelector('.main-nav').classList.toggle('menu-open', open);
  document.querySelector('.menu-toggle').setAttribute('aria-expanded', String(open));
}

byId('year').textContent = new Date().getFullYear();
byId('signup-open').addEventListener('click', () => openAuth(true));
byId('hero-join').addEventListener('click', () => openAuth(true));
byId('login-open').addEventListener('click', () => openAuth(false));
byId('auth-close').addEventListener('click', () => byId('auth-dialog').close());
byId('auth-dialog').addEventListener('click', (event) => {
  if (event.target === byId('auth-dialog')) byId('auth-dialog').close();
});
document.querySelector('.menu-toggle').addEventListener('click', (event) => {
  setMenuOpen(event.currentTarget.getAttribute('aria-expanded') !== 'true');
});
document.querySelectorAll('.main-nav a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));

document.querySelectorAll('.oauth-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: button.dataset.provider,
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) feedback(byId('auth-feedback'), error.message, true);
  });
});

byId('auth-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) return;
  const email = byId('auth-email').value.trim();
  const password = byId('auth-password').value;
  const button = byId('auth-submit');
  button.disabled = true;
  feedback(byId('auth-feedback'), '');
  const result = isSignup
    ? await supabase.auth.signUp({ email, password, options: { data: { username: byId('auth-username').value.trim() } } })
    : await supabase.auth.signInWithPassword({ email, password });
  button.disabled = false;
  if (result.error) {
    feedback(byId('auth-feedback'), result.error.message, true);
    return;
  }
  if (isSignup && !result.data.session) {
    feedback(byId('auth-feedback'), 'Check your email to confirm your account, then come back to log in.');
    return;
  }
  byId('auth-dialog').close();
  toast(isSignup ? 'Welcome to the community!' : 'You’re all set. Welcome back!');
});

byId('wall-message').addEventListener('input', (event) => {
  byId('wall-count').textContent = `${event.target.value.length} / 500`;
});
byId('wall-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const message = byId('wall-message').value.trim();
  if (!supabase) {
    feedback(byId('wall-feedback'), 'Connect Supabase to send a message. Your message has not been saved.', true);
    return;
  }
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  const { error } = await supabase.from('freedom_posts').insert({ message, status: 'pending' });
  button.disabled = false;
  if (error) {
    feedback(byId('wall-feedback'), `Your message wasn't sent: ${error.message}`, true);
    return;
  }
  event.currentTarget.reset();
  byId('wall-count').textContent = '0 / 500';
  feedback(byId('wall-feedback'), 'Your anonymous message is in the review queue. Thanks for sharing.');
});

byId('chat-open').addEventListener('click', () => {
  if (!supabase) {
    toast('Set up Supabase to join the live community chat.');
    return;
  }
  startChat();
});
byId('chat-close').addEventListener('click', async () => {
  byId('chat-panel').classList.add('hidden');
  if (chatChannel) {
    await supabase.removeChannel(chatChannel);
    chatChannel = null;
  }
});
byId('chat-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = byId('chat-input').value.trim();
  if (!body) return;
  const { error } = await supabase.from('discussion_messages').insert({ body });
  if (error) {
    feedback(byId('chat-feedback'), `Your message wasn't sent: ${error.message}`, true);
    return;
  }
  byId('chat-input').value = '';
  feedback(byId('chat-feedback'), '');
});

if (supabase) {
  loadWall();
  loadPromotions();
  loadAnnouncements();
}

byId('promotion-request-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) {
    feedback(byId('promotion-feedback'), 'Connect Supabase to send a request. Your information has not been saved.', true);
    return;
  }
  const form = event.currentTarget;
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  const url = safeExternalUrl(form.elements.url.value.trim());
  if (!url) {
    button.disabled = false;
    feedback(byId('promotion-feedback'), 'Use a valid http or https link.', true);
    return;
  }
  const { error } = await supabase.from('promotion_requests').insert({
    brand: form.elements.brand.value.trim(),
    description: form.elements.description.value.trim(),
    url,
    contact_email: form.elements.email.value.trim(),
    status: 'pending'
  });
  button.disabled = false;
  if (error) {
    feedback(byId('promotion-feedback'), `Your request wasn't sent: ${error.message}`, true);
    return;
  }
  form.reset();
  feedback(byId('promotion-feedback'), 'Your request is in the review queue. Thanks for sharing what you make.');
});
