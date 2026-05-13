import { supabase } from './supabase.js';
import {
    getStats,
    getAllCars,
    getCar,
    addCar,
    updateCar,
    deleteCar,
    formatPrice,
    getMessages,
    updateMessageReadStatus,
    deleteMessage
} from './data.js';

import {
    requireAdminOrRedirect,
    ADMIN_LOGIN_ROUTE
} from './admin-access.js';

// ===================================
// Painel de Administração
// ===================================

const STORAGE_BUCKET = 'car-images';
const MAX_IMAGE_UPLOAD_COUNT = 10;
const MAX_ORIGINAL_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;
const MAX_COMPRESSED_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const IMAGE_TARGET_SIZE_BYTES = 700 * 1024;
const IMAGE_MAX_DIMENSION_PX = 1600;
const IMAGE_QUALITY_START = 0.82;
const IMAGE_QUALITY_MIN = 0.55;

let carImages = []; // [{ kind: 'existing'|'new', imageId, storagePath, ordem, url, file, previewUrl }]
let deletedExistingImages = []; // imagens existentes removidas no formulário, apagadas ao guardar
let adminMessages = [];
let carFormInitialSnapshot = '';

document.addEventListener('DOMContentLoaded', async function () {
    const adminUser = await requireAdminOrRedirect();
    if (!adminUser) return;

    initNavigation();
    initAdminActions();
    initCarManagement();
    initAdminDashboard();
    initCarForm();
    initImageUpload();
    initMessagesActions();
    bindMessagesRefresh();
    bindLogout();
    setCarYearMax();
    bindCleanupOnUnload();
});


function bindMessagesRefresh() {
    const refreshBtn = document.getElementById('refreshMessagesBtn');
    if (!refreshBtn) return;

    refreshBtn.addEventListener('click', async () => {
        await loadMessages();
    });
}

function setCarYearMax() {
    const carAnoInput = document.getElementById('carAno');
    if (!carAnoInput) return;

    carAnoInput.max = String(new Date().getFullYear() + 1);
}

function bindLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;

    logoutBtn.addEventListener('click', async function () {
        const confirmLogout = confirm('Tem a certeza que deseja sair?');
        if (!confirmLogout) return;

        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Erro ao terminar sessão:', error);
                showMessage('Não foi possível terminar a sessão.', 'error');
                return;
            }

            window.location.href = ADMIN_LOGIN_ROUTE;
        } catch (err) {
            console.error('Erro inesperado no logout:', err);
            showMessage('Ocorreu um erro ao terminar a sessão.', 'error');
        }
    });
}


function initAdminActions() {
    document.addEventListener('click', async (e) => {
        const sectionTrigger = e.target.closest('[data-go-section]');
        if (sectionTrigger) {
            e.preventDefault();
            const sectionName = sectionTrigger.dataset.goSection;
            if (sectionName) {
                await goToSection(sectionName);
            }
            return;
        }

        const adminActionBtn = e.target.closest('[data-admin-action]');
        if (!adminActionBtn) return;

        const action = adminActionBtn.dataset.adminAction;
        const carId = adminActionBtn.dataset.carId;

        if (action === 'edit-car' && carId) {
            await editCar(carId);
            return;
        }

        if (action === 'delete-car' && carId) {
            await confirmDeleteCar(carId);
            return;
        }

        if (action === 'reset-car-form') {
            resetForm();
            return;
        }
    });
}

// ===================================
// Navegação entre Secções
// ===================================

function initNavigation() {
    const menuLinks = document.querySelectorAll('.admin-menu a');

    menuLinks.forEach(link => {
        link.addEventListener('click', async function (e) {
            e.preventDefault();

            const sectionName = this.getAttribute('data-section');
            if (sectionName) {
                await goToSection(sectionName);
            }
        });
    });
}

async function goToSection(sectionName) {
    const activeSectionName = getActiveSectionName();

    if (activeSectionName === 'add-car' && sectionName !== 'add-car') {
        const canLeave = await confirmLeaveCarFormIfNeeded();
        if (!canLeave) return false;

        resetForm();
    }

    if (sectionName === 'add-car') {
        if (activeSectionName === 'add-car') {
            const canDiscard = await confirmLeaveCarFormIfNeeded();
            if (!canDiscard) return false;
        }

        resetForm();
    }

    await activateSection(sectionName);
    return true;
}

