// Analiza un sitio web por su URL para identificar si está construido con
// WordPress, HTML puro u otro CMS/constructor, y emitir un veredicto de si es
// apto para tomar/migrar a nuestros servidores.

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// Firmas por plataforma (se buscan en el HTML de la página).
const SIGNATURES = {
  wordpress: [
    /wp-content\//i,
    /wp-includes\//i,
    /wp-json/i,
    /wp-login\.php/i,
    /wp-admin/i,
    /wordpress\.org/i,
    /<meta name="generator" content="WordPress/i,
    /wordpress\.com/i
  ],
  wix: [
    /wixstatic\.com/i,
    /\.wix\.com/i,
    /wixsite\.com/i,
    /Wix\.com Website Builder/i,
    /_wixClient/i,
    /wix-warmup/i
  ],
  squarespace: [
    /assets\.squarespace/i,
    /static[0-9]*\.squarespace/i,
    /squarespace\.com/i,
    /<meta name="generator" content="Squarespace/i
  ],
  odoo: [
    /web\.assets/i,
    /\/web\/login/i,
    /@odoo-module/i,
    /odoodb/i,
    /odoo\.js/i
  ],
  shopify: [
    /cdn\.shopify\.com/i,
    /myshopify\.com/i,
    /\/cdn\/shop/i,
    /shopify/i,
    /option_selection\.js/i
  ],
  webflow: [
    /website-files\.com/i,
    /webflow\.js/i,
    /webflow/i
  ],
  blogger: [
    /blogspot\.com/i,
    /blog\.blogspot/i
  ],
  weebly: [
    /weebly\.com/i,
    /weebly\.cloudfront/i
  ],
  godaddy: [
    /godaddysites\.com/i,
    /GoDaddy/i
  ],
  drupal: [
    /sites\/default\/files/i,
    /\/sites\/all\//i,
    /drupal/i,
    /\/core\/themes\//i
  ],
  joomla: [
    /\/media\/system\/js/i,
    /\/media\/jui/i,
    /joomla/i
  ],
  prestashop: [
    /prestashop/i,
    /\/themes\/[a-z0-9_-]+\/assets/i
  ],
  magento: [
    /magento/i,
    /\/static\/version[0-9]+\//i,
    /\/static\/frontend\//i
  ],
  wixstudio: [
    /wixusercontent\.com/i
  ]
};

// Señales fuertes basadas en el dominio (subdominios de cada plataforma).
const HOST_SUFFIX = [
  [/\.wordpress\.com$/, 'wordpress'],
  [/\.wixsite\.com$/, 'wix'],
  [/\.wix\.com$/, 'wix'],
  [/\.squarespace\.com$/, 'squarespace'],
  [/\.myshopify\.com$/, 'shopify'],
  [/\.webflow\.io$/, 'webflow'],
  [/\.blogspot\.com$/, 'blogger'],
  [/\.weebly\.com$/, 'weebly'],
  [/\.godaddysites\.com$/, 'godaddy'],
  [/\.carrd\.co$/, 'carrd'],
  [/\.jimdosite\.com$/, 'jimdo'],
  [/\.site123\.me$/, 'site123'],
  [/\.simdif\.com$/, 'simdif']
];

const PRIVATE_IP =
  /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.|0\.|::1$|fd|fe8)/;

