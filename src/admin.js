import { supabase } from './supabase.js';
import './styles.css';

const byId = (id) => document.getElementById(id);
const contentDialog = byId('content-dialog');

function feedback(target, message, error = false) {
  target.textContent = message;
  target.classList.toggle('is-error', error);
  target.classList.toggle('is-visible', Boolean(message));
}

function escapeText(value) {
  const span = document.createElement('span');
  span.textContent = value ?? '';
  return span.innerHTML;
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

function setAdminVisible(visible) {
  byId('admin-login').classList.toggle('hidden', visible);
  byId('admin-dashboard').classList.toggle('hidden', !visible);
}

async function requireAdmin() {
  if (!supabase) {
    feedback(byId('admin-login-feedback'), 'Supabase is not configured. Copy .env.example to .env and add your project credentials.', true);
    return;
  }
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    feedback(byId('admin-login-feedback'), sessionError.message, true);
    return;
  }
  if (!session) return;

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    feedback(byId('admin-login-feedback'), error.message, true);
    return;
  }
  if (!user) return;
  if (user.app_metadata?.role !== 'admin') {
    await supabase.auth.signOut();
    feedback(byId('admin-login-feedback'), 'This account does not have admin access.', true);
    return;
  }
  setAdminVisible(true);
  await loadAll();
}

async function fetchRows(table, columns = '*') {
  const { data, error } = await supabase.from(table).select(columns).order('created_at', { ascending: false }).limit(200);
  if (error) throw error;
  return data ?? [];
}

async function loadAll() {
  try {
    await Promise.all([loadFreedom(), loadRequests(), loadContent('promotions'), loadContent('news'), loadUsers()]);
  } catch (error) {
    feedback(byId('admin-feedback'), `Couldn't load admin data: ${error.message}`, true);
  }
}

async function loadRequests() {
  const requests = await fetchRows('promotion_requests', 'id, brand, description, url, contact_email, status, created_at');
  byId('request-count').textContent = String(requests.filter((request) => request.status === 'pending').length);
  byId('admin-requests-list').innerHTML = requests.length ? requests.map((request) => {
    const href = safeExternalUrl(request.url);
    return `
    <article class="admin-row">
      <div class="admin-row-copy"><span class="admin-meta">${escapeText(request.status.toUpperCase())} · ${escapeText(new Date(request.created_at).toLocaleString())}</span><h3>${escapeText(request.brand)}</h3><p>${escapeText(request.description)}</p><p>${href ? `<a href="${escapeText(href)}" target="_blank" rel="noopener noreferrer">${escapeText(request.url)}</a>` : escapeText(request.url)} · ${escapeText(request.contact_email)}</p></div>
      <div class="row-actions">${request.status === 'pending' ? `<button class="button button-small button-accent" data-action="approve-request" data-id="${request.id}">Approve & publish</button><button class="button button-small button-outline" data-action="reject-request" data-id="${request.id}">Reject</button>` : ''}<button class="button button-small button-outline" data-action="delete-request" data-id="${request.id}">Delete</button></div>
    </article>`;
  }).join('') : '<p class="admin-empty">No promotion requests yet.</p>';
}

async function loadFreedom() {
  const { data, error } = await supabase.functions.invoke('manage-freedom-wall', { body: { action: 'list' } });
  if (error) throw error;
  const posts = data.posts;
  byId('pending-count').textContent = String(posts.filter((post) => post.status === 'pending').length);
  byId('admin-freedom-list').innerHTML = posts.length ? posts.map((post) => `
    <article class="admin-row">
      <div class="admin-row-copy"><span class="admin-meta">${escapeText(new Date(post.created_at).toLocaleString())} · ${escapeText(post.status.toUpperCase())}</span><p>${escapeText(post.message)}</p>${post.status === 'approved' ? `<p class="admin-meta">FACEBOOK: ${escapeText((post.facebook_publish_status || 'pending').toUpperCase())}${post.facebook_publish_error ? ` · ${escapeText(post.facebook_publish_error)}` : ''}</p>` : ''}</div>
      <div class="row-actions">${post.status === 'pending' ? `<button class="button button-small button-accent" data-action="approve" data-id="${post.id}">Approve & publish</button><button class="button button-small button-outline" data-action="reject" data-id="${post.id}">Reject</button>` : ''}${post.status === 'approved' && post.facebook_publish_status !== 'published' ? `<button class="button button-small button-outline" data-action="publish-facebook" data-id="${post.id}">Retry Facebook</button>` : ''}<button class="button button-small button-outline" data-action="delete-wall" data-id="${post.id}">Delete</button></div>
    </article>`).join('') : '<p class="admin-empty">No Freedom Wall submissions yet.</p>';
}

