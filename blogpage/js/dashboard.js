/* ============================================
   Papertrail — dashboard.js
   Stats, post management, filter tabs, delete modal.
   ============================================ */

let dashboardPosts = [];
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('dashboard-page')) return;
  if (!redirectIfNotAuthenticated()) return;

  const user = getCurrentUser();
  renderDashboardHeader(user);
  initFilterTabs();
  loadDashboard();
  initDeleteModal();
});

function renderDashboardHeader(user) {
  const greeting = document.getElementById('dash-greeting');
  const emailEl = document.getElementById('dash-email');
  if (greeting && user) {
    greeting.textContent = `Welcome back, ${user.name.split(' ')[0]}`;
  }
  if (emailEl && user) {
    emailEl.textContent = `${user.email} • Author Account`;
  }
}

function initFilterTabs() {
  const tabs = document.querySelectorAll('[data-status-filter]');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.getAttribute('data-status-filter');
      applyFilterAndRender();
    });
  });
}

async function loadDashboard() {
  const tableBody = document.getElementById('posts-table-body');
  if (tableBody) {
    tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--muted);">Loading your stories…</td></tr>`;
  }

  try {
    const [statsRes, postsRes] = await Promise.all([
      api.dashboard.stats(),
      api.blogs.mine({ limit: 50 })
    ]);

    applyStats(statsRes.data);
    dashboardPosts = postsRes.data.blogs || [];
    applyFilterAndRender();
  } catch (err) {
    if (err.status === 401) {
      clearCurrentUser();
      window.location.href = 'login.html';
      return;
    }
    showToast(err.message || 'Could not load your dashboard.', 'error');
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--danger);">Could not load your stories: ${escapeHtml(err.message || '')}</td></tr>`;
    }
  }
}

function applyStats(stats) {
  setStat('stat-total', stats.totalPosts || 0);
  setStat('stat-published', stats.publishedPosts || 0);
  setStat('stat-drafts', stats.draftPosts || 0);
  setStat('stat-views', (stats.totalViews || 0).toLocaleString());
}

