/* ============================================
   Papertrail — main.js
   Navigation, toasts, shared helpers, home page.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  renderNav();
  initMobileMenu();
  initUserDropdown();

  if (document.getElementById('home-page')) {
    initHomePage();
  }
});

/* ---------- Formatting helpers ---------- */
function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
  return div.innerHTML;
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

function handleImageError(imgEl, label) {
  const wrap = document.createElement('div');
  wrap.className = 'card-img-fallback';
  wrap.textContent = label || 'Papertrail';
  imgEl.replaceWith(wrap);
}

/* ---------- Toasts ---------- */
function showToast(message, type = 'default') {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 200);
  }, 3200);
}

/* ---------- Auth guard ---------- */
function redirectIfNotAuthenticated() {
  if (!isAuthenticated()) {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    const query = window.location.search || '';
    const destination = encodeURIComponent(page + query);
    window.location.href = `login.html?redirect=${destination}`;
    return false;
  }
  return true;
}

/* ---------- Navigation (shared across all pages) ---------- */
function renderNav() {
  const user = getCurrentUser();
  const desktopActions = document.getElementById('nav-actions-desktop');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!desktopActions || !mobileMenu) return;

  if (user) {
    desktopActions.innerHTML = `
      <a href="create-blog.html" class="btn btn-secondary btn-sm">Create Blog</a>
      <div class="nav-dropdown">
        <button class="nav-user" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
          <span class="avatar">${escapeHtml(getInitials(user.name))}</span>
          ${escapeHtml(user.name.split(' ')[0])}
        </button>
        <div class="nav-dropdown-menu" id="user-menu">
          <div class="nav-user-header" style="padding: 8px 12px; border-bottom: 1px solid var(--border); margin-bottom: 4px;">
            <strong style="display: block; font-size: 13.5px; color: var(--ink);">${escapeHtml(user.name)}</strong>
            <span style="display: block; font-size: 12px; color: var(--muted);">${escapeHtml(user.email || '')}</span>
          </div>
          <a href="dashboard.html">Dashboard</a>
          <a href="create-blog.html">Create Blog</a>
          <button id="logout-btn" type="button">Logout</button>
        </div>
      </div>
    `;
    mobileMenu.innerHTML = `
      <div style="padding: 8px 4px 12px; border-bottom: 1px solid var(--border);">
        <strong style="display: block; font-size: 14px; color: var(--ink);">${escapeHtml(user.name)}</strong>
        <span style="font-size: 12px; color: var(--muted);">${escapeHtml(user.email || '')}</span>
      </div>
      <a href="index.html">Home</a>
      <a href="index.html#latest-articles">Explore</a>
      <a href="dashboard.html">Dashboard</a>
      <a href="create-blog.html">Create Blog</a>
      <button id="logout-btn-mobile" type="button">Logout</button>
    `;
  } else {
    desktopActions.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;
    mobileMenu.innerHTML = `
      <a href="index.html">Home</a>
      <a href="index.html#latest-articles">Explore</a>
      <a href="login.html">Login</a>
      <a href="register.html" class="btn btn-primary">Register</a>
    `;
  }

  const logoutBtn = document.getElementById('logout-btn');
  const logoutBtnMobile = document.getElementById('logout-btn-mobile');
  [logoutBtn, logoutBtnMobile].forEach(btn => {
    if (btn) btn.addEventListener('click', handleLogout);
  });

  markActiveNavLink();
}

function markActiveNavLink() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a[data-page]').forEach(link => {
    if (link.getAttribute('data-page') === page) link.classList.add('active');
  });
}

function handleLogout() {
  clearCurrentUser();
  showToast('You have been logged out.');
  setTimeout(() => { window.location.href = 'index.html'; }, 500);
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  if (!hamburger || !menu) return;
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    menu.classList.toggle('open');
  });
  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      hamburger.classList.remove('open');
      menu.classList.remove('open');
    }
  });
}

function initUserDropdown() {
  document.addEventListener('click', (e) => {
    const btn = document.getElementById('user-menu-btn');
    const menu = document.getElementById('user-menu');
    if (!btn || !menu) return;
    if (btn.contains(e.target)) {
      const isOpen = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen);
    } else if (!menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================
   Home page
   ============================================ */
let currentCategoryFilter = 'All';
let currentSearchTerm = '';
let searchDebounceTimer = null;

function initHomePage() {
  renderCategoryPills();
  loadFeatured();
  loadBlogGrid();

  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value.trim();
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        currentSearchTerm = value;
        loadBlogGrid();
      }, 300);
    });
  }
}

