# Arquitectura del Sistema - UNAH Shop

## 🏗️ Vista General de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│                         Puerto 3000                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │   MPA       │  │     SPA     │  │  Material   │             │
│  │ (Next.js)   │  │  (React)    │  │     UI      │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                               │
                    ┌──────────┼──────────┐
                    │          │          │
                    ▼          ▼          ▼
        ┌─────────────────────────────────────────────────────────┐
        │                API GATEWAY                              │
        │            (Load Balancer)                             │
        └─────────────────────────────────────────────────────────┘
                               │
        ┌──────────┬──────────┼──────────┬──────────┐
        │          │          │          │          │
        ▼          ▼          ▼          ▼          ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ CUSTOMERS    │ │  PRODUCTS    │ │    CART      │ │   ORDERS     │
│   SERVICE    │ │   SERVICE    │ │   SERVICE    │ │   SERVICE    │
│ Puerto 3001  │ │ Puerto 3002  │ │ Puerto 3003  │ │ Puerto 3004  │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
        │                 │              │              │
        │                 │              │              │
        ▼                 ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   SUPABASE   │ │   EXTERNAL   │ │   SUPABASE   │ │   SUPABASE   │
│  (customers) │ │  PRODUCTS    │ │    (cart)    │ │   (orders)   │
│              │ │     API      │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

## 🔄 Flujo de Datos Principal

### 1. Flujo de Autenticación/Usuario
```
Usuario → Frontend → customers-service → Supabase → customers-service → Frontend
```

### 2. Flujo de Productos
```
Frontend → products-service → External API (Cache) → products-service → Frontend
```

### 3. Flujo del Carrito
```
Frontend → cart-service → Supabase → cart-service → Frontend
         ↓
    products-service (validación de inventario)
```

### 4. Flujo de Órdenes
```
Frontend → orders-service → customers-service (validar usuario)
                         ↓
                    cart-service (obtener items)
                         ↓
                    Supabase (crear orden)
                         ↓
                    cart-service (limpiar carrito)
                         ↓
                    Frontend (confirmación)
```

## 🎯 Arquitectura por Capas

### Frontend Layer
```
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  Pages (MPA)          │  Components (SPA)    │  Material-UI     │
│  ├─ /                 │  ├─ ProductList      │  ├─ Theme        │
│  ├─ /products         │  ├─ ShoppingCart     │  ├─ Components   │
│  ├─ /products/[id]    │  ├─ CustomerForm     │  └─ Icons        │
│  ├─ /cart             │  └─ OrderSummary     │                  │
│  └─ /checkout         │                      │                  │
├─────────────────────────────────────────────────────────────────┤
│                      BUSINESS LOGIC LAYER                       │
├─────────────────────────────────────────────────────────────────┤
│  Services             │  Utils               │  Hooks           │
│  ├─ fetchApi.js       │  ├─ functional.js    │  ├─ useCart      │
│  ├─ xmlHttpReq.js     │  ├─ CartClass.js     │  ├─ useProducts  │
│  └─ apiClient.js      │  └─ formatters.js    │  └─ useOrders    │
├─────────────────────────────────────────────────────────────────┤
│                       DATA ACCESS LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  HTTP Clients         │  State Management    │  Local Storage   │
│  ├─ Fetch API         │  ├─ React Context    │  ├─ Cart Items   │
│  ├─ XMLHttpRequest    │  ├─ useState         │  └─ User Prefs   │
│  └─ Axios (optional)  │  └─ useReducer       │                  │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Layer (Microservicios)
```
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Load Balancer        │  CORS Handler        │  Rate Limiting   │
│  ├─ Service Discovery │  ├─ Origin Control    │  ├─ Per Service  │
│  ├─ Health Checks     │  └─ Headers Setup     │  └─ Per User     │
│  └─ Routing           │                       │                  │
├─────────────────────────────────────────────────────────────────┤
│                     MICROSERVICES LAYER                         │
├─────────────────────────────────────────────────────────────────┤
│  customers-service    │  products-service    │  cart-service    │
│  ├─ Routes           │  ├─ Routes            │  ├─ Routes       │
│  ├─ Controllers      │  ├─ Controllers       │  ├─ Controllers  │
│  ├─ Services         │  ├─ Services          │  ├─ Services     │
│  ├─ Models           │  ├─ Cache Layer       │  ├─ Models       │
│  └─ Middleware       │  └─ Middleware        │  └─ Middleware   │
│                      │                       │                  │
│  orders-service      │                       │                  │
│  ├─ Routes           │                       │                  │
│  ├─ Controllers      │                       │                  │
│  ├─ Services         │                       │                  │
│  ├─ Models           │                       │                  │
│  └─ Middleware       │                       │                  │
├─────────────────────────────────────────────────────────────────┤
│                      DATA ACCESS LAYER                          │
├─────────────────────────────────────────────────────────────────┤
│  Supabase Client      │  External APIs       │  Cache Layer     │
│  ├─ PostgreSQL       │  ├─ FakeStore API     │  ├─ Memory Cache │
│  ├─ Real-time        │  ├─ DummyJSON API     │  ├─ Redis (opt.) │
│  └─ Auth              │  └─ HTTP Client       │  └─ TTL Config   │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Patrones de Comunicación

