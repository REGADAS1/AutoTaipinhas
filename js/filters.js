// ===================================
// Sistema de Filtros e Pesquisa
// ===================================

import {
    getAllCars,
    getUniqueBrands,
    getModelsByBrand,
    createCarCard
} from './data.js';



document.addEventListener('DOMContentLoaded', async function() {
    // Verificar se estamos na página de stock
    if (document.getElementById('stockGrid')) {
        initFilters();
        initSearch();
        initSort();
        await loadStockCars();
    }
});

let currentFilters = {
    search: '',
    marca: '',
    modelo: '',
    combustivel: '',
    caixa: '',
    precoMin: '',
    precoMax: '',
    anoMin: '',
    anoMax: '',
    kmMax: ''
};

let currentSort = 'recent';

// ===================================
// Inicializar Filtros
// ===================================

async function initFilters() {
    // Popular select de marcas
    await populateBrandSelect();

    // Toggle filtros em mobile
    const toggleBtn = document.getElementById('toggleFilters');
    const filtersContainer = document.getElementById('filtersContainer');

    if (toggleBtn && filtersContainer) {
        toggleBtn.addEventListener('click', function() {
            const isVisible = filtersContainer.style.display === 'block';
            filtersContainer.style.display = isVisible ? 'none' : 'block';
        });
    }

    // Aplicar filtros
    const applyBtn = document.getElementById('applyFilters');
    if (applyBtn) {
        applyBtn.addEventListener('click', applyFilters);
    }

    // Limpar filtros
    const clearBtn = document.getElementById('clearFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }

    // Atualizar modelos quando marca muda
    const marcaSelect = document.getElementById('filterMarca');
    if (marcaSelect) {
        marcaSelect.addEventListener('change', function() {
            populateModelSelect(this.value);
        });
    }

    // Enter para aplicar filtros nos inputs
    document.querySelectorAll('.filter-group input').forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    });
}

// ===================================
// Popular Selects
// ===================================

async function populateBrandSelect() {
    const select = document.getElementById('filterMarca');
    if (!select) return;

    const brands = await getUniqueBrands();
    brands.forEach(brand => {
        const option = document.createElement('option');
        option.value = brand;
        option.textContent = brand;
        select.appendChild(option);
    });
}

async function populateModelSelect(brand) {
    const select = document.getElementById('filterModelo');
    if (!select) return;

    // Limpar opções existentes
    select.innerHTML = '<option value="">Todos</option>';

    if (brand) {
        const models = await getModelsByBrand(brand);
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            select.appendChild(option);
        });
    }
}

// ===================================
// Aplicar Filtros
// ===================================

function applyFilters() {
    // Recolher valores dos filtros
    currentFilters = {
        search: document.getElementById('searchInput')?.value.toLowerCase() || '',
        marca: document.getElementById('filterMarca')?.value || '',
        modelo: document.getElementById('filterModelo')?.value || '',
        combustivel: document.getElementById('filterCombustivel')?.value || '',
        caixa: document.getElementById('filterCaixa')?.value || '',
        precoMin: document.getElementById('filterPrecoMin')?.value || '',
        precoMax: document.getElementById('filterPrecoMax')?.value || '',
        anoMin: document.getElementById('filterAnoMin')?.value || '',
        anoMax: document.getElementById('filterAnoMax')?.value || '',
        kmMax: document.getElementById('filterKmMax')?.value || ''
    };

    // Atualizar contador de filtros ativos
    updateFilterCount();

    // Carregar carros filtrados
    loadStockCars();

    // Scroll para resultados
    // document.getElementById('stockGrid')?.scrollIntoView({ behavior: 'smooth' });
}

// ===================================
// Limpar Filtros
// ===================================

function clearFilters() {
    // Limpar campos
    document.getElementById('searchInput').value = '';
    document.getElementById('filterMarca').value = '';
    document.getElementById('filterModelo').value = '';
    document.getElementById('filterCombustivel').value = '';
    document.getElementById('filterCaixa').value = '';
    document.getElementById('filterPrecoMin').value = '';
    document.getElementById('filterPrecoMax').value = '';
    document.getElementById('filterAnoMin').value = '';
    document.getElementById('filterAnoMax').value = '';
    document.getElementById('filterKmMax').value = '';

    // Resetar filtros
    currentFilters = {
        search: '',
        marca: '',
        modelo: '',
        combustivel: '',
        caixa: '',
        precoMin: '',
        precoMax: '',
        anoMin: '',
        anoMax: '',
        kmMax: ''
    };

    // Atualizar contador
    updateFilterCount();

    // Recarregar carros
    loadStockCars();
}

