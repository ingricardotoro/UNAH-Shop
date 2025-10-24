require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configuración de Supabase faltante');
  console.error(
    'Asegúrate de configurar SUPABASE_URL y SUPABASE_ANON_KEY en .env'
  );
  process.exit(1);
}

// Solo usar SERVICE_ROLE_KEY si está disponible Y es válida (longitud correcta)
// IMPORTANTE: no subir la service_role key a repositorios públicos.
const isServiceRoleValid = supabaseServiceRoleKey && supabaseServiceRoleKey.length > 100;
const keyToUse = isServiceRoleValid ? supabaseServiceRoleKey : supabaseAnonKey;
const keyType = isServiceRoleValid ? 'service_role' : 'anon';

console.log(`Using Supabase key type: ${keyType}`);

const supabase = createClient(supabaseUrl, keyToUse);

// Test de conexión
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error de conexión a Supabase:', error.message);
      return false;
    }

    console.log('✅ Conexión a Supabase exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error al probar conexión:', error.message);
    return false;
  }
};

module.exports = {
  supabase,
  testConnection,
};
