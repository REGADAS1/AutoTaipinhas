// ===================================
// Painel de Administração
// ===================================

let selectedImages = [];
let existingImages = [];

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuthentication();

    // Inicializar dashboard
    initAdminDashboard();
    initNavigation();
    initCarManagement();
    initCarForm();
    initImageUpload();
});

// ===================================
// Autenticação
// ===================================

function checkAuthentication() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated');

    if (!isAuthenticated || isAuthenticated !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }
}

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
        if (confirm('Tem a certeza que deseja sair?')) {
            localStorage.removeItem('adminAuthenticated');
            window.location.href = 'admin-login.html';
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
        link.addEventListener('click', function(e) {
            e.preventDefault();

            const sectionName = this.getAttribute('data-section');

            // Atualizar links ativos
            menuLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Mostrar secção correspondente
            sections.forEach(section => {
                section.classList.remove('active');
            });

            const targetSection = document.getElementById(`${sectionName}-section`);
            if (targetSection) {
                targetSection.classList.add('active');

                // Refresh de dados se necessário
                if (sectionName === 'dashboard') {
                    updateDashboardStats();
                } else if (sectionName === 'cars') {
                    loadCarsTable();
                }
            }
        });
    });
}

// Função auxiliar para mudar de secção
function goToSection(sectionName) {
    const link = document.querySelector(`[data-section="${sectionName}"]`);
    if (link) {
        link.click();
    }
}

// ===================================
// Dashboard - Estatísticas
// ===================================

function initAdminDashboard() {
    updateDashboardStats();
}

function updateDashboardStats() {
    const stats = getStats();

    document.getElementById('totalCars').textContent = stats.total;
    document.getElementById('availableCars').textContent = stats.disponivel;
    document.getElementById('reservedCars').textContent = stats.reservado;
    document.getElementById('soldCars').textContent = stats.vendido;
}

// ===================================
// Gestão de Carros - Tabela
// ===================================

function initCarManagement() {
    loadCarsTable();

    // Pesquisa na tabela
    const searchInput = document.getElementById('adminSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterCarsTable(searchTerm);
        });
    }
}

