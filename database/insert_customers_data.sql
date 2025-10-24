-- ================================
-- Script para insertar datos de prueba de customers
-- Ejecutar este script en el SQL Editor de Supabase
-- ================================

-- Insertar 20 customers adicionales con datos variados
INSERT INTO customers (id, email, first_name, last_name, phone, created_at, updated_at) VALUES
-- Customers con nombres hondureños comunes
('550e8400-e29b-41d4-a716-446655440002', 'ana.garcia@unah.edu.hn', 'Ana', 'García', '+504 9999-1111', '2024-01-15 10:30:00', '2024-01-15 10:30:00'),
('550e8400-e29b-41d4-a716-446655440003', 'carlos.lopez@gmail.com', 'Carlos', 'López', '+504 8877-2222', '2024-02-20 14:15:00', '2024-02-20 14:15:00'),
('550e8400-e29b-41d4-a716-446655440004', 'maria.rodriguez@hotmail.com', 'María', 'Rodríguez', '+504 7766-3333', '2024-03-10 09:45:00', '2024-03-10 09:45:00'),
('550e8400-e29b-41d4-a716-446655440005', 'jose.martinez@yahoo.com', 'José', 'Martínez', '+504 6655-4444', '2024-03-25 16:20:00', '2024-03-25 16:20:00'),
('550e8400-e29b-41d4-a716-446655440006', 'sofia.hernandez@unah.edu.hn', 'Sofía', 'Hernández', '+504 5544-5555', '2024-04-05 11:10:00', '2024-04-05 11:10:00'),

-- Customers de diferentes ciudades
('550e8400-e29b-41d4-a716-446655440007', 'pedro.gonzalez@gmail.com', 'Pedro', 'González', '+504 4433-6666', '2024-04-18 13:25:00', '2024-04-18 13:25:00'),
('550e8400-e29b-41d4-a716-446655440008', 'lucia.flores@hotmail.com', 'Lucía', 'Flores', '+504 3322-7777', '2024-05-02 08:50:00', '2024-05-02 08:50:00'),
('550e8400-e29b-41d4-a716-446655440009', 'miguel.santos@yahoo.com', 'Miguel', 'Santos', '+504 2211-8888', '2024-05-15 17:30:00', '2024-05-15 17:30:00'),
('550e8400-e29b-41d4-a716-446655440010', 'carmen.morales@gmail.com', 'Carmen', 'Morales', '+504 1100-9999', '2024-06-01 12:40:00', '2024-06-01 12:40:00'),
('550e8400-e29b-41d4-a716-446655440011', 'ricardo.vargas@unah.edu.hn', 'Ricardo', 'Vargas', '+504 9988-0000', '2024-06-20 15:15:00', '2024-06-20 15:15:00'),

-- Customers más recientes
('550e8400-e29b-41d4-a716-446655440012', 'elena.castro@hotmail.com', 'Elena', 'Castro', '+504 8877-1111', '2024-07-08 10:20:00', '2024-07-08 10:20:00'),
('550e8400-e29b-41d4-a716-446655440013', 'fernando.ramos@gmail.com', 'Fernando', 'Ramos', '+504 7766-2222', '2024-07-25 14:55:00', '2024-07-25 14:55:00'),
('550e8400-e29b-41d4-a716-446655440014', 'isabel.jimenez@yahoo.com', 'Isabel', 'Jiménez', '+504 6655-3333', '2024-08-10 09:30:00', '2024-08-10 09:30:00'),
('550e8400-e29b-41d4-a716-446655440015', 'antonio.medina@unah.edu.hn', 'Antonio', 'Medina', '+504 5544-4444', '2024-08-28 16:45:00', '2024-08-28 16:45:00'),
('550e8400-e29b-41d4-a716-446655440016', 'patricia.cruz@gmail.com', 'Patricia', 'Cruz', '+504 4433-5555', '2024-09-12 11:25:00', '2024-09-12 11:25:00'),

-- Customers muy recientes (últimos 2 meses)
('550e8400-e29b-41d4-a716-446655440017', 'rafael.torres@hotmail.com', 'Rafael', 'Torres', '+504 3322-6666', '2024-09-30 13:10:00', '2024-09-30 13:10:00'),
('550e8400-e29b-41d4-a716-446655440018', 'gabriela.silva@yahoo.com', 'Gabriela', 'Silva', '+504 2211-7777', '2024-10-05 08:40:00', '2024-10-05 08:40:00'),
('550e8400-e29b-41d4-a716-446655440019', 'diego.mendez@gmail.com', 'Diego', 'Méndez', '+504 1100-8888', '2024-10-15 17:20:00', '2024-10-15 17:20:00'),
('550e8400-e29b-41d4-a716-446655440020', 'valeria.ortiz@unah.edu.hn', 'Valeria', 'Ortiz', '+504 9900-9999', '2024-10-18 14:35:00', '2024-10-18 14:35:00'),
('550e8400-e29b-41d4-a716-446655440021', 'alejandro.ruiz@hotmail.com', 'Alejandro', 'Ruiz', '+504 8899-0000', '2024-10-20 12:15:00', '2024-10-20 12:15:00');

-- Verificar la inserción
SELECT 
    COUNT(*) as total_customers,
    COUNT(CASE WHEN created_at >= '2024-10-01' THEN 1 END) as customers_this_month,
    COUNT(CASE WHEN created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as customers_last_30_days
FROM customers;

-- Mostrar algunos de los nuevos customers insertados
SELECT 
    id, 
    first_name, 
    last_name, 
    email, 
    phone,
    created_at
FROM customers 
ORDER BY created_at DESC 
LIMIT 10;

-- ================================
-- Script completado exitosamente
-- Total de 20 nuevos customers agregados
-- ================================