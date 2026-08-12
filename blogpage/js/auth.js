/* ============================================
   Papertrail — auth.js
   Login and register form handling.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('login-form')) initLoginForm();
  if (document.getElementById('register-form')) initRegisterForm();
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(inputEl, errorEl, message) {
  inputEl.classList.add('invalid');
  errorEl.textContent = message;
  errorEl.classList.add('visible');
}

function clearFieldError(inputEl, errorEl) {
  inputEl.classList.remove('invalid');
  errorEl.classList.remove('visible');
  errorEl.textContent = '';
}

function showBanner(bannerEl, message, type) {
  bannerEl.textContent = message;
  bannerEl.className = `form-banner visible ${type}`;
}

function hideBanner(bannerEl) {
  bannerEl.className = 'form-banner';
  bannerEl.textContent = '';
}

/* ---------- Login ---------- */
function initLoginForm() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const emailError = document.getElementById('login-email-error');
  const passwordError = document.getElementById('login-password-error');
  const banner = document.getElementById('login-banner');

  if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideBanner(banner);
    clearFieldError(emailInput, emailError);
    clearFieldError(passwordInput, passwordError);

    let valid = true;
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email) {
      showFieldError(emailInput, emailError, 'Enter your email address.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError(emailInput, emailError, 'Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showFieldError(passwordInput, passwordError, 'Enter your password.');
      valid = false;
    }

    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await api.auth.login(email, password);
      setCurrentUser(res.data.user, res.data.token);
      showBanner(banner, 'Login successful. Redirecting to your dashboard...', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
    } catch (err) {
      showBanner(banner, err.message || 'Incorrect email or password. Try again.', 'error');
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

/* ---------- Register ---------- */
function initRegisterForm() {
  const form = document.getElementById('register-form');
  const nameInput = document.getElementById('reg-name');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const confirmInput = document.getElementById('reg-confirm');
  const termsInput = document.getElementById('reg-terms');
  const nameError = document.getElementById('reg-name-error');
  const emailError = document.getElementById('reg-email-error');
  const passwordError = document.getElementById('reg-password-error');
  const confirmError = document.getElementById('reg-confirm-error');
  const termsError = document.getElementById('reg-terms-error');
  const banner = document.getElementById('register-banner');

  if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideBanner(banner);
    [ [nameInput, nameError], [emailInput, emailError], [passwordInput, passwordError],
      [confirmInput, confirmError] ].forEach(([input, err]) => clearFieldError(input, err));
    termsError.classList.remove('visible');

    let valid = true;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!name) {
      showFieldError(nameInput, nameError, 'Enter your full name.');
      valid = false;
    }

    if (!email) {
      showFieldError(emailInput, emailError, 'Enter your email address.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError(emailInput, emailError, 'Enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showFieldError(passwordInput, passwordError, 'Create a password.');
      valid = false;
    } else if (password.length < 8) {
      showFieldError(passwordInput, passwordError, 'Password must be at least 8 characters.');
      valid = false;
    }

    if (!confirm) {
      showFieldError(confirmInput, confirmError, 'Confirm your password.');
      valid = false;
    } else if (confirm !== password) {
      showFieldError(confirmInput, confirmError, 'Passwords do not match.');
      valid = false;
    }

    if (!termsInput.checked) {
      termsError.classList.add('visible');
      valid = false;
    }

    if (!valid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      await api.auth.register(name, email, password);
      showBanner(banner, 'Account created. Redirecting to login...', 'success');
      form.reset();
      setTimeout(() => { window.location.href = 'login.html'; }, 900);
    } catch (err) {
      if (err.status === 409) {
        showFieldError(emailInput, emailError, err.message || 'An account with this email already exists.');
      } else {
        showBanner(banner, err.message || 'Could not create your account. Please try again.', 'error');
      }
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
