import { supabase } from './supabase.js';
import './styles.css';

const byId = (id) => document.getElementById(id);
let chatChannel;
let toastTimeout;
let connectUser = null;
let connectSessionVersion = 0;

function feedback(target, message, error = false) {
  if (!target) return;
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
  let element = byId('toast');
  if (!element) {
    element = document.createElement('div');
    element.id = 'toast';
    element.className = 'toast';
    element.setAttribute('role', 'status');
    document.body.append(element);
  }
  element.textContent = message;
  element.classList.add('is-visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => element.classList.remove('is-visible'), 3500);
}

function initializeHeaderAuth() {
  const actions = document.querySelector('.header-actions');
  if (!supabase || !actions) return;
  const defaultActions = Array.from(actions.childNodes, (node) => node.cloneNode(true));

  function render(user) {
    actions.replaceChildren();
    if (!user) {
      actions.append(...defaultActions.map((node) => node.cloneNode(true)));
      return;
    }

    const accountLink = document.createElement('a');
    accountLink.className = 'button button-outline';
    accountLink.href = '/profile.html';
    accountLink.textContent = 'My account';
    const logoutButton = document.createElement('button');
    logoutButton.className = 'button button-accent';
    logoutButton.type = 'button';
    logoutButton.textContent = 'Log out';
    logoutButton.addEventListener('click', async () => {
      logoutButton.disabled = true;
      const { error } = await supabase.auth.signOut();
      logoutButton.disabled = false;
      if (error) toast(`Couldn't log out: ${error.message}`);
    });
    actions.append(accountLink, logoutButton);
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => render(session?.user ?? null), 0);
  });
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      toast(`Couldn't check your sign-in status: ${error.message}`);
      return;
    }
    render(data.session?.user ?? null);
  });
}

function renderWall(posts) {
  const list = byId('wall-list');
  if (!list) return;
  list.querySelectorAll('.wall-note').forEach((note) => note.remove());
  const empty = byId('wall-empty');
  if (empty) empty.classList.toggle('hidden', posts.length > 0);
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
    list.insertBefore(article, empty);
  }
}

async function loadWall() {
  if (!supabase || !byId('wall-list')) return;
  const { data, error } = await supabase.from('freedom_posts').select('id, message, created_at').eq('status', 'approved').order('created_at', { ascending: false }).limit(6);
  if (error) {
    toast(`Couldn't load the Freedom Wall: ${error.message}`);
    return;
  }
  renderWall(data ?? []);
}

async function loadPromotions() {
  if (!supabase || !byId('promotion-list')) return;
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
  if (!supabase || !byId('announcement-list')) return;
  const { data, error } = await supabase.from('announcements').select('id, title, description, url, created_at').eq('published', true).order('created_at', { ascending: false }).limit(3);
  if (error) {
    toast(`Couldn't load announcements: ${error.message}`);
    return;
  }
  if (!data?.length) return;
  const list = byId('announcement-list');
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

async function loadAccountProfile(user, isCurrentSession) {
  const { data, error } = await supabase.from('profiles').select('username').eq('id', user.id).single();
  if (!isCurrentSession()) return;
  if (error) {
    feedback(byId('connect-account-feedback'), `Couldn't load your profile: ${error.message}`, true);
    return;
  }
  byId('account-username').textContent = data.username;
}

async function startChat(user, isCurrentSession) {
  if (chatChannel) {
    const channel = chatChannel;
    chatChannel = null;
    await supabase.removeChannel(channel);
    if (!isCurrentSession()) return;
  }
  const { data, error } = await supabase.from('discussion_messages').select('id, user_id, body, created_at, profiles(username)').order('created_at', { ascending: false }).limit(80);
  if (!isCurrentSession()) return;
  if (error) {
    feedback(byId('chat-feedback'), `Couldn't load the chat: ${error.message}`, true);
    return;
  }
  byId('chat-messages').replaceChildren();
  (data ?? []).reverse().forEach((message) => appendChatMessage(message, user.id));
  chatChannel = supabase.channel('community-discussion')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'discussion_messages' }, async (payload) => {
      if (!isCurrentSession()) return;
      const { data: message, error: messageError } = await supabase.from('discussion_messages').select('id, user_id, body, created_at, profiles(username)').eq('id', payload.new.id).single();
      if (!isCurrentSession()) return;
      if (messageError) {
        feedback(byId('chat-feedback'), `Couldn't load the new message: ${messageError.message}`, true);
        return;
      }
      appendChatMessage(message, user.id);
    })
    .subscribe();
}

