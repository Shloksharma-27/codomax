/* ============================================
   Papertrail — auth.js
   Login and register form handling.
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('login-form')) initLoginForm();
  if (document.getElementById('register-form')) initRegisterForm();
  initPasswordToggles();
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showFieldError(inputEl, errorEl, message) {
  if (inputEl) inputEl.classList.add('invalid');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

function clearFieldError(inputEl, errorEl) {
  if (inputEl) inputEl.classList.remove('invalid');
  if (errorEl) {
    errorEl.classList.remove('visible');
    errorEl.textContent = '';
  }
}

function showBanner(bannerEl, message, type) {
  if (!bannerEl) return;
  const icon = type === 'success'
    ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>'
    : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>';
  
  bannerEl.innerHTML = `${icon}<span>${escapeHtml(message)}</span>`;
  bannerEl.className = `form-banner visible ${type}`;
}

function hideBanner(bannerEl) {
  if (!bannerEl) return;
  bannerEl.className = 'form-banner';
  bannerEl.innerHTML = '';
}

function initPasswordToggles() {
  document.querySelectorAll('.password-toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const wrap = btn.closest('.input-password-wrap');
      const input = wrap?.querySelector('input');
      if (!input) return;

      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';

      const eyeOpen = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
      const eyeClosed = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';

      btn.innerHTML = isPassword ? eyeClosed : eyeOpen;
      btn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
    });
  });
}

/* ---------- Login Form ---------- */
function initLoginForm() {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const emailError = document.getElementById('login-email-error');
  const passwordError = document.getElementById('login-password-error');
  const banner = document.getElementById('login-banner');
  const submitBtn = document.getElementById('login-submit-btn');
  const forgotLink = document.getElementById('forgot-password-link');

  if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  if (forgotLink) {
    forgotLink.addEventListener('click', (e) => {
      e.preventDefault();
      showToast('Password reset: Please contact your site administrator or create a new account.', 'default');
    });
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
      showFieldError(emailInput, emailError, 'Please enter your email address.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError(emailInput, emailError, 'Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showFieldError(passwordInput, passwordError, 'Please enter your password.');
      valid = false;
    }

    if (!valid) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Logging in…';
    }

    try {
      const res = await api.auth.login(email, password);
      setCurrentUser(res.data.user, res.data.token);
      showBanner(banner, 'Login successful. Redirecting to your dashboard…', 'success');

      const params = new URLSearchParams(window.location.search);
      const redirectTarget = params.get('redirect');
      const destination = redirectTarget ? decodeURIComponent(redirectTarget) : 'dashboard.html';

      setTimeout(() => {
        window.location.href = destination;
      }, 500);
    } catch (err) {
      showBanner(banner, err.message || 'Incorrect email or password. Please try again.', 'error');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Log in</span>';
      }
    }
  });
}

/* ---------- Register Form ---------- */
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
  const submitBtn = document.getElementById('register-submit-btn');

  if (isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideBanner(banner);
    [
      [nameInput, nameError],
      [emailInput, emailError],
      [passwordInput, passwordError],
      [confirmInput, confirmError]
    ].forEach(([input, err]) => clearFieldError(input, err));
    if (termsError) termsError.classList.remove('visible');

    let valid = true;
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    if (!name) {
      showFieldError(nameInput, nameError, 'Please enter your full name.');
      valid = false;
    }

    if (!email) {
      showFieldError(emailInput, emailError, 'Please enter your email address.');
      valid = false;
    } else if (!isValidEmail(email)) {
      showFieldError(emailInput, emailError, 'Please enter a valid email address.');
      valid = false;
    }

    if (!password) {
      showFieldError(passwordInput, passwordError, 'Please create a password.');
      valid = false;
    } else if (password.length < 8) {
      showFieldError(passwordInput, passwordError, 'Password must be at least 8 characters long.');
      valid = false;
    }

    if (!confirm) {
      showFieldError(confirmInput, confirmError, 'Please confirm your password.');
      valid = false;
    } else if (confirm !== password) {
      showFieldError(confirmInput, confirmError, 'Passwords do not match.');
      valid = false;
    }

    if (termsInput && !termsInput.checked) {
      if (termsError) {
        termsError.textContent = 'You must accept the terms to create an account.';
        termsError.classList.add('visible');
      }
      valid = false;
    }

    if (!valid) return;

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Creating account…';
    }

    try {
      const res = await api.auth.register(name, email, password);
      // Auto login user after register
      if (res.data?.token && res.data?.user) {
        setCurrentUser(res.data.user, res.data.token);
        showBanner(banner, 'Account created successfully! Redirecting…', 'success');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 600);
      } else {
        showBanner(banner, 'Account created! Redirecting to login…', 'success');
        form.reset();
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 800);
      }
    } catch (err) {
      if (err.status === 409) {
        showFieldError(emailInput, emailError, err.message || 'An account with this email already exists.');
      } else {
        showBanner(banner, err.message || 'Could not create account. Please try again.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<span class="btn-text">Create Account</span>';
      }
    }
  });
}
