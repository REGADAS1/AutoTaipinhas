import {
    getCar,
    getAllCars,
    getStatusBadge,
    formatPrice,
    formatKm,
    createCarCard
} from './data.js';

let currentImages = [];
let currentImageIndex = 0;

document.addEventListener('DOMContentLoaded', async function () {
    await loadCarDetails();
});

async function loadCarDetails() {
    const params = new URLSearchParams(window.location.search);
    const carId = params.get('id');

    if (!carId) {
        window.location.href = 'stock.html';
        return;
    }

    const car = await getCar(carId);

    if (!car) {
        renderNotFound();
        return;
    }

    displayCarDetails(car);
    await displaySimilarCars(car);
}

function displayCarDetails(car) {
    const content = document.getElementById('carDetailsContent');
    if (!content) return;

    const statusBadge = getStatusBadge(car.estado);
    const imagens = car.imagens?.length
        ? car.imagens
        : ['https://via.placeholder.com/900x600?text=Sem+Imagem'];

    currentImages = imagens;
    currentImageIndex = 0;

    content.innerHTML = `
        <div class="car-details-grid">
            <div class="car-gallery">
                <div class="main-image">
                    <img src="${imagens[0]}" alt="${escapeHtml(car.marca)} ${escapeHtml(car.modelo)}" id="mainImage">
                    ${statusBadge}
                </div>

                <div class="thumbnail-gallery">
                    ${imagens.map((img, index) => `
                        <img
                            src="${img}"
                            alt="Imagem ${index + 1}"
                            class="thumbnail ${index === 0 ? 'active' : ''}"
                            data-image="${img}"
                            data-index="${index}"
                        >
                    `).join('')}
                </div>
            </div>

            <div class="car-info">
                <h1>${escapeHtml(car.marca)} ${escapeHtml(car.modelo)}</h1>
                <div class="car-price">${formatPrice(car.preco)}</div>

                <div class="car-specs-grid">
                    <div class="spec-item">
                        <span class="spec-label">Ano</span>
                        <span class="spec-value">${car.ano}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Quilómetros</span>
                        <span class="spec-value">${formatKm(car.quilometros)}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Combustível</span>
                        <span class="spec-value">${escapeHtml(car.combustivel)}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Caixa</span>
                        <span class="spec-value">${escapeHtml(car.caixa)}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Potência</span>
                        <span class="spec-value">${car.potencia} CV</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Cilindrada</span>
                        <span class="spec-value">${car.cilindrada} cc</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Cor</span>
                        <span class="spec-value">${escapeHtml(car.cor)}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Portas</span>
                        <span class="spec-value">${escapeHtml(String(car.portas ?? '-'))}</span>
                    </div>
                    <div class="spec-item">
                        <span class="spec-label">Lugares</span>
                        <span class="spec-value">${escapeHtml(String(car.lugares ?? '-'))}</span>
                    </div>
                </div>

                <div class="contact-buttons">
                    <a href="contact.html" class="btn btn-primary btn-large">Pedir Informações</a>
                    <a href="https://wa.me/351934175852?text=${encodeURIComponent(`Olá, tenho interesse no ${car.marca} ${car.modelo}`)}"
                       target="_blank"
                       class="btn btn-success btn-large">
                        WhatsApp
                    </a>
                </div>
            </div>
        </div>

        <div class="car-description-section">
            <h2>Descrição</h2>
            <p>${escapeHtml(car.descricao || '')}</p>
        </div>

        ${car.equipamentos && car.equipamentos.length > 0 ? `
            <div class="car-features-section">
                <h2>Equipamentos e Opcionais</h2>
                <div class="features-grid">
                    ${car.equipamentos.map(eq => `
                        <div class="feature-item">
                            <span class="feature-icon">✓</span>
                            <span>${escapeHtml(eq)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        ` : ''}
    `;

    bindThumbnailGallery();
    createImageLightbox();
    bindMainImageClick();
}

function bindThumbnailGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail-gallery .thumbnail');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function () {
            const imageIndex = Number(this.dataset.index);

            if (mainImage) {
                mainImage.src = this.dataset.image;
            }

            currentImageIndex = imageIndex;

            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function bindMainImageClick() {
    const mainImage = document.getElementById('mainImage');
    if (!mainImage) return;

    mainImage.addEventListener('click', () => {
        openLightbox(currentImageIndex);
    });
}

function createImageLightbox() {
    const existing = document.getElementById('imageLightbox');
    if (existing) existing.remove();

    const lightbox = document.createElement('div');
    lightbox.id = 'imageLightbox';
    lightbox.className = 'image-lightbox';
    lightbox.innerHTML = `
    <div class="lightbox-backdrop"></div>

    <button class="lightbox-close" id="lightboxClose" aria-label="Fechar">
        &times;
    </button>

    <button class="lightbox-nav lightbox-prev" id="lightboxPrev" aria-label="Imagem anterior">
        &#10094;
    </button>

    <div class="lightbox-content">
        <img id="lightboxImage" src="" alt="Imagem ampliada">
    </div>

    <div class="lightbox-counter" id="lightboxCounter">1 / 1</div>

    <button class="lightbox-nav lightbox-next" id="lightboxNext" aria-label="Imagem seguinte">
        &#10095;
    </button>
`;

    document.body.appendChild(lightbox);

    const closeBtn = document.getElementById('lightboxClose');
    const prevBtn = document.getElementById('lightboxPrev');
    const nextBtn = document.getElementById('lightboxNext');
    const backdrop = lightbox.querySelector('.lightbox-backdrop');

    closeBtn?.addEventListener('click', closeLightbox);
    prevBtn?.addEventListener('click', showPreviousImage);
    nextBtn?.addEventListener('click', showNextImage);
    backdrop?.addEventListener('click', closeLightbox);

    document.addEventListener('keydown', handleLightboxKeyboard);
}

function updateLightboxCounter() {
    const counter = document.getElementById('lightboxCounter');
    if (!counter) return;

    counter.textContent = `${currentImageIndex + 1} / ${currentImages.length}`;
}

function openLightbox(index) {
    const lightbox = document.getElementById('imageLightbox');
    const lightboxImage = document.getElementById('lightboxImage');

    if (!lightbox || !lightboxImage || !currentImages.length) return;
updateLightboxCounter();
    currentImageIndex = index;
    lightboxImage.src = currentImages[currentImageIndex];
    lightbox.classList.add('active');
    document.body.classList.add('lightbox-open');
}

function closeLightbox() {
    const lightbox = document.getElementById('imageLightbox');
    if (!lightbox) return;

    lightbox.classList.remove('active');
    document.body.classList.remove('lightbox-open');
}

function showPreviousImage() {
    if (!currentImages.length) return;

    currentImageIndex =
        currentImageIndex === 0
            ? currentImages.length - 1
            : currentImageIndex - 1;

    updateLightboxImage();
    updateActiveThumbnail();
}

function showNextImage() {
    if (!currentImages.length) return;

    currentImageIndex =
        currentImageIndex === currentImages.length - 1
            ? 0
            : currentImageIndex + 1;

    updateLightboxImage();
    updateActiveThumbnail();
}

function updateLightboxImage() {
    const lightboxImage = document.getElementById('lightboxImage');
    const mainImage = document.getElementById('mainImage');

    if (lightboxImage) {
        lightboxImage.src = currentImages[currentImageIndex];
    }

    if (mainImage) {
        mainImage.src = currentImages[currentImageIndex];
    }

    updateLightboxCounter();
}

function updateActiveThumbnail() {
    const thumbnails = document.querySelectorAll('.thumbnail-gallery .thumbnail');

    thumbnails.forEach((thumb, index) => {
        thumb.classList.toggle('active', index === currentImageIndex);
    });
}

function handleLightboxKeyboard(e) {
    const lightbox = document.getElementById('imageLightbox');
    if (!lightbox || !lightbox.classList.contains('active')) return;

    if (e.key === 'Escape') {
        closeLightbox();
    }

    if (e.key === 'ArrowLeft') {
        showPreviousImage();
    }

    if (e.key === 'ArrowRight') {
        showNextImage();
    }
}

async function displaySimilarCars(currentCar) {
    const allCars = await getAllCars();

    const similar = allCars
        .filter(car => car.id !== currentCar.id && car.estado === 'Disponível')
        .filter(car =>
            car.marca === currentCar.marca ||
            Math.abs(car.preco - currentCar.preco) < 5000
        )
        .slice(0, 3);

    const similarCarsContainer = document.getElementById('similarCars');
    if (!similarCarsContainer) return;

    if (similar.length === 0) {
        similarCarsContainer.innerHTML = `
            <p class="no-cars-message">Não existem carros semelhantes disponíveis de momento.</p>
        `;
        return;
    }

    similarCarsContainer.innerHTML = similar.map(car => createCarCard(car)).join('');
}

function renderNotFound() {
    const content = document.getElementById('carDetailsContent');
    if (!content) return;

    content.innerHTML = `
        <div class="no-cars-message">
            <h2>Carro não encontrado</h2>
            <p>O veículo que procura não existe ou já não está disponível.</p>
            <a href="stock.html" class="btn btn-primary" style="margin-top: 20px;">
                Ver Stock
            </a>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}