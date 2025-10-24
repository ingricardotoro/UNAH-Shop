# Configuración de Supabase - UNAH Shop

## 🗄️ Guía de Configuración de Base de Datos

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto:
   - **Nombre**: `unah-shop`
   - **Contraseña**: (genera una contraseña segura)
   - **Región**: Selecciona la más cercana (US East recomendada)

### 2. Obtener Credenciales

Una vez creado el proyecto, ve a **Settings > API** y obtén:

- **Project URL**: `https://tu-proyecto-id.supabase.co`
- **anon/public key**: Para uso en frontend
- **service_role key**: Para uso en backend (mantener privada)

### 3. Configurar Variables de Entorno

Actualiza tu archivo `.env.local` con las credenciales:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# Database URL para microservicios
DATABASE_URL=postgresql://postgres:tu_password@db.tu-proyecto-id.supabase.co:5432/postgres
```

## 📊 Esquemas de Base de Datos

### Tabla: customers
```sql
-- Crear tabla de clientes
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Tabla: cart_items
```sql
-- Crear tabla de items del carrito
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500),
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint para evitar duplicados del mismo producto por usuario
  UNIQUE(customer_id, product_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Trigger para cart_items
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Tabla: orders
```sql
-- Crear tabla de órdenes
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
  items_count INTEGER NOT NULL CHECK (items_count > 0),
  
  -- Información del cliente al momento de la orden (snapshot)
  customer_info JSONB NOT NULL,
  
  -- Dirección de envío
  shipping_address JSONB,
  
  -- Dirección de facturación
  billing_address JSONB,
  
  -- Información de pago (simulada)
  payment_info JSONB,
  
  -- Notas adicionales
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generar número de orden automáticamente
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || 
                       LPAD(EXTRACT(EPOCH FROM NEW.created_at)::TEXT, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- Índices
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Trigger para orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Tabla: order_items
```sql
-- Crear tabla de items de orden (detalle de productos en cada orden)
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_description TEXT,
  product_image VARCHAR(500),
  category VARCHAR(100),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price > 0),
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
```

## 🔐 Políticas de Seguridad (Row Level Security)

### Habilitar RLS en todas las tablas
```sql
-- Habilitar Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
```

### Políticas para customers
```sql
-- Los usuarios solo pueden ver y modificar sus propios datos
CREATE POLICY "Users can view own data" ON customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON customers
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON customers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own data" ON customers
  FOR DELETE USING (auth.uid() = id);
```

### Políticas para cart_items
```sql
-- Los usuarios solo pueden acceder a su propio carrito
CREATE POLICY "Users can view own cart" ON cart_items
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can insert to own cart" ON cart_items
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can update own cart" ON cart_items
  FOR UPDATE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can delete from own cart" ON cart_items
  FOR DELETE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );
```

### Políticas para orders
```sql
-- Los usuarios solo pueden ver sus propias órdenes
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

-- Solo lectura para updates (cambios de estado serían manejados por admin)
CREATE POLICY "Users can view order updates" ON orders
  FOR UPDATE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );
```

### Políticas para order_items
```sql
-- Los usuarios pueden ver items de sus propias órdenes
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (
        SELECT id FROM customers WHERE auth.uid() = id
      )
    )
  );

CREATE POLICY "Users can insert order items" ON order_items
  FOR INSERT WITH CHECK (
    order_id IN (
      SELECT id FROM orders WHERE customer_id IN (
        SELECT id FROM customers WHERE auth.uid() = id
      )
    )
  );
```

## 🚀 Script de Inicialización

Ejecuta este script completo en el **SQL Editor** de Supabase:

```sql
-- ================================
-- UNAH-Shop Database Setup Script
-- ================================

-- 1. Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Función para generar número de orden
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || 
                       LPAD(EXTRACT(EPOCH FROM NEW.created_at)::TEXT, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Crear todas las tablas
-- (Insertar aquí todos los CREATE TABLE statements de arriba)

-- 5. Habilitar RLS
-- (Insertar aquí todos los ALTER TABLE ENABLE RLS)

-- 6. Crear políticas de seguridad
-- (Insertar aquí todas las políticas CREATE POLICY)

-- 7. Insertar datos de prueba (opcional)
INSERT INTO customers (id, email, first_name, last_name, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'juan.perez@unah.hn', 'Juan', 'Pérez', '+504 9999-9999'),
  ('550e8400-e29b-41d4-a716-446655440001', 'maria.lopez@unah.hn', 'María', 'López', '+504 8888-8888'),
  ('550e8400-e29b-41d4-a716-446655440002', 'carlos.rodriguez@unah.hn', 'Carlos', 'Rodríguez', '+504 7777-7777')
ON CONFLICT (email) DO NOTHING;

-- Mensaje de confirmación
SELECT 'Base de datos UNAH-Shop configurada exitosamente! 🎉' as status;
```

## 📖 Uso en la Aplicación

### Frontend (Next.js)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### Backend (Microservicios)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
```

## 🔍 Verificación

### Consultas de prueba
```sql
-- Verificar estructura
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar datos de prueba
SELECT COUNT(*) as total_customers FROM customers;
```

## 🛠️ Comandos Útiles

### Resetear datos (desarrollo)
```sql
-- ⚠️ Cuidado: Esto eliminará todos los datos
TRUNCATE cart_items, order_items, orders, customers RESTART IDENTITY CASCADE;
```

### Respaldo de esquema
```bash
# Exportar solo estructura
pg_dump --schema-only --no-owner --no-privileges DATABASE_URL > schema.sql

# Exportar datos también
pg_dump --no-owner --no-privileges DATABASE_URL > backup.sql
```

---

**Última actualización**: 20 de octubre de 2025
**Estado**: Listo para implementación ✅