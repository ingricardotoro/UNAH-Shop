-- ================================
-- Agregar soporte para carritos por sesión
-- ================================

-- Agregar columna session_id a cart_items
ALTER TABLE cart_items 
ADD COLUMN IF NOT EXISTS session_id VARCHAR(255);

-- Modificar constraint para permitir customer_id NULL cuando hay session_id
ALTER TABLE cart_items 
ALTER COLUMN customer_id DROP NOT NULL;

-- Crear constraint para asegurar que hay customer_id O session_id
ALTER TABLE cart_items 
ADD CONSTRAINT check_customer_or_session 
CHECK (
  (customer_id IS NOT NULL AND session_id IS NULL) OR 
  (customer_id IS NULL AND session_id IS NOT NULL)
);

-- Modificar constraint único para incluir session_id
ALTER TABLE cart_items 
DROP CONSTRAINT cart_items_customer_id_product_id_key;

-- Crear nuevo constraint único para customer_id + product_id
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_customer_product_unique 
UNIQUE (customer_id, product_id) DEFERRABLE INITIALLY DEFERRED;

-- Crear constraint único para session_id + product_id
ALTER TABLE cart_items 
ADD CONSTRAINT cart_items_session_product_unique 
UNIQUE (session_id, product_id) DEFERRABLE INITIALLY DEFERRED;

-- Crear índice para session_id
CREATE INDEX IF NOT EXISTS idx_cart_items_session_id ON cart_items(session_id);

-- Actualizar políticas RLS para incluir session_id
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert to own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete from own cart" ON cart_items;

-- Políticas más permisivas para desarrollo (en producción se deben restringir más)
CREATE POLICY "Allow cart operations" ON cart_items FOR ALL USING (true);

-- Verificar que los cambios se aplicaron correctamente
SELECT 
  'Session support added successfully! 🎉' as status,
  COUNT(*) as total_cart_items 
FROM cart_items;

-- Mostrar estructura actualizada
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'cart_items' 
  AND table_schema = 'public'
ORDER BY ordinal_position;