import { build } from 'esbuild';

await build({
  entryPoints: ['src/worker.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  outfile: 'public/_worker.js',
  external: [
    'cloudflare:*',
    'node:*',
    'ws',
    'bufferutil',
    'utf-8-validate'
  ],
  sourcemap: false,
  logLevel: 'info'
});

console.log('✅ Worker generado en public/_worker.js');