async function activateSection(sectionName) {
    const menuLinks = document.querySelectorAll('.admin-menu a');
    const sections = document.querySelectorAll('.admin-section');
    const targetSection = document.getElementById(`${sectionName}-section`);

    if (!targetSection) return;

    menuLinks.forEach(link => {
        link.classList.toggle('active', link.getAttribute('data-section') === sectionName);
    });

    sections.forEach(section => {
        section.classList.remove('active');
    });

    targetSection.classList.add('active');

    if (sectionName === 'dashboard') {
        await updateDashboardStats();
    } else if (sectionName === 'cars') {
        await loadCarsTable();
    } else if (sectionName === 'add-car') {
        hideFormMessage();
    } else if (sectionName === 'messages') {
        await loadMessages();
    }
}

function getActiveSectionName() {
    const activeSection = document.querySelector('.admin-section.active');
    return activeSection?.id?.replace('-section', '') || '';
}

function getCarFormSnapshot() {
    const form = document.getElementById('carForm');
    if (!form) return '';

    const fields = Array.from(form.querySelectorAll('input, select, textarea'))
        .filter(field => field.type !== 'file')
        .map(field => ({
            id: field.id,
            value: field.type === 'checkbox' ? field.checked : field.value
        }));

    return JSON.stringify({
        fields,
        images: carImages.map((image, index) => ({
            index,
            kind: image.kind,
            key: image.imageId || image.storagePath || image.url || image.file?.name || '',
            fileSize: image.file?.size || null
        })),
        deletedExistingImages: deletedExistingImages.map(image => image.imageId || image.storagePath || image.url || '')
    });
}

function setCarFormBaseline() {
    carFormInitialSnapshot = getCarFormSnapshot();
}

function hasCarFormDraft() {
    const carId = document.getElementById('carId')?.value;
    return Boolean(carId) || getCarFormSnapshot() !== carFormInitialSnapshot;
}

async function confirmLeaveCarFormIfNeeded() {
    if (!hasCarFormDraft()) return true;

    return showConfirmModal({
        title: 'Sair sem guardar?',
        message: 'Tem a certeza que quer sair sem guardar? As alterações não guardadas serão perdidas.',
        confirmText: 'Sim, sair',
        cancelText: 'Cancelar'
    });
}

// ===================================
// Dashboard - Estatísticas
// ===================================

async function initAdminDashboard() {
    await updateDashboardStats();
}

async function updateDashboardStats() {
    try {
        const stats = await getStats();

        const totalCars = document.getElementById('totalCars');
        const availableCars = document.getElementById('availableCars');
        const reservedCars = document.getElementById('reservedCars');
        const soldCars = document.getElementById('soldCars');

        if (totalCars) totalCars.textContent = stats.total ?? 0;
        if (availableCars) availableCars.textContent = stats.disponivel ?? 0;
        if (reservedCars) reservedCars.textContent = stats.reservado ?? 0;
        if (soldCars) soldCars.textContent = stats.vendido ?? 0;
    } catch (err) {
        console.error('Erro ao atualizar estatísticas:', err);
        showMessage('Não foi possível carregar as estatísticas.', 'error');
    }
}

// ===================================
// Gestão de Carros - Tabela
// ===================================

function initCarManagement() {
    const searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            filterCarsTable(searchTerm);
        });
    }
}

