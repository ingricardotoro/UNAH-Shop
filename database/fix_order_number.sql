-- ================================
-- Script para arreglar el generador de número de orden
-- Ejecutar este script en el SQL Editor de Supabase
-- ================================

-- 1. Primero, eliminar el trigger existente
DROP TRIGGER IF EXISTS set_order_number ON orders;

-- 2. Crear una nueva función mejorada para generar números de orden únicos
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
DECLARE
    order_count INTEGER;
    new_order_number VARCHAR(50);
BEGIN
    -- Contar órdenes del día actual
    SELECT COUNT(*) + 1 INTO order_count
    FROM orders 
    WHERE DATE(created_at) = DATE(NOW());
    
    -- Generar número único basado en fecha y contador secuencial
    new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 4, '0');
    
    -- Asegurar que sea único (en caso de concurrencia)
    WHILE EXISTS (SELECT 1 FROM orders WHERE order_number = new_order_number) LOOP
        order_count := order_count + 1;
        new_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.order_number = new_order_number;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 3. Recrear el trigger con la nueva función
CREATE TRIGGER set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION generate_order_number();

-- 4. Limpiar cualquier orden existente con customer_id null (opcional)
-- DELETE FROM orders WHERE customer_id IS NULL;

-- 5. Verificar que todo esté funcionando
SELECT 'Función de número de orden actualizada exitosamente!' as status;