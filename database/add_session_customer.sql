-- Insertar cliente de prueba para sesiones
INSERT INTO customers (id, email, first_name, last_name, phone) VALUES
  ('550e8400-e29b-41d4-a716-446655440003', 'session_demo_001@test.local', 'Session', 'Demo', '+504 0000-0000')
ON CONFLICT (email) DO NOTHING;

-- Verificar inserción
SELECT * FROM customers WHERE email = 'session_demo_001@test.local';