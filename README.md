# 📰 Papertrail — Full-Stack Editorial Blog Platform

[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19%2B-blue.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20Mongoose%208-brightgreen.svg)](https://www.mongodb.com/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black.svg)](https://codomax-rho.vercel.app)
[![API Server](https://img.shields.io/badge/API%20Server-Render-46E3B7.svg)](https://papertrail-backend-f6w2.onrender.com/api)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](#license)

Papertrail is a modern, production-ready Full-Stack Blog and Editorial Publishing Application. Built with an **Express + MongoDB (Mongoose)** backend REST API and a **clean, responsive Vanilla HTML5/CSS3/JavaScript** frontend, Papertrail delivers a reading and publishing experience with zero unnecessary framework bloat.

### 🌐 Live Production Deployments
- 🚀 **Live Web Application**: [https://codomax-rho.vercel.app](https://codomax-rho.vercel.app)
- ⚙️ **Production REST API**: [https://papertrail-backend-f6w2.onrender.com/api](https://papertrail-backend-f6w2.onrender.com/api)
- 🗄️ **Database Cluster**: MongoDB Atlas (`Cluster0`)
- 📦 **GitHub Repository**: [https://github.com/Shloksharma-27/codomax](https://github.com/Shloksharma-27/codomax)

---

## 📑 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Directory Structure](#-project-directory-structure)
- [Prerequisites & Environment Variables](#-prerequisites--environment-variables)
- [Local Installation & Setup](#-local-installation--setup)
- [Running the Application](#-running-the-application)
- [REST API Documentation](#-rest-api-documentation)
- [Database Configuration (MongoDB Atlas)](#-database-configuration-mongodb-atlas)
- [Production Deployment Guide](#-production-deployment-guide)
  - [Frontend Deployment (Vercel / Netlify)](#frontend-deployment-vercel--netlify)
  - [Backend Deployment (Render)](#backend-deployment-render)
- [Testing & Quality Assurance](#-testing--quality-assurance)
- [Screenshots & UI Showcase](#-screenshots--ui-showcase)
- [Future Improvements](#-future-improvements)
- [Author & License](#-author--license)

---

## 🔍 Overview & Architecture

Papertrail is architected as a decoupled full-stack web application:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Client)                        │
│    Vanilla HTML5 + Modern CSS3 + Vanilla ES6 JavaScript     │
│    Hosted on: Vercel / Netlify / Live Server (Port 5500)    │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST API Calls (JSON / JWT)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (API Server)                     │
│               Node.js + Express + Mongoose                  │
│          Hosted on: Render / Node Server (Port 5000)        │
└──────────────────────────────┬──────────────────────────────┘
                               │  Mongoose ODM (ReplicaSet)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│               MongoDB Atlas / Local MongoDB                 │
└─────────────────────────────────────────────────────────────┘
```

1. **Frontend (`blogpage/`)**: Static multi-page application with modular styling, skeleton loading states, markdown rendering, responsive navigation drawer, and dynamic runtime API configuration (`config.js`).
2. **Backend (`backend/src/`)**: Express API structured in MVC pattern with JWT authentication, BCrypt password hashing, Mongoose schemas, central error handling, CORS validation, and rate/security headers.
3. **Database**: Cloud MongoDB Atlas instance managing indexed collections for `users` and `blogs`.

---

## ✨ Key Features

### 🌟 Reader Experience
- **Editorial Design System**: Typography pairing with *Fraunces* serif for headlines, *Inter* for UI copy, and *JetBrains Mono* for code/meta tags.
- **Hero & Live Search**: Debounced instant search filtering articles by title, excerpt, and content with a one-click clear button.
- **Category Filtering**: Explore stories by *Technology*, *Design*, *Productivity*, *Career*, and *Lifestyle*.
- **Featured Story Showcase**: Hero featured article highlighting the latest published publication.
- **Skeleton Shimmer Loading**: Skeleton loaders on initial data fetch.
- **Full Article View (`post.html`)**:
  - Live **reading progress bar** pinned to the navigation header.
  - Estimated reading time and view count tracking.
  - Markdown parser supporting headers, bold, italics, blockquotes, lists, and syntax-highlighted code blocks with **Copy to Clipboard**.
  - One-click article link sharing with toast confirmation.

### ✍️ Author & Publishing Studio
- **Secure Authentication**: User registration, login, and session persistence with JWT (JSON Web Tokens) and BCrypt password encryption.
- **Author Dashboard (`dashboard.html`)**:
  - Real-time stat counters for *Total Stories*, *Published*, *Drafts*, and *Total Views*.
  - Status filter tabs (*All*, *Published*, *Drafts*).
  - Responsive desktop data table and stacked card view on mobile devices.
  - Safe story deletion with modal confirmation.
- **Story Editor (`create-blog.html`)**:
  - Live character/word counter and reading time estimator.
  - Markdown formatting toolbar (Bold, Italic, Headings, Quotes, Lists, Code, Links).
  - **Write vs Preview tab toggle** to preview formatted stories before publishing.
  - Instant featured image preview with fallback and Unsplash sample shortcuts.
  - Tag input with chip tags and backspace removal.
  - Draft saving vs Immediate publishing.

### 📱 100% Mobile Responsive
- Optimized across **Mobile (320px–480px)**, **Tablet (768px–860px)**, **Laptop (1024px)**, and **Desktop (1200px+)**.
- Touch-friendly hamburger drawer with backdrop overlay.
- Zero horizontal scrolling or broken element overflows.

---

## 🛠️ Tech Stack

| Domain | Technology | Details |
|---|---|---|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | Vanilla DOM manipulation, CSS Grid, Flexbox, CSS Custom Properties |
| **Fonts & Icons** | Google Fonts, Inline SVG | *Fraunces*, *Inter*, *JetBrains Mono*, SVG icons |
| **Backend Runtime** | Node.js (v18+) | ES Modules (`"type": "module"`) |
| **Web Framework** | Express.js 4.19+ | RESTful API, Custom Middleware, Route handlers |
| **Database** | MongoDB & Mongoose 8+ | Document schema modeling, population, compound indexing |
| **Authentication** | JWT & BCrypt | Token-based auth (`Bearer <token>`), 10-round salt hashing |
| **Deployment** | Vercel / Netlify + Render | Static frontend CDN + Containerized Node.js Web Service |

---

## 📁 Project Directory Structure

```text
blog-application/
├── .env.example                # Root environment template
├── .gitignore                  # Git ignore rules (node_modules, .env, logs)
├── package.json                # Root automation scripts (dev, backend, frontend, test)
├── render.yaml                 # Render backend deployment blueprint
├── vercel.json                 # Vercel static hosting and route rewrite rules
├── netlify.toml                # Netlify deployment configuration
├── serve-frontend.js           # Static HTTP server for frontend (port 5500)
├── test_auth_dashboard.mjs     # Auth & dashboard automated integration test suite
├── test_crud_integration.mjs   # Blog CRUD & permissions automated test suite
├── README.md                   # Complete project documentation
│
├── backend/                    # Express API Backend
│   ├── .env.example            # Backend environment template
│   ├── .gitignore              # Backend git ignore rules
│   ├── package.json            # Backend dependencies and scripts
│   └── src/
│       ├── app.js              # Express app setup, CORS, security headers, middleware
│       ├── server.js           # Database connection & HTTP server entry point
│       ├── config/
│       │   └── db.js           # Mongoose MongoDB connection & error handlers
│       ├── controllers/
│       │   ├── authController.js       # Register, Login, Me handlers
│       │   ├── blogController.js       # CRUD, Search, Category filters, Pagination
│       │   └── dashboardController.js  # Author stats aggregation
│       ├── middleware/
│       │   ├── auth.js                 # JWT Protect & OptionalAuth middleware
│       │   └── errorHandler.js         # Central 4xx/5xx error formatter
│       ├── models/
│       │   ├── Blog.js                 # Blog schema & client JSON serializer
│       │   └── User.js                 # User schema & password hashing methods
│       ├── routes/
│       │   ├── authRoutes.js           # /api/auth routes
│       │   ├── blogRoutes.js           # /api/blogs routes
│       │   └── dashboardRoutes.js      # /api/dashboard routes
│       └── utils/
│           ├── AppError.js             # Custom operational error class
│           ├── asyncHandler.js         # Async route wrapper
│           ├── generateToken.js        # JWT generation utility
│           └── slugify.js              # URL slug generator
│
└── blogpage/                   # Frontend Client
    ├── config.js               # Dynamic API URL runtime configuration
    ├── index.html              # Home page (Hero, search, categories, featured, grid)
    ├── post.html               # Story reading detail page
    ├── create-blog.html        # Story creation and editing studio
    ├── dashboard.html          # Author management dashboard
    ├── login.html              # User login page
    ├── register.html           # User registration page
    ├── css/
    │   ├── style.css           # Design tokens, global typography, navbar, footer, post view
    │   ├── auth.css            # Login & register card styling
    │   └── dashboard.css       # Stats, tables, editor layout, modal dialog
    └── js/
        ├── api.js              # Network request layer with JWT management
        ├── auth.js             # Auth form validation, password toggle, submission
        ├── create-blog.js      # Editor logic, markdown formatting, tag input, preview
        ├── dashboard.js        # Stats loader, status filter, post table, delete modal
        ├── data.js             # LocalStorage session state management
        ├── main.js             # Navigation, mobile drawer, search, category pills, toasts
        └── post.js             # Post rendering, reading bar, share button, markdown parser
```

---

## ⚙️ Prerequisites & Environment Variables

### Prerequisites
- **Node.js**: v18.0.0 or higher ([Download Node.js](https://nodejs.org/))
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas connection string or local MongoDB instance running on `mongodb://127.0.0.1:27017`

### Environment Configuration
Create a `.env` file in the root directory and in `backend/.env` using the template below:

```env
# Server Port
PORT=5000

# Environment Mode
NODE_ENV=development

# MongoDB Connection String (Atlas or Local MongoDB)
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/papertrail?retryWrites=true&w=majority

# JWT Secret & Expiration
JWT_SECRET=papertrail_production_secret_key_minimum_32_characters_long
JWT_EXPIRES_IN=7d

# Allowed Frontend Origins for CORS (Comma-separated)
CLIENT_URL=http://localhost:5500,http://127.0.0.1:5500,http://localhost:5173,http://localhost:3000
```

---

## 🚀 Local Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/blog-application.git
   cd blog-application
   ```

2. **Install Backend Dependencies**:
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Configure Environment Variables**:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
   *(Ensure your `MONGO_URI` is populated in `.env`)*

---

## 💻 Running the Application

### Option A: Run Backend and Frontend Concurrently

Open two terminal windows:

**Terminal 1 (Backend API):**
```bash
npm run backend
# API will start at http://localhost:5000
```

**Terminal 2 (Frontend Client):**
```bash
npm run frontend
# Frontend will be served at http://localhost:5500
```

### Option B: Using VS Code Live Server
1. Start the backend: `npm run backend`
2. Open `blogpage/index.html` in VS Code and click **"Go Live"** (Port 5500).

---

## 📡 REST API Documentation

### Base URL
`http://localhost:5000/api` (Development) or `https://your-backend.onrender.com/api` (Production)

### 1. Health & Info
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/health` | Public | Returns server uptime and health status |
| `GET` | `/api` | Public | API index and endpoints summary |

### 2. Authentication (`/api/auth`)
| Method | Endpoint | Access | Request Body | Description |
|---|---|---|---|---|
| `POST` | `/api/auth/register` | Public | `{ name, email, password }` | Registers a new user and returns JWT token |
| `POST` | `/api/auth/login` | Public | `{ email, password }` | Authenticates user and returns JWT token |
| `GET` | `/api/auth/me` | Private | *Header: `Authorization: Bearer <token>`* | Returns current authenticated user |

### 3. Blog Management (`/api/blogs`)
| Method | Endpoint | Access | Query / Body | Description |
|---|---|---|---|---|
| `GET` | `/api/blogs` | Public / Optional Auth | `?search=&category=&page=&limit=` | Fetches published articles with filtering |
| `GET` | `/api/blogs?mine=true` | Private | *Header: `Authorization: Bearer <token>`* | Fetches the signed-in author's posts (published + drafts) |
| `GET` | `/api/blogs/:id` | Public | `?view=true` | Fetches a single story by ID (increments views if `view=true`) |
| `POST` | `/api/blogs` | Private | `{ title, content, excerpt, category, image, tags, status }` | Creates a new post (draft or published) |
| `PUT` | `/api/blogs/:id` | Private (Owner) | `{ title, content, category, image, tags, status }` | Updates an existing story |
| `DELETE` | `/api/blogs/:id` | Private (Owner) | None | Deletes a post |

### 4. Author Dashboard (`/api/dashboard`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/stats` | Private | Aggregates Total Posts, Published, Drafts, and Total Views |

---

## 🗄️ Database Configuration (MongoDB Atlas)

1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (e.g. `M0 Sandbox`).
3. Under **Database Access**, create a database user with read and write privileges.
4. Under **Network Access**, add IP address `0.0.0.0/0` (allow access from anywhere for cloud deployment).
5. Click **Connect** -> **Connect your application** -> Copy the connection string.
6. Paste the connection string as `MONGO_URI` in `.env`.

---

## 🚀 Production Deployment Guide

### Frontend Deployment (Vercel / Netlify)

#### Deploying on Vercel
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and click **"Add New Project"**.
3. Import your `blog-application` repository.
4. Framework Preset: **Other**.
5. Root Directory: `./` (Vercel uses the included `vercel.json` configuration).
6. Click **Deploy**.
7. In `blogpage/config.js`, set your deployed Render backend URL or specify it via `window.PAPERTRAIL_CONFIG`.

#### Deploying on Netlify
1. Go to [Netlify](https://www.netlify.com/) and click **"Add new site"** -> **"Import an existing project"**.
2. Select your repository.
3. Publish directory: `blogpage` (Netlify will automatically detect `netlify.toml`).
4. Click **Deploy Site**.

---

### Backend Deployment (Render)

1. Go to [Render](https://render.com/) and create a **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `papertrail-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
4. Add Environment Variables under the **Environment** tab:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGO_URI`: `your_mongodb_atlas_connection_string`
   - `JWT_SECRET`: `a_very_long_secure_random_string_32_characters`
   - `JWT_EXPIRES_IN`: `7d`
   - `CLIENT_URL`: `https://your-vercel-app.vercel.app,https://your-netlify-app.netlify.app`
5. Click **Create Web Service**.
6. Once deployed, copy your Render URL (e.g., `https://papertrail-backend.onrender.com`) and update `blogpage/config.js` or set `localStorage.setItem('PAPERTRAIL_API_URL', 'https://papertrail-backend.onrender.com/api')`.

---

## 🧪 Testing & Quality Assurance

Papertrail includes end-to-end integration test suites verifying all authentication flows, permissions, and database CRUD operations.

### Running Automated Integration Tests
Ensure the backend server is running, then execute:

```bash
# Run both test suites
npm test

# Or run individually
node test_crud_integration.mjs
node test_auth_dashboard.mjs
```

### Test Coverage Summary
- [x] User Registration with field validation (Name, Email format, Password >= 8 chars)
- [x] Duplicate Email rejection (409 Conflict)
- [x] Login credential verification & generic error feedback on bad password / bad email
- [x] JWT Token generation, verification, and expiration handling
- [x] Protected route isolation (Unauthorized access returns 401)
- [x] Draft post creation (hidden from public feed, visible only in author dashboard)
- [x] Story publishing, updating, and public visibility
- [x] Authorization checks (User B cannot edit or delete User A's post -> 403 Forbidden)
- [x] Story deletion and 404 response verification
- [x] View counter incrementation and dashboard stats aggregation
- [x] Search query filtering and category segregation

---

## 📸 Screenshots & UI Showcase

| View | Description |
|---|---|
| **Homepage** | Hero header, debounced live search, category filter pills, featured story, and 3-column article grid with skeleton loaders. |
| **Story Detail** | Reading progress bar, typography styling, code copy buttons, share action, and author quick-edit access. |
| **Author Dashboard** | Real-time statistics, status filter tabs (*All*, *Published*, *Drafts*), desktop table, and mobile card views. |
| **Story Editor** | Distraction-free Markdown editor with formatting toolbar, write/preview tabs, word counter, and image preview. |
| **Authentication** | Login and registration cards with password visibility toggles and real-time field error banners. |

---

## 🔮 Future Improvements

- [ ] Cloudinary / AWS S3 direct image upload support
- [ ] Reader comments and reaction system
- [ ] Bookmark and favorite stories functionality
- [ ] Email newsletter subscription integration
- [ ] Dark Mode toggle with CSS variables persistence
- [ ] Social login (OAuth with Google & GitHub)

---

## 👨‍💻 Author & License

- **Author**: **Shlok Sharma**
- **GitHub**: [@Shloksharma-27](https://github.com/Shloksharma-27)
- **LinkedIn**: [Shlok Sharma](https://www.linkedin.com/in/shlok-sharma-4167842a7/)
- **Project**: Papertrail Full-Stack Editorial Blog Platform
- **License**: MIT License — open for educational and commercial use.
