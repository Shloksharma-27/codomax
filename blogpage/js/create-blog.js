/* ============================================
   Papertrail — create-blog.js
   Create & Edit blog post handling.
   ============================================ */

let currentTags = [];
let editingPostId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('create-blog-page')) return;
  if (!redirectIfNotAuthenticated()) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');

  initToolbar();
  initViewTabs();
  initTagInput();
  initImagePreview();
  initWordCountTracker();
  initFormActions();
  initSampleImages();

  if (editId) {
    document.getElementById('editor-title-heading').textContent = 'Edit Story';
    const publishBtn = document.getElementById('publish-btn');
    if (publishBtn) publishBtn.innerHTML = '<span class="btn-text">Update & Publish</span>';
    setFormDisabled(true);

    try {
      const res = await api.blogs.get(editId);
      const post = res.data.blog;
      const currentUser = getCurrentUser();

      if (currentUser && post.authorId && post.authorId !== currentUser.id && post.author !== currentUser.id) {
        showToast('You can only edit your own posts.', 'error');
        setTimeout(() => { window.location.href = 'dashboard.html'; }, 500);
        return;
      }

      editingPostId = post.id;
      populateForm(post);
    } catch (err) {
      showToast(err.message || 'Could not load this post.', 'error');
      window.location.href = 'dashboard.html';
      return;
    } finally {
      setFormDisabled(false);
    }
  }
});

function setFormDisabled(disabled) {
  const page = document.getElementById('create-blog-page');
  if (!page) return;
  page.querySelectorAll('input, textarea, select, button').forEach(el => {
    el.disabled = disabled;
  });
}

function populateForm(post) {
  document.getElementById('title-input').value = post.title || '';
  document.getElementById('category-select').value = post.category || 'Technology';
  document.getElementById('image-input').value = post.image || '';
  document.getElementById('excerpt-input').value = post.excerpt || '';
  document.getElementById('content-textarea').value = post.content || '';
  currentTags = [...(post.tags || [])];
  renderTags();
  updateImagePreview(post.image);
  updateWordCount();
}

/* ---------- Word & Reading Time Counter ---------- */
function initWordCountTracker() {
  const textarea = document.getElementById('content-textarea');
  if (!textarea) return;

  textarea.addEventListener('input', updateWordCount);
  updateWordCount();
}

function updateWordCount() {
  const textarea = document.getElementById('content-textarea');
  const wordBadge = document.getElementById('word-count-badge');
  const readBadge = document.getElementById('reading-time-badge');
  if (!textarea || !wordBadge || !readBadge) return;

  const text = textarea.value.trim();
  const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
  const mins = Math.max(1, Math.round(words / 200));

  wordBadge.textContent = `${words.toLocaleString()} ${words === 1 ? 'word' : 'words'}`;
  readBadge.textContent = `${mins} min read`;
}

/* ---------- Write vs Preview Tab ---------- */
function initViewTabs() {
  const writeBtn = document.getElementById('tab-write-btn');
  const previewBtn = document.getElementById('tab-preview-btn');
  const textarea = document.getElementById('content-textarea');
  const previewPane = document.getElementById('content-preview-pane');
  if (!writeBtn || !previewBtn || !textarea || !previewPane) return;

  writeBtn.addEventListener('click', () => {
    writeBtn.classList.add('active');
    previewBtn.classList.remove('active');
    textarea.style.display = 'block';
    previewPane.classList.remove('active');
  });

  previewBtn.addEventListener('click', () => {
    previewBtn.classList.add('active');
    writeBtn.classList.remove('active');
    textarea.style.display = 'none';
    previewPane.classList.add('active');

    const content = textarea.value.trim();
    previewPane.innerHTML = content
      ? renderMarkdownPreview(content)
      : '<p style="color: var(--muted); font-style: italic;">Nothing to preview yet. Start typing your story in the Write tab!</p>';
  });
}

function renderMarkdownPreview(raw) {
  const lines = raw.split('\n');
  const html = [];
  let listBuffer = [];
  let codeBuffer = [];
  let inCode = false;

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
      if (inCode) {
        inCode = false;
        flushCode();
      } else {
        flushList();
        inCode = true;
      }
      return;
    }

    if (inCode) {
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
    } else {
      flushList();
      html.push(`<p>${inline(trimmed)}</p>`);
    }
  });

  flushList();
  flushCode();

  return html.join('\n');
}

/* ---------- Formatting Toolbar ---------- */
function initToolbar() {
  const toolbar = document.getElementById('editor-toolbar');
  if (!toolbar) return;
  const textarea = document.getElementById('content-textarea');

  toolbar.querySelectorAll('button[data-format]').forEach(btn => {
    btn.addEventListener('click', () => {
      applyFormat(textarea, btn.getAttribute('data-format'));
      updateWordCount();
    });
  });
}

function applyFormat(textarea, format) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || 'text';
  let wrapped = selected;

  switch (format) {
    case 'bold':
      wrapped = `**${selected}**`;
      break;
    case 'italic':
      wrapped = `_${selected}_`;
      break;
    case 'heading':
      wrapped = `\n## ${selected}\n`;
      break;
    case 'quote':
      wrapped = `\n> ${selected}\n`;
      break;
    case 'list':
      wrapped = selected.split('\n').map(l => `- ${l}`).join('\n');
      break;
    case 'numlist':
      wrapped = selected.split('\n').map((l, i) => `${i + 1}. ${l}`).join('\n');
      break;
    case 'code':
      wrapped = `\n\`\`\`javascript\n${selected}\n\`\`\`\n`;
      break;
    case 'link':
      wrapped = `[${selected}](https://example.com)`;
      break;
  }

  textarea.value = textarea.value.slice(0, start) + wrapped + textarea.value.slice(end);
  textarea.focus();
  textarea.selectionStart = start;
  textarea.selectionEnd = start + wrapped.length;
}

