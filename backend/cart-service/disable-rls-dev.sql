-- SQL para deshabilitar temporalmente RLS en cart_items (SOLO PARA DESARROLLO)
-- Ejecuta esto en el editor SQL de Supabase para permitir inserciones con anon key

-- Ver las políticas actuales
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'cart_items';

-- Deshabilitar RLS temporalmente (SOLO PARA DESARROLLO)
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;

-- Para re-habilitar RLS más tarde (cuando tengas las políticas correctas):
-- ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Ver el estado actual de RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'cart_items';