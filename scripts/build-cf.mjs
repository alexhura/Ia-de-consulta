import { build } from 'esbuild';

// Banner: expone un "require" funcional (vía createRequire) para los
// requires dinámicos residuales de dependencias CJS dentro de workerd.
const BANNER = [
  "import { createRequire as __createRequire } from 'node:module';",
  'var require = __createRequire((import.meta && import.meta.url) || \'file:///\');',
  ''
].join('\n');

await build({
  entryPoints: ['src/worker.js'],
  bundle: true,
  format: 'esm',
  platform: 'node',
  target: 'es2022',
  outfile: 'public/_worker.js',
  banner: { js: BANNER },
  external: [
    'cloudflare:*',
    'node:*',
    'dotenv',
    'ws',
    'bufferutil',
    'utf-8-validate'
  ],
  supported: {
    // Respeta los imports con prefijo "node:" ya escritos en el código.
    'node-colon-prefix-import': true
  },
  sourcemap: false,
  logLevel: 'info'
});

console.log('✅ Worker generado en public/_worker.js');