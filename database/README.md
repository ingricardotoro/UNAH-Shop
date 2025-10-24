# Base de Datos - UNAH Shop

## 📊 Descripción General

La base de datos de UNAH-Shop está diseñada con PostgreSQL (Supabase) siguiendo principios de normalización y mejores prácticas para aplicaciones de e-commerce educativas.

## 🗂️ Estructura de Archivos

```
database/
├── README.md           # Este archivo
├── setup.md           # Guía detallada de configuración
├── init.sql           # Script de inicialización completo
├── queries.sql        # Consultas útiles para desarrollo
└── schemas.js         # Esquemas de validación Joi
```

## 🏗️ Arquitectura de Datos

### Relaciones Entre Tablas

```
customers (1) ←──→ (N) cart_items
customers (1) ←──→ (N) orders
orders (1) ←──→ (N) order_items
```

### Diagrama ER Simplificado

```
┌─────────────────┐
│    CUSTOMERS    │
│ ─────────────── │
│ + id (UUID)     │
│ + email         │
│ + first_name    │
│ + last_name     │
│ + phone         │
│ + created_at    │
│ + updated_at    │
└─────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐    ┌─────────────────┐
│   CART_ITEMS    │    │     ORDERS      │
│ ─────────────── │    │ ─────────────── │
│ + id (UUID)     │    │ + id (UUID)     │
│ + customer_id   │◄───┤ + customer_id   │
│ + product_id    │    │ + order_number  │
│ + product_name  │    │ + status        │
│ + quantity      │    │ + total_amount  │
│ + unit_price    │    │ + items_count   │
│ + total_price   │    │ + customer_info │
│ + created_at    │    │ + shipping_addr │
│ + updated_at    │    │ + billing_addr  │
└─────────────────┘    │ + payment_info  │
                       │ + notes         │
                       │ + created_at    │
                       │ + updated_at    │
                       └─────────────────┘
                                │
                                │ 1:N
                                ▼
                       ┌─────────────────┐
                       │   ORDER_ITEMS   │
                       │ ─────────────── │
                       │ + id (UUID)     │
                       │ + order_id      │
                       │ + product_id    │
                       │ + product_name  │
                       │ + product_desc  │
                       │ + category      │
                       │ + quantity      │
                       │ + unit_price    │
                       │ + total_price   │
                       │ + created_at    │
                       └─────────────────┘
```

## 📋 Detalles de Tablas

### customers
**Propósito**: Almacenar información de clientes registrados.

| Campo      | Tipo        | Descripción                    |
|------------|-------------|--------------------------------|
| id         | UUID        | Clave primaria                 |
| email      | VARCHAR(255)| Email único del cliente        |
| first_name | VARCHAR(100)| Nombre del cliente             |
| last_name  | VARCHAR(100)| Apellido del cliente           |
| phone      | VARCHAR(20) | Teléfono (opcional)            |
| created_at | TIMESTAMPTZ | Fecha de registro              |
| updated_at | TIMESTAMPTZ | Última actualización           |

### cart_items
**Propósito**: Gestionar items del carrito de compras.

| Campo        | Tipo         | Descripción                     |
|--------------|-------------|---------------------------------|
| id           | UUID        | Clave primaria                  |
| customer_id  | UUID        | FK a customers                  |
| product_id   | INTEGER     | ID del producto (API externa)   |
| product_name | VARCHAR(255)| Nombre del producto             |
| product_image| VARCHAR(500)| URL de imagen del producto      |
| quantity     | INTEGER     | Cantidad de items               |
| unit_price   | DECIMAL(10,2)| Precio unitario                |
| total_price  | DECIMAL(10,2)| Precio total (calculado)       |
| created_at   | TIMESTAMPTZ | Fecha de adición                |
| updated_at   | TIMESTAMPTZ | Última actualización            |

### orders
**Propósito**: Registrar órdenes de compra completas.

| Campo          | Tipo         | Descripción                    |
|----------------|-------------|--------------------------------|
| id             | UUID        | Clave primaria                 |
| customer_id    | UUID        | FK a customers                 |
| order_number   | VARCHAR(50) | Número de orden único          |
| status         | VARCHAR(50) | Estado de la orden             |
| total_amount   | DECIMAL(10,2)| Monto total                   |
| items_count    | INTEGER     | Cantidad de items              |
| customer_info  | JSONB       | Snapshot info del cliente      |
| shipping_address| JSONB      | Dirección de envío             |
| billing_address | JSONB      | Dirección de facturación       |
| payment_info   | JSONB       | Información de pago            |
| notes          | TEXT        | Notas adicionales              |
| created_at     | TIMESTAMPTZ | Fecha de creación              |
| updated_at     | TIMESTAMPTZ | Última actualización           |

### order_items
**Propósito**: Detallar productos específicos en cada orden.

