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
    markMessageAsRead,
    deleteMessage
} from './data.js';

// ===================================
// Painel de Administração
// ===================================

let selectedImages = [];
let existingImages = [];
let adminMessages = [];

document.addEventListener('DOMContentLoaded', async function () {
    const isAuthenticated = await checkAuthentication();
    if (!isAuthenticated) return;

    bindLogout();
    initNavigation();
    initCarForm();
    initImageUpload();
    initCarManagement();

    document.getElementById('refreshMessagesBtn')?.addEventListener('click', loadMessages);
    initMessagesActions();
    await initAdminDashboard();
});

// Expor funções para o HTML (onclick)
window.goToSection = goToSection;
window.editCar = editCar;
window.confirmDeleteCar = confirmDeleteCar;
window.resetForm = resetForm;

// ===================================
// Autenticação
// ===================================

async function checkAuthentication() {
    try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
            console.error('Erro ao verificar sessão:', error);
            window.location.href = 'admin-login.html';
            return false;
        }

        const session = data?.session;

        if (!session) {
            window.location.href = 'admin-login.html';
            return false;
        }

        return true;
    } catch (err) {
        console.error('Erro inesperado ao verificar autenticação:', err);
        window.location.href = 'admin-login.html';
        return false;
    }
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

            window.location.href = 'admin-login.html';
        } catch (err) {
            console.error('Erro inesperado no logout:', err);
            showMessage('Ocorreu um erro ao terminar a sessão.', 'error');
        }
    });
}

// ===================================
// Navegação entre Secções
// ===================================

function initNavigation() {
    const menuLinks = document.querySelectorAll('.admin-menu a');
    const sections = document.querySelectorAll('.admin-section');

    menuLinks.forEach(link => {
        link.addEventListener('click', async function (e) {
            e.preventDefault();

            const sectionName = this.getAttribute('data-section');

            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            sections.forEach(section => {
                section.classList.remove('active');
            });

            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
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
        });
    });
}

async function goToSection(sectionName) {
    const link = document.querySelector(`[data-section="${sectionName}"]`);
    if (link) {
        link.click();
    }
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
                            <button class="btn-icon btn-edit" onclick="editCar('${car.id}')" title="Editar">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="btn-icon btn-delete" onclick="confirmDeleteCar('${car.id}')" title="Eliminar">
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

function initImageUpload() {
    const imageInput = document.getElementById('carImagens');
    if (!imageInput) return;

    imageInput.addEventListener('change', handleImageSelection);
}

function handleImageSelection(event) {
    const files = Array.from(event.target.files || []);
    const previewContainer = document.getElementById('imagePreviewContainer');

    selectedImages = [];
    if (previewContainer) previewContainer.innerHTML = '';

    if (!files.length) {
        renderImagePreviews(existingImages);
        return;
    }

    let processedCount = 0;

    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            processedCount++;
            if (processedCount === files.length) {
                renderImagePreviews(selectedImages.length ? selectedImages : existingImages);
            }
            return;
        }

        const reader = new FileReader();

        reader.onload = function (e) {
            selectedImages.push(e.target.result);
            processedCount++;

            if (processedCount === files.length) {
                renderImagePreviews(selectedImages);
            }
        };

        reader.onerror = function () {
            processedCount++;
            if (processedCount === files.length) {
                renderImagePreviews(selectedImages.length ? selectedImages : existingImages);
            }
        };

        reader.readAsDataURL(file);
    });
}

function renderImagePreviews(images) {
    const previewContainer = document.getElementById('imagePreviewContainer');
    if (!previewContainer) return;

    previewContainer.innerHTML = '';

    images.forEach((img, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        previewItem.innerHTML = `<img src="${img}" alt="Imagem ${index + 1}">`;
        previewContainer.appendChild(previewItem);
    });
}

function loadExistingImages(images) {
    existingImages = Array.isArray(images) ? images : [];
    selectedImages = [];
    renderImagePreviews(existingImages);
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

        await goToSection('add-car');

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
        document.getElementById('carEstado').value = car.estado ?? '';
        document.getElementById('carDescricao').value = car.descricao ?? '';
        document.getElementById('carEquipamentos').value = Array.isArray(car.equipamentos)
            ? car.equipamentos.join('\n')
            : '';
        document.getElementById('carImagens').value = '';
        document.getElementById('carDestaque').checked = Boolean(car.destaque);

        loadExistingImages(car.imagens || []);
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

        const imagens = selectedImages.length > 0 ? selectedImages : existingImages;

        if (!imagens.length) {
            showFormMessage('É necessário adicionar pelo menos uma imagem.', 'error');
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

            const { error: deleteImagesError } = await supabase
                .from('imagens')
                .delete()
                .eq('car_id', Number(carId));

            if (deleteImagesError) {
                console.error('Erro ao limpar imagens antigas:', deleteImagesError);
                showFormMessage('O carro foi atualizado, mas houve erro ao atualizar as imagens.', 'error');
                return;
            }
        } else {
            const newCar = await addCar(carData);

            if (!newCar?.id) {
                showFormMessage('Não foi possível adicionar o carro.', 'error');
                return;
            }

            savedCarId = newCar.id;
        }

        const imageRows = imagens.map(url => ({
            car_id: Number(savedCarId),
            url
        }));

        const { error: imageInsertError } = await supabase
            .from('imagens')
            .insert(imageRows);

        if (imageInsertError) {
            console.error('Erro ao guardar imagens:', imageInsertError);
            showFormMessage('O carro foi guardado, mas houve erro ao guardar as imagens.', 'error');
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

    selectedImages = [];
    existingImages = [];

    const previewContainer = document.getElementById('imagePreviewContainer');
    if (previewContainer) {
        previewContainer.innerHTML = '';
    }

    hideFormMessage();
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

    adminMessages = await getMessages();
    console.log('Mensagens carregadas:', adminMessages);

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
                <p><strong>Assunto:</strong> ${escapeHtml(message.assunto)}</p>
                <p><strong>Recebida em:</strong> ${formatMessageDate(message.created_at)}</p>
            </div>

            <div class="message-card-actions">
                <button class="btn btn-primary btn-sm" data-action="view-message" data-id="${message.message_id}">
                    Ver
                </button>
                <button class="btn btn-secondary btn-sm" data-action="read-message" data-id="${message.message_id}">
                    Marcar como lida
                </button>
                <button class="btn btn-danger btn-sm" data-action="delete-message" data-id="${message.message_id}">
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');
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
                await markMessageAsRead(messageId);
                await loadMessages();
            }
        }

        if (action === 'read-message') {
            await markMessageAsRead(messageId);
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
                <p><strong>Assunto:</strong> ${escapeHtml(message.assunto)}</p>
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

console.log('%c Admin Panel Loaded ', 'background: #111827; color: #60a5fa; font-size: 16px; font-weight: bold; padding: 8px;');
console.log('%c Sessão de administração Supabase ativa ', 'background: #16a34a; color: white; font-size: 12px; padding: 5px;');


