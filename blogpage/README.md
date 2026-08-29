# 📰 Papertrail — Frontend Client

The frontend client for the Papertrail Full-Stack Blog Application, built with modern Vanilla HTML5, CSS3, and JavaScript (ES6+).

## Features

- **Home Page**: Editorial hero, live debounced search bar, category filter pills, featured story showcase, and 3-column article grid with skeleton loading states.
- **Article Detail View (`post.html`)**: Live reading progress bar, estimated reading time, view counter, rich markdown renderer (code blocks with copy-to-clipboard, blockquotes, lists, tables), share buttons, and author edit shortcuts.
- **Author Dashboard (`dashboard.html`)**: Real-time reader engagement stats, status filter tabs (*All*, *Published*, *Drafts*), desktop table view, mobile stacked card view, and delete confirmation modal.
- **Story Studio Editor (`create-blog.html`)**: Live word and reading time counter, markdown formatting toolbar, Write vs. Live Preview tabs, instant image preview with sample shortcuts, and tag chip inputs.
- **Authentication (`login.html`, `register.html`)**: Clean login/register cards with password visibility toggles, client-side validation, loading button spinners, and animated error banners.
- **100% Mobile Responsive**: Tested across mobile (320px+), tablet, and desktop viewports with a sliding mobile drawer and backdrop blur.

## Runtime Configuration (`config.js`)

The frontend dynamically discovers the backend API URL through `config.js`:
- In local development: defaults to `http://localhost:5000/api`
- In production: defaults to the configured backend or `window.__API_URL__` / `localStorage.getItem('PAPERTRAIL_API_URL')`.

For complete project setup, API documentation, and deployment instructions, refer to the [Root README](../README.md).
