# UNAH-Shop - E-Commerce Educativo
## Desarrollador por Ingeniero Marvin Toro
## 20 de Octbre 2025

## 📋 Descripción del Proyecto
Sistema de E-Commerce educativo desarrollado para ilustrar conceptos fundamentales de programación web moderna, incluyendo SPA/MPA, microservicios, comunicación asíncrona y paradigmas de programación en JavaScript.

## 🎯 Objetivos de Aprendizaje

### Objetivos Principales
1. **SPA vs MPA**: Mostrar diferencias prácticas entre Single Page Application y Multi Page Application
2. **Comunicación Asíncrona**: Implementar XHR y Fetch API
3. **Microservicios**: Integrar servicios distribuidos en ecosistema web
4. **Paradigmas JS**: Aplicar programación funcional y orientada a objetos
5. **Framework Moderno**: Desarrollar con React/Next.js

### Objetivos Específicos
- ✅ Implementar frontend con Next.js (MPA) y React puro (SPA)
- ✅ Crear 4 microservicios independientes con Node.js + Express
- ✅ Integrar Supabase para persistencia de datos
- ✅ Consumir APIs externas para catálogo de productos
- ✅ Aplicar Material-UI para diseño consistente
- ✅ Documentar diferencias entre paradigmas de programación

## 🏗️ Arquitectura del Proyecto

```
UNAH-Shop/
├── 📁 frontend/                 # Next.js Application
│   ├── 📁 pages/               # MPA Pages (Next.js routing)
│   ├── 📁 components/          # React Components
│   │   ├── 📁 functional/      # Paradigma Funcional
│   │   └── 📁 oop/            # Paradigma OOP
│   ├── 📁 services/           # API Communication
│   │   ├── fetchAPI.js        # Modern Fetch approach
│   │   └── xmlHttpRequest.js  # Legacy XHR approach
│   ├── 📁 spa-version/        # Pure React SPA
│   └── 📁 styles/             # Material-UI themes
├── 📁 backend/                 # Microservices
│   ├── 📁 customers-service/   # Port 3001
│   ├── 📁 products-service/    # Port 3002
│   ├── 📁 cart-service/       # Port 3003
│   └── 📁 orders-service/     # Port 3004
├── 📁 docs/                   # Documentation
├── 📁 database/               # Supabase schemas
└── 📁 tests/                  # Testing files
```

## 🔧 Stack Tecnológico

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Library**: Material-UI v5
- **Styling**: CSS Modules + Material-UI
- **State Management**: React Context + useState/useReducer
- **HTTP Client**: Fetch API + XMLHttpRequest (educativo)

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **External API**: FakeStore API / DummyJSON
- **Middleware**: CORS, Morgan, Helmet

### DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm
- **Linting**: ESLint + Prettier
- **Testing**: Jest + React Testing Library
- **Deployment**: Vercel (Frontend) + Railway (Backend)

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 18+
- npm o yarn
- Git
- Cuenta en Supabase

### Configuración Inicial
```bash
# Clonar repositorio
git clone <repository-url>
cd UNAH-Shop

# Instalar dependencias del monorepo
npm install

# Configurar variables de entorno
cp .env.example .env.local
```

## 📚 Conceptos Educativos Implementados

### 1. Paradigma Funcional vs Orientado a Objetos

#### Funcional (Ejemplo: Carrito de Compras)
```javascript
// Funciones puras para manejo del carrito
const addToCart = (cart, product) => [...cart, product];
const removeFromCart = (cart, productId) => 
  cart.filter(item => item.id !== productId);
const calculateTotal = (cart) => 
  cart.reduce((total, item) => total + item.price, 0);
```

#### Orientado a Objetos (Ejemplo: Carrito de Compras)
```javascript
class ShoppingCart {
  constructor() {
    this.items = [];
  }
  
  addItem(product) {
    this.items.push(product);
  }
  
  removeItem(productId) {
    this.items = this.items.filter(item => item.id !== productId);
  }
  
  getTotal() {
    return this.items.reduce((total, item) => total + item.price, 0);
  }
}
```

### 2. SPA vs MPA

#### SPA (Single Page Application)
- **Ubicación**: `/spa-version/`
- **Características**: React Router, carga dinámica, estado global
- **Ventajas**: Navegación fluida, menos solicitudes al servidor
- **Desventajas**: SEO limitado, carga inicial más lenta

#### MPA (Multi Page Application)
- **Ubicación**: `/pages/` (Next.js)
- **Características**: Server-Side Rendering, rutas de archivo
- **Ventajas**: Mejor SEO, carga inicial rápida
- **Desventajas**: Recarga de página, más solicitudes al servidor