async function loadCarsTable() {
    const tbody = document.getElementById('carsTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
        <tr>
            <td colspan="7" style="text-align:center; padding: 30px;">A carregar carros...</td>
        </tr>
    `;

    try {
        const cars = await getAllCars();

        if (!cars || cars.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding: 40px;">
                        Nenhum carro adicionado ainda.
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = cars.map(car => {
            const statusClass = normalizeStatusClass(car.estado);
            const imageSrc = car.imagens?.[0] || 'https://via.placeholder.com/120x80?text=Sem+Imagem';

            return `
                <tr data-car-id="${car.id}">
                    <td>
                        <img src="${imageSrc}" alt="${car.marca} ${car.modelo}" class="car-thumbnail">
                    </td>
                    <td>${escapeHtml(car.marca)}</td>
                    <td>${escapeHtml(car.modelo)}</td>
                    <td>${escapeHtml(String(car.ano))}</td>
                    <td>${formatPrice(car.preco)}</td>
                    <td>
                        <span class="status-badge status-${statusClass}">
                            ${escapeHtml(car.estado)}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button
                                type="button"
                                class="btn-icon btn-edit"
                                data-admin-action="edit-car"
                                data-car-id="${car.id}"
                                title="Editar"
                            >
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button
                                type="button"
                                class="btn-icon btn-delete"
                                data-admin-action="delete-car"
                                data-car-id="${car.id}"
                                title="Eliminar"
                            >
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    } catch (err) {
        console.error('Erro ao carregar tabela de carros:', err);
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center; padding: 40px;">
                    Erro ao carregar os carros.
                </td>
            </tr>
        `;
    }
}

function filterCarsTable(searchTerm) {
    const rows = document.querySelectorAll('#carsTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
}

// ===================================
// Upload e Preview de Imagens
// ===================================

function clearSelectedPreviewUrls() {
    carImages.forEach(image => {
        if (image?.kind === 'new' && image.previewUrl) {
            URL.revokeObjectURL(image.previewUrl);
        }
    });
}

function getImagePreviewSrc(image) {
    if (!image) return '';

    if (typeof image === 'string') return image;
    if (image.previewUrl) return image.previewUrl;
    if (image.url) return image.url;

    return '';
}

function getExistingImageItems() {
    return carImages.filter(image => image.kind === 'existing');
}

function getNewImageItems() {
    return carImages.filter(image => image.kind === 'new');
}

function sanitizeFileName(fileName) {
    const extension = fileName.includes('.')
        ? fileName.split('.').pop().toLowerCase()
        : 'jpg';

    const baseName = fileName.replace(/\.[^/.]+$/, '');

    const safeBaseName = baseName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'imagem';

    return {
        extension,
        safeBaseName
    };
}

async function loadImageElement(file) {
    const objectUrl = URL.createObjectURL(file);

    try {
        const image = new Image();
        image.src = objectUrl;
        await image.decode();
        return image;
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
}

function getScaledImageSize(width, height) {
    const longestSide = Math.max(width, height);

    if (longestSide <= IMAGE_MAX_DIMENSION_PX) {
        return { width, height };
    }

    const scale = IMAGE_MAX_DIMENSION_PX / longestSide;

    return {
        width: Math.round(width * scale),
        height: Math.round(height * scale)
    };
}

function canvasToBlob(canvas, type, quality) {
    return new Promise((resolve, reject) => {
        canvas.toBlob(blob => {
            if (blob) {
                resolve(blob);
                return;
            }

            reject(new Error('Não foi possível comprimir a imagem.'));
        }, type, quality);
    });
}

async function compressImageFile(file) {
    const image = await loadImageElement(file);
    const { width, height } = getScaledImageSize(image.naturalWidth, image.naturalHeight);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, 0, 0, width, height);

    let quality = IMAGE_QUALITY_START;
    let blob = await canvasToBlob(canvas, 'image/webp', quality);

    while (blob.size > IMAGE_TARGET_SIZE_BYTES && quality > IMAGE_QUALITY_MIN) {
        quality = Math.max(IMAGE_QUALITY_MIN, quality - 0.08);
        blob = await canvasToBlob(canvas, 'image/webp', quality);
    }

    if (blob.size > MAX_COMPRESSED_IMAGE_SIZE_BYTES) {
        throw new Error(`A imagem "${file.name}" ficou demasiado pesada mesmo depois da compressão.`);
    }

    const { safeBaseName } = sanitizeFileName(file.name);

    return new File([blob], `${safeBaseName}.webp`, {
        type: 'image/webp',
        lastModified: Date.now()
    });
}

async function uploadNewImagesToStorage(carId) {
    const uploadedRows = [];

    for (const [index, image] of carImages.entries()) {
        if (image.kind !== 'new') continue;

        const { extension, safeBaseName } = sanitizeFileName(image.file.name);
        const filePath = `cars/${carId}/${Date.now()}-${index}-${safeBaseName}.${extension}`;

        const { error: uploadError } = await supabase
            .storage
            .from(STORAGE_BUCKET)
            .upload(filePath, image.file, {
                cacheControl: '31536000',
                contentType: image.file.type || 'image/webp',
                upsert: false
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data } = supabase
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(filePath);

        uploadedRows.push({
            car_id: Number(carId),
            storage_path: filePath,
            url: data.publicUrl,
            ordem: index
        });
    }

    return uploadedRows;
}

async function updateExistingImageOrder(carId) {
    const updates = carImages
        .map((image, index) => ({ image, index }))
        .filter(({ image }) => image.kind === 'existing' && image.imageId);

    for (const { image, index } of updates) {
        const { error } = await supabase
            .from('imagens')
            .update({ ordem: index })
            .eq('image_id', image.imageId)
            .eq('car_id', Number(carId));

        if (error) {
            throw error;
        }
    }
}

async function deleteMarkedExistingImages() {
    const imageIds = deletedExistingImages
        .map(image => image.imageId)
        .filter(Boolean);

    if (imageIds.length) {
        const { error } = await supabase
            .from('imagens')
            .delete()
            .in('image_id', imageIds);

        if (error) {
            throw error;
        }
    }

    await removeStoredImages(deletedExistingImages);
    deletedExistingImages = [];
}

async function cleanupUploadedFiles(uploadedRows) {
    const paths = (uploadedRows || [])
        .map(row => row.storage_path)
        .filter(Boolean);

    if (!paths.length) return;

    const { error } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .remove(paths);

    if (error) {
        console.error('Erro ao limpar uploads recentes do Storage:', error);
    }
}

async function removeStoredImages(images) {
    const paths = (images || [])
        .map(image => image.storagePath)
        .filter(Boolean);

    if (!paths.length) return;

    const { error } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .remove(paths);

    if (error) {
        throw error;
    }
}

function initImageUpload() {
    const imageInput = document.getElementById('carImagens');
    const previewContainer = document.getElementById('imagePreviewContainer');

    if (imageInput) {
        imageInput.addEventListener('change', handleImageSelection);
    }

    if (previewContainer) {
        previewContainer.addEventListener('click', handleImagePreviewClick);
        previewContainer.addEventListener('dragstart', handleImageDragStart);
        previewContainer.addEventListener('dragover', handleImageDragOver);
        previewContainer.addEventListener('drop', handleImageDrop);
        previewContainer.addEventListener('dragend', handleImageDragEnd);
    }
}

async function handleImageSelection(event) {
    const imageInput = event.target;
    const files = Array.from(imageInput.files || []);

    if (!files.length) {
        renderImagePreviews();
        return;
    }

    if (carImages.length + files.length > MAX_IMAGE_UPLOAD_COUNT) {
        showFormMessage(`Este anúncio pode ter no máximo ${MAX_IMAGE_UPLOAD_COUNT} imagens. Remova algumas imagens antes de adicionar novas.`, 'error');
        imageInput.value = '';
        renderImagePreviews();
        return;
    }

    const invalidFile = files.find(file => !['image/jpeg', 'image/png', 'image/webp'].includes(file.type));
    if (invalidFile) {
        showFormMessage('Só podes selecionar imagens JPG, PNG ou WebP.', 'error');
        imageInput.value = '';
        renderImagePreviews();
        return;
    }

    const oversizedFile = files.find(file => file.size > MAX_ORIGINAL_IMAGE_SIZE_BYTES);
    if (oversizedFile) {
        showFormMessage('Cada imagem original deve ter no máximo 12 MB.', 'error');
        imageInput.value = '';
        renderImagePreviews();
        return;
    }

    try {
        imageInput.disabled = true;
        showFormMessage('A comprimir imagens...', 'success');

        const compressedFiles = [];

        for (const file of files) {
            const compressedFile = await compressImageFile(file);
            compressedFiles.push(compressedFile);
        }

        const newImages = compressedFiles.map(file => ({
            kind: 'new',
            file,
            previewUrl: URL.createObjectURL(file)
        }));

        carImages.push(...newImages);

        const originalTotal = files.reduce((total, file) => total + file.size, 0);
        const compressedTotal = compressedFiles.reduce((total, file) => total + file.size, 0);
        const savedPercent = Math.max(0, Math.round((1 - compressedTotal / originalTotal) * 100));

        showFormMessage(`Imagens adicionadas e comprimidas com sucesso. Espaço poupado: ${savedPercent}%. Pode arrastar para ordenar.`, 'success');
        imageInput.value = '';
        renderImagePreviews();
    } catch (error) {
        console.error('Erro ao comprimir imagens:', error);
        imageInput.value = '';
        showFormMessage(error.message || 'Não foi possível comprimir as imagens.', 'error');
        renderImagePreviews();
    } finally {
        imageInput.disabled = false;
    }
}

function renderImagePreviews() {
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    if (!carImages.length) {
        previewContainer.innerHTML = `
            <div class="image-preview-empty">
                Nenhuma imagem adicionada. A primeira imagem será a foto principal do anúncio.
            </div>
        `;
        return;
    }

    carImages.forEach((image, index) => {
        const src = getImagePreviewSrc(image);
        if (!src) return;

        const previewItem = document.createElement('div');
        previewItem.className = `image-preview-item ${index === 0 ? 'is-cover' : ''}`;
        previewItem.draggable = true;
        previewItem.dataset.imageIndex = String(index);
        previewItem.innerHTML = `
            <div class="image-preview-thumb">
                <img src="${escapeHtml(src)}" alt="Imagem ${index + 1}">
                <span class="image-order-badge">${index === 0 ? 'Principal' : index + 1}</span>
            </div>

            <div class="image-preview-info">
                <span>${image.kind === 'new' ? 'Nova foto' : 'Foto guardada'}</span>
                <small>${index === 0 ? 'Aparece primeiro no anúncio' : 'Arraste para mudar a ordem'}</small>
            </div>

            <div class="image-preview-actions">
                <button type="button" class="image-action-btn" data-image-action="move-up" data-image-index="${index}" ${index === 0 ? 'disabled' : ''} title="Subir imagem">
                    <i class="fa-solid fa-arrow-up"></i>
                </button>
                <button type="button" class="image-action-btn" data-image-action="move-down" data-image-index="${index}" ${index === carImages.length - 1 ? 'disabled' : ''} title="Descer imagem">
                    <i class="fa-solid fa-arrow-down"></i>
                </button>
                <button type="button" class="image-action-btn danger" data-image-action="remove" data-image-index="${index}" title="Eliminar imagem">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        previewContainer.appendChild(previewItem);
    });
}

