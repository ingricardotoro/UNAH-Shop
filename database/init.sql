-- ================================
-- UNAH-Shop Database Setup Script
-- Ejecutar este script completo en el SQL Editor de Supabase
-- ================================

-- 1. Crear extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();  
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Función para generar número de orden automáticamente
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    NEW.order_number = 'ORD-' || TO_CHAR(NEW.created_at, 'YYYYMMDD') || '-' || 
                       LPAD(EXTRACT(EPOCH FROM NEW.created_at)::TEXT, 6, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ================================
-- TABLAS
-- ================================

-- Tabla: customers (clientes registrados)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: cart_items (items del carrito de compras)
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

-- Tabla: orders (órdenes de compra)
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

-- Tabla: order_items (detalle de productos en cada orden)
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

-- ================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- ================================

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers(created_at);

-- Índices para cart_items
CREATE INDEX IF NOT EXISTS idx_cart_items_customer_id ON cart_items(customer_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Índices para order_items
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- ================================
-- TRIGGERS
-- ================================

-- Trigger para actualizar updated_at en customers
CREATE TRIGGER update_customers_updated_at
    BEFORE UPDATE ON customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en cart_items
CREATE TRIGGER update_cart_items_updated_at
    BEFORE UPDATE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para generar order_number automáticamente
CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- Trigger para actualizar updated_at en orders
CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- ROW LEVEL SECURITY (RLS)
-- ================================

-- Habilitar RLS en todas las tablas
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ================================
-- POLÍTICAS DE SEGURIDAD
-- ================================

-- Políticas para customers
CREATE POLICY "Users can view own data" ON customers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own data" ON customers
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own data" ON customers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can delete own data" ON customers
  FOR DELETE USING (auth.uid() = id);

-- Políticas para cart_items
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

-- Políticas para orders
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

CREATE POLICY "Users can view order updates" ON orders
  FOR UPDATE USING (
    customer_id IN (
      SELECT id FROM customers WHERE auth.uid() = id
    )
  );

-- Políticas para order_items
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

-- ================================
-- DATOS DE PRUEBA (OPCIONAL)
-- ================================

-- Insertar algunos clientes de prueba
INSERT INTO customers (id, email, first_name, last_name, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 'juan.perez@unah.hn', 'Juan', 'Pérez', '+504 9999-9999'),
  ('550e8400-e29b-41d4-a716-446655440001', 'maria.lopez@unah.hn', 'María', 'López', '+504 8888-8888'),
  ('550e8400-e29b-41d4-a716-446655440002', 'carlos.rodriguez@unah.hn', 'Carlos', 'Rodríguez', '+504 7777-7777')
ON CONFLICT (email) DO NOTHING;

-- Insertar algunos items de carrito de prueba
INSERT INTO cart_items (customer_id, product_id, product_name, product_image, quantity, unit_price) VALUES
  ('550e8400-e29b-41d4-a716-446655440000', 1, 'Fjallraven - Foldsack No. 1 Backpack', 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg', 2, 109.95),
  ('550e8400-e29b-41d4-a716-446655440000', 2, 'Mens Casual Premium Slim Fit T-Shirts', 'https://fakestoreapi.com/img/71-3HjGNDUL._AC_SY879._SX._UX._SY._UY_.jpg', 1, 22.30),
  ('550e8400-e29b-41d4-a716-446655440001', 3, 'Mens Cotton Jacket', 'https://fakestoreapi.com/img/71li-ujtlUL._AC_UX679_.jpg', 1, 55.99)
ON CONFLICT (customer_id, product_id) DO NOTHING;

-- ================================
-- VERIFICACIÓN
-- ================================

-- Verificar que todo se creó correctamente
SELECT 
  'Configuración completada exitosamente! 🎉' as status,
  COUNT(*) as total_customers 
FROM customers;

-- Mostrar estructura de tablas creadas
SELECT 
  table_name,
  COUNT(*) as columns_count
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('customers', 'cart_items', 'orders', 'order_items')
GROUP BY table_name
ORDER BY table_name;

-- Mostrar políticas RLS creadas
SELECT 
  tablename,
  COUNT(*) as policies_count
FROM pg_policies 
WHERE schemaname = 'public' 
GROUP BY tablename
ORDER BY tablename;