function loadCarsTable() {
    const tbody = document.getElementById('carsTableBody');
    if (!tbody) return;

    const cars = getAllCars();

    if (cars.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">Nenhum carro adicionado ainda.</td></tr>';
        return;
    }

    tbody.innerHTML = cars.map(car => `
        <tr data-car-id="${car.id}">
            <td>
                <img src="${car.imagens[0]}" alt="${car.marca} ${car.modelo}" class="car-thumbnail">
            </td>
            <td>${car.marca}</td>
            <td>${car.modelo}</td>
            <td>${car.ano}</td>
            <td>${formatPrice(car.preco)}</td>
            <td>
                <span class="status-badge status-${car.estado.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">${car.estado}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="editCar('${car.id}')" title="Editar">
                        ✏️
                    </button>
                    <button class="btn-icon btn-delete" onclick="confirmDeleteCar('${car.id}')" title="Eliminar">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterCarsTable(searchTerm) {
    const rows = document.querySelectorAll('#carsTableBody tr');

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
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
    const files = Array.from(event.target.files);
    const previewContainer = document.getElementById('imagePreviewContainer');

    selectedImages = [];
    previewContainer.innerHTML = '';

    if (!files.length) {
        renderImagePreviews(existingImages);
        return;
    }

    let processedCount = 0;

    files.forEach(file => {
        if (!file.type.startsWith('image/')) {
            processedCount++;
            return;
        }

        const reader = new FileReader();

        reader.onload = function(e) {
            selectedImages.push(e.target.result);
            processedCount++;

            if (processedCount === files.length) {
                renderImagePreviews(selectedImages);
            }
        };

        reader.onerror = function() {
            processedCount++;
            if (processedCount === files.length) {
                renderImagePreviews(selectedImages);
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
        previewItem.innerHTML = `
            <img src="${img}" alt="Imagem ${index + 1}">
        `;
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

function editCar(carId) {
    const car = getCar(carId);
    if (!car) return;

    // Mudar para secção de formulário
    goToSection('add-car');

    // Preencher formulário
    document.getElementById('carFormTitle').textContent = 'Editar Carro';
    document.getElementById('carId').value = car.id;
    document.getElementById('carMarca').value = car.marca;
    document.getElementById('carModelo').value = car.modelo;
    document.getElementById('carAno').value = car.ano;
    document.getElementById('carPreco').value = car.preco;
    document.getElementById('carCombustivel').value = car.combustivel;
    document.getElementById('carCaixa').value = car.caixa;
    document.getElementById('carQuilometros').value = car.quilometros;
    document.getElementById('carPotencia').value = car.potencia;
    document.getElementById('carCor').value = car.cor;
    document.getElementById('carEstado').value = car.estado;
    document.getElementById('carDescricao').value = car.descricao;
    document.getElementById('carEquipamentos').value = car.equipamentos ? car.equipamentos.join('\n') : '';
    document.getElementById('carImagens').value = '';
    document.getElementById('carDestaque').checked = car.destaque || false;

    loadExistingImages(car.imagens);

    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===================================
// Eliminar Carro
// ===================================

function confirmDeleteCar(carId) {
    const car = getCar(carId);
    if (!car) return;

    if (confirm(`Tem a certeza que deseja eliminar o ${car.marca} ${car.modelo}?\nEsta ação não pode ser revertida.`)) {
        deleteCar(carId);
        showMessage('Carro eliminado com sucesso!', 'success');
        loadCarsTable();
        updateDashboardStats();
    }
}

// ===================================
// Formulário de Adicionar/Editar Carro
// ===================================

function initCarForm() {
    const form = document.getElementById('carForm');
    if (!form) return;

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        saveCarForm();
    });
}

function saveCarForm() {
    // Recolher dados do formulário
    const carId = document.getElementById('carId').value;
    const marca = document.getElementById('carMarca').value.trim();
    const modelo = document.getElementById('carModelo').value.trim();
    const ano = parseInt(document.getElementById('carAno').value);
    const preco = parseInt(document.getElementById('carPreco').value);
    const combustivel = document.getElementById('carCombustivel').value;
    const caixa = document.getElementById('carCaixa').value;
    const quilometros = parseInt(document.getElementById('carQuilometros').value);
    const potencia = parseInt(document.getElementById('carPotencia').value);
    const cor = document.getElementById('carCor').value.trim();
    const estado = document.getElementById('carEstado').value;
    const descricao = document.getElementById('carDescricao').value.trim();
    const equipamentosText = document.getElementById('carEquipamentos').value.trim();
    const destaque = document.getElementById('carDestaque').checked;

    // Validação básica
    if (!marca || !modelo || !ano || !preco || !combustivel || !caixa || !quilometros || !potencia || !cor || !descricao) {
        showFormMessage('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    // Processar equipamentos (separar por linha)
    const equipamentos = equipamentosText
        .split('\n')
        .map(e => e.trim())
        .filter(e => e.length > 0);

    const imagens = selectedImages.length > 0 ? selectedImages : existingImages;

    if (imagens.length === 0) {
        showFormMessage('É necessário adicionar pelo menos uma imagem.', 'error');
        return;
    }

    // Criar objeto do carro
    const carData = {
        marca,
        modelo,
        ano,
        preco,
        combustivel,
        caixa,
        quilometros,
        potencia,
        cor,
        estado,
        descricao,
        equipamentos,
        imagens,
        destaque
    };

    // Guardar (adicionar ou atualizar)
    if (carId) {
        // Atualizar carro existente
        updateCar(carId, carData);
        showFormMessage('Carro atualizado com sucesso!', 'success');
    } else {
        // Adicionar novo carro
        addCar(carData);
        showFormMessage('Carro adicionado com sucesso!', 'success');
    }

    // Limpar formulário e voltar à lista
    setTimeout(() => {
        resetForm();
        goToSection('cars');
        loadCarsTable();
        updateDashboardStats();
    }, 1500);
}

function resetForm() {
    document.getElementById('carForm').reset();
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
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.className = `admin-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        padding: 15px 25px;
        background-color: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Remover após 3 segundos
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

    // Scroll para a mensagem
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function hideFormMessage() {
    const messageDiv = document.getElementById('carFormMessage');
    if (messageDiv) {
        messageDiv.style.display = 'none';
    }
}

// ===================================
// Animações CSS
// ===================================

// Adicionar estilos de animação
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

// ===================================
// Console Info
// ===================================

console.log('%c Admin Panel Loaded ', 'background: #2c3e50; color: #3498db; font-size: 16px; font-weight: bold; padding: 8px;');
console.log('%c Sessão de administração ativa ', 'background: #27ae60; color: white; font-size: 12px; padding: 5px;');