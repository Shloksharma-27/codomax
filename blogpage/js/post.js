/* ============================================
   Papertrail — post.js
   Loads and renders a single blog post by ?id= query param.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('post-page')) return;
  loadPost();
  initReadingProgressBar();
  initShareButton();
});

function initReadingProgressBar() {
  const bar = document.getElementById('reading-progress-bar');
  if (!bar) return;

  window.addEventListener('scroll', () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (totalHeight <= 0) {
      bar.style.width = '0%';
      return;
    }
    const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
    bar.style.width = `${progress}%`;
  }, { passive: true });
}

function initShareButton() {
  const copyBtn = document.getElementById('copy-link-btn');
  if (!copyBtn) return;

  copyBtn.addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(window.location.href);
      } else {
        const temp = document.createElement('input');
        temp.value = window.location.href;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        temp.remove();
      }
      showToast('Article link copied to clipboard!', 'success');
    } catch (err) {
      showToast('Could not copy link.', 'default');
    }
  });
}

function renderContent(raw) {
  if (!raw) return '';
  const lines = raw.split('\n');
  const html = [];
  let listBuffer = [];
  let listType = 'ul'; // 'ul' or 'ol'
  let codeBuffer = [];
  let inCodeBlock = false;
  let codeLang = '';

  function flushList() {
    if (listBuffer.length) {
      const tag = listType;
      html.push(`<${tag}>${listBuffer.map(li => `<li>${li}</li>`).join('')}</${tag}>`);
      listBuffer = [];
      listType = 'ul';
    }
  }

  function flushCode() {
    if (codeBuffer.length) {
      const codeText = codeBuffer.join('\n');
      const escaped = escapeHtml(codeText);
      html.push(`
        <div class="post-code-block-wrap">
          <button type="button" class="post-code-copy-btn" onclick="copyCodeBlock(this)">Copy</button>
          <pre><code>${escaped}</code></pre>
        </div>
      `);
      codeBuffer = [];
    }
  }

  function inline(text) {
    return escapeHtml(text)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.+?)_/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  }

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCode();
      } else {
        flushList();
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith('#### ')) {
      flushList();
      html.push(`<h4>${inline(trimmed.slice(5))}</h4>`);
    } else if (trimmed.startsWith('### ')) {
      flushList();
      html.push(`<h3>${inline(trimmed.slice(4))}</h3>`);
    } else if (trimmed.startsWith('## ')) {
      flushList();
      html.push(`<h2>${inline(trimmed.slice(3))}</h2>`);
    } else if (trimmed.startsWith('# ')) {
      flushList();
      html.push(`<h1>${inline(trimmed.slice(2))}</h1>`);
    } else if (trimmed.startsWith('> ')) {
      flushList();
      html.push(`<blockquote>${inline(trimmed.slice(2))}</blockquote>`);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      if (listBuffer.length > 0 && listType !== 'ul') flushList();
      listType = 'ul';
      listBuffer.push(inline(trimmed.slice(2)));
    } else if (/^\d+\.\s/.test(trimmed)) {
      if (listBuffer.length > 0 && listType !== 'ol') flushList();
      listType = 'ol';
      listBuffer.push(inline(trimmed.replace(/^\d+\.\s/, '')));
    } else {
      flushList();
      html.push(`<p>${inline(trimmed)}</p>`);
    }
  });

  flushList();
  flushCode();

  return html.join('\n');
}

// Global copy helper for pre code blocks
window.copyCodeBlock = function (btn) {
  const pre = btn.closest('.post-code-block-wrap')?.querySelector('pre code');
  if (!pre) return;
  const text = pre.textContent;

  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1800);
  }).catch(() => {
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
  });
};

async function loadPost() {
  const skeleton = document.getElementById('post-skeleton');
  const statusEl = document.getElementById('post-status');
  const article = document.getElementById('post-article');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    if (skeleton) skeleton.classList.add('hidden');
    if (statusEl) {
      statusEl.textContent = 'No story identifier was specified.';
      statusEl.classList.remove('hidden');
    }
    return;
  }

  try {
    const res = await api.blogs.get(id, { trackView: true });
    const post = res.data.blog;

    if (skeleton) skeleton.classList.add('hidden');
    renderPost(post);
    if (statusEl) statusEl.classList.add('hidden');
    if (article) article.classList.remove('hidden');
    document.title = `${post.title} — Papertrail`;
  } catch (err) {
    if (skeleton) skeleton.classList.add('hidden');
    if (statusEl) {
      statusEl.textContent = err.status === 404
        ? "This story doesn't exist or may have been removed."
        : `Could not load this story: ${err.message}`;
      statusEl.classList.remove('hidden');
    }
  }
}

function renderPost(post) {
  const categoryEl = document.getElementById('post-category');
  const titleEl = document.getElementById('post-title');
  const authorEl = document.getElementById('post-author');
  const dateEl = document.getElementById('post-date');
  const readingTimeEl = document.getElementById('post-reading-time');
  const viewsEl = document.getElementById('post-views');

  if (categoryEl) categoryEl.textContent = post.category || 'Story';
  if (titleEl) titleEl.textContent = post.title;
  if (authorEl) authorEl.textContent = post.author || 'Papertrail Author';
  if (dateEl) dateEl.textContent = formatDate(post.date || post.createdAt);
  if (readingTimeEl) readingTimeEl.textContent = `${post.readingTime || 1} min read`;
  if (viewsEl) viewsEl.textContent = `${(post.views || 0).toLocaleString()} views`;

  // Author Edit Button
  const user = getCurrentUser();
  const actionsBar = document.querySelector('.post-actions-bar');
  const existingEditBtn = document.getElementById('post-author-edit-btn');
  if (existingEditBtn) existingEditBtn.remove();

  if (user && (user.id === post.authorId || user.id === post.author)) {
    const editBtn = document.createElement('a');
    editBtn.id = 'post-author-edit-btn';
    editBtn.className = 'btn btn-secondary btn-sm';
    editBtn.href = `create-blog.html?id=${encodeURIComponent(post.id)}`;
    editBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
      Edit Story
    `;
    if (actionsBar) actionsBar.prepend(editBtn);
  }

  // Media
  const media = document.getElementById('post-media');
  if (media) {
    if (post.image) {
      media.innerHTML = `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" onerror="handleImageError(this, '${escapeHtml(post.category)}')">`;
    } else {
      media.innerHTML = '';
    }
  }

  // Body
  const bodyEl = document.getElementById('post-body');
  if (bodyEl) {
    bodyEl.innerHTML = renderContent(post.content || '');
  }

  // Tags
  const tagsWrap = document.getElementById('post-tags');
  if (tagsWrap) {
    if (post.tags && post.tags.length) {
      tagsWrap.innerHTML = post.tags.map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('');
    } else {
      tagsWrap.innerHTML = '';
    }
  }
}
