// Entry point de Cloudflare Workers + Static Assets.
// server.js ya ejecuta app.listen(config.port) al importarse;
// aquí conectamos Express al runtime de Workers con cloudflare:node.
import { httpServerHandler } from 'cloudflare:node';
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

const expressHandler = httpServerHandler({ port: config.port });

// En algunos runtimes httpServerHandler devuelve una función fetch handler;
// en otros un objeto con la propiedad fetch. Soportamos ambos.
function callExpress(request, env, ctx) {
  return typeof expressHandler === 'function'
    ? expressHandler(request, env, ctx)
    : expressHandler.fetch(request, env, ctx);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (!url.pathname.startsWith('/api')) {
      return env.ASSETS.fetch(request);
    }

    try {
      if (url.pathname !== '/api/health') {
        await ensureReady();
      }
      return callExpress(request, env, ctx);
    } catch (error) {
      console.error('[worker] Error:', error && error.stack ? error.stack : String(error));
      return json(500, { success: false, error: (error && error.message) || String(error) });
    }
  }
};