// Extrae la primera URL de un texto (http/https o www.). Normaliza y evita
// enteras IP privadas (protección básica contra SSRF).
export function extractUrl(text) {
  if (!text) return null;
  const m = text.match(/(?:https?:\/\/|www\.)[^\s<>"'\u]+\S*/i);
  if (!m) return null;
  let url = m[0].replace(/[),.;:!?}\]>"'`]+$/, '');
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  let host;
  try {
    host = new URL(url).hostname;
  } catch {
    return null;
  }
  if (host === 'localhost' || PRIVATE_IP.test(host)) return null;
  return url;
}

function scorePlatform(fullText) {
  const scores = {};
  for (const [name, pats] of Object.entries(SIGNATURES)) {
    let n = 0;
    for (const p of pats) if (p.test(fullText)) n++;
    scores[name] = n;
  }
  return scores;
}

// Veredicto humano para que la IA lo transmita tal cual.
export function verdictFor(platform) {
  if (platform === 'WordPress') {
    return {
      apta: true,
      mensaje: '✅ Sí es apta 🟢: está hecha en WordPress y se puede migrar a nuestros servidores.'
    };
  }
  if (platform === 'HTML puro o estático') {
    return {
      apta: true,
      mensaje: '✅ Sí es apta 🟢: no usa un CMS bloqueante, es HTML puro/estático y se puede tomar y trabajar normal.'
    };
  }
  return {
    apta: false,
    mensaje: `❌ No es apta 🔴: está construida con ${platform}, que no es WordPress ni HTML puro, por lo que NO se puede migrar ni trabajar desde nuestros servidores.`
  };
}

// Detecta la plataforma de una URL. Devuelve un objeto con resumen listo
// para inyectar en el contexto del chat.
export async function detectPlatform(url) {
  let hostname = '';
  try { hostname = new URL(url).hostname; } catch { hostname = ''; }

  let body = '';
  let status = 0;
  let blocked = false;
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      headers: {
        'user-agent': BROWSER_UA,
        accept: 'text/html,application/xhtml+xml,*/*',
        'accept-language': 'es,en;q=0.8'
      },
      signal: AbortSignal.timeout(15000)
    });
    status = res.status;
    const ctype = (res.headers.get('content-type') || '').toLowerCase();
    if (!ctype.includes('html')) {
      const det = {
        url, hostname,
        platform: 'No es una página HTML',
        apta: null,
        mensaje: 'La URL no devuelve una página HTML (parece un PDF, imagen u otro archivo), lo revisamos con un humano.'
      };
      return { ...det, status, summary: buildSummary(url, det.platform, det) };
    }
    body = await res.text();
  } catch (err) {
    blocked = true;
  }

  if (!body) {
    const blockedMsg = (status === 403 || status === 401)
      ? 'El sitio bloquea el análisis (protección anti-bots), no se pudo verificar.'
      : 'No se pudo acceder al sitio para analizarlo.';
    const det = { url, hostname, platform: 'No verificado', apta: null, mensaje: blockedMsg, status };
    return { ...det, summary: buildSummary(url, det.platform, det) };
  }

  const fullText = body.slice(0, 800000);
  const scores = scorePlatform(fullText);

  // Señal fuerte por dominio
  let slug = '';
  const lowerHost = hostname.toLowerCase().replace(/^www\./, '');
  for (const [rx, name] of HOST_SUFFIX) {
    if (rx.test(lowerHost)) { slug = name; break; }
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topName, topCount] = ranked[0];

  let platform = 'HTML puro o estático';
  if (slug === 'wordpress' || (topName === 'wordpress' && topCount >= 1)) {
    platform = 'WordPress';
  } else if (slug && topCount >= 0) {
    platform = PLATFORM_LABEL[slug];
  } else if (topCount >= 1) {
    platform = PLATFORM_LABEL[topName];
  }

  const verdict = verdictFor(platform);
  return { url, hostname, detected: slug || topName, platform, ...verdict, status, summary: buildSummary(url, platform, verdict) };
}

const PLATFORM_LABEL = {
  wordpress: 'WordPress',
  wix: 'Wix',
  wixstudio: 'Wix Studio',
  squarespace: 'Squarespace',
  odoo: 'Odoo',
  shopify: 'Shopify',
  webflow: 'Webflow',
  blogger: 'Blogger (Google)',
  weebly: 'Weebly',
  godaddy: 'GoDaddy Website Builder',
  drupal: 'Drupal',
  joomla: 'Joomla',
  prestashop: 'Prestashop',
  magento: 'Magento',
  carrd: 'Carrd',
  jimdo: 'Jimdo',
  site123: 'Site123',
  simdif: 'SimDif'
};

function buildSummary(url, platform, verdict) {
  const apta = verdict.apta === true ? 'APTA' : verdict.apta === false ? 'NO APTA' : 'VERIFICACIÓN PENDIENTE';
  return [
    '🔍 DETECCIÓN DE PLATAFORMA:',
    `- 🌐 URL analizada: ${url}`,
    `- 🛠️ Plataforma detectada: ${platform}`,
    `- 📊 Veredicto (${apta}): ${verdict.mensaje}`,
    '',
    'INSTRUCCIÓN DE FORMATO: esto es SOLO un escaneo. Responde de forma natural y breve (1-3 oraciones), con emojis, dando el veredicto (apta/no apta) y el motivo. NO copies el bloque textualmente ni repitas cada línea que ves aquí, y NO añadas pasos siguientes, ofertas de ayuda, recomendaciones ni preguntas de seguimiento.'
  ].join('\n');
}

// Recorta de la respuesta de la IA cualquier "paso siguiente / oferta de ayuda"
// que el modelo añada tras el veredicto (plan B si ignora la instrucción).
const OFFER_RE = /\b(Si necesitas|¿Quieres|No dudes en|Avísame|Dime si|Estamos aquí|Puedo ayudarte|Si quieres|Podemos proceder|¿Qué implica|Me comentas|Déjame saber|Escríbeme|Puedes pedir|Disponemos de|Te puedo)\b/i;
export function trimNextSteps(text) {
  if (!text) return text;
  const idx = text.search(OFFER_RE);
  if (idx === -1) return text.trim();
  return text.slice(0, idx).trim().replace(/[:\u2014\x2014-]\s*$/, '').trim();
}