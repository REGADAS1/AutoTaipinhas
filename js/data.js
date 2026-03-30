import { supabase } from './supabase.js';

// ===================================
// Mapeamentos
// ===================================

function formatEstadoFromDb(estado) {
    const map = {
        disponivel: 'Disponível',
        reservado: 'Reservado',
        vendido: 'Vendido'
    };

    return map[estado] || estado;
}

function formatEstadoToDb(estado) {
    const map = {
        'Disponível': 'disponivel',
        'Reservado': 'reservado',
        'Vendido': 'vendido',
        disponivel: 'disponivel',
        reservado: 'reservado',
        vendido: 'vendido'
    };

    return map[estado] || 'disponivel';
}

function mapDbCarToUi(car) {
    return {
        id: String(car.car_id),
        marca: car.marca,
        modelo: car.modelo,
        ano: car.ano,
        preco: Number(car.preco),
        combustivel: car.combustivel,
        caixa: car.transmissao,
        quilometros: car.quilometros,
        potencia: car.cavalos,
        cor: car.cor,
        estado: formatEstadoFromDb(car.estado),
        destaque: car.destaque ?? false,
        descricao: car.descricao,
        equipamentos: car.equipamentos ?? [],
        imagens: (car.imagens || []).map(img => img.url)
    };
}

function formatTransmissaoToDb(transmissao) {
    const map = {
        'Manual': 'manual',
        'Automática': 'automatica',
        manual: 'manual',
        automatica: 'automatica',
        automática: 'automatica'
    };

    return map[transmissao] || 'manual';
}

function formatCombustivelToDb(combustivel) {
    const map = {
        'Gasolina': 'gasoline',
        'Diesel': 'diesel',
        'Elétrico': 'electric',
        'Híbrido': 'hybrid',
        'GPL': 'lpg',
        gasoline: 'gasoline',
        diesel: 'diesel',
        electric: 'electric',
        hybrid: 'hybrid',
        lpg: 'lpg'
    };

    return map[combustivel] || combustivel?.toLowerCase();
}

function mapUiCarToDb(car) {
    return {
        marca: car.marca,
        modelo: car.modelo,
        ano: car.ano,
        preco: car.preco,
        combustivel: formatCombustivelToDb(car.combustivel),
        transmissao: formatTransmissaoToDb(car.caixa),
        quilometros: car.quilometros,
        cavalos: car.potencia,
        cilindrada: car.cilindrada ?? 0,
        portas: car.portas ?? 5,
        lugares: car.lugares ?? 5,
        cor: car.cor,
        estado: formatEstadoToDb(car.estado),
        descricao: car.descricao,
        destaque: car.destaque ?? false,
        equipamentos: car.equipamentos ?? []
    };
}

// ===================================
// Queries principais
// ===================================

export async function getAllCars() {
    const { data, error } = await supabase
        .from('carros')
        .select(`
            *,
            imagens (
                image_id,
                url
            )
        `)
        .order('car_id', { ascending: false });

    if (error) {
        console.error('Erro ao obter carros:', error);
        return [];
    }

    return (data || []).map(mapDbCarToUi);
}

export async function getCar(id) {
    const { data, error } = await supabase
        .from('carros')
        .select(`
            *,
            imagens (
                image_id,
                url
            )
        `)
        .eq('car_id', Number(id))
        .single();

    if (error) {
        console.error('Erro ao obter carro:', error);
        return null;
    }

    return mapDbCarToUi(data);
}

export async function getFeaturedCars() {
    const { data, error } = await supabase
        .from('carros')
        .select(`
            *,
            imagens (
                image_id,
                url
            )
        `)
        .eq('destaque', true)
        .eq('estado', 'disponivel')
        .limit(3);

    if (error) {
        console.error('Erro ao obter carros em destaque:', error);
        return [];
    }

    return (data || []).map(mapDbCarToUi);
}

