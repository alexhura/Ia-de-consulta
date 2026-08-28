// Entry point de Cloudflare Workers/Pages.
// server.js ya ejecuta app.listen(config.port) al importarse;
// aquí lo conectamos al runtime de Workers con httpServerHandler.
import { httpServerHandler } from 'cloudflare:node';
import { config } from '../config/index.js';
import { app } from '../server.js';

const expressHandler = httpServerHandler({ port: config.port });

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // API: la maneja Express. Todo lo demás lo sirve Pages como estático.
    if (url.pathname.startsWith('/api')) {
      return expressHandler(request, env, ctx);
    }

    return env.ASSETS.fetch(request);
  }
};