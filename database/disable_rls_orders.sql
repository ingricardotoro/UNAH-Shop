-- ================================
-- Script para desactivar RLS temporalmente en orders y order_items
-- Ejecutar este script en el SQL Editor de Supabase
-- ================================

-- Desactivar RLS para orders
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS para order_items  
ALTER TABLE order_items DISABLE ROW LEVEL SECURITY;

-- Verificar que se desactivó correctamente
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('orders', 'order_items');