### 1. Síncrona (HTTP/REST)
```
Frontend ←──HTTP──→ Microservice ←──HTTP──→ Database/External API
```

### 2. Asíncrona (Event-Driven) - Futuro
```
Service A ──Event──→ Message Queue ──Event──→ Service B
```

### 3. Cache Pattern
```
Request → Cache Check → Hit? → Return Data
             │              
             ↓ Miss
        External API → Update Cache → Return Data
```

## 📊 Esquema de Base de Datos

### Supabase Tables
```sql
-- Customers (Gestión de clientes)
customers
├─ id (UUID, PK)
├─ email (VARCHAR, UNIQUE)
├─ first_name (VARCHAR)
├─ last_name (VARCHAR) 
├─ phone (VARCHAR, Optional)
├─ created_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)

-- Cart Items (Items del carrito)
cart_items
├─ id (UUID, PK)
├─ customer_id (UUID, FK → customers.id)
├─ product_id (INTEGER) -- Referencia a API externa
├─ quantity (INTEGER)
├─ price (DECIMAL)
├─ created_at (TIMESTAMP)
└─ updated_at (TIMESTAMP)

-- Orders (Órdenes de compra)
orders
├─ id (UUID, PK)
├─ customer_id (UUID, FK → customers.id)
├─ total_amount (DECIMAL)
├─ status (VARCHAR) -- pending, processing, completed, cancelled
├─ items (JSONB) -- Snapshot de items al momento de la orden
├─ shipping_address (JSONB, Optional)
├─ billing_address (JSONB, Optional)
└─ created_at (TIMESTAMP)

-- Order Items (Detalle de órdenes) - Opcional para normalización
order_items
├─ id (UUID, PK)
├─ order_id (UUID, FK → orders.id)
├─ product_id (INTEGER)
├─ product_name (VARCHAR)
├─ quantity (INTEGER)
├─ unit_price (DECIMAL)
└─ total_price (DECIMAL)
```

### Relationships
```
customers (1) ←──→ (N) cart_items
customers (1) ←──→ (N) orders
orders (1) ←──→ (N) order_items
```

## 🔐 Seguridad y Autenticación

### Row Level Security (RLS) - Supabase
```sql
-- Customers: Users can only see their own data
CREATE POLICY customers_own_data ON customers
FOR ALL USING (auth.uid() = id);

-- Cart Items: Users can only access their own cart
CREATE POLICY cart_own_items ON cart_items
FOR ALL USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth.uid() = id
  )
);

-- Orders: Users can only see their own orders
CREATE POLICY orders_own_data ON orders
FOR ALL USING (
  customer_id IN (
    SELECT id FROM customers WHERE auth.uid() = id
  )
);
```

### API Security
```
┌─────────────────────────────────────────────────────────────────┐
│                        SECURITY LAYERS                          │
├─────────────────────────────────────────────────────────────────┤
│  1. HTTPS/TLS         │  2. CORS Policy      │  3. Rate Limiting │
│  └─ SSL Certificates  │  └─ Origin Control   │  └─ Request Limits│
├─────────────────────────────────────────────────────────────────┤
│  4. Input Validation  │  5. Authentication   │  6. Authorization │
│  └─ Joi Schemas       │  └─ JWT Tokens       │  └─ RLS Policies  │
├─────────────────────────────────────────────────────────────────┤
│  7. SQL Injection     │  8. XSS Protection   │  9. CSRF Guard    │
│  └─ Parameterized     │  └─ Content Security │  └─ Token Verify  │
│     Queries           │     Policy           │                   │
└─────────────────────────────────────────────────────────────────┘
```

