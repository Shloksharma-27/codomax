/* ============================================
   Papertrail — post.js
   Loads and renders a single blog post by its ?id= query param.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (!document.getElementById('post-page')) return;
  loadPost();
});

function renderContent(raw) {
  if (!raw) return '';
  const lines = raw.split('\n');
  const html = [];
  let listBuffer = [];
  let codeBuffer = [];
  let inCodeBlock = false;

  function flushList() {
    if (listBuffer.length) {
      html.push(`<ul>${listBuffer.map(li => `<li>${li}</li>`).join('')}</ul>`);
      listBuffer = [];
    }
  }

  function flushCode() {
    if (codeBuffer.length) {
      html.push(`<pre><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`);
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

    if (trimmed.startsWith('### ')) {
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
      listBuffer.push(inline(trimmed.slice(2)));
    } else if (/^\d+\.\s/.test(trimmed)) {
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

async function loadPost() {
  const statusEl = document.getElementById('post-status');
  const article = document.getElementById('post-article');
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  if (!id) {
    statusEl.textContent = 'No story was specified.';
    return;
  }

  try {
    const res = await api.blogs.get(id, { trackView: true });
    renderPost(res.data.blog);
    statusEl.classList.add('hidden');
    article.classList.remove('hidden');
    document.title = `${res.data.blog.title} — Papertrail`;
  } catch (err) {
    if (err.status === 404) {
      statusEl.textContent = "This story doesn't exist or may have been removed.";
    } else {
      statusEl.textContent = `Could not load this story: ${err.message}`;
    }
  }
}

function renderPost(post) {
  document.getElementById('post-category').textContent = post.category;
  document.getElementById('post-title').textContent = post.title;
  document.getElementById('post-author').textContent = post.author || 'Unknown author';
  document.getElementById('post-date').textContent = formatDate(post.date);
  document.getElementById('post-reading-time').textContent = `${post.readingTime} min read`;
  document.getElementById('post-views').textContent = `${(post.views || 0).toLocaleString()} views`;

  const user = getCurrentUser();
  const metaRow = document.querySelector('.post-meta');
  const existingEditBtn = document.getElementById('post-author-edit-btn');
  if (existingEditBtn) existingEditBtn.remove();

  if (user && (user.id === post.authorId || user.id === post.author)) {
    const editBtn = document.createElement('a');
    editBtn.id = 'post-author-edit-btn';
    editBtn.className = 'btn btn-secondary btn-sm post-edit-btn';
    editBtn.href = `create-blog.html?id=${encodeURIComponent(post.id)}`;
    editBtn.textContent = 'Edit this story';
    if (metaRow) metaRow.appendChild(editBtn);
  }

  const media = document.getElementById('post-media');
  if (post.image) {
    media.innerHTML = `<img src="${escapeHtml(post.image)}" alt="${escapeHtml(post.title)}" onerror="handleImageError(this, '${escapeHtml(post.category)}')">`;
  } else {
    media.innerHTML = '';
  }

  document.getElementById('post-body').innerHTML = renderContent(post.content || '');

  const tagsWrap = document.getElementById('post-tags');
  if (post.tags && post.tags.length) {
    tagsWrap.innerHTML = post.tags.map(t => `<span class="tag-chip">${escapeHtml(t)}</span>`).join('');
  } else {
    tagsWrap.innerHTML = '';
  }
}
