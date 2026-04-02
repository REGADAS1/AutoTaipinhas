import { sendMessage } from './data.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    const messageBox = document.getElementById('formMessage');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        hideFormMessage();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

        const nome = document.getElementById('name')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const telefone = document.getElementById('phone')?.value.trim() || '';
        const assunto = document.getElementById('subject')?.value || '';
        const mensagem = document.getElementById('message')?.value.trim() || '';

        if (!nome || !email || !telefone || !mensagem) {
            showFormMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        try {
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = 'A enviar...';
            }

            const success = await sendMessage({
                nome,
                email,
                telefone,
                assunto,
                mensagem,
                origem: 'site-contactos',
                created_at: new Date().toISOString()
            });

            if (!success) {
                showFormMessage('Não foi possível enviar a mensagem. Tente novamente.', 'error');
                return;
            }

            showFormMessage('Mensagem enviada com sucesso! Entraremos em contacto em breve.', 'success');
            form.reset();
        } catch (error) {
            console.error('Erro ao submeter formulário de contacto:', error);
            showFormMessage('Ocorreu um erro ao enviar a mensagem.', 'error');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        }
    });

    function showFormMessage(message, type) {
        if (!messageBox) return;

        messageBox.textContent = message;
        messageBox.className = `form-message ${type}`;
        messageBox.style.display = 'block';
    }

    function hideFormMessage() {
        if (!messageBox) return;

        messageBox.style.display = 'none';
        messageBox.textContent = '';
        messageBox.className = 'form-message';
    }
});