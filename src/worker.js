// Entry point de Cloudflare Workers/Pages.
// server.js ya ejecuta app.listen(config.port) al importarse;
// aquí lo conectamos al runtime de Workers con httpServerHandler.
import { httpServerHandler } from 'cloudflare:node';
import { config } from '../config/index.js';
import { app, bootstrap } from '../server.js';

const expressHandler = httpServerHandler({ port: config.port });

// En algunos runtimes httpServerHandler devuelve una función fetch handler;
// en otros un objeto con la propiedad fetch. Soportamos ambos.
function callExpress(request, env, ctx) {
  return typeof expressHandler === 'function'
    ? expressHandler(request, env, ctx)
    : expressHandler.fetch(request, env, ctx);
}

// Los workers no permiten I/O asíncrono en scope global, así que la
// inicialización de Supabase se hace de forma perezosa en el primer request.
let initPromise = null;
function ensureReady() {
  if (!initPromise) {
    initPromise = bootstrap().catch((error) => {
      console.error('❌ Fallo en initDatabase del Worker:', error.message);
      initPromise = null;
      throw error;
    });
  }
  return initPromise;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API: la maneja Express. Todo lo demás lo sirve Pages como estático.
    if (url.pathname.startsWith('/api')) {
      await ensureReady();
      return callExpress(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  }
};