async function publishFreedomPost(id) {
  const { data, error } = await supabase.functions.invoke('publish-freedom-post', { body: { postId: id } });
  await loadFreedom();
  if (error) throw error;
  feedback(byId('admin-feedback'), data?.alreadyPublished
    ? 'This Freedom Wall message is already published on Facebook.'
    : 'Message approved and published to Facebook.');
}

async function loadContent(kind) {
  const table = kind === 'news' ? 'announcements' : 'promotions';
  const rows = await fetchRows(table, 'id, title, description, url, published, created_at');
  byId(`admin-${kind}-list`).innerHTML = rows.length ? rows.map((row) => `
    <article class="admin-row">
      <div class="admin-row-copy"><span class="admin-meta">${escapeText(row.published ? 'PUBLISHED' : 'HIDDEN')} · ${escapeText(new Date(row.created_at).toLocaleDateString())}</span><h3>${escapeText(row.title)}</h3><p>${escapeText(row.description)}</p></div>
      <div class="row-actions"><button class="button button-small button-outline" data-action="edit-${kind}" data-id="${row.id}">Edit</button><button class="button button-small button-outline" data-action="delete-${kind}" data-id="${row.id}">Delete</button></div>
    </article>`).join('') : `<p class="admin-empty">No ${kind} yet. Add the first one.</p>`;
}

async function loadUsers() {
  const { data, error } = await supabase.functions.invoke('manage-community-member', { body: { action: 'list' } });
  if (error) throw error;
  const users = data.members;
  byId('admin-users-list').innerHTML = users.length ? users.map((user) => `
    <article class="admin-row">
      <div class="admin-row-copy"><span class="admin-meta">MEMBER SINCE ${escapeText(new Date(user.created_at).toLocaleDateString())}${user.isAdmin ? ' · ADMIN' : ''}</span><h3>${escapeText(user.username || 'Community member')}</h3><p>${escapeText(user.email || 'No email')} · ${escapeText(user.id.slice(0, 8))}${user.suspended ? ' · SUSPENDED' : ''}</p></div>
      ${user.isAdmin ? '' : `<button class="button button-small button-outline" data-action="${user.suspended ? 'restore-user' : 'suspend-user'}" data-id="${user.id}">${user.suspended ? 'Restore access' : 'Suspend access'}</button>`}
    </article>`).join('') : '<p class="admin-empty">No community members yet.</p>';
}

function showContentForm(kind, row = null) {
  const isNews = kind === 'news';
  byId('content-dialog-title').textContent = `${row ? 'Edit' : 'New'} ${isNews ? 'announcement' : 'promotion'}`;
  const form = byId('content-form');
  form.elements.kind.value = kind;
  form.elements.id.value = row?.id ?? '';
  form.elements.title.value = row?.title ?? '';
  form.elements.description.value = row?.description ?? '';
  form.elements.url.value = row?.url ?? '';
  form.elements.published.checked = row?.published ?? true;
  feedback(byId('content-feedback'), '');
  contentDialog.showModal();
}

