// Script para mostrar la información de conexión a Supabase
require('dotenv').config();

console.log('=== INFORMACIÓN DE SUPABASE ===');
console.log('URL:', process.env.SUPABASE_URL);
console.log('ANON KEY:', process.env.SUPABASE_ANON_KEY ? 'Configurada ✅' : 'No configurada ❌');
console.log('SERVICE ROLE KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada ✅' : 'No configurada ❌');

console.log('\n=== INSTRUCCIONES ===');
console.log('1. Ve a tu dashboard de Supabase');
console.log('2. Proyecto → Settings → API');
console.log('3. Busca "service_role" key (Secret) en la sección Project API keys');
console.log('4. Copia esa clave y agrégala al archivo .env como:');
console.log('   SUPABASE_SERVICE_ROLE_KEY=tu_clave_service_role_aqui');
console.log('\n5. O ejecuta el SQL en disable-rls-dev.sql para deshabilitar RLS temporalmente');

console.log('\n=== ESTRUCTURA ESPERADA DEL .env ===');
console.log(`SUPABASE_URL=${process.env.SUPABASE_URL}`);
console.log(`SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}`);
console.log('SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...(tu_clave_real)');