export async function addCar(carData) {
    const dbCar = mapUiCarToDb(carData);

    const { data, error } = await supabase
        .from('carros')
        .insert([dbCar])
        .select()
        .single();

    if (error) {
        console.error('Erro ao adicionar carro:', error);
        return null;
    }

    return {
        id: String(data.car_id)
    };
}

export async function updateCar(id, carData) {
    const dbCar = mapUiCarToDb(carData);

    const { error } = await supabase
        .from('carros')
        .update(dbCar)
        .eq('car_id', Number(id));

    if (error) {
        console.error('Erro ao atualizar carro:', error);
        return false;
    }

    return true;
}

export async function deleteCar(id) {
    const { error } = await supabase
        .from('carros')
        .delete()
        .eq('car_id', Number(id));

    if (error) {
        console.error('Erro ao eliminar carro:', error);
        return false;
    }

    return true;
}

export async function getStats() {
    const { data, error } = await supabase
        .from('carros')
        .select('estado');

    if (error) {
        console.error('Erro ao obter estatísticas:', error);
        return {
            total: 0,
            disponivel: 0,
            reservado: 0,
            vendido: 0
        };
    }

    return {
        total: data.length,
        disponivel: data.filter(car => car.estado === 'disponivel').length,
        reservado: data.filter(car => car.estado === 'reservado').length,
        vendido: data.filter(car => car.estado === 'vendido').length
    };
}

export async function sendMessage(messageData) {
    const { error } = await supabase
        .from('mensagens')
        .insert([messageData]);

    if (error) {
        console.error('Erro ao enviar mensagem:', error);
        return false;
    }

    return true;
}

// ===================================
// Utilitários
// ===================================

export function formatPrice(price) {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

export function formatKm(km) {
    return new Intl.NumberFormat('pt-PT').format(km) + ' km';
}

export function getStatusBadge(estado) {
    const badges = {
        'Disponível': '<span class="car-badge badge-disponivel">Disponível</span>',
        'Reservado': '<span class="car-badge badge-reservado">Reservado</span>',
        'Vendido': '<span class="car-badge badge-vendido">Vendido</span>'
    };

    return badges[estado] || '';
}

export function createCarCard(car) {
    const destaqueBadge = car.destaque
        ? '<span class="car-badge badge-destaque">Destaque</span>'
        : '';

    const estadoBadge = getStatusBadge(car.estado);
    const primeiraImagem = car.imagens?.[0] || 'https://via.placeholder.com/800x500?text=Sem+Imagem';

    return `
        <div class="car-card" onclick="window.location.href='car-details.html?id=${car.id}'">
            <div class="car-image">
                <img src="${primeiraImagem}" alt="${car.marca} ${car.modelo}">
                ${destaqueBadge}
                ${estadoBadge}
            </div>
            <div class="car-info">
                <h3 class="car-title">${car.marca} ${car.modelo}</h3>
                <div class="car-specs">
                    <span class="car-spec">📅 ${car.ano}</span>
                    <span class="car-spec">⛽ ${car.combustivel}</span>
                    <span class="car-spec">🔧 ${car.caixa}</span>
                    <span class="car-spec">📊 ${formatKm(car.quilometros)}</span>
                </div>
                <div class="car-price">${formatPrice(car.preco)}</div>
                <div class="car-actions">
                    <button class="btn btn-primary" onclick="event.stopPropagation(); window.location.href='car-details.html?id=${car.id}'">
                        Ver Detalhes
                    </button>
                </div>
            </div>
        </div>
    `;
}

export async function getUniqueBrands() {
    const cars = await getAllCars();
    const brands = [...new Set(cars.map(car => car.marca))];
    return brands.sort();
}

export async function getModelsByBrand(brand) {
    const cars = await getAllCars();
    const models = [...new Set(
        cars
            .filter(car => car.marca === brand)
            .map(car => car.modelo)
    )];

    return models.sort();
}