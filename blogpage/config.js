/**
 * Papertrail — Runtime Frontend Configuration
 *
 * For local development: defaults to http://localhost:5000/api
 * For production deployment (Vercel / Netlify / Custom Domain):
 * Set your backend Render/production API URL here or via window.__API_URL__.
 */
(function () {
  const isLocal =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  // Local fallback or production API URL
  const defaultUrl = isLocal ? 'http://localhost:5000/api' : 'http://localhost:5000/api';

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
