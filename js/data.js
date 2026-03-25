// ===================================
// Sistema de Gestão de Dados com localStorage
// ===================================

// Carros de exemplo pré-carregados
const DEMO_CARS = [
    {
        id: '1',
        marca: 'BMW',
        modelo: '320d',
        ano: 2020,
        preco: 28500,
        combustivel: 'Diesel',
        caixa: 'Automática',
        quilometros: 45000,
        potencia: 190,
        cor: 'Preto',
        estado: 'Disponível',
        destaque: true,
        descricao: 'BMW 320d em excelente estado de conservação. Totalmente revisto e com histórico completo de manutenções. Único dono, não fumador. Veículo muito bem estimado e pronto a usar. Todos os extras de série incluídos. Garantia de stand incluída no preço.',
        equipamentos: [
            'Navegação GPS',
            'Sensores de estacionamento',
            'Câmara de marcha-atrás',
            'Ar condicionado automático',
            'Bancos em pele',
            'Vidros elétricos',
            'Direção assistida',
            'Computador de bordo',
            'Controlo de cruzeiro',
            'Sistema de som premium'
        ],
        imagens: [
            'https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb&w=800'
        ]
    },
    {
        id: '2',
        marca: 'Mercedes-Benz',
        modelo: 'Classe A 180',
        ano: 2021,
        preco: 32000,
        combustivel: 'Gasolina',
        caixa: 'Automática',
        quilometros: 28000,
        potencia: 136,
        cor: 'Branco',
        estado: 'Disponível',
        destaque: true,
        descricao: 'Mercedes-Benz Classe A 180 em estado impecável. Viatura como nova, sempre seguida em oficina autorizada. Livre de acidentes e com garantia de origem. Interior em perfeito estado, sem qualquer desgaste. Uma oportunidade única de adquirir qualidade premium.',
        equipamentos: [
            'Sistema MBUX',
            'Câmara 360°',
            'Estofos em pele',
            'Teto panorâmico',
            'Luzes LED',
            'Jantes de liga leve 18"',
            'Park assist',
            'Keyless entry',
            'Controlo de velocidade adaptativo',
            'Apple CarPlay / Android Auto'
        ],
        imagens: [
            'https://images.pexels.com/photos/3874337/pexels-photo-3874337.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/3802102/pexels-photo-3802102.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/3764984/pexels-photo-3764984.jpeg?auto=compress&cs=tinysrgb&w=800'
        ]
    },
    {
        id: '3',
        marca: 'Audi',
        modelo: 'A4 Avant',
        ano: 2019,
        preco: 26900,
        combustivel: 'Diesel',
        caixa: 'Manual',
        quilometros: 68000,
        potencia: 150,
        cor: 'Cinzento',
        estado: 'Disponível',
        destaque: true,
        descricao: 'Audi A4 Avant 2.0 TDI, versão carrinha com enorme espaço de bagageira. Ideal para família ou profissionais. Motor diesel económico e fiável. Manutenções sempre em dia na rede oficial Audi. Pneus novos e travões revistos recentemente.',
        equipamentos: [
            'MMI Navigation Plus',
            'Virtual Cockpit',
            'Matrix LED',
            'Sensores de estacionamento',
            'Assistente de faixa de rodagem',
            'Cruise control',
            'Bluetooth',
            'USB / AUX',
            'Airbags completos',
            'ESP e ABS'
        ],
        imagens: [
            'https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/3802508/pexels-photo-3802508.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/244206/pexels-photo-244206.jpeg?auto=compress&cs=tinysrgb&w=800'
        ]
    },
    {
        id: '4',
        marca: 'Volkswagen',
        modelo: 'Golf 1.6 TDI',
        ano: 2018,
        preco: 17500,
        combustivel: 'Diesel',
        caixa: 'Manual',
        quilometros: 95000,
        potencia: 115,
        cor: 'Azul',
        estado: 'Disponível',
        destaque: false,
        descricao: 'Volkswagen Golf 1.6 TDI, o clássico que nunca falha. Motor diesel robusto e económico, perfeito para o dia a dia. Muito bem conservado e sempre tratado. Documentação em dia e pronto a usar. Aceita retoma e possibilidade de financiamento.',
        equipamentos: [
            'Ar condicionado',
            'Rádio com Bluetooth',
            'Computador de bordo',
            'Vidros elétricos',
            'Fechos centralizados',
            'ABS e ESP',
            'Airbags frontais e laterais',
            'Direção assistida',
            'Jantes de liga leve',
            'Luzes de nevoeiro'
        ],
        imagens: [
            'https://images.pexels.com/photos/1638459/pexels-photo-1638459.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/3802102/pexels-photo-3802102.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/170811/pexels-photo-170811.jpeg?auto=compress&cs=tinysrgb&w=800'
        ]
    },
    {
        id: '5',
        marca: 'Renault',
        modelo: 'Clio 1.5 dCi',
        ano: 2017,
        preco: 12900,
        combustivel: 'Diesel',
        caixa: 'Manual',
        quilometros: 112000,
        potencia: 90,
        cor: 'Vermelho',
        estado: 'Disponível',
        destaque: false,
        descricao: 'Renault Clio 1.5 dCi económico e fiável. Perfeito para quem procura um carro prático e com baixos consumos. Ideal para cidade e viagens. Revisões sempre efetuadas em oficina credenciada. IUC baixo e seguro acessível.',
        equipamentos: [
            'Ar condicionado',
            'Direção assistida',
            'Vidros elétricos',
            'Rádio CD',
            'Computador de bordo',
            'ABS',
            'Airbags',
            'Retrovisores elétricos',
            'Isofix',
            'Travão de mão eletrónico'
        ],
        imagens: [
            'https://images.pexels.com/photos/1077785/pexels-photo-1077785.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/707046/pexels-photo-707046.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/1149831/pexels-photo-1149831.jpeg?auto=compress&cs=tinysrgb&w=800'
        ]
    },
    {
        id: '6',
        marca: 'Tesla',
        modelo: 'Model 3',
        ano: 2022,
        preco: 45000,
        combustivel: 'Elétrico',
        caixa: 'Automática',
        quilometros: 18000,
        potencia: 283,
        cor: 'Branco',
        estado: 'Reservado',
        destaque: true,
        descricao: 'Tesla Model 3 Long Range, o futuro da mobilidade elétrica. Autonomia superior a 500km. Tecnologia de ponta com Autopilot incluído. Carregamento em SuperChargers Tesla. Zero emissões e custos de manutenção mínimos. Como novo, com garantia de fábrica ainda ativa.',
        equipamentos: [
            'Autopilot',
            'Ecrã tátil 15"',
            'Carregamento rápido',
            'Sistema de som premium',
            'Conectividade total',
            'Atualizações OTA',
            'Vidros panorâmicos',
            'Bancos aquecidos',
            'Câmaras 360°',
            'Keyless entry'
        ],
        imagens: [
            'https://images.pexels.com/photos/13861/IMG_3496bfree.jpg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/11383663/pexels-photo-11383663.jpeg?auto=compress&cs=tinysrgb&w=800',
            'https://images.pexels.com/photos/15435263/pexels-photo-15435263.jpeg?auto=compress&cs=tinysrgb&w=800'
        ]
    }
];

