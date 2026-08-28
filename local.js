// Entry para Node local (npm start / Hostinger).
// El app y app.listen están definidos en server.js (compartido con el Worker).
import { app, bootstrap } from './server.js';
import { config } from './config/index.js';

const missingEnv = [];
if (!config.groq.apiKey) missingEnv.push('GROQ_API_KEY');
if (!config.supabase.url) missingEnv.push('SUPABASE_URL');
if (!config.supabase.key) missingEnv.push('SUPABASE_API_KEY');

if (missingEnv.length > 0) {
  console.error('❌ Faltan variables de entorno requeridas:');
  missingEnv.forEach(v => console.error('   - ' + v));
  console.error('   Configúralas como variables de entorno en tu plataforma (Hostinger / Cloudflare) o en .env');
  process.exit(1);
}

try {
  await bootstrap();
  console.log('✅ Base de datos inicializada correctamente.');
} catch (error) {
  console.error('❌ No se pudo inicializar la base de datos:', error.message);
  console.error('   Revisa SUPABASE_URL y SUPABASE_API_KEY. Si es un problema de conexión, revisa los logs.');
  process.exit(1);
}

// server.js ya hizo app.listen(config.port).
console.log('🚀 Servidor local listo. app importada:', typeof app === 'function');