function setStat(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function applyFilterAndRender() {
  let filtered = dashboardPosts;
  if (currentFilter === 'published') {
    filtered = dashboardPosts.filter(p => p.status === 'published');
  } else if (currentFilter === 'draft') {
    filtered = dashboardPosts.filter(p => p.status === 'draft');
  }
  renderPosts(filtered);
}

function renderPosts(posts) {
  const tableBody = document.getElementById('posts-table-body');
  const cardList = document.getElementById('posts-card-list');
  const emptyState = document.getElementById('dash-empty-state');
  const tableWrap = document.querySelector('.posts-table-wrap');

  if (!posts || posts.length === 0) {
    if (tableWrap) tableWrap.classList.add('hidden');
    if (cardList) cardList.classList.add('hidden');
    if (emptyState) {
      emptyState.classList.remove('hidden');
      const emptyTitle = document.getElementById('dash-empty-title');
      const emptyDesc = document.getElementById('dash-empty-desc');
      if (currentFilter === 'published') {
        if (emptyTitle) emptyTitle.textContent = 'No published stories';
        if (emptyDesc) emptyDesc.textContent = 'You have not published any stories yet.';
      } else if (currentFilter === 'draft') {
        if (emptyTitle) emptyTitle.textContent = 'No drafts saved';
        if (emptyDesc) emptyDesc.textContent = 'You have no saved drafts.';
      } else {
        if (emptyTitle) emptyTitle.textContent = 'No stories yet';
        if (emptyDesc) emptyDesc.textContent = 'Share your insights or engineering perspectives with our reader community.';
      }
    }
    return;
  }

  if (tableWrap) tableWrap.classList.remove('hidden');
  if (cardList) cardList.classList.remove('hidden');
  if (emptyState) emptyState.classList.add('hidden');

  if (tableBody) {
    tableBody.innerHTML = posts.map(post => `
      <tr>
        <td class="post-title-cell">
          <a href="${post.status === 'published' ? `post.html?id=${encodeURIComponent(post.id)}` : `create-blog.html?id=${encodeURIComponent(post.id)}`}">
            ${escapeHtml(post.title)}
          </a>
          <span class="excerpt-preview">${escapeHtml(post.excerpt || post.content.slice(0, 100))}</span>
        </td>
        <td><span class="category-tag">${escapeHtml(post.category)}</span></td>
        <td>
          <span class="status-badge ${post.status}">
            <span style="width: 6px; height: 6px; border-radius: 50%; background: currentColor;"></span>
            ${post.status === 'published' ? 'Published' : 'Draft'}
          </span>
        </td>
        <td>${formatDate(post.date || post.createdAt)}</td>
        <td><strong>${(post.views || 0).toLocaleString()}</strong></td>
        <td style="text-align: right;">
          <div class="row-actions" style="justify-content: flex-end;">
            ${post.status === 'published' ? `<a class="icon-btn" href="post.html?id=${encodeURIComponent(post.id)}" aria-label="View story" title="View Story">${viewIcon()}</a>` : ''}
            <a class="icon-btn" href="create-blog.html?id=${encodeURIComponent(post.id)}" aria-label="Edit story" title="Edit Story">${editIcon()}</a>
            <button class="icon-btn danger" type="button" data-delete-id="${encodeURIComponent(post.id)}" aria-label="Delete story" title="Delete Story">${trashIcon()}</button>
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
            <span class="status-badge ${post.status}" style="margin-top: 6px;">
              ${post.status === 'published' ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        <p class="pmc-meta">${escapeHtml(post.category)} &middot; ${formatDate(post.date || post.createdAt)} &middot; ${(post.views || 0).toLocaleString()} views</p>
        <div class="pmc-actions">
          ${post.status === 'published' ? `<a class="btn btn-secondary btn-sm" href="post.html?id=${encodeURIComponent(post.id)}">View</a>` : ''}
          <a class="btn btn-secondary btn-sm" href="create-blog.html?id=${encodeURIComponent(post.id)}">Edit</a>
          <button class="btn btn-secondary btn-sm" type="button" data-delete-id="${encodeURIComponent(post.id)}" style="color: var(--danger);">Delete</button>
        </div>
      </div>
    `).join('');
  }

  document.querySelectorAll('[data-delete-id]').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(btn.getAttribute('data-delete-id')));
  });
}

function viewIcon() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
}

function editIcon() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>`;
}

function trashIcon() {
  return `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path></svg>`;
}

/* ---------- Delete Confirmation Modal ---------- */
let pendingDeleteId = null;

function initDeleteModal() {
  const overlay = document.getElementById('delete-modal');
  const cancelBtn = document.getElementById('delete-cancel');
  const confirmBtn = document.getElementById('delete-confirm');
  if (!overlay || !cancelBtn || !confirmBtn) return;

  cancelBtn.addEventListener('click', closeDeleteModal);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDeleteModal();
  });

  confirmBtn.addEventListener('click', async () => {
    if (!pendingDeleteId) {
      closeDeleteModal();
      return;
    }

    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Deleting…';

    try {
      await api.blogs.remove(pendingDeleteId);
      showToast('Story deleted successfully.', 'success');
      closeDeleteModal();
      await loadDashboard();
    } catch (err) {
      showToast(err.message || 'Could not delete this story.', 'error');
      closeDeleteModal();
    } finally {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Delete Story';
    }
  });
}

function openDeleteModal(id) {
  pendingDeleteId = id;
  const overlay = document.getElementById('delete-modal');
  if (overlay) overlay.classList.add('open');
}

function closeDeleteModal() {
  pendingDeleteId = null;
  const overlay = document.getElementById('delete-modal');
  if (overlay) overlay.classList.remove('open');
}
