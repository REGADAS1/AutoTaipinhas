import { supabase } from './supabase.js';

document.addEventListener('DOMContentLoaded', async () => {
    const { data } = await supabase.auth.getSession();

    if (data?.session) {
        window.location.href = 'admin-dashboard.html';
        return;
    }

    initLoginForm();
});

function initLoginForm() {
    const form = document.getElementById('adminLoginForm');
    const errorBox = document.getElementById('loginMessage');

    if (!form) {
        console.error('Formulário de login não encontrado.');
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        hideError();

        const email = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!email || !password) {
            showError('Preencha o email e a palavra-passe.');
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
                console.error('Erro no login:', error);
                showError('Credenciais inválidas.');
                return;
            }

            window.location.href = 'admin-dashboard.html';
        } catch (err) {
            console.error('Erro inesperado no login:', err);
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
        errorBox.style.display = 'none';
        errorBox.textContent = '';
    }
}