/**
 * Turns a title into a URL-friendly slug and appends a short random
 * suffix so two posts with the same title never collide.
 */
export function slugify(title) {
  const base = title
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  const suffix = Math.random().toString(36).slice(2, 8);
  return `${base || 'post'}-${suffix}`;
}