### 3. Comunicación Asíncrona

#### Fetch API (Moderno)
```javascript
const fetchProducts = async () => {
  try {
    const response = await fetch('/api/products');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
  }
};
```

#### XMLHttpRequest (Clásico)
```javascript
const xhrGetProducts = () => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/products');
    xhr.onload = () => resolve(JSON.parse(xhr.responseText));
    xhr.onerror = () => reject(xhr.statusText);
    xhr.send();
  });
};
```

## 🏢 Microservicios

### 1. customers-service (Puerto 3001)
**Responsabilidad**: Gestión de clientes registrados
- `GET /api/customers` - Listar clientes
- `POST /api/customers` - Crear cliente
- `PUT /api/customers/:id` - Actualizar cliente
- `DELETE /api/customers/:id` - Eliminar cliente

### 2. products-service (Puerto 3002)
**Responsabilidad**: Catálogo de productos
- `GET /api/products` - Listar productos
- `GET /api/products/:id` - Obtener producto específico
- `GET /api/products/category/:category` - Filtrar por categoría

### 3. cart-service (Puerto 3003)
**Responsabilidad**: Gestión del carrito de compras
- `GET /api/cart/:userId` - Obtener carrito del usuario
- `POST /api/cart` - Añadir item al carrito
- `PUT /api/cart/:itemId` - Actualizar cantidad
- `DELETE /api/cart/:itemId` - Eliminar item

### 4. orders-service (Puerto 3004)
**Responsabilidad**: Procesamiento de órdenes
- `POST /api/orders` - Crear nueva orden
- `GET /api/orders/:userId` - Historial de órdenes
- `GET /api/orders/:id` - Detalle de orden específica

## 🗄️ Esquema de Base de Datos (Supabase)

### Tabla: customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: cart_items
```sql
CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  product_id INTEGER NOT NULL,
  quantity INTEGER DEFAULT 1,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla: orders
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id),
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 📖 Guías de Desarrollo

### Comandos de Desarrollo
```bash
# Desarrollo completo (todos los servicios)
npm run dev

# Solo frontend
npm run dev:frontend

# Solo backend (todos los microservicios)
npm run dev:backend

# Microservicio específico
npm run dev:customers
npm run dev:products
npm run dev:cart
npm run dev:orders
```

### Estructura de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: documentación
style: formato de código
refactor: refactorización
test: pruebas
```

## 🎓 Ejercicios Prácticos

### Para Estudiantes

1. **Paradigmas de Programación**
   - Convertir componente funcional a clase y viceversa
   - Implementar misma funcionalidad con ambos paradigmas

2. **SPA vs MPA**
   - Comparar tiempo de carga inicial
   - Analizar comportamiento de navegación
   - Evaluar SEO de ambas versiones

3. **Microservicios**
   - Crear nuevo microservicio para reviews
   - Implementar comunicación entre servicios
   - Manejar fallos de servicio

4. **APIs**
   - Migrar de XMLHttpRequest a Fetch
   - Implementar cache para optimizar performance
   - Manejar estados de carga y error

## 🚀 Roadmap de Desarrollo

### Fase 1: Configuración (Semana 1)
- [x] Estructura del proyecto
- [ ] Configuración de Supabase
- [ ] Setup de desarrollo

### Fase 2: Backend (Semana 2-3)
- [ ] Microservicio customers-service
- [ ] Microservicio products-service
- [ ] Microservicio cart-service
- [ ] Microservicio orders-service

### Fase 3: Frontend (Semana 4-5)
- [ ] Configuración Next.js + Material-UI
- [ ] Páginas principales (MPA)
- [ ] Versión SPA
- [ ] Integración con microservicios

### Fase 4: Conceptos Educativos (Semana 6)
- [ ] Ejemplos paradigmas funcional/OOP
- [ ] Comparativa Fetch/XHR
- [ ] Documentación SPA vs MPA

### Fase 5: Testing y Deploy (Semana 7)
- [ ] Tests unitarios
- [ ] Tests de integración
- [ ] Deployment en Vercel/Railway

## 🤝 Contribución

Este es un proyecto educativo. Las contribuciones deben enfocarse en:
- Mejorar ejemplos educativos
- Añadir documentación clara
- Optimizar código para aprendizaje
- Corregir bugs o errores conceptuales

## 📝 Licencia

MIT License - Proyecto con fines educativos

---

**Desarrollado con ❤️ para la educación en programación web moderna**