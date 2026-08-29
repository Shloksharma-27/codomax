/* ============================================
   Papertrail — data.js
   Session storage helpers for current browser session.
   Posts and users reside in MongoDB behind Express API.
   ============================================ */

const SESSION_KEY = 'papertrail_current_user';

function getCurrentUser() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user, token) {
  try {
    if (user) {
      localStorage.setItem(
        SESSION_KEY,
        JSON.stringify({ id: user.id || user._id, name: user.name, email: user.email })
      );
    }
    if (token) {
      setToken(token);
    }
  } catch (e) {
    console.error('Could not save user session', e);
  }
}

function clearCurrentUser() {
  try {
    localStorage.removeItem(SESSION_KEY);
    clearToken();
  } catch (e) {
    console.error('Could not clear user session', e);
  }
}

function isAuthenticated() {
  return !!getToken() && !!getCurrentUser();
}