async function handleImagePreviewClick(event) {
    const button = event.target.closest('[data-image-action]');
    if (!button) return;

    const index = Number(button.dataset.imageIndex);
    if (!Number.isInteger(index) || !carImages[index]) return;

    const action = button.dataset.imageAction;

    if (action === 'move-up') {
        moveImage(index, index - 1);
        return;
    }

    if (action === 'move-down') {
        moveImage(index, index + 1);
        return;
    }

    if (action === 'remove') {
        await removeImageAtIndex(index);
    }
}

function moveImage(fromIndex, toIndex) {
    if (toIndex < 0 || toIndex >= carImages.length || fromIndex === toIndex) return;

    const [image] = carImages.splice(fromIndex, 1);
    carImages.splice(toIndex, 0, image);
    renderImagePreviews();
}

async function removeImageAtIndex(index) {
    const image = carImages[index];
    if (!image) return;

    const confirmed = await showConfirmModal({
        title: 'Eliminar imagem?',
        message: 'Esta imagem será removida do anúncio quando guardar o carro.',
        confirmText: 'Sim, eliminar',
        cancelText: 'Cancelar'
    });

    if (!confirmed) return;

    if (image.kind === 'new' && image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
    }

    if (image.kind === 'existing') {
        deletedExistingImages.push(image);
    }

    carImages.splice(index, 1);
    renderImagePreviews();
    showFormMessage('Imagem removida. Guarde o carro para confirmar a alteração.', 'success');
}

