-- ================================
-- CONSULTAS ÚTILES PARA DESARROLLO
-- UNAH-Shop Database
-- ================================

-- ================================
-- CONSULTAS DE VERIFICACIÓN
-- ================================

-- Ver estructura de todas las tablas
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('customers', 'cart_items', 'orders', 'order_items')
ORDER BY table_name, ordinal_position;

-- Ver todas las políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Ver todos los índices creados
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'cart_items', 'orders', 'order_items')
ORDER BY tablename, indexname;

-- Ver todos los triggers
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ================================
-- CONSULTAS DE DATOS
-- ================================

-- Ver todos los clientes con su información básica
SELECT 
  id,
  email,
  first_name || ' ' || last_name as full_name,
  phone,
  created_at
FROM customers
ORDER BY created_at DESC;

-- Ver carrito de cada cliente con totales
SELECT 
  c.first_name || ' ' || c.last_name as customer_name,
  c.email,
  COUNT(ci.id) as items_in_cart,
  SUM(ci.total_price) as cart_total
FROM customers c
LEFT JOIN cart_items ci ON c.id = ci.customer_id
GROUP BY c.id, c.first_name, c.last_name, c.email
ORDER BY cart_total DESC NULLS LAST;

-- Ver detalles del carrito por cliente
SELECT 
  c.first_name || ' ' || c.last_name as customer_name,
  ci.product_name,
  ci.quantity,
  ci.unit_price,
  ci.total_price,
  ci.created_at
FROM customers c
JOIN cart_items ci ON c.id = ci.customer_id
ORDER BY c.first_name, ci.created_at;

-- Ver todas las órdenes con información del cliente
SELECT 
  o.order_number,
  o.status,
  c.first_name || ' ' || c.last_name as customer_name,
  o.total_amount,
  o.items_count,
  o.created_at
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
ORDER BY o.created_at DESC;

-- Ver detalles de items por orden
SELECT 
  o.order_number,
  o.status,
  oi.product_name,
  oi.quantity,
  oi.unit_price,
  oi.total_price
FROM orders o
JOIN order_items oi ON o.id = oi.order_id
ORDER BY o.created_at DESC, oi.product_name;

-- ================================
-- CONSULTAS DE ESTADÍSTICAS
-- ================================

-- Estadísticas generales
SELECT 
  'Customers' as table_name,
  COUNT(*) as total_records
FROM customers
UNION ALL
SELECT 
  'Cart Items' as table_name,
  COUNT(*) as total_records
FROM cart_items
UNION ALL
SELECT 
  'Orders' as table_name,
  COUNT(*) as total_records
FROM orders  
UNION ALL
SELECT 
  'Order Items' as table_name,
  COUNT(*) as total_records
FROM order_items;

-- Top productos en carritos
SELECT 
  product_id,
  product_name,
  COUNT(*) as times_added_to_cart,
  SUM(quantity) as total_quantity,
  AVG(unit_price) as avg_price,
  SUM(total_price) as total_value
FROM cart_items
GROUP BY product_id, product_name
ORDER BY times_added_to_cart DESC, total_quantity DESC;

-- Top productos vendidos (en órdenes)
SELECT 
  product_id,
  product_name,
  COUNT(*) as times_ordered,
  SUM(quantity) as total_sold,
  AVG(unit_price) as avg_price,
  SUM(total_price) as total_revenue
FROM order_items
GROUP BY product_id, product_name
ORDER BY total_sold DESC, total_revenue DESC;

-- Órdenes por estado
SELECT 
  status,
  COUNT(*) as order_count,
  SUM(total_amount) as total_revenue,
  AVG(total_amount) as avg_order_value
FROM orders
GROUP BY status
ORDER BY order_count DESC;

-- Actividad por mes
SELECT 
  DATE_TRUNC('month', created_at) as month,
  COUNT(*) as orders_count,
  SUM(total_amount) as monthly_revenue
FROM orders
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ================================
-- CONSULTAS PARA TESTING/DEBUG
-- ================================

