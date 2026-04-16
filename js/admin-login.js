import { supabase } from './supabase.js';
import {
  getVerifiedUser,
  isCurrentUserAdmin,
  ADMIN_DASHBOARD_ROUTE
} from './admin-access.js';

document.addEventListener('DOMContentLoaded', async () => {
  const user = await getVerifiedUser();

  if (user) {
    const isAdmin = await isCurrentUserAdmin();

    if (isAdmin) {
      window.location.href = ADMIN_DASHBOARD_ROUTE;
      return;
    }

    await supabase.auth.signOut();
  }

  initLoginForm();
});

function initLoginForm() {
  const form = document.getElementById('adminLoginForm');
  const errorBox = document.getElementById('loginMessage');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const email = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!email || !password) {
      showError('Preenche o email e a palavra-passe.');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.innerHTML : '';

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'A entrar...';
      }

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        showError('Credenciais inválidas.');
        return;
      }

      const isAdmin = await isCurrentUserAdmin();

      if (!isAdmin) {
        await supabase.auth.signOut();
        showError('Esta conta não tem permissão para aceder à administração.');
        return;
      }

      window.location.href = ADMIN_DASHBOARD_ROUTE;
    } catch (err) {
      console.error(err);
      showError('Ocorreu um erro ao iniciar sessão.');
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  });

  function showError(message) {
    if (!errorBox) return;
    errorBox.textContent = message;
    errorBox.style.display = 'block';
  }

  function hideError() {
    if (!errorBox) return;
    errorBox.textContent = '';
    errorBox.style.display = 'none';
  }
}