/* ============================================
   Papertrail — dashboard.js
   Stats, post list, edit/delete handling. Backed by the API.
   ============================================ */

let dashboardPosts = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('dashboard-page')) return;
  if (!redirectIfNotAuthenticated()) return;

  const user = getCurrentUser();
  renderDashboardHeader(user);
  loadDashboard();
  initDeleteModal();
});

function renderDashboardHeader(user) {
  const greeting = document.getElementById('dash-greeting');
  const emailEl = document.getElementById('dash-email');
  if (greeting && user) {
    greeting.textContent = `Good to see you, ${user.name.split(' ')[0]}`;
  }
  if (emailEl && user) {
    emailEl.textContent = `${user.email} • Author Account`;
  }
}

async function loadDashboard() {
  const tableBody = document.getElementById('posts-table-body');
  if (tableBody) tableBody.innerHTML = `<tr><td colspan="6">Loading your posts…</td></tr>`;

  try {
    const [statsRes, postsRes] = await Promise.all([
      api.dashboard.stats(),
      api.blogs.mine({ limit: 50 })
    ]);

    applyStats(statsRes.data);
    dashboardPosts = postsRes.data.blogs;
    renderPosts(dashboardPosts);
  } catch (err) {
    if (err.status === 401) {
      clearCurrentUser();
      window.location.href = 'login.html';
      return;
    }
    showToast(err.message || 'Could not load your dashboard.', 'error');
    if (tableBody) tableBody.innerHTML = `<tr><td colspan="6">Could not load your posts. ${escapeHtml(err.message || '')}</td></tr>`;
  }
}

function applyStats(stats) {
  setStat('stat-total', stats.totalPosts);
  setStat('stat-published', stats.publishedPosts);
  setStat('stat-drafts', stats.draftPosts);
  setStat('stat-views', (stats.totalViews || 0).toLocaleString());
}

function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function renderPosts(posts) {
  const tableBody = document.getElementById('posts-table-body');
  const cardList = document.getElementById('posts-card-list');
  const emptyState = document.getElementById('dash-empty-state');
  const tableWrap = document.querySelector('.posts-table-wrap');
  const toolbar = document.querySelector('.dash-toolbar');

  if (posts.length === 0) {
    if (tableWrap) tableWrap.classList.add('hidden');
    if (cardList) cardList.classList.add('hidden');
    if (toolbar) toolbar.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (tableWrap) tableWrap.classList.remove('hidden');
  if (cardList) cardList.classList.remove('hidden');
  if (toolbar) toolbar.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');

  if (tableBody) {
    tableBody.innerHTML = posts.map(post => `
      <tr>
        <td class="post-title-cell">
          ${escapeHtml(post.title)}
          <span class="excerpt-preview">${escapeHtml(post.excerpt || '')}</span>
        </td>
        <td>${escapeHtml(post.category)}</td>
        <td><span class="status-badge ${post.status}">${post.status === 'published' ? 'Published' : 'Draft'}</span></td>
        <td>${formatDate(post.date)}</td>
        <td>${(post.views || 0).toLocaleString()}</td>
        <td>
          <div class="row-actions">
            <a class="icon-btn" href="create-blog.html?id=${post.id}" aria-label="Edit ${escapeHtml(post.title)}" title="Edit">${editIcon()}</a>
            <button class="icon-btn danger" type="button" data-delete-id="${post.id}" aria-label="Delete ${escapeHtml(post.title)}" title="Delete">${trashIcon()}</button>
          </div>
        </td>
      </tr>
    `).join('');
  }

  if (cardList) {
    cardList.innerHTML = posts.map(post => `
      <div class="post-mobile-card">
        <div class="pmc-top">
          <div>
            <h4>${escapeHtml(post.title)}</h4>
            <span class="status-badge ${post.status}">${post.status === 'published' ? 'Published' : 'Draft'}</span>
          </div>
        </div>
        <p class="pmc-meta">${escapeHtml(post.category)} &middot; ${formatDate(post.date)} &middot; ${(post.views || 0).toLocaleString()} views</p>
        <div class="pmc-actions">
          <a class="btn btn-secondary btn-sm" href="create-blog.html?id=${post.id}">Edit</a>
          <button class="btn btn-secondary btn-sm" type="button" data-delete-id="${post.id}">Delete</button>
        </div>
      </div>
    `).join('');
  }

  document.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-delete-id')));
  });
}

function editIcon() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
}
function trashIcon() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>`;
}

/* ---------- Delete confirmation modal ---------- */
let pendingDeleteId = null;

function initDeleteModal() {
  const overlay = document.getElementById('delete-modal');
  const cancelBtn = document.getElementById('delete-cancel');
  const confirmBtn = document.getElementById('delete-confirm');
  if (!overlay) return;

  cancelBtn.addEventListener('click', closeDeleteModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeDeleteModal(); });
  confirmBtn.addEventListener('click', async () => {
    if (pendingDeleteId == null) { closeDeleteModal(); return; }

    confirmBtn.disabled = true;
    try {
      await api.blogs.remove(pendingDeleteId);
      showToast('Post deleted.', 'success');
      closeDeleteModal();
      await loadDashboard();
    } catch (err) {
      showToast(err.message || 'Could not delete this post.', 'error');
      closeDeleteModal();
    } finally {
      confirmBtn.disabled = false;
    }
  });
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  document.getElementById('delete-modal').classList.add('open');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  document.getElementById('delete-modal').classList.remove('open');
}
