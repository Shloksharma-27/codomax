# Papertrail

A responsive blog platform built with vanilla HTML, CSS, and JavaScript. Papertrail lets a visitor browse articles, search and filter by category, register an account, and write, edit, publish, and delete their own stories — all persisted in the browser's LocalStorage.

This was built as a frontend internship project to demonstrate DOM manipulation, client-side routing between static pages, form validation, responsive design, and basic state management without a framework.

## Features

- **Home page** — hero section, featured article, searchable/filterable article grid, category pills
- **Search** — live filtering of articles by title or excerpt as you type
- **Category filtering** — filter the article grid by Technology, Design, Productivity, Career, or Lifestyle
- **Register / Login** — client-side form validation, duplicate-email checking, and a simulated authentication flow backed by LocalStorage
- **Protected routes** — Dashboard and Create Blog redirect to Login if no user is signed in
- **Dashboard** — post statistics (total, published, drafts, views), a sortable list of the signed-in user's posts, and inline edit/delete actions
- **Create / Edit Blog** — a distraction-free writing view with a lightweight Markdown-style formatting toolbar, tag input, category selector, and featured image preview with graceful fallback
- **Delete confirmation** — posts are never removed without an explicit "Delete this story?" confirmation modal
- **Toast notifications** — lightweight feedback for actions like publishing, saving drafts, logging in, and logging out
- **Fully responsive** — tested down to 375px, with the dashboard table collapsing into stacked cards and the nav collapsing into a hamburger menu on mobile
- **Accessible markup** — semantic HTML, labeled form fields, visible focus states, and ARIA attributes on interactive controls

## Tech Stack

- HTML5
- CSS3 (custom properties, CSS Grid, Flexbox — no framework)
- Vanilla JavaScript (ES6+)
- Browser LocalStorage for data persistence
- Google Fonts (Fraunces, Inter, JetBrains Mono)
- Inline SVG icons (no icon library dependency)

No React, Vue, Angular, Bootstrap, or backend framework is used. The app runs entirely by opening the HTML files in a browser.

## Project Structure

```text
blog-application/
│
├── index.html          Home page — hero, search, categories, article grid
├── login.html           Login page
├── register.html         Register page
├── dashboard.html        Signed-in user's dashboard
├── create-blog.html       Create / edit story page
│
├── css/
│   ├── style.css         Design system, navigation, footer, home page
│   ├── auth.css          Login / register page styles
│   └── dashboard.css      Dashboard and editor styles
│
├── js/
│   ├── data.js           Sample posts + all LocalStorage read/write helpers
│   ├── main.js           Navigation, toasts, formatting helpers, home page logic
│   ├── auth.js           Login and register form validation and submission
│   ├── dashboard.js       Stats, post list rendering, delete modal
│   └── create-blog.js      Editor logic: formatting, tags, image preview, save/publish
│
├── assets/
│   └── images/            (reserved for local assets; the project currently
│                            references remote Unsplash images for sample posts)
│
└── README.md
```

## How to Run

1. Download or clone the project folder.
2. Open the folder in VS Code (or any editor).
3. Open `index.html` with the **Live Server** extension, or simply double-click `index.html` to open it directly in a browser.

No build step, package installation, or server is required.

## How Authentication Works

Authentication in this project is **simulated entirely on the frontend** for demonstration purposes:

- Registering a user stores `{ name, email, password }` as plain text in a `papertrail_users` array in LocalStorage.
- Logging in checks the entered email and password against that array and, on a match, stores the signed-in user's name and email under `papertrail_current_user`.
- `Dashboard` and `Create Blog` check for `papertrail_current_user` on load and redirect to `Login` if it is missing.
- Logging out simply removes `papertrail_current_user`.

**This is not secure authentication.** Passwords are stored in plain text in the browser and are visible to anyone with access to that browser's DevTools. A real production app would need a backend service that hashes and salts passwords, issues signed session tokens (e.g. JWT), and never exposes credentials to client-side storage.

## How LocalStorage Works

The app uses four LocalStorage keys, all managed through helper functions in `js/data.js`:

| Key | Purpose |
|---|---|
| `papertrail_posts` | Array of all blog posts (seeded with ~10 sample articles on first load) |
| `papertrail_users` | Array of registered users |
| `papertrail_current_user` | The currently signed-in user, or absent if signed out |
| `papertrail_seeded` | Flag to prevent re-seeding sample data on every visit |

Because everything lives in the browser's LocalStorage, data is local to a single browser on a single device and will be lost if site data is cleared.

## Testing Checklist

- [x] Home search filters articles by title/excerpt, empty state shows when nothing matches
- [x] Category pills filter the article grid
- [x] Navigation is consistent and highlights the active page
- [x] Register validates required fields, email format, password length, password match, and terms acceptance
- [x] Register blocks duplicate emails
- [x] Login validates required fields and shows an error banner for invalid credentials
- [x] Successful login redirects to Dashboard
- [x] Dashboard shows accurate stats and the signed-in user's posts only
- [x] Edit opens Create Blog pre-filled with the existing post's data
- [x] Delete requires confirmation via modal before removing a post
- [x] Create Blog validates title, category, and content before saving
- [x] Save Draft and Publish both work and redirect to Dashboard with a toast
- [x] Dashboard and Create Blog redirect to Login when signed out
- [x] Logout clears the session and redirects to Home
- [x] Mobile: hamburger menu opens/closes, blog cards stack, dashboard table becomes cards, no horizontal scroll
- [x] No console errors on any page

## Future Improvements

- Node.js/Express backend with a real database (MongoDB or PostgreSQL)
- Secure authentication with hashed passwords and JWT-based sessions
- Cloud image uploads instead of pasted image URLs
- Real-time comments and reactions
- Rich-text (WYSIWYG) editor instead of the current lightweight Markdown-style toolbar
- Admin panel for moderating posts and users
- Pagination or infinite scroll for the article grid
