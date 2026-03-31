import {
    getCar,
    getAllCars,
    getStatusBadge,
    formatPrice,
    formatKm,
    createCarCard
} from './data.js';

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
                </div>

                <div class="contact-buttons">
                    <a href="contact.html" class="btn btn-primary btn-large">Pedir Informações</a>
                    <a href="https://wa.me/351912345678?text=${encodeURIComponent(`Olá, tenho interesse no ${car.marca} ${car.modelo}`)}"
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
}

function bindThumbnailGallery() {
    const mainImage = document.getElementById('mainImage');
    const thumbnails = document.querySelectorAll('.thumbnail-gallery .thumbnail');

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', function () {
            if (mainImage) {
                mainImage.src = this.dataset.image;
            }

            thumbnails.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
        });
    });
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

    const container = document.getElementById('similarCars');
    if (!container) return;

    if (!similar.length) {
        container.innerHTML = '<p>Sem viaturas semelhantes disponíveis.</p>';
        return;
    }

    container.innerHTML = similar.map(car => createCarCard(car)).join('');
}

function renderNotFound() {
    const content = document.getElementById('carDetailsContent');
    if (!content) return;

    content.innerHTML = `
        <div style="padding: 60px 20px; text-align: center;">
            <h1>Carro não encontrado</h1>
            <p>A viatura que procura não existe ou já não está disponível.</p>
            <a href="stock.html" class="btn btn-primary">Voltar ao Stock</a>
        </div>
    `;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}