function handleImageDragStart(event) {
    const item = event.target.closest('.image-preview-item');
    if (!item) return;

    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', item.dataset.imageIndex);
    item.classList.add('is-dragging');
}

function handleImageDragOver(event) {
    if (event.target.closest('.image-preview-item')) {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }
}

function handleImageDrop(event) {
    const targetItem = event.target.closest('.image-preview-item');
    if (!targetItem) return;

    event.preventDefault();

    const fromIndex = Number(event.dataTransfer.getData('text/plain'));
    const toIndex = Number(targetItem.dataset.imageIndex);

    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;

    moveImage(fromIndex, toIndex);
}

function handleImageDragEnd() {
    document.querySelectorAll('.image-preview-item.is-dragging')
        .forEach(item => item.classList.remove('is-dragging'));
}

function loadExistingImages(images) {
    clearSelectedPreviewUrls();
    carImages = Array.isArray(images)
        ? images.map(image => ({
            kind: 'existing',
            imageId: image.imageId,
            storagePath: image.storagePath ?? null,
            ordem: image.ordem ?? 0,
            url: image.url ?? ''
        }))
        : [];
    deletedExistingImages = [];

    renderImagePreviews();
}

// ===================================
// Editar Carro
// ===================================

async function editCar(carId) {
    try {
        const car = await getCar(carId);
        if (!car) {
            showMessage('Carro não encontrado.', 'error');
            return;
        }

        const movedToForm = await goToSection('add-car');
        if (!movedToForm) return;

        document.getElementById('carFormTitle').textContent = 'Editar Carro';
        document.getElementById('carId').value = car.id;
        document.getElementById('carMarca').value = car.marca ?? '';
        document.getElementById('carModelo').value = car.modelo ?? '';
        document.getElementById('carAno').value = car.ano ?? '';
        document.getElementById('carPreco').value = car.preco ?? '';
        document.getElementById('carCombustivel').value = car.combustivel ?? '';
        document.getElementById('carCaixa').value = car.caixa ?? '';
        document.getElementById('carQuilometros').value = car.quilometros ?? '';
        document.getElementById('carPotencia').value = car.potencia ?? '';
        document.getElementById('carCilindrada').value = car.cilindrada ?? '';
        document.getElementById('carCor').value = car.cor ?? '';
        document.getElementById('carPortas').value = car.portas ?? '';
        document.getElementById('carLugares').value = car.lugares ?? '';
        document.getElementById('carEstado').value = car.estado ?? '';
        document.getElementById('carDescricao').value = car.descricao ?? '';
        document.getElementById('carEquipamentos').value = Array.isArray(car.equipamentos)
            ? car.equipamentos.join('\n')
            : '';
        document.getElementById('carImagens').value = '';
        document.getElementById('carDestaque').checked = Boolean(car.destaque);

        loadExistingImages(car.imagensMeta || []);
        setCarFormBaseline();
        hideFormMessage();

        window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
        console.error('Erro ao editar carro:', err);
        showMessage('Não foi possível carregar os dados do carro.', 'error');
    }
}