| Campo             | Tipo         | Descripción                   |
|-------------------|-------------|-------------------------------|
| id                | UUID        | Clave primaria                |
| order_id          | UUID        | FK a orders                   |
| product_id        | INTEGER     | ID del producto               |
| product_name      | VARCHAR(255)| Nombre del producto           |
| product_description| TEXT       | Descripción del producto      |
| product_image     | VARCHAR(500)| URL de imagen                 |
| category          | VARCHAR(100)| Categoría del producto        |
| quantity          | INTEGER     | Cantidad ordenada             |
| unit_price        | DECIMAL(10,2)| Precio unitario              |
| total_price       | DECIMAL(10,2)| Precio total (calculado)     |
| created_at        | TIMESTAMPTZ | Fecha de creación             |

## 🔐 Seguridad

### Row Level Security (RLS)
Todas las tablas tienen RLS habilitado para asegurar que:
- Los usuarios solo pueden acceder a sus propios datos
- No hay acceso cruzado entre clientes
- Los datos están protegidos a nivel de base de datos

### Políticas Implementadas
1. **customers**: Solo acceso a datos propios
2. **cart_items**: Solo acceso al carrito propio
3. **orders**: Solo acceso a órdenes propias
4. **order_items**: Solo acceso a items de órdenes propias

## ⚡ Optimizaciones

### Índices Creados
- `idx_customers_email`: Búsqueda rápida por email
- `idx_cart_items_customer_id`: Consultas de carrito por usuario
- `idx_orders_customer_id`: Órdenes por cliente
- `idx_orders_status`: Filtrado por estado de orden
- `idx_order_items_order_id`: Items por orden

### Campos Calculados
- `cart_items.total_price`: Generado automáticamente (quantity × unit_price)
- `order_items.total_price`: Generado automáticamente (quantity × unit_price)

### Triggers Automáticos
- **updated_at**: Se actualiza automáticamente en modificaciones
- **order_number**: Se genera automáticamente con formato ORD-YYYYMMDD-XXXXXX

## 🚀 Configuración Rápida

### 1. Configurar Supabase
```bash
# 1. Crear proyecto en https://supabase.com
# 2. Copiar credenciales a .env.local
# 3. Ejecutar script de inicialización
```

### 2. Ejecutar Script de Inicialización
```sql
-- Copiar y pegar el contenido de init.sql en el SQL Editor de Supabase
-- El script incluye:
-- - Creación de tablas
-- - Índices de optimización  
-- - Triggers automáticos
-- - Políticas RLS
-- - Datos de prueba
```

### 3. Verificar Instalación
```sql
-- Ejecutar consultas de verificación desde queries.sql
SELECT 'Configuración completada exitosamente! 🎉' as status,
       COUNT(*) as total_customers 
FROM customers;
```

## 🛠️ Herramientas de Desarrollo

### Validación de Datos
```javascript
// Usar schemas.js para validación en microservicios
const { validateCustomerCreate } = require('./database/schemas');

const { error, value } = validateCustomerCreate(customerData);
if (error) {
  // Manejar error de validación
}
```

### Consultas Comunes
Ver `queries.sql` para ejemplos de:
- Consultas de estadísticas
- Reportes de ventas
- Análisis de productos
- Consultas de debugging

## 📊 Datos de Ejemplo

### Clientes de Prueba
```
juan.perez@unah.hn    - Juan Pérez
maria.lopez@unah.hn   - María López  
carlos.rodriguez@unah.hn - Carlos Rodríguez
```

### Estados de Orden
- `pending`: Orden recibida, pendiente de procesar
- `processing`: Orden en proceso de preparación
- `shipped`: Orden enviada al cliente
- `delivered`: Orden entregada exitosamente
- `cancelled`: Orden cancelada

## 🔄 Flujos de Datos

### Flujo del Carrito
1. Usuario añade producto → `cart_items`
2. Usuario modifica cantidad → UPDATE `cart_items`
3. Usuario procede al checkout → Leer `cart_items`

### Flujo de Órdenes
1. Crear orden → INSERT `orders`
2. Copiar items del carrito → INSERT `order_items`
3. Limpiar carrito → DELETE `cart_items`
4. Actualizar estado → UPDATE `orders.status`

## 🐛 Debugging

### Consultas Útiles
```sql
-- Ver estructura completa
\d+ customers

-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Analizar performance
EXPLAIN ANALYZE SELECT * FROM orders WHERE customer_id = 'uuid';
```

### Problemas Comunes
1. **RLS blocking queries**: Verificar que auth.uid() esté configurado
2. **Constraint violations**: Revisar validaciones en schemas.js
3. **Performance issues**: Verificar que los índices estén siendo usados

## 📈 Monitoreo

### Métricas Importantes
- Número de usuarios activos
- Items promedio por carrito
- Tasa de conversión (carrito → orden)
- Productos más populares
- Tiempo promedio de checkout

### Consultas de Monitoreo
Ver `queries.sql` sección "CONSULTAS DE ESTADÍSTICAS" para métricas en tiempo real.

---

**Autor**: UNAH - Proyecto Educativo  
**Fecha**: 20 de octubre de 2025  
**Versión**: 1.0  
**Estado**: ✅ Listo para desarrollo