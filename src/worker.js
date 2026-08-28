// Entry point de Cloudflare Workers/Pages.
// server.js ya ejecuta app.listen(config.port) al importarse;
// aquí conectamos Express al runtime de Workers con cloudflare:node.
import { config } from '../config/index.js';
import { app, bootstrap } from '../server.js';

const json = (status, obj) => new Response(JSON.stringify(obj), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8' }
});

// Los workers no permiten I/O asíncrono en scope global, así que la
// inicialización de Supabase se hace de forma perezosa en el primer request.
// Si falla, no bloqueamos: Express responderá el error de cada ruta.
let initPromise = null;
function ensureReady() {
  if (!initPromise) {
    initPromise = bootstrap().catch((error) => {
      console.error('❌ Fallo en initDatabase del Worker:', error.message);
      initPromise = null;
    });
  }
  return initPromise;
}

// Import 'cloudflare:node' de forma perezosa: si los compat flags no están
// configurados en el proyecto Pages, capturamos el error y respondemos JSON
// en vez de un 500 vacío.
let handlerPromise = null;
function getExpressHandler() {
  if (!handlerPromise) {
    handlerPromise = (async () => {
      const { httpServerHandler } = await import('cloudflare:node');
      const handler = httpServerHandler({ port: config.port });
      return typeof handler === 'function' ? handler : handler.fetch;
    })();
  }
  return handlerPromise;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api')) {
      return env.ASSETS.fetch(request);
    }

    try {
      const handle = await getExpressHandler();
      if (url.pathname === '/api/health') {
        return handle(request, env, ctx);
      }
      await ensureReady();
      return handle(request, env, ctx);
    } catch (error) {
      console.error('[worker] Error:', error && error.stack ? error.stack : String(error));
      return json(500, { success: false, error: (error && error.message) || String(error) });
    }
  }
};