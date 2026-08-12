/* ============================================
   Papertrail — create-blog.js
   Create and edit blog post handling. Backed by the API.
   ============================================ */

let currentTags = [];
let editingPostId = null;

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('create-blog-page')) return;
  if (!redirectIfNotAuthenticated()) return;

  const params = new URLSearchParams(window.location.search);
  const editId = params.get('id');

  initToolbar();
  initTagInput();
  initImagePreview();
  initFormActions();

  if (editId) {
    document.getElementById('editor-title-heading').textContent = 'Edit story';
    setFormDisabled(true);
    try {
      const res = await api.blogs.get(editId);
      editingPostId = res.data.blog.id;
      populateForm(res.data.blog);
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
  const form = document.getElementById('create-blog-page');
  if (!form) return;
  form.querySelectorAll('input, textarea, select, button').forEach(el => { el.disabled = disabled; });
}

function populateForm(post) {
  document.getElementById('title-input').value = post.title;
  document.getElementById('category-select').value = post.category;
  document.getElementById('image-input').value = post.image;
  document.getElementById('excerpt-input').value = post.excerpt;
  document.getElementById('content-textarea').value = post.content;
  currentTags = [...(post.tags || [])];
  renderTags();
  updateImagePreview(post.image);
}

/* ---------- Formatting toolbar ---------- */
function initToolbar() {
  const toolbar = document.getElementById('editor-toolbar');
  if (!toolbar) return;
  const textarea = document.getElementById('content-textarea');

  toolbar.querySelectorAll('button[data-format]').forEach(btn => {
    btn.addEventListener('click', () => applyFormat(textarea, btn.getAttribute('data-format')));
  });
}

function applyFormat(textarea, format) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || 'text';
  let wrapped;

  switch (format) {
    case 'bold': wrapped = `**${selected}**`; break;
    case 'italic': wrapped = `_${selected}_`; break;
    case 'heading': wrapped = `## ${selected}`; break;
    case 'quote': wrapped = `> ${selected}`; break;
    case 'list': wrapped = selected.split('\n').map(line => `- ${line}`).join('\n'); break;
    default: wrapped = selected;
  }

  textarea.value = textarea.value.slice(0, start) + wrapped + textarea.value.slice(end);
  textarea.focus();
  textarea.selectionStart = start;
  textarea.selectionEnd = start + wrapped.length;
}

/* ---------- Tags ---------- */
function initTagInput() {
  const input = document.getElementById('tag-input');
  if (!input) return;
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = input.value.trim().replace(/,/g, '');
      if (value && !currentTags.includes(value)) {
        currentTags.push(value);
        renderTags();
      }
      input.value = '';
    }
  });
}

function renderTags() {
  const list = document.getElementById('tag-list');
  if (!list) return;
  list.innerHTML = currentTags.map(tag => `
    <span class="tag-chip">${escapeHtml(tag)}<button type="button" data-remove-tag="${escapeHtml(tag)}" aria-label="Remove ${escapeHtml(tag)}">&times;</button></span>
  `).join('');

  list.querySelectorAll('[data-remove-tag]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentTags = currentTags.filter(t => t !== btn.getAttribute('data-remove-tag'));
      renderTags();
    });
  });
}

/* ---------- Image preview ---------- */
function initImagePreview() {
  const input = document.getElementById('image-input');
  if (!input) return;
  input.addEventListener('input', () => updateImagePreview(input.value.trim()));
}

function updateImagePreview(url) {
  const preview = document.getElementById('image-preview');
  if (!preview) return;
  if (!url) {
    preview.innerHTML = 'No image yet';
    return;
  }
  preview.innerHTML = `<img src="${escapeHtml(url)}" alt="Featured image preview">`;
  const img = preview.querySelector('img');
  img.addEventListener('error', () => { preview.innerHTML = 'Image failed to load'; });
}

/* ---------- Save / Publish ---------- */
function initFormActions() {
  const saveDraftBtn = document.getElementById('save-draft-btn');
  const publishBtn = document.getElementById('publish-btn');

  saveDraftBtn.addEventListener('click', () => submitPost('draft'));
  publishBtn.addEventListener('click', () => submitPost('published'));
}

async function submitPost(status) {
  const title = document.getElementById('title-input').value.trim();
  const category = document.getElementById('category-select').value;
  const image = document.getElementById('image-input').value.trim();
  const excerpt = document.getElementById('excerpt-input').value.trim();
  const content = document.getElementById('content-textarea').value.trim();

  clearEditorErrors();

  let valid = true;
  if (!title) { showEditorError('title-error', 'Give your story a title.'); valid = false; }
  if (!content) { showEditorError('content-error', 'Write some content before saving.'); valid = false; }
  if (!category) { showEditorError('category-error', 'Choose a category.'); valid = false; }

  if (!valid) {
    showToast('Fill in the required fields before saving.', 'error');
    return;
  }

  const saveDraftBtn = document.getElementById('save-draft-btn');
  const publishBtn = document.getElementById('publish-btn');
  saveDraftBtn.disabled = true;
  publishBtn.disabled = true;

  const payload = { title, category, image, excerpt, content, status, tags: currentTags };

  try {
    if (editingPostId) {
      await api.blogs.update(editingPostId, payload);
    } else {
      await api.blogs.create(payload);
    }
    showToast(status === 'published' ? 'Story published.' : 'Draft saved.', 'success');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
  } catch (err) {
    showToast(err.message || 'Could not save this post. Please try again.', 'error');
    saveDraftBtn.disabled = false;
    publishBtn.disabled = false;
  }
}

function showEditorError(id, message) {
  const el = document.getElementById(id);
  if (el) { el.textContent = message; el.classList.add('visible'); }
}

function clearEditorErrors() {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; el.classList.remove('visible'); });
}