async function handleAdminAction(button) {
  const { action, id } = button.dataset;
  if (action === 'approve-request') {
    const { error } = await supabase.rpc('approve_promotion_request', { request_id: id });
    if (error) throw error;
    feedback(byId('admin-feedback'), 'Request approved and published as a community promotion.');
    await Promise.all([loadRequests(), loadContent('promotions')]);
    return;
  }
  if (action === 'reject-request' || action === 'delete-request') {
    if (action === 'delete-request' && !window.confirm('Delete this promotion request?')) return;
    const { error } = action === 'reject-request'
      ? await supabase.from('promotion_requests').update({ status: 'rejected' }).eq('id', id)
      : await supabase.from('promotion_requests').delete().eq('id', id);
    if (error) throw error;
    await loadRequests();
    feedback(byId('admin-feedback'), action === 'reject-request' ? 'Promotion request rejected.' : 'Promotion request deleted.');
    return;
  }
  if (action === 'approve' || action === 'reject') {
    const approved = action === 'approve';
    const { error } = await supabase.from('freedom_posts').update({
      status: approved ? 'approved' : 'rejected'
    }).eq('id', id);
    if (error) throw error;
    if (approved) {
      await publishFreedomPost(id);
    } else {
      feedback(byId('admin-feedback'), 'Message rejected.');
      await loadFreedom();
    }
    return;
  }
  if (action === 'publish-facebook') {
    await publishFreedomPost(id);
    return;
  }
  if (action === 'suspend-user' || action === 'restore-user') {
    const { error } = await supabase.functions.invoke('manage-community-member', {
      body: { action: action === 'suspend-user' ? 'suspend' : 'restore', userId: id }
    });
    if (error) throw error;
    await loadUsers();
    feedback(byId('admin-feedback'), action === 'suspend-user' ? 'Member access suspended.' : 'Member access restored.');
    return;
  }
  if (action === 'delete-wall' && !window.confirm('Delete this Freedom Wall message?')) return;
  const kind = action.endsWith('promotions') ? 'promotions' : 'news';
  const table = kind === 'news' ? 'announcements' : 'promotions';
  if (action.startsWith('edit-')) {
    const { data, error } = await supabase.from(table).select('*').eq('id', id).single();
    if (error) throw error;
    showContentForm(kind, data);
    return;
  }
  const { error } = await supabase.from(action === 'delete-wall' ? 'freedom_posts' : table).delete().eq('id', id);
  if (error) throw error;
  if (action === 'delete-wall') await loadFreedom();
  else await loadContent(kind);
  feedback(byId('admin-feedback'), 'Item deleted.');
}

byId('admin-login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!supabase) return requireAdmin();
  const { error } = await supabase.auth.signInWithPassword({ email: byId('admin-email').value.trim(), password: byId('admin-password').value });
  if (error) {
    feedback(byId('admin-login-feedback'), error.message, true);
    return;
  }
  await requireAdmin();
});

byId('admin-logout').addEventListener('click', async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) {
    feedback(byId('admin-feedback'), `Couldn't sign out: ${error.message}`, true);
    return;
  }
  setAdminVisible(false);
});

document.querySelectorAll('.admin-tab').forEach((tab) => tab.addEventListener('click', () => {
  document.querySelectorAll('.admin-tab').forEach((item) => item.classList.toggle('active', item === tab));
  document.querySelectorAll('.admin-panel').forEach((panel) => panel.classList.toggle('hidden', panel.id !== `panel-${tab.dataset.tab}`));
}));

document.querySelectorAll('[data-create]').forEach((button) => button.addEventListener('click', () => showContentForm(button.dataset.create)));
document.querySelectorAll('.admin-list').forEach((list) => list.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  button.disabled = true;
  try {
    await handleAdminAction(button);
  } catch (error) {
    feedback(byId('admin-feedback'), `Action failed: ${error.message}`, true);
  } finally {
    button.disabled = false;
  }
}));

byId('content-close').addEventListener('click', () => contentDialog.close());
contentDialog.addEventListener('click', (event) => {
  if (event.target === contentDialog) contentDialog.close();
});
byId('content-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const kind = form.elements.kind.value;
  const table = kind === 'news' ? 'announcements' : 'promotions';
  const payload = {
    title: form.elements.title.value.trim(),
    description: form.elements.description.value.trim(),
    url: form.elements.url.value.trim() || null,
    published: form.elements.published.checked
  };
  const result = form.elements.id.value
    ? await supabase.from(table).update(payload).eq('id', form.elements.id.value)
    : await supabase.from(table).insert(payload);
  if (result.error) {
    feedback(byId('content-feedback'), `Couldn't save changes: ${result.error.message}`, true);
    return;
  }
  contentDialog.close();
  await loadContent(kind);
  feedback(byId('admin-feedback'), `${kind === 'news' ? 'Announcement' : 'Promotion'} saved.`);
});

if (supabase) requireAdmin();
