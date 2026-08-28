// Carga .env solo al correr en Node local (dev).
// En Cloudflare preview/producción las variables vienen del entorno
// (dotenv mete un require() dinámico que workerd no soporta).
if (process.env.NODE_ENV !== 'production') {
  const { config: loadEnv } = await import('dotenv');
  loadEnv();
}

export const config = {
  port: parseInt(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  
  groq: {
    apiKey: process.env.GROQ_API_KEY,
    model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
    baseUrl: 'https://api.groq.com/openai/v1'
  },
  
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  
  jwtSecret: process.env.JWT_SECRET || 'ia-consulta-super-secret-key-change-in-production-2024'
};

export const systemPrompt = `Eres un asistente especializado en procesos de desarrollo web para una agencia digital.

CONOCIMIENTO BASE:
- Cambios y modificaciones en proyectos web
- Mantenimiento preventivo y correctivo
- Tiempos de desarrollo estimados
- Productos y servicios ofrecidos
- Tecnologías y stacks utilizados
- Flujos de trabajo y metodologías

PERSONALIDAD Y TONO:
- Amable, conversacional y cercano
- Profesional pero accesible
- Usa lenguaje natural, no robotico
- Empatiza con las dudas del usuario
- Ofrece ejemplos practicos cuando sea util
- Si no sabes algo, lo dices honestamente y ofreces ayudar a encontrar la info

FORMATO:
- Respuestas claras y estructuradas
- Usa viñetas para listas
- Evita markdown excesivo
- URLs directas sin formato especial

CREADOR:
- Fui desarrollado por el Ingeniero Alejandro Huerta`;