-- Ver el carrito de un cliente específico
SELECT 
  ci.product_name,
  ci.quantity,
  ci.unit_price,
  ci.total_price,
  ci.created_at
FROM cart_items ci
JOIN customers c ON ci.customer_id = c.id
WHERE c.email = 'juan.perez@unah.hn'
ORDER BY ci.created_at;

-- Ver órdenes de un cliente específico
SELECT 
  o.order_number,
  o.status,
  o.total_amount,
  o.items_count,
  o.created_at,
  STRING_AGG(oi.product_name, ', ') as products
FROM orders o
JOIN customers c ON o.customer_id = c.id
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE c.email = 'juan.perez@unah.hn'
GROUP BY o.id, o.order_number, o.status, o.total_amount, o.items_count, o.created_at
ORDER BY o.created_at DESC;

-- Verificar integridad referencial
SELECT 
  'Orphaned cart items' as issue,
  COUNT(*) as count
FROM cart_items ci
LEFT JOIN customers c ON ci.customer_id = c.id
WHERE c.id IS NULL
UNION ALL
SELECT 
  'Orphaned order items' as issue,
  COUNT(*) as count
FROM order_items oi
LEFT JOIN orders o ON oi.order_id = o.id
WHERE o.id IS NULL;

-- ================================
-- CONSULTAS DE LIMPIEZA (DESARROLLO)
-- ================================

-- Limpiar carrito de un usuario específico
-- DELETE FROM cart_items 
-- WHERE customer_id = (SELECT id FROM customers WHERE email = 'test@example.com');

-- Limpiar todas las órdenes de prueba
-- DELETE FROM order_items WHERE order_id IN (
--   SELECT id FROM orders WHERE order_number LIKE 'TEST-%'
-- );
-- DELETE FROM orders WHERE order_number LIKE 'TEST-%';

-- Limpiar todos los datos (PELIGROSO - solo para desarrollo)
-- TRUNCATE cart_items, order_items, orders, customers RESTART IDENTITY CASCADE;

-- ================================
-- CONSULTAS DE PERFORMANCE
-- ================================

-- Ver uso de índices
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_tup_read DESC;

-- Ver consultas lentas (requiere configuración específica)
-- SELECT query, mean_time, calls, total_time
-- FROM pg_stat_statements
-- WHERE query LIKE '%customers%' OR query LIKE '%cart_items%' OR query LIKE '%orders%'
-- ORDER BY mean_time DESC;

-- Analizar tamaño de tablas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('customers', 'cart_items', 'orders', 'order_items')
ORDER BY size_bytes DESC;

-- ================================
-- CONSULTAS PARA REPORTES
-- ================================

-- Reporte de ventas diario
SELECT 
  DATE(created_at) as date,
  COUNT(*) as orders_count,
  SUM(total_amount) as daily_revenue,
  AVG(total_amount) as avg_order_value,
  SUM(items_count) as total_items_sold
FROM orders
WHERE status IN ('delivered', 'shipped')
  AND created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Reporte de productos más vendidos
SELECT 
  oi.product_name,
  oi.category,
  COUNT(DISTINCT oi.order_id) as orders_count,
  SUM(oi.quantity) as total_quantity,
  SUM(oi.total_price) as total_revenue,
  AVG(oi.unit_price) as avg_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status IN ('delivered', 'shipped')
  AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY oi.product_id, oi.product_name, oi.category
ORDER BY total_revenue DESC
LIMIT 10;

-- Reporte de clientes más activos
SELECT 
  c.first_name || ' ' || c.last_name as customer_name,
  c.email,
  COUNT(o.id) as total_orders,
  SUM(o.total_amount) as total_spent,
  AVG(o.total_amount) as avg_order_value,
  MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.id = o.customer_id
WHERE o.status IN ('delivered', 'shipped')
GROUP BY c.id, c.first_name, c.last_name, c.email
HAVING COUNT(o.id) > 0
ORDER BY total_spent DESC, total_orders DESC
LIMIT 10;