// ===================================
// Eliminar Carro
// ===================================

async function confirmDeleteCar(carId) {
    try {
        const car = await getCar(carId);
        if (!car) {
            showMessage('Carro não encontrado.', 'error');
            return;
        }

        const confirmed = confirm(
            `Tem a certeza que deseja eliminar o ${car.marca} ${car.modelo}?\nEsta ação não pode ser revertida.`
        );

        if (!confirmed) return;

        const deleted = await deleteCar(carId);

        if (!deleted) {
            showMessage('Não foi possível eliminar o carro.', 'error');
            return;
        }

        try {
            await removeStoredImages(car.imagensMeta || []);
        } catch (storageCleanupError) {
            console.error('Erro ao remover imagens do Storage após eliminar carro:', storageCleanupError);
            showMessage('O carro foi eliminado, mas algumas imagens ficaram no Storage.', 'error');
            await loadCarsTable();
            await updateDashboardStats();
            return;
        }

        showMessage('Carro eliminado com sucesso!', 'success');
        await loadCarsTable();
        await updateDashboardStats();
    } catch (err) {
        console.error('Erro ao eliminar carro:', err);
        showMessage('Ocorreu um erro ao eliminar o carro.', 'error');
    }
}

// ===================================
// Formulário de Adicionar/Editar Carro
// ===================================

function initCarForm() {
    const form = document.getElementById('carForm');
    if (!form) return;

    form.addEventListener('submit', async function (e) {
        e.preventDefault();
        await saveCarForm();
    });
}

async function saveCarForm() {
    try {
        const carId = document.getElementById('carId').value;
        const marca = document.getElementById('carMarca').value.trim();
        const modelo = document.getElementById('carModelo').value.trim();
        const ano = parseInt(document.getElementById('carAno').value, 10);
        const preco = parseFloat(document.getElementById('carPreco').value);
        const combustivel = document.getElementById('carCombustivel').value;
        const caixa = document.getElementById('carCaixa').value;
        const quilometros = parseInt(document.getElementById('carQuilometros').value, 10);
        const potencia = parseInt(document.getElementById('carPotencia').value, 10);
        const cilindradaValue = document.getElementById('carCilindrada').value;
        const cilindrada = cilindradaValue ? parseInt(cilindradaValue, 10) : null;
        const cor = document.getElementById('carCor').value.trim();
        const portas = parseInt(document.getElementById('carPortas').value, 10);
        const lugares = parseInt(document.getElementById('carLugares').value, 10);
        const estado = document.getElementById('carEstado').value;
        const descricao = document.getElementById('carDescricao').value.trim();
        const equipamentosText = document.getElementById('carEquipamentos').value.trim();
        const destaque = document.getElementById('carDestaque').checked;

        if (
            !marca ||
            !modelo ||
            !ano ||
            !preco ||
            !combustivel ||
            !caixa ||
            Number.isNaN(quilometros) ||
            Number.isNaN(potencia) ||
            Number.isNaN(portas) ||
            Number.isNaN(lugares) ||
            !cor ||
            !estado ||
            !descricao
        ) {
            showFormMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
            return;
        }

        const equipamentos = equipamentosText
            .split('\n')
            .map(e => e.trim())
            .filter(Boolean);

        const hasNewSelectedImages = getNewImageItems().length > 0;
        const hasAnyImages = carImages.length > 0;

        if (!hasAnyImages) {
            showFormMessage('É necessário manter ou adicionar pelo menos uma imagem.', 'error');
            return;
        }

        const carData = {
            marca,
            modelo,
            ano,
            preco,
            combustivel,
            caixa,
            quilometros,
            potencia,
            cilindrada,
            cor,
            portas,
            lugares,
            estado,
            descricao,
            equipamentos,
            destaque
        };

        let savedCarId;

        if (carId) {
            const updated = await updateCar(carId, carData);

            if (!updated) {
                showFormMessage('Não foi possível atualizar o carro.', 'error');
                return;
            }

            savedCarId = carId;
        } else {
            const newCar = await addCar(carData);

            if (!newCar?.id) {
                showFormMessage('Não foi possível adicionar o carro.', 'error');
                return;
            }

            savedCarId = newCar.id;
        }

        if (hasNewSelectedImages) {
            const uploadedRows = await uploadNewImagesToStorage(savedCarId);

            const { error: imageInsertError } = await supabase
                .from('imagens')
                .insert(uploadedRows);

            if (imageInsertError) {
                await cleanupUploadedFiles(uploadedRows);
                console.error('Erro ao guardar metadados das imagens:', imageInsertError);
                showFormMessage('O carro foi guardado, mas houve erro ao registar as imagens.', 'error');
                return;
            }
        }

        try {
            await updateExistingImageOrder(savedCarId);
        } catch (orderUpdateError) {
            console.error('Erro ao atualizar ordem das imagens:', orderUpdateError);
            showFormMessage('O carro foi guardado, mas houve erro ao atualizar a ordem das imagens.', 'error');
            return;
        }

        try {
            await deleteMarkedExistingImages();
        } catch (imageDeleteError) {
            console.error('Erro ao eliminar imagens removidas:', imageDeleteError);
            showFormMessage('O carro foi guardado, mas houve erro ao eliminar algumas imagens.', 'error');
            return;
        }

        showFormMessage(
            carId ? 'Carro atualizado com sucesso!' : 'Carro adicionado com sucesso!',
            'success'
        );

        setTimeout(async () => {
            resetForm();
            await goToSection('cars');
            await loadCarsTable();
            await updateDashboardStats();
        }, 1200);
    } catch (err) {
        console.error('Erro ao guardar formulário:', err);
        showFormMessage('Ocorreu um erro ao guardar o carro.', 'error');
    }
}

