/**
 * Papertrail — Runtime Frontend Configuration
 *
 * For local development: defaults to http://localhost:5000/api
 * For production deployment (Vercel / Netlify / Custom Domain):
 * Uses the Render production backend URL.
 */
(function () {
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  // Local fallback on localhost vs Render production URL on deployed domains
  const defaultUrl = isLocal
    ? 'http://localhost:5000/api'
    : 'https://papertrail-backend-f6w2.onrender.com/api';

  window.PAPERTRAIL_CONFIG = {
    // Priority: custom window var -> localStorage override -> defaultUrl
    API_BASE_URL:
      window.__API_URL__ ||
      localStorage.getItem('PAPERTRAIL_API_URL') ||
      defaultUrl,
    APP_NAME: 'Papertrail',
    VERSION: '1.0.0'
  };
})();