## 🎯 Conceptos Educativos Implementados

### 1. SPA vs MPA Architecture
```
SPA (React Router)          MPA (Next.js)
├─ Client-Side Routing      ├─ File-based Routing
├─ Single HTML Load         ├─ Server-Side Rendering
├─ Dynamic Content          ├─ Static Generation
├─ JavaScript Navigation    ├─ Traditional Navigation
└─ State Management         └─ Page-level State
```

### 2. Paradigma Funcional vs POO
```
Functional Programming      Object-Oriented Programming
├─ Pure Functions          ├─ Classes and Objects
├─ Immutability           ├─ Encapsulation
├─ Higher-Order Functions  ├─ Inheritance
├─ Function Composition    ├─ Polymorphism
└─ No Side Effects        └─ Method Chaining
```

### 3. Communication Patterns
```
XMLHttpRequest (Legacy)     Fetch API (Modern)
├─ Callback-based          ├─ Promise-based
├─ Event Listeners         ├─ Async/Await
├─ Manual Error Handling   ├─ Built-in Error Handling
├─ Verbose Syntax          ├─ Clean Syntax
└─ Limited Features        └─ Stream Support
```

## 📈 Performance Considerations

### Frontend Optimizations
```
┌─────────────────────────────────────────────────────────────────┐
│                      PERFORMANCE STRATEGIES                      │
├─────────────────────────────────────────────────────────────────┤
│  Code Splitting          │  Image Optimization  │  Caching       │
│  ├─ Dynamic Imports      │  ├─ Next.js Image    │  ├─ Browser    │
│  ├─ Route-based          │  ├─ WebP Format      │  ←─ Service    │
│  └─ Component-based      │  └─ Lazy Loading     │  └─ CDN        │
├─────────────────────────────────────────────────────────────────┤
│  Bundle Optimization    │  Server-Side         │  Client-Side    │
│  ├─ Tree Shaking        │  ├─ SSR for SEO      │  ├─ Hydration   │
│  ├─ Minification        │  ├─ SSG for Static   │  ├─ Virtual DOM │
│  └─ Compression         │  └─ ISR for Dynamic  │  └─ Memoization │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Optimizations
```
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND PERFORMANCE                        │
├─────────────────────────────────────────────────────────────────┤
│  Database               │  API Optimizations   │  Microservices │
│  ├─ Connection Pooling  │  ├─ Response Caching │  ├─ Load Balance│
│  ├─ Query Optimization  │  ├─ Compression      │  ├─ Health Check│
│  └─ Indexing           │  └─ Pagination       │  └─ Graceful    │
├─────────────────────────────────────────────────────────────────┤
│  External APIs          │  Memory Management   │  Monitoring     │
│  ├─ Response Caching    │  ├─ Garbage Collect  │  ├─ Metrics     │
│  ├─ Rate Limiting       │  ├─ Memory Leaks     │  ├─ Logs        │
│  └─ Circuit Breaker     │  └─ Process Mgmt     │  └─ Alerts      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Deployment Architecture

### Development Environment
```
Local Machine
├─ Frontend (localhost:3000)
├─ customers-service (localhost:3001)
├─ products-service (localhost:3002)
├─ cart-service (localhost:3003)
├─ orders-service (localhost:3004)
└─ Supabase (cloud)
```

### Production Environment
```
Cloud Infrastructure
├─ Frontend (Vercel)
│  ├─ CDN Distribution
│  ├─ Edge Functions
│  └─ Auto Scaling
├─ Backend (Railway/Render)
│  ├─ Container Deployment
│  ├─ Load Balancing
│  └─ Health Monitoring
└─ Database (Supabase Cloud)
   ├─ Connection Pooling
   ├─ Automatic Backups
   └─ Global Distribution
```

---

**Última actualización**: 20 de octubre de 2025  
**Versión**: 1.0  
**Estado**: Documentación base completada ✅