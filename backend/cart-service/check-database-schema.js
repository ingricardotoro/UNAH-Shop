const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Verificando esquema de la tabla cart_items...');
    
    // Obtener un registro para ver qué columnas tiene
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error al consultar la tabla:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Estructura de un registro de cart_items:');
      console.log('Columnas disponibles:', Object.keys(data[0]));
      console.log('Registro completo:', data[0]);
    } else {
      console.log('⚠️ No hay registros en la tabla cart_items');
    }

    // También intentar hacer una consulta específica para product_image
    const { data: testData, error: testError } = await supabase
      .from('cart_items')
      .select('id, product_id, product_name, product_image')
      .limit(3);

    if (testError) {
      console.error('❌ Error al consultar product_image:', testError);
    } else {
      console.log('🖼️ Datos de product_image:', testData);
    }

  } catch (error) {
    console.error('💥 Error general:', error);
  }
}

checkDatabaseSchema();