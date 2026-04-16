# Auto Taipinhas

Website oficial da **Auto Taipinhas**, desenvolvido com foco em presença digital profissional, gestão interna de stock automóvel e preparação para ambiente real de produção.

Este projeto foi concebido para disponibilizar uma experiência moderna e intuitiva ao utilizador final, ao mesmo tempo que oferece uma **área de administração segura** para gestão de viaturas, imagens e mensagens recebidas através do website.

---

## Visão Geral

A plataforma está dividida em duas áreas principais:

### Área pública
- Homepage
- Página de stock
- Página de detalhe de viatura
- Página “Sobre Nós”
- Página de contactos
- Página de localização

### Área de administração
- Autenticação de administrador
- Dashboard com estatísticas
- Gestão de carros
- Adicionar, editar e eliminar viaturas
- Atualização do estado da viatura
- Gestão de imagens
- Gestão de mensagens recebidas pelo formulário de contacto

---

## Objetivo do Projeto

O principal objetivo deste projeto foi transformar a presença digital do stand **Auto Taipinhas** numa solução mais profissional, moderna e preparada para utilização real, substituindo uma lógica inicial baseada em dados hardcoded e armazenamento local por uma arquitetura com backend real, autenticação e base de dados.

---

## Stack Tecnológica

### Frontend
- HTML5
- CSS3
- JavaScript (ES Modules)
- Vite

### Backend / Serviços
- Supabase
- Supabase Auth
- PostgreSQL
- Supabase Storage

---

## Principais Funcionalidades

### Website público
- Apresentação institucional do stand
- Catálogo de viaturas
- Página individual por carro
- Galeria de imagens
- Formulário de contacto integrado com base de dados
- Página de localização com Google Maps

### Painel de Administração
- Login protegido
- Verificação de acesso administrativo
- Dashboard com visão geral do stock
- CRUD completo de viaturas
- Upload e gestão de imagens via Supabase Storage
- Leitura e gestão de mensagens recebidas
- Atualização do estado das viaturas:
  - Disponível
  - Reservado
  - Vendido

---

## Segurança e Estrutura

Este projeto inclui uma evolução estrutural relevante face à versão inicial:

- Migração de lógica baseada em `localStorage` para **Supabase**
- Autenticação de administradores com **Supabase Auth**
- Proteção de tabelas com **Row Level Security (RLS)**
- Separação entre área pública e área administrativa
- Organização do frontend com **ES Modules**
- Normalização progressiva entre frontend e base de dados
- Preparação para deploy em domínio real

---

## Arquitetura de Dados

A aplicação utiliza uma base de dados PostgreSQL via Supabase, com tabelas principais como:

- `carros`
- `imagens`
- `mensagens`
- `admin_users`

### Exemplos de dados geridos
#### Carros
- marca
- modelo
- ano
- preço
- quilómetros
- combustível
- transmissão
- cavalos
- cilindrada
- portas
- lugares
- cor
- estado
- descrição
- destaque
- equipamentos

#### Mensagens
- nome
- email
- telefone
- assunto
- mensagem
- origem
- data de criação
- estado de leitura

---

## Melhorias Implementadas

Ao longo do desenvolvimento, o projeto passou por uma evolução significativa, incluindo:

- remoção gradual de lógica antiga e dependências locais
- integração real com base de dados
- autenticação segura para o painel administrativo
- migração de imagens para storage dedicado
- melhoria da arquitetura do admin
- remoção de handlers inline (`onclick`)
- reforço da camada de contacto com validações e proteção anti-spam básica
- alinhamento entre os campos da interface e os campos reais da base de dados

---

## Estrutura do Projeto

```bash
Auto-Taipinhas/
│
├── css/
│   ├── style.css
│   └── admin.css
│
├── js/
│   ├── admin.js
│   ├── admin-access.js
│   ├── admin-login.js
│   ├── car-details.js
│   ├── contact.js
│   ├── data.js
│   ├── filters.js
│   ├── main.js
│   └── supabase.js
│
├── images/
│
├── index.html
├── stock.html
├── about.html
├── contact.html
├── location.html
├── car-details.html
├── painel-acesso-taipinhas.html
├── painel-gestao-taipinhas.html
├── package.json
└── README.md
```

---

## Como Executar o Projeto Localmente

### 1. Clonar o repositório
```bash
git clone <URL_DO_REPOSITORIO>
cd auto-taipinhas
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Criar ficheiro `.env`
Criar um ficheiro `.env` na raiz do projeto com:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

### 4. Iniciar ambiente de desenvolvimento
```bash
npm run dev
```

### 5. Gerar build de produção
```bash
npm run build
```

---

## Variáveis de Ambiente

| Variável | Descrição |
|----------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave pública anon do Supabase |

---

## Estado Atual

O projeto encontra-se numa fase avançada de implementação, com base funcional sólida e várias componentes já preparadas para utilização real.

### Já concluído
- website público funcional
- painel de administração funcional
- integração com Supabase
- autenticação administrativa
- gestão de carros
- gestão de imagens
- receção e visualização de mensagens
- proteção base com RLS
- melhoria estrutural do frontend

### Em melhoria contínua
- refinamento final de arquitetura
- otimização de performance
- SEO e branding final
- polimento para deploy definitivo

---

## Demonstração

> Adicionar aqui screenshots reais do projeto ou links para demonstração online.

Exemplos:
- Homepage
- Página de stock
- Página de detalhe
- Painel de administração
- Gestão de mensagens

---

## Aprendizagens e Valor Técnico

Este projeto permitiu consolidar competências em:

- desenvolvimento frontend com JavaScript modular
- integração com serviços backend
- autenticação e controlo de acesso
- modelação e consumo de base de dados
- gestão de ficheiros com storage cloud
- refatoração progressiva de código legado
- preparação de aplicações para produção real

---

## Possíveis Evoluções Futuras

- paginação e filtros avançados no stock
- melhoria da gestão de imagens com ordenação manual
- dashboard com métricas mais detalhadas
- exportação de leads/mensagens
- painel com gestão de utilizadores administrativos
- otimização SEO avançada
- integração com analytics

---

## Autor

**Gonçalo Regadas**  
Software and Web Dev

### Contacto
- LinkedIn: https://www.linkedin.com/in/regadas02/
- Email: regadas02@gmail.com
- GitHub: https://github.com/REGADAS1

---

## Copyright e Direitos Reservados

© 2026 Auto Taipinhas. Todos os direitos reservados.

Este projeto foi desenvolvido no contexto de prestação de serviços e comercialização de solução digital. O código-fonte, estrutura, conteúdos, identidade visual e implementação técnica associada encontram-se reservados, não sendo permitida a sua reprodução, distribuição, modificação, reutilização comercial ou republicação total ou parcial sem autorização prévia e expressa do titular dos direitos.

---

## Nota Final

Este projeto representa não apenas a construção de um website institucional, mas também a evolução de uma solução simples para uma aplicação web com backend real, autenticação, estrutura administrativa e preocupação com segurança, manutenção e deploy.
