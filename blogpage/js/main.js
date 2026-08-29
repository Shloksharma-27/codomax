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

/* ---------- Formatting Helpers ---------- */
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date)) return dateString;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function escapeHtml(str) {
  if (str == null) return '';
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map(n => n[0].toUpperCase()).join('');
}

function handleImageError(imgEl, label) {
  const wrap = document.createElement('div');
  wrap.className = 'card-img-fallback';
  wrap.innerHTML = `<span>${escapeHtml(label || 'Papertrail')}</span>`;
  if (imgEl && imgEl.parentNode) {
    imgEl.replaceWith(wrap);
  }
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
  
  let iconSvg = '';
  if (type === 'success') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
  } else if (type === 'error') {
    iconSvg = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  }

  toast.innerHTML = `${iconSvg}<span>${escapeHtml(message)}</span>`;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 220);
  }, 3400);
}

/* ---------- Auth Guard ---------- */
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

/* ---------- Navigation ---------- */
function renderNav() {
  const user = getCurrentUser();
  const desktopActions = document.getElementById('nav-actions-desktop');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!desktopActions || !mobileMenu) return;

  if (user) {
    desktopActions.innerHTML = `
      <a href="create-blog.html" class="btn btn-secondary btn-sm">+ Write Story</a>
      <div class="nav-dropdown">
        <button class="nav-user" id="user-menu-btn" aria-haspopup="true" aria-expanded="false">
          <span class="avatar">${escapeHtml(getInitials(user.name))}</span>
          <span>${escapeHtml(user.name.split(' ')[0])}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
        </button>
        <div class="nav-dropdown-menu" id="user-menu">
          <div style="padding: 8px 12px; border-bottom: 1px solid var(--border); margin-bottom: 4px;">
            <strong style="display: block; font-size: 13.5px; color: var(--ink);">${escapeHtml(user.name)}</strong>
            <span style="display: block; font-size: 12px; color: var(--muted);">${escapeHtml(user.email || '')}</span>
          </div>
          <a href="dashboard.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            Dashboard
          </a>
          <a href="create-blog.html">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
            Write a Story
          </a>
          <button id="logout-btn" type="button">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
            Logout
          </button>
        </div>
      </div>
    `;

    mobileMenu.innerHTML = `
      <div class="mobile-user-card">
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
          <span class="avatar">${escapeHtml(getInitials(user.name))}</span>
          <div>
            <strong style="display: block; font-size: 14.5px; color: var(--ink);">${escapeHtml(user.name)}</strong>
            <span style="font-size: 12.5px; color: var(--muted);">${escapeHtml(user.email || '')}</span>
          </div>
        </div>
      </div>
      <a href="index.html">Home</a>
      <a href="index.html#latest-articles">Explore Stories</a>
      <a href="dashboard.html">Author Dashboard</a>
      <a href="create-blog.html" class="btn btn-primary btn-sm" style="margin: 6px 0;">+ Write a Story</a>
      <button id="logout-btn-mobile" type="button" style="color: var(--danger);">Logout</button>
    `;
  } else {
    desktopActions.innerHTML = `
      <a href="login.html" class="btn btn-secondary btn-sm">Login</a>
      <a href="register.html" class="btn btn-primary btn-sm">Register</a>
    `;

    mobileMenu.innerHTML = `
      <a href="index.html">Home</a>
      <a href="index.html#latest-articles">Explore Stories</a>
      <a href="login.html">Login</a>
      <a href="register.html" class="btn btn-primary">Create Account</a>
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
    if (link.getAttribute('data-page') === page) {
      link.classList.add('active');
    }
  });
}

function handleLogout() {
  clearCurrentUser();
  showToast('You have been logged out.', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 400);
}

function initMobileMenu() {
  const hamburger = document.getElementById('hamburger-btn');
  const menu = document.getElementById('mobile-menu');
  const backdrop = document.getElementById('mobile-menu-backdrop');
  if (!hamburger || !menu) return;

  function closeMenu() {
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
    if (backdrop) backdrop.classList.remove('open');
  }

  function toggleMenu() {
    const isOpen = hamburger.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    menu.classList.toggle('open', isOpen);
    if (backdrop) backdrop.classList.toggle('open', isOpen);
  }

  hamburger.addEventListener('click', toggleMenu);
  if (backdrop) backdrop.addEventListener('click', closeMenu);

  menu.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' || e.target.tagName === 'BUTTON') {
      closeMenu();
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
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    } else if (!menu.contains(e.target)) {
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
}

/* ============================================
   Home Page Logic
   ============================================ */
let currentCategoryFilter = 'All';
let currentSearchTerm = '';
let searchDebounceTimer = null;

function initHomePage() {
  renderCategoryPills();
  loadFeatured();
  loadBlogGrid();

  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('search-clear-btn');
  const resetBtn = document.getElementById('reset-filters-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const value = e.target.value;
      if (clearBtn) {
        clearBtn.classList.toggle('visible', !!value.trim());
      }
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        currentSearchTerm = value.trim();
        loadBlogGrid();
      }, 300);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      clearBtn.classList.remove('visible');
      currentSearchTerm = '';
      loadBlogGrid();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      currentCategoryFilter = 'All';
      currentSearchTerm = '';
      if (searchInput) searchInput.value = '';
      if (clearBtn) clearBtn.classList.remove('visible');
      renderCategoryPills();
      loadBlogGrid();
    });
  }

  // Handle category link clicks in footer
  document.querySelectorAll('[data-category-link]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const cat = link.getAttribute('data-category-link');
      currentCategoryFilter = cat;
      renderCategoryPills();
      loadBlogGrid();
      const section = document.getElementById('latest-articles');
      if (section) section.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

/**
 * Loads the latest published article for the hero featured card.
 */
async function loadFeatured() {
  const container = document.getElementById('featured-article');
  const skeleton = document.getElementById('featured-loading');
  const featuredSection = container?.closest('.featured');
  if (!container) return;

  try {
    const res = await api.blogs.list({ status: 'published', limit: 1 });
    const posts = res.data.blogs;

    if (skeleton) skeleton.classList.add('hidden');

    if (!posts || posts.length === 0) {
      if (featuredSection) featuredSection.classList.add('hidden');
      return;
    }

    if (featuredSection) featuredSection.classList.remove('hidden');
    renderFeatured(posts[0]);
    container.classList.remove('hidden');
  } catch (err) {
    if (skeleton) skeleton.classList.add('hidden');
    if (featuredSection) featuredSection.classList.add('hidden');
  }
}

function renderFeatured(featured) {
  const container = document.getElementById('featured-article');
  if (!container) return;

  const imageHtml = featured.image
    ? `<img src="${escapeHtml(featured.image)}" alt="${escapeHtml(featured.title)}" loading="lazy" onerror="handleImageError(this, '${escapeHtml(featured.category)}')">`
    : `<div class="card-img-fallback">${escapeHtml(featured.category)}</div>`;

  container.innerHTML = `
    <a href="post.html?id=${encodeURIComponent(featured.id)}" class="featured-media" aria-label="Read ${escapeHtml(featured.title)}">
      ${imageHtml}
    </a>
    <div class="featured-body">
      <span class="category-tag">${escapeHtml(featured.category)}</span>
      <h3><a href="post.html?id=${encodeURIComponent(featured.id)}">${escapeHtml(featured.title)}</a></h3>
      <p>${escapeHtml(featured.excerpt || featured.content.slice(0, 160))}</p>
      <div class="meta-row">
        <span><strong>${escapeHtml(featured.author || 'Papertrail Author')}</strong></span>
        <span class="sep">&middot;</span>
        <span>${formatDate(featured.date || featured.createdAt)}</span>
        <span class="sep">&middot;</span>
        <span>${featured.readingTime || 1} min read</span>
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

/**
 * Loads published stories from the backend API with category and search filter.
 */
async function loadBlogGrid() {
  const grid = document.getElementById('blog-grid');
  const skeleton = document.getElementById('blog-grid-skeleton');
  const emptyState = document.getElementById('empty-state');
  const heading = document.getElementById('grid-heading');
  if (!grid) return;

  if (heading) {
    heading.textContent = currentCategoryFilter === 'All'
      ? (currentSearchTerm ? `Search Results for "${currentSearchTerm}"` : 'Latest Articles')
      : `${currentCategoryFilter} Articles`;
  }

  if (emptyState) emptyState.classList.add('hidden');
  grid.classList.add('hidden');
  if (skeleton) skeleton.classList.remove('hidden');

  try {
    const params = {
      status: 'published',
      category: currentCategoryFilter !== 'All' ? currentCategoryFilter : undefined,
      search: currentSearchTerm || undefined,
      limit: 24
    };

    const res = await api.blogs.list(params);
    const blogs = res.data.blogs || [];

    if (skeleton) skeleton.classList.add('hidden');
    renderBlogGrid(blogs, grid, emptyState);
  } catch (err) {
    if (skeleton) skeleton.classList.add('hidden');
    grid.classList.remove('hidden');
    grid.innerHTML = `<p class="feed-status">Could not load stories: ${escapeHtml(err.message)}</p>`;
  }
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

  grid.innerHTML = posts.map(post => {
    const imageHtml = post.image
      ? `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" loading="lazy" onerror="handleImageError(this, '${escapeHtml(post.category)}')">`
      : `<div class="card-img-fallback">${escapeHtml(post.category)}</div>`;

    return `
      <article class="blog-card">
        <a href="post.html?id=${encodeURIComponent(post.id)}" class="blog-card-media" aria-label="Read ${escapeHtml(post.title)}">
          ${imageHtml}
        </a>
        <div class="blog-card-body">
          <span class="category-tag">${escapeHtml(post.category)}</span>
          <h3><a href="post.html?id=${encodeURIComponent(post.id)}">${escapeHtml(post.title)}</a></h3>
          <p>${escapeHtml(post.excerpt || post.content.slice(0, 120))}</p>
          <div class="meta-row">
            <span>${escapeHtml(post.author || 'Author')}</span>
            <span class="sep">&middot;</span>
            <span>${formatDate(post.date || post.createdAt)}</span>
            <span class="sep">&middot;</span>
            <span>${post.readingTime || 1} min read</span>
          </div>
        </div>
      </article>
    `;
  }).join('');
}
