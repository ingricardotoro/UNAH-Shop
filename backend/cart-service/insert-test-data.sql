-- SQL para agregar datos de prueba a la tabla cart_items
-- Ejecuta este script en el editor SQL de Supabase

-- Primero, limpiar datos existentes para el customer
DELETE FROM cart_items WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';

-- Insertar datos de prueba
INSERT INTO cart_items (customer_id, product_id, product_name, quantity, unit_price) 
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', 1, 'Fjallraven - Foldsack No. 1 Backpack', 2, 109.95),
  ('550e8400-e29b-41d4-a716-446655440001', 2, 'Mens Casual Premium Slim Fit T-Shirts', 1, 22.30),
  ('550e8400-e29b-41d4-a716-446655440001', 3, 'Mens Cotton Jacket', 1, 55.99);

-- Verificar que se insertaron correctamente
SELECT * FROM cart_items WHERE customer_id = '550e8400-e29b-41d4-a716-446655440001';