/* ---------- Tags Handling ---------- */
function initTagInput() {
  const input = document.getElementById('tag-input');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = input.value.trim().replace(/,/g, '');
      if (val && !currentTags.includes(val)) {
        currentTags.push(val);
        renderTags();
      }
      input.value = '';
    } else if (e.key === 'Backspace' && !input.value && currentTags.length > 0) {
      currentTags.pop();
      renderTags();
    }
  });
}

function renderTags() {
  const list = document.getElementById('tag-list');
  if (!list) return;
  list.innerHTML = currentTags.map(tag => `
    <span class="tag-chip">
      ${escapeHtml(tag)}
      <button type="button" data-remove-tag="${escapeHtml(tag)}" aria-label="Remove tag">&times;</button>
    </span>
  `).join('');

  list.querySelectorAll('[data-remove-tag]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tagToRemove = btn.getAttribute('data-remove-tag');
      currentTags = currentTags.filter(t => t !== tagToRemove);
      renderTags();
    });
  });
}

/* ---------- Featured Image Preview ---------- */
function initImagePreview() {
  const input = document.getElementById('image-input');
  if (!input) return;
  input.addEventListener('input', () => updateImagePreview(input.value.trim()));
}

function updateImagePreview(url) {
  const preview = document.getElementById('image-preview');
  if (!preview) return;
  if (!url) {
    preview.innerHTML = '<span>No image preview</span>';
    return;
  }
  preview.innerHTML = `<img src="${escapeHtml(url)}" alt="Preview">`;
  const img = preview.querySelector('img');
  if (img) {
    img.addEventListener('error', () => {
      preview.innerHTML = '<span style="color: var(--danger);">Image failed to load (check URL)</span>';
    });
  }
}

function initSampleImages() {
  const techBtn = document.getElementById('sample-img-tech');
  const designBtn = document.getElementById('sample-img-design');
  const input = document.getElementById('image-input');
  if (!input) return;

  if (techBtn) {
    techBtn.addEventListener('click', () => {
      input.value = 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80';
      updateImagePreview(input.value);
    });
  }

  if (designBtn) {
    designBtn.addEventListener('click', () => {
      input.value = 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1200&q=80';
      updateImagePreview(input.value);
    });
  }
}

/* ---------- Save / Publish ---------- */
function initFormActions() {
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const publishBtn = document.getElementById('publish-btn');

  if (saveDraftBtn) {
    saveDraftBtn.addEventListener('click', () => submitPost('draft'));
  }
  if (publishBtn) {
    publishBtn.addEventListener('click', () => submitPost('published'));
  }
}

async function submitPost(status) {
  const title = document.getElementById('title-input').value.trim();
  const category = document.getElementById('category-select').value;
  const image = document.getElementById('image-input').value.trim();
  const excerpt = document.getElementById('excerpt-input').value.trim();
  const content = document.getElementById('content-textarea').value.trim();

  clearEditorErrors();

  let valid = true;
  if (!title) {
    showEditorError('title-error', 'Please give your story a title.');
    valid = false;
  }
  if (!content) {
    showEditorError('content-error', 'Please write some story content before saving.');
    valid = false;
  }
  if (!category) {
    showEditorError('category-error', 'Please choose a category.');
    valid = false;
  }

  if (!valid) {
    showToast('Please fill in all required fields.', 'error');
    return;
  }

  const saveDraftBtn = document.getElementById('save-draft-btn');
  const publishBtn = document.getElementById('publish-btn');
  const targetBtn = status === 'published' ? publishBtn : saveDraftBtn;

  if (saveDraftBtn) saveDraftBtn.disabled = true;
  if (publishBtn) publishBtn.disabled = true;

  if (targetBtn) {
    targetBtn.innerHTML = `<span class="spinner"></span> ${status === 'published' ? 'Publishing…' : 'Saving draft…'}`;
  }

  const payload = {
    title,
    category,
    image,
    excerpt: excerpt || content.slice(0, 160).replace(/[#*`_>]/g, '').trim(),
    content,
    status,
    tags: currentTags
  };

  try {
    if (editingPostId) {
      await api.blogs.update(editingPostId, payload);
    } else {
      await api.blogs.create(payload);
    }
    showToast(status === 'published' ? 'Story published successfully!' : 'Draft saved successfully!', 'success');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 600);
  } catch (err) {
    showToast(err.message || 'Could not save this post. Please try again.', 'error');
    if (saveDraftBtn) {
      saveDraftBtn.disabled = false;
      saveDraftBtn.innerHTML = '<span class="btn-text">Save as Draft</span>';
    }
    if (publishBtn) {
      publishBtn.disabled = false;
      publishBtn.innerHTML = editingPostId ? '<span class="btn-text">Update & Publish</span>' : '<span class="btn-text">Publish Story</span>';
    }
  }
}

function showEditorError(id, message) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
  }
}

function clearEditorErrors() {
  document.querySelectorAll('.field-error').forEach(el => {
    el.textContent = '';
    el.classList.remove('visible');
  });
}