/**
 * The featured card always shows the single most recent published
 * post, independent of the search/category filters below it.
 */
async function loadFeatured() {
  const container = document.getElementById('featured-article');
  const featuredWrap = container?.closest('.featured');
  if (!container) return;

  try {
    const res = await api.blogs.list({ status: 'published', limit: 1 });
    const posts = res.data.blogs;
    if (posts.length === 0) {
      if (featuredWrap) featuredWrap.classList.add('hidden');
      return;
    }
    renderFeatured(posts[0], featuredWrap);
  } catch (err) {
    if (featuredWrap) featuredWrap.classList.add('hidden');
  }
}

/**
 * Fetches published posts from the API with server-side search and
 * category filtering, and renders the article grid.
 */
async function loadBlogGrid() {
  const grid = document.getElementById('blog-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid) return;

  if (emptyState) emptyState.classList.add('hidden');
  grid.classList.remove('hidden');
  grid.innerHTML = '<p class="feed-status">Loading stories…</p>';

  try {
    const params = {
      status: 'published',
      category: currentCategoryFilter !== 'All' ? currentCategoryFilter : undefined,
      search: currentSearchTerm || undefined,
      limit: 24
    };
    const res = await api.blogs.list(params);
    renderBlogGrid(res.data.blogs, grid, emptyState);
  } catch (err) {
    grid.innerHTML = `<p class="feed-status">Could not load stories: ${escapeHtml(err.message)}</p>`;
  }
}

function renderFeatured(featured, featuredWrap) {
  const container = document.getElementById('featured-article');
  if (!container) return;
  if (featuredWrap) featuredWrap.classList.remove('hidden');
  container.innerHTML = `
    <a href="post.html?id=${encodeURIComponent(featured.id)}" class="featured-media" aria-label="Read ${escapeHtml(featured.title)}">
      <img src="${escapeHtml(featured.image)}" alt="${escapeHtml(featured.title)}" loading="lazy"
        onerror="handleImageError(this, 'Papertrail')">
    </a>
    <div class="featured-body">
      <span class="category-tag">${escapeHtml(featured.category)}</span>
      <h3><a href="post.html?id=${encodeURIComponent(featured.id)}">${escapeHtml(featured.title)}</a></h3>
      <p>${escapeHtml(featured.excerpt)}</p>
      <div class="meta-row">
        <span>${escapeHtml(featured.author)}</span>
        <span class="sep">&middot;</span>
        <span>${formatDate(featured.date)}</span>
        <span class="sep">&middot;</span>
        <span>${featured.readingTime} min read</span>
      </div>
    </div>
  `;
}

function renderCategoryPills() {
  const wrap = document.getElementById('category-pills');
  if (!wrap) return;
  const categories = ['All', 'Technology', 'Design', 'Productivity', 'Career', 'Lifestyle'];
  wrap.innerHTML = categories.map(cat => `
    <button class="pill ${cat === currentCategoryFilter ? 'active' : ''}" data-category="${cat}" type="button">${cat}</button>
  `).join('');

  wrap.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      currentCategoryFilter = pill.getAttribute('data-category');
      renderCategoryPills();
      loadBlogGrid();
    });
  });
}

function renderBlogGrid(posts, grid, emptyState) {
  if (posts.length === 0) {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  grid.classList.remove('hidden');

  grid.innerHTML = posts.map(post => `
    <article class="blog-card">
      <a href="post.html?id=${encodeURIComponent(post.id)}" class="blog-card-media" aria-label="Read ${escapeHtml(post.title)}">
        <img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy"
          onerror="handleImageError(this, '${escapeHtml(post.category)}')">
      </a>
      <div class="blog-card-body">
        <span class="category-tag">${escapeHtml(post.category)}</span>
        <h3><a href="post.html?id=${encodeURIComponent(post.id)}">${escapeHtml(post.title)}</a></h3>
        <p>${escapeHtml(post.excerpt)}</p>
        <div class="meta-row">
          <span>${escapeHtml(post.author)}</span>
          <span class="sep">&middot;</span>
          <span>${formatDate(post.date)}</span>
          <span class="sep">&middot;</span>
          <span>${post.readingTime} min read</span>
        </div>
      </div>
    </article>
  `).join('');
}