async function renderConnectSession(user) {
  const gate = byId('chat-auth-prompt');
  const memberArea = byId('connect-member-area');
  if (!gate || !memberArea) return;

  if (user && connectUser?.id === user.id) {
    gate.classList.add('hidden');
    memberArea.classList.remove('hidden');
    byId('account-email').textContent = user.email || 'Email not available';
    return;
  }

  const version = ++connectSessionVersion;
  const isCurrentSession = () => version === connectSessionVersion;
  if (!user) {
    connectUser = null;
    gate.classList.remove('hidden');
    memberArea.classList.add('hidden');
    byId('chat-messages').replaceChildren();
    if (chatChannel) {
      const channel = chatChannel;
      chatChannel = null;
      await supabase.removeChannel(channel);
    }
    return;
  }

  const sameUser = connectUser?.id === user.id;
  connectUser = user;
  gate.classList.add('hidden');
  memberArea.classList.remove('hidden');
  byId('account-email').textContent = user.email || 'Email not available';
  if (sameUser) return;

  await loadAccountProfile(user, isCurrentSession);
  if (!isCurrentSession()) return;
  await startChat(user, isCurrentSession);
}

function initializeConnectPage() {
  if (!byId('chat-auth-prompt')) return;
  if (!supabase) {
    byId('chat-auth-prompt').insertAdjacentText('beforeend', ' Supabase has not been configured yet.');
    return;
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    setTimeout(() => {
      void renderConnectSession(session?.user ?? null);
    }, 0);
  });
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      feedback(byId('chat-auth-feedback'), `Couldn't check your sign-in status: ${error.message}`, true);
      return;
    }
    void renderConnectSession(data.session?.user ?? null);
  });

  byId('connect-signout').addEventListener('click', async (event) => {
    const button = event.currentTarget;
    button.disabled = true;
    const { error } = await supabase.auth.signOut();
    button.disabled = false;
    if (error) feedback(byId('connect-account-feedback'), `Couldn't log out: ${error.message}`, true);
  });
}

const year = document.querySelector('.year');
if (year) year.textContent = new Date().getFullYear();

const menuToggle = document.querySelector('.menu-toggle');
const mainNav = document.querySelector('.main-nav');
if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const open = menuToggle.getAttribute('aria-expanded') !== 'true';
    mainNav.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
  });
  mainNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
    mainNav.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  }));
}

const wallMessage = byId('wall-message');
if (wallMessage) {
  wallMessage.addEventListener('input', () => {
    byId('wall-count').textContent = `${wallMessage.value.length} / 500`;
  });
  byId('wall-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = wallMessage.value.trim();
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
}

if (byId('chat-form')) {
  byId('chat-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabase || !connectUser) return;
    const body = byId('chat-input').value.trim();
    if (!body) return;
    const button = event.currentTarget.querySelector('button[type="submit"]');
    button.disabled = true;
    const { error } = await supabase.from('discussion_messages').insert({ body });
    button.disabled = false;
    if (error) {
      feedback(byId('chat-feedback'), `Your message wasn't sent: ${error.message}`, true);
      return;
    }
    byId('chat-input').value = '';
    feedback(byId('chat-feedback'), '');
  });
}

const promotionForm = byId('promotion-request-form');
if (promotionForm) {
  promotionForm.addEventListener('submit', async (event) => {
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
}

initializeHeaderAuth();
initializeConnectPage();
loadWall();
loadPromotions();
loadAnnouncements();
