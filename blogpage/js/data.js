/* ============================================
   Papertrail — data.js
   Session helpers only. Posts and user accounts now live in
   MongoDB behind the Express API (see js/api.js); this file just
   tracks who is currently signed in, in the browser.
   ============================================ */

const SESSION_KEY = 'papertrail_current_user';

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user, token) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ id: user.id, name: user.name, email: user.email }));
  if (token) setToken(token);
}

function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
  clearToken();
}

function isAuthenticated() {
  return !!getToken() && !!getCurrentUser();
}
