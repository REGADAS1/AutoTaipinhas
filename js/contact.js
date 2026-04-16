import { sendMessage } from './data.js';

const COOLDOWN_MS = 10_000;
let lastSuccessfulSubmitAt = 0;

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contactForm');
    const messageBox = document.getElementById('formMessage');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        hideFormMessage();

        const submitBtn = form.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';

        const now = Date.now();
        const remainingCooldown = COOLDOWN_MS - (now - lastSuccessfulSubmitAt);

        if (remainingCooldown > 0) {
            const secondsLeft = Math.ceil(remainingCooldown / 1000);
            showFormMessage(
                `Aguarde ${secondsLeft} segundo${secondsLeft > 1 ? 's' : ''} antes de enviar outra mensagem.`,
                'error'
            );
            return;
        }

        const nome = document.getElementById('name')?.value.trim() || '';
        const email = document.getElementById('email')?.value.trim() || '';
        const telefone = document.getElementById('phone')?.value.trim() || '';
        const assuntoCodigo = document.getElementById('subject')?.value || '';
        const mensagem = document.getElementById('message')?.value.trim() || '';
        const website = document.getElementById('website')?.value.trim() || '';

        const subjectMap = {
            info: 'Pedido de Informação',
            visit: 'Agendar Visita',
            financing: 'Financiamento',
            trade: 'Retoma',
            other: 'Outro'
        };

        const assunto = subjectMap[assuntoCodigo] || 'Outro';

        if (!nome || !email || !telefone || !mensagem) {
            showFormMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        if (website) {
            showFormMessage('Não foi possível enviar a mensagem. Tente novamente.', 'error');
            return;
        }

        if (!isValidEmail(email)) {
            showFormMessage('Por favor, introduza um email válido.', 'error');
            return;
        }

        if (!isValidPhone(telefone)) {
            showFormMessage('Por favor, introduza um número de telefone válido.', 'error');
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

            lastSuccessfulSubmitAt = Date.now();

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

    function isValidEmail(value) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
    }

    function isValidPhone(value) {
        const allowedChars = /^[+\d\s().-]+$/;
        const digitsOnly = value.replace(/\D/g, '');

        return allowedChars.test(value) && digitsOnly.length >= 9 && digitsOnly.length <= 15;
    }

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