// ===================================
// Contador de Filtros Ativos
// ===================================

function updateFilterCount() {
    const filterCount = document.getElementById('filterCount');
    if (!filterCount) return;

    let count = 0;
    for (let key in currentFilters) {
        if (currentFilters[key] !== '') count++;
    }

    if (count > 0) {
        filterCount.textContent = count;
        filterCount.style.display = 'inline-block';
    } else {
        filterCount.style.display = 'none';
    }
}

// ===================================
// Pesquisa
// ===================================

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            currentFilters.search = this.value.toLowerCase();
            loadStockCars();
        }, 500);
    });
}

// ===================================
// Ordenação
// ===================================

function initSort() {
    const sortSelect = document.getElementById('sortBy');
    if (!sortSelect) return;

    sortSelect.addEventListener('change', function() {
        currentSort = this.value;
        loadStockCars();
    });
}

// ===================================
// Carregar e Exibir Carros
// ===================================

async function loadStockCars() {
    let cars = await getAllCars();

    // Aplicar filtros
    cars = cars.filter(car => {
        // Pesquisa
        if (currentFilters.search) {
            const searchTerm = currentFilters.search;
            const searchable = `${car.marca} ${car.modelo} ${car.ano} ${car.combustivel} ${car.caixa}`.toLowerCase();
            if (!searchable.includes(searchTerm)) return false;
        }

        // Marca
        if (currentFilters.marca && car.marca !== currentFilters.marca) return false;

        // Modelo
        if (currentFilters.modelo && car.modelo !== currentFilters.modelo) return false;

        // Combustível
        if (currentFilters.combustivel && car.combustivel !== currentFilters.combustivel) return false;

        // Caixa
        if (currentFilters.caixa && car.caixa !== currentFilters.caixa) return false;

        // Preço mínimo
        if (currentFilters.precoMin && car.preco < parseInt(currentFilters.precoMin)) return false;

        // Preço máximo
        if (currentFilters.precoMax && car.preco > parseInt(currentFilters.precoMax)) return false;

        // Ano mínimo
        if (currentFilters.anoMin && car.ano < parseInt(currentFilters.anoMin)) return false;

        // Ano máximo
        if (currentFilters.anoMax && car.ano > parseInt(currentFilters.anoMax)) return false;

        // Quilómetros máximo
        if (currentFilters.kmMax && car.quilometros > parseInt(currentFilters.kmMax)) return false;

        return true;
    });

    // Aplicar ordenação
    cars = sortCars(cars, currentSort);

    // Exibir resultados
    displayStockCars(cars);

    // Atualizar contador de resultados
    updateResultsCount(cars.length);
}

// ===================================
// Ordenar Carros
// ===================================

function sortCars(cars, sortType) {
    const sorted = [...cars];

    switch (sortType) {
        case 'price-asc':
            return sorted.sort((a, b) => a.preco - b.preco);
        case 'price-desc':
            return sorted.sort((a, b) => b.preco - a.preco);
        case 'year-desc':
            return sorted.sort((a, b) => b.ano - a.ano);
        case 'year-asc':
            return sorted.sort((a, b) => a.ano - b.ano);
        case 'km-asc':
            return sorted.sort((a, b) => a.quilometros - b.quilometros);
        case 'recent':
        default:
            return sorted.reverse(); // Mais recentes primeiro (por ID)
    }
}

// ===================================
// Exibir Carros
// ===================================

function displayStockCars(cars) {
    const grid = document.getElementById('stockGrid');
    const noResults = document.getElementById('noResults');

    if (!grid) return;

    if (cars.length === 0) {
        grid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
    } else {
        grid.style.display = 'grid';
        if (noResults) noResults.style.display = 'none';
        grid.innerHTML = cars.map(car => createCarCard(car)).join('');
    }
}

// ===================================
// Atualizar Contador de Resultados
// ===================================

function updateResultsCount(count) {
    const resultsInfo = document.getElementById('resultsCount');
    if (!resultsInfo) return;

    if (count === 0) {
        resultsInfo.textContent = 'Nenhum carro encontrado';
    } else if (count === 1) {
        resultsInfo.textContent = '1 carro encontrado';
    } else {
        resultsInfo.textContent = `${count} carros encontrados`;
    }
}