// ===================================
// Funções de Gestão do localStorage
// ===================================

// Inicializar dados se não existirem
function initializeData() {
    if (!localStorage.getItem('autostand_cars')) {
        localStorage.setItem('autostand_cars', JSON.stringify(DEMO_CARS));
    }
}

// Obter todos os carros
function getAllCars() {
    initializeData();
    const cars = localStorage.getItem('autostand_cars');
    return cars ? JSON.parse(cars) : [];
}

// Obter um carro específico por ID
function getCar(id) {
    const cars = getAllCars();
    return cars.find(car => car.id === id);
}

// Obter carros em destaque
function getFeaturedCars() {
    const cars = getAllCars();
    return cars.filter(car => car.destaque && car.estado === 'Disponível').slice(0, 3);
}

// Adicionar novo carro
function addCar(carData) {
    const cars = getAllCars();
    const newCar = {
        ...carData,
        id: Date.now().toString()
    };
    cars.push(newCar);
    localStorage.setItem('autostand_cars', JSON.stringify(cars));
    return newCar;
}

// Atualizar carro existente
function updateCar(id, carData) {
    const cars = getAllCars();
    const index = cars.findIndex(car => car.id === id);
    if (index !== -1) {
        cars[index] = { ...cars[index], ...carData, id };
        localStorage.setItem('autostand_cars', JSON.stringify(cars));
        return true;
    }
    return false;
}

// Remover carro
function deleteCar(id) {
    const cars = getAllCars();
    const filtered = cars.filter(car => car.id !== id);
    localStorage.setItem('autostand_cars', JSON.stringify(filtered));
    return true;
}

// Obter estatísticas
function getStats() {
    const cars = getAllCars();
    return {
        total: cars.length,
        disponivel: cars.filter(c => c.estado === 'Disponível').length,
        reservado: cars.filter(c => c.estado === 'Reservado').length,
        vendido: cars.filter(c => c.estado === 'Vendido').length
    };
}

// ===================================
// Funções de Formatação e Utilidade
// ===================================

// Formatar preço
function formatPrice(price) {
    return new Intl.NumberFormat('pt-PT', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(price);
}

// Formatar quilómetros
function formatKm(km) {
    return new Intl.NumberFormat('pt-PT').format(km) + ' km';
}

// Obter badge de estado
function getStatusBadge(estado) {
    const badges = {
        'Disponível': '<span class="car-badge badge-disponivel">Disponível</span>',
        'Reservado': '<span class="car-badge badge-reservado">Reservado</span>',
        'Vendido': '<span class="car-badge badge-vendido">Vendido</span>'
    };
    return badges[estado] || '';
}

// Criar card de carro
function createCarCard(car) {
    const destaqueBadge = car.destaque ? '<span class="car-badge badge-destaque">Destaque</span>' : '';
    const estadoBadge = getStatusBadge(car.estado);

    return `
        <div class="car-card" onclick="window.location.href='car-details.html?id=${car.id}'">
            <div class="car-image">
                <img src="${car.imagens[0]}" alt="${car.marca} ${car.modelo}">
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

// Obter marcas únicas
function getUniqueBrands() {
    const cars = getAllCars();
    const brands = [...new Set(cars.map(car => car.marca))];
    return brands.sort();
}

// Obter modelos por marca
function getModelsByBrand(brand) {
    const cars = getAllCars();
    const models = [...new Set(cars.filter(car => car.marca === brand).map(car => car.modelo))];
    return models.sort();
}

// Inicializar dados ao carregar o script
initializeData();
