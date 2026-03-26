window.addEventListener('load', function () {
    const loader = document.getElementById('pageLoader');

    if (!loader) return;

    setTimeout(() => {
        loader.classList.add('hidden');
    }, 1500);
});


// ===================================
// Script Principal do Site Público
// ===================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes comuns
    initNavbar();
    initBackToTop();
    initHomepage();
});

// ===================================
// Navbar e Menu Mobile
// ===================================

function initNavbar() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('navMenu');
    const navbar = document.getElementById('navbar');

    // Toggle menu mobile
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');

            // Animar hamburger
            const spans = hamburger.querySelectorAll('span');
            if (navMenu.classList.contains('active')) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(7px, -7px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });

        // Fechar menu ao clicar num link
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                navMenu.classList.remove('active');
                const spans = hamburger.querySelectorAll('span');
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            });
        });
    }

    // Navbar scroll effect
    if (navbar) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 100) {
                navbar.style.boxShadow = '0 4px 20px rgba(0,0,0,0.2)';
            } else {
                navbar.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
            }
        });
    }
}

// ===================================
// Botão Voltar ao Topo
// ===================================

function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    if (backToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// ===================================
// Homepage - Carros em Destaque
// ===================================

function initHomepage() {
    const featuredContainer = document.getElementById('featuredCars');

    if (featuredContainer) {
        const featuredCars = getFeaturedCars();

        if (featuredCars.length > 0) {
            featuredContainer.innerHTML = featuredCars.map(car => createCarCard(car)).join('');
        } else {
            featuredContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">Nenhum carro em destaque no momento.</p>';
        }
    }
}

// ===================================
// Animações de Entrada
// ===================================

// Observer para animações ao fazer scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Aplicar animações a elementos
document.querySelectorAll('.car-card, .testimonial-card, .value-card, .reason-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===================================
// Validação de Formulários
// ===================================

// Validar email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validar telefone português
function validatePhone(phone) {
    const re = /^(\+351)?[1-9][0-9]{8}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// ===================================
// Utilitários
// ===================================

// Smooth scroll para links âncora
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Prevenir submit em formulários de newsletter
document.querySelectorAll('.newsletter-form').forEach(form => {
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const emailInput = this.querySelector('input[type="email"]');
        const email = emailInput.value;

        if (validateEmail(email)) {
            alert('Obrigado por subscrever a nossa newsletter!');
            emailInput.value = '';
        } else {
            alert('Por favor, insira um email válido.');
        }
    });
});

// ===================================
// Lazy Loading de Imagens
// ===================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ===================================
// Loading State
// ===================================

// Adicionar loader a botões durante ações
function addLoadingState(button) {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.textContent = 'A carregar...';
}

function removeLoadingState(button) {
    button.disabled = false;
    button.textContent = button.dataset.originalText;
}

// ===================================
// Console Info
// ===================================

console.log('%c AutoStand Premium ', 'background: #2c3e50; color: #3498db; font-size: 20px; font-weight: bold; padding: 10px;');
console.log('%c Website desenvolvido com HTML, CSS e JavaScript puro ', 'background: #ecf0f1; color: #2c3e50; font-size: 12px; padding: 5px;');