function resetForm() {
    const form = document.getElementById('carForm');
    if (form) form.reset();

    document.getElementById('carId').value = '';
    document.getElementById('carFormTitle').textContent = 'Adicionar Novo Carro';

    clearSelectedPreviewUrls();
    carImages = [];
    deletedExistingImages = [];

    renderImagePreviews();

    hideFormMessage();
    setCarFormBaseline();
}

// ===================================
// Mensagens
// ===================================

function showMessage(message, type) {
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background-color: ${type === 'success' ? '#16a34a' : '#dc2626'};
        color: white;
        border-radius: 10px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.18);
        z-index: 10000;
        animation: slideIn 0.3s ease;
        font-weight: 600;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

function showFormMessage(message, type) {
    const messageDiv = document.getElementById('carFormMessage');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `form-message ${type}`;
    messageDiv.style.display = 'block';
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFormMessage() {
    const messageDiv = document.getElementById('carFormMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

function showConfirmModal({
    title = 'Confirmar ação',
    message = 'Tem a certeza?',
    confirmText = 'Sim',
    cancelText = 'Cancelar'
} = {}) {
    const existing = document.getElementById('confirmModal');
    if (existing) existing.remove();

    return new Promise(resolve => {
        const modal = document.createElement('div');
        modal.id = 'confirmModal';
        modal.className = 'custom-modal-overlay';

        modal.innerHTML = `
            <div class="custom-modal custom-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirmModalTitle">
                <button type="button" class="custom-modal-close" id="cancelConfirmModal" aria-label="Fechar">&times;</button>

                <h2 id="confirmModalTitle">${escapeHtml(title)}</h2>
                <div class="custom-modal-content">
                    <p class="custom-modal-message">${escapeHtml(message)}</p>
                </div>

                <div class="custom-modal-actions">
                    <button type="button" class="btn btn-outline" id="confirmModalNo">${escapeHtml(cancelText)}</button>
                    <button type="button" class="btn btn-secondary" id="confirmModalYes">${escapeHtml(confirmText)}</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        let resolved = false;

        const close = (value) => {
            if (resolved) return;
            resolved = true;
            document.removeEventListener('keydown', handleKeydown);
            modal.remove();
            resolve(value);
        };

        const handleKeydown = (e) => {
            if (e.key === 'Escape') {
                close(false);
            }
        };

        document.getElementById('confirmModalYes')?.addEventListener('click', () => close(true));
        document.getElementById('confirmModalNo')?.addEventListener('click', () => close(false));
        document.getElementById('cancelConfirmModal')?.addEventListener('click', () => close(false));

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                close(false);
            }
        });

        document.addEventListener('keydown', handleKeydown);
        document.getElementById('confirmModalNo')?.focus();
    });
}

// ===================================
// Helpers
// ===================================

function normalizeStatusClass(estado) {
    return String(estado || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

// ===================================
// Mensagens
// ===================================

async function loadMessages() {
    const list = document.getElementById('messagesList');
    if (!list) return;

    list.innerHTML = `<div class="loading-state">A carregar mensagens...</div>`;

    try {
        adminMessages = await getMessages();

        if (!adminMessages.length) {
            list.innerHTML = `<div class="empty-state">Ainda não existem mensagens recebidas.</div>`;
            return;
        }

        list.innerHTML = adminMessages.map(message => `
            <div class="message-card ${message.lida ? 'read' : 'unread'}">
                <div class="message-card-header">
                    <div>
                        <h3>${escapeHtml(message.nome)}</h3>
                        <p>${escapeHtml(message.email)}</p>
                    </div>
                    <div class="message-status">
                        ${message.lida
                ? '<span class="status-badge read">Lida</span>'
                : '<span class="status-badge unread">Nova</span>'}
                    </div>
                </div>

                <div class="message-card-body">
                    <p><strong>Telefone:</strong> ${escapeHtml(message.telefone)}</p>
                    <p><strong>Assunto:</strong> ${escapeHtml(normalizeMessageSubject(message.assunto))}</p>
                    <p><strong>Recebida em:</strong> ${formatMessageDate(message.created_at)}</p>
                </div>

                <div class="message-card-actions">
                    <button class="btn btn-primary btn-sm" data-action="view-message" data-id="${message.message_id}">
                        Ver
                    </button>
                    <button
                        class="btn btn-secondary btn-sm"
                        data-action="${message.lida ? 'unread-message' : 'read-message'}"
                        data-id="${message.message_id}"
                    >
                        ${message.lida ? 'Marcar como Não Lida' : 'Marcar como Lida'}
                    </button>
                    <button class="btn btn-danger btn-sm" data-action="delete-message" data-id="${message.message_id}">
                        Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        list.innerHTML = `<div class="empty-state">Não foi possível carregar as mensagens.</div>`;
        showMessage('Não foi possível carregar as mensagens.', 'error');
    }
}


function initMessagesActions() {
    document.addEventListener('click', async (e) => {
        const button = e.target.closest('[data-action]');
        if (!button) return;

        const action = button.dataset.action;
        const messageId = Number(button.dataset.id);

        if (!messageId) return;

        if (action === 'view-message') {
            const message = adminMessages.find(m => m.message_id === messageId);
            if (!message) return;

            showMessageModal(message);

            if (!message.lida) {
                await updateMessageReadStatus(messageId, true);
                await loadMessages();
            }
        }

        if (action === 'read-message') {
            const success = await updateMessageReadStatus(messageId, true);
            if (!success) {
                showMessage('Não foi possível marcar a mensagem como lida.', 'error');
                return;
            }

            await loadMessages();
        }

        if (action === 'unread-message') {
            const success = await updateMessageReadStatus(messageId, false);
            if (!success) {
                showMessage('Não foi possível marcar a mensagem como não lida.', 'error');
                return;
            }

            await loadMessages();
        }

        if (action === 'delete-message') {
            const confirmed = confirm('Tem a certeza que pretende eliminar esta mensagem?');
            if (!confirmed) return;

            await deleteMessage(messageId);
            await loadMessages();
        }
    });
}

function bindCleanupOnUnload() {
    window.addEventListener('beforeunload', () => {
        clearSelectedPreviewUrls();
    });
}

function normalizeMessageSubject(subject) {
    const subjectMap = {
        info: 'Pedido de Informação',
        visit: 'Agendar Visita',
        financing: 'Financiamento',
        trade: 'Retoma',
        other: 'Outro'
    };

    return subjectMap[subject] || subject || 'Outro';
}

function showMessageModal(message) {
    const existing = document.getElementById('messageModal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'messageModal';
    modal.className = 'custom-modal-overlay';

    modal.innerHTML = `
        <div class="custom-modal">
            <button class="custom-modal-close" id="closeMessageModal">&times;</button>
            <h2>Mensagem de ${escapeHtml(message.nome)}</h2>
            <div class="custom-modal-content">
                <p><strong>Email:</strong> ${escapeHtml(message.email)}</p>
                <p><strong>Telefone:</strong> ${escapeHtml(message.telefone)}</p>
                <p><strong>Assunto:</strong> ${escapeHtml(normalizeMessageSubject(message.assunto))}</p>
                <p><strong>Recebida em:</strong> ${formatMessageDate(message.created_at)}</p>
                <hr>
                <p><strong>Mensagem:</strong></p>
                <p>${escapeHtml(message.mensagem).replace(/\n/g, '<br>')}</p>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('closeMessageModal')?.addEventListener('click', () => {
        modal.remove();
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

function formatMessageDate(dateString) {
    if (!dateString) return '-';

    return new Date(dateString).toLocaleString('pt-PT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// ===================================
// Animações CSS
// ===================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);




