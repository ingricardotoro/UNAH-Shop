require('dotenv').config();
const { supabase } = require('./src/config/database');

const testCustomerId = '550e8400-e29b-41d4-a716-446655440001';

const sampleData = [
  {
    customer_id: testCustomerId,
    product_id: 1,
    product_name: 'Fjallraven - Foldsack No. 1 Backpack',
    quantity: 2,
    unit_price: 109.95
  },
  {
    customer_id: testCustomerId,
    product_id: 2, 
    product_name: 'Mens Casual Premium Slim Fit T-Shirts',
    quantity: 1,
    unit_price: 22.30
  },
  {
    customer_id: testCustomerId,
    product_id: 3,
    product_name: 'Mens Cotton Jacket',
    quantity: 1,
    unit_price: 55.99
  }
];

async function seedTestData() {
  try {
    console.log('🌱 Agregando datos de prueba a cart_items...');
    
    // Primero, limpiar datos existentes del customer
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('customer_id', testCustomerId);
    
    if (deleteError) {
      console.log('⚠️  Error limpiando datos existentes:', deleteError.message);
    }

    // Insertar nuevos datos
    const { data, error } = await supabase
      .from('cart_items')
      .insert(sampleData)
      .select();

    if (error) {
      console.error('❌ Error insertando datos:', error);
      return;
    }

    console.log('✅ Datos de prueba insertados exitosamente:');
    console.log(`   - ${data.length} items agregados`);
    console.log(`   - Customer ID: ${testCustomerId}`);
    
    data.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.product_name} (x${item.quantity}) - $${item.total_price}`);
    });

    // Verificar que se pueden consultar
    const { data: verification, error: verifyError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('customer_id', testCustomerId);

    if (verifyError) {
      console.error('❌ Error verificando datos:', verifyError);
      return;
    }

    console.log(`\n🔍 Verificación: ${verification.length} items encontrados en la base de datos`);
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedTestData()
    .then(() => {
      console.log('\n🎉 Proceso completado. Ahora puedes probar el frontend.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Error fatal:', error);
      process.exit(1);
    });
}

module.exports = { seedTestData };