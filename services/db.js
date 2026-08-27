import pg from 'pg';
import crypto from 'crypto';
import { config } from '../config/index.js';

const { Pool } = pg;

let pool = null;

export function getPool() {
  if (!pool) {
    if (!config.db.connectionString) {
      throw new Error('DATABASE_URL no configurado. Agrega la conexión de Supabase en .env');
    }
    pool = new Pool({
      connectionString: config.db.connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 15000,
      ssl: { rejectUnauthorized: false }
    });
  }
  return pool;
}

export async function query(text, params = []) {
  const client = await getPool().connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function initDatabase() {
  const client = await getPool().connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT DEFAULT '📄',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS knowledge_items (
        id SERIAL PRIMARY KEY,
        category_id INTEGER NOT NULL REFERENCES categories(id),
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        keywords TEXT,
        priority INTEGER DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_kb_keywords ON knowledge_items(keywords);
      CREATE INDEX IF NOT EXISTS idx_kb_category ON knowledge_items(category_id);

      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_login TIMESTAMPTZ
      );
    `);

    await seedIfEmpty(client);
  } finally {
    client.release();
  }
}

async function seedIfEmpty(client) {
  const { rows } = await client.query('SELECT COUNT(*) as c FROM categories');
  if (parseInt(rows[0].c) > 0) return;

  const categories = [
    ['cambios', 'Procesos para cambios y modificaciones en proyectos web', '🔄'],
    ['mantenimiento', 'Mantenimiento preventivo y correctivo de sitios web', '🛠️'],
    ['tiempos', 'Estimaciones y tiempos de desarrollo', '⏱️'],
    ['productos', 'Productos y servicios ofrecidos', '📦'],
    ['tecnologias', 'Stacks tecnológicos y herramientas utilizadas', '💻'],
    ['flujos', 'Flujos de trabajo y metodologías', '📋']
  ];

  for (const [name, desc, icon] of categories) {
    await client.query(
      'INSERT INTO categories (name, description, icon) VALUES ($1, $2, $3) ON CONFLICT (name) DO NOTHING',
      [name, desc, icon]
    );
  }

  const items = [
    ['cambios', 'Proceso de solicitud de cambios', `Para solicitar un cambio en tu proyecto web:

1. **Registro**: Envía tu solicitud por email a cambios@agencia.com o usa el formulario en el portal del cliente
2. **Clasificación**: Evaluamos si es:
   - Cambio menor (texto, imágenes, colores) → 1-2 días hábiles
   - Cambio medio (funcionalidad, secciones) → 3-5 días hábiles
   - Cambio mayor (rediseño, nueva funcionalidad compleja) → 1-3 semanas
3. **Presupuesto**: Te enviamos cotización si aplica (cambios fuera de mantenimiento incluido)
4. **Aprobación**: Confirmas y agendamos
5. **Desarrollo y pruebas**: Implementamos en staging, tú revisas
6. **Despliegue**: Subimos a producción en horario de bajo tráfico

**Incluido en mantenimiento mensual**: Hasta 2 horas de cambios menores al mes.`, 'cambio, modificación, solicitud, proceso, menor, medio, mayor, presupuesto, mantenimiento', 10],
    ['cambios', 'Cambios urgentes / Hotfix', `Para errores críticos en producción (sitio caído, formularios que no envían, pagos fallando):

- **Tiempo de respuesta**: < 4 horas hábiles
- **Canal**: WhatsApp de emergencia + email con asunto [URGENTE]
- **Costo**: Incluido en planes Premium/Enterprise. Plan Básico: $50 USD/hora
- **Proceso**: Diagnóstico → Fix temporal → Fix definitivo → Post-mortem

No uses este canal para cambios estéticos o mejoras.`, 'urgente, hotfix, emergencia, crítico, producción, caída, error', 9],
    ['cambios', 'Cambios en contenido vs funcionalidad', `Diferencia importante para tiempos y costos:

**Contenido (rápido, suele estar en mantenimiento)**:
- Textos, copywriting
- Imágenes, banners, logos
- Colores, tipografías
- SEO meta tags
- Enlaces, botones CTA

**Funcionalidad (requiere desarrollo)**:
- Nuevos formularios / campos
- Integraciones (CRM, pagos, email marketing)
- Lógica de negocio, cálculos
- Áreas privadas, login, roles
- Reportes, dashboards
- APIs, webhooks

Siempre especificamos en la cotización qué tipo es cada item.`, 'contenido, funcionalidad, diferencia, texto, imagen, formulario, integración, lógica', 8],
    ['mantenimiento', 'Planes de mantenimiento web', `Ofrecemos 3 planes:

**Básico - $49 USD/mes**
- Monitoreo uptime 24/7
- Backups diarios (retención 30 días)
- Actualizaciones core WordPress/plugins mensuales
- SSL renovación automática
- 2h cambios menores/mes
- Reporte mensual

**Profesional - $149 USD/mes** (RECOMENDADO)
- Todo lo Básico +
- Backups cada 6 horas
- Actualizaciones semanales
- WAF / Firewall aplicación
- Optimización velocidad trimestral
- 5h cambios menores/mes
- Soporte prioritario email (4h)
- Limpieza malware/hacks

**Enterprise - $399 USD/mes**
- Todo Profesional +
- Backups cada hora + offsite
- Actualizaciones diarias críticas
- CDN gestionado
- Pentest anual
- 15h cambios/mes
- Soporte 24/7 teléfono + Slack
- SLA 99.9% uptime
- Gestor de cuenta dedicado`, 'mantenimiento, plan, básico, profesional, enterprise, precio, backup, actualización, soporte', 10],
    ['mantenimiento', 'Qué incluye el mantenimiento preventivo', `Mensualmente realizamos:
- Actualización WordPress core, plugins, temas (tras testing en staging)
- Verificación de backups (test de restauración trimestral)
- Escaneo seguridad (malware, vulnerabilidades, archivos sospechosos)
- Optimización DB (limpieza revisions, transients, spam)
- Revisión velocidad (Core Web Vitals)
- Check enlaces rotos (Broken Link Checker)
- Renovación certificados SSL
- Limpieza cache servidor + CDN
- Revisión logs de errores (PHP, JS, servidor)
- Reporte entregado días 1-5 de cada mes`, 'preventivo, mensual, actualización, backup, seguridad, optimización, velocidad, ssl, cache', 9],
    ['mantenimiento', 'Mantenimiento correctivo / Reparaciones', `Cuando algo falla:

**Cobertura incluida en planes**:
- Errores 500, pantalla blanca
- Formularios que no envían
- Problemas tras actualizaciones
- Caídas por tráfico (escalado servidor)
- Inyección código malicioso (limpieza)
- Certificados SSL expirados

**Fuera de cobertura (cotización aparte)**:
- Rediseños / nuevas funcionalidades
- Migraciones de hosting/servidor
- Recuperación sin backups válidos
- Desarrollo a medida
- Integraciones nuevas

Tiempos: Crítico <4h, Alto <24h, Normal <72h.`, 'correctivo, reparación, error, caída, hack, malware, ssl, cobertura, tiempo', 8],
    ['tiempos', 'Tiempos estimados de desarrollo web', `Rangos típicos (días hábiles, equipo 1-2 devs):

**Landing Page / One Page**: 5-10 días
- Diseño: 2-3 días
- Desarrollo: 3-5 días
- Testing + deploy: 1-2 días

**Web Corporativa (5-10 páginas)**: 15-25 días
- Discovery + arquitectura: 3-5 días
- Diseño sistema + páginas: 5-8 días
- Desarrollo frontend/back: 7-12 días
- Testing + contenido + deploy: 3-5 días

**E-commerce (WooCommerce/Shopify)**: 25-45 días
- Setup + productos: 5-10 días
- Pasarelas pago/envío: 3-5 días
- Carrito, checkout, cuenta: 5-8 días
- Testing exhaustivo: 5-7 días

**Web App / SaaS / Dashboard**: 60-120+ días
- Requiere discovery detallado
- Backend API + Auth + DB: 20-40 días
- Frontend complejo: 20-40 días
- Testing, CI/CD, docs: 10-20 días

**Factores que alteran tiempos**:
- Contenido listo vs crear contenido (+30-50%)
- Integraciones terceros (APIs, CRM, ERP)
- Número de revisiones de diseño
- Disponibilidad del cliente para feedback`, 'tiempo, estimación, desarrollo, landing, corporativa, ecommerce, saas, web app, días', 10],
    ['tiempos', 'Tiempos de respuesta y soporte', `**SLA por plan**:

| Tipo | Básico | Profesional | Enterprise |
|------|--------|-------------|------------|
| Crítico (sitio caído) | 8h | 4h | 1h |
| Alto (función principal rota) | 24h | 8h | 4h |
| Normal (bug menor, duda) | 72h | 24h | 8h |
| Cambio menor incluido | 5 días | 3 días | 2 días |

**Horario soporte**: Lun-Vie 9:00-18:00 (CDMX)
**Emergencias 24/7**: Solo Enterprise

**Canales**: Email, Portal tickets, WhatsApp (Pro+), Teléfono (Ent)`, 'sla, tiempo, respuesta, soporte, crítico, alto, normal, horario, canal', 9],
    ['productos', 'Productos y servicios principales', `**Desarrollo Web**
- Landing Pages / One Page
- Sitios corporativos multi-página
- E-commerce (WooCommerce, Shopify, custom)
- Web Apps / SaaS / Dashboards
- Progressive Web Apps (PWA)
- Migraciones (WP → WP, WP → Headless, etc.)

**Mantenimiento & Crecimiento**
- Planes mantenimiento (Básico/Pro/Enterprise)
- Optimización velocidad (Core Web Vitals)
- SEO técnico + contenido
- CRO (Optimización conversión)
- Analytics & Dashboards (GA4, Tag Manager, Looker)

**Integraciones & Automatización**
- CRM (HubSpot, Salesforce, Pipedrive, ActiveCampaign)
- Email Marketing (Mailchimp, Klaviyo, Brevo)
- Pagos (Stripe, PayPal, MercadoPago, Conekta)
- Automatizaciones (Make, Zapier, n8n)
- APIs custom / Webhooks

**Infraestructura**
- Hosting gestionado (VPS, Cloud, Serverless)
- CDN + WAF configurado
- CI/CD pipelines
- Monitoreo + Alertas
- Disaster Recovery`, 'producto, servicio, landing, corporativo, ecommerce, saas, pwa, mantenimiento, seo, cro, integración, crm, hosting', 10],
    ['productos', 'Paquetes de inicio rápido (Starter Packs)', `Para clientes que quieren empezar ya:

**Starter Web - $2,499 USD** (entrega 10 días)
- Web 5 páginas (Inicio, Nosotros, Servicios, Blog, Contacto)
- Diseño personalizado (no template)
- CMS WordPress + Elementor Pro
- Formularios + Google Maps
- SEO básico + Analytics
- 1 mes mantenimiento Pro gratis

**Starter E-commerce - $4,999 USD** (entrega 20 días)
- Tienda hasta 50 productos
- WooCommerce + Stripe/PayPal
- Carrito, checkout, cuenta cliente
- Emails transaccionales
- Inventario + cupones
- 2 meses mantenimiento Pro gratis

**Starter SaaS MVP - $14,999 USD** (entrega 45 días)
- Auth (login, registro, roles)
- Dashboard usuario + admin
- 3 funcionalidades core definidas
- API REST documentada
- Tests automatizados
- Deploy AWS/Vercel + CI/CD
- 3 meses mantenimiento Enterprise gratis`, 'starter, paquete, inicio, rápido, web, ecommerce, saas, mvp, precio, entrega', 9],
    ['tecnologias', 'Stack tecnológico principal', `**Frontend**: React, Next.js, Vue, Nuxt, Astro, TypeScript, Tailwind CSS
**Backend**: Node.js (Express, Fastify, NestJS), PHP (Laravel, WordPress), Python (FastAPI)
**Bases de datos**: PostgreSQL, MySQL, MongoDB, Redis, SQLite
**CMS**: WordPress (Gutenberg, ACF, Elementor), Headless (Strapi, Sanity, Contentful)
**E-commerce**: WooCommerce, Shopify, Medusa, Saleor
**DevOps**: Docker, GitHub Actions, Vercel, Netlify, AWS, DigitalOcean, Coolify
**Testing**: Vitest, Playwright, Cypress
**Monitoreo**: Sentry, UptimeRobot, LogRocket

**Elegimos la mejor herramienta para cada proyecto**, no forzamos un stack.`, 'stack, tecnología, frontend, backend, base de datos, cms, ecommerce, devops, testing', 10],
    ['tecnologias', 'WordPress: Nuestro enfoque', `Usamos WordPress moderno, no "constructores visuales" pesados:

- **Temas**: Block themes (Full Site Editing) o temas ligeros custom (Underscores/Sage)
- **Campos**: ACF PRO para campos flexibles, no page builders
- **Gutenberg**: Bloques custom React para componentes complejos
- **Performance**: Sin jQuery, assets optimizados, cache nativo
- **Seguridad**: Hardening (disable xmlrpc, file editing, debug), WAF, 2FA obligatorio
- **Workflow**: Local → Staging → Prod con Git + CI/CD

**Plugins obligatorios en nuestros proyectos**:
- ACF PRO (campos)
- WP Rocket / LiteSpeed Cache (performance)
- Wordfence / Solid Security (seguridad)
- Rank Math / Yoast (SEO)
- Custom blocks plugin (nuestros bloques)

Evitamos: Elementor, Divi, WPBakery, plugins "todo en uno" pesados.`, 'wordpress, tema, bloque, gutenberg, acf, performance, seguridad, plugin, elementor', 9],
    ['flujos', 'Flujo de trabajo estándar (Discovery → Launch)', `**1. Discovery (1-2 semanas)**
- Kickoff call + cuestionario
- Auditoría actual (si hay sitio)
- Definición alcance, KPIs, user stories
- Arquitectura técnica + stack
- Cronograma + hitos

**2. Diseño (2-4 semanas)**
- Wireframes UX (Figma)
- Sistema de diseño (colores, tipografía, componentes)
- UI pages clave (Desktop + Mobile)
- Revisiones (2 incluidas)
- Handoff a dev (Zeplin/Figma dev mode)

**3. Desarrollo (variable)**
- Setup repo + CI/CD + Staging
- Sprint 1: Core + Auth + CMS setup
- Sprint 2: Frontend pages + componentes
- Sprint 3: Funcionalidades específicas
- Code reviews + QA interno

**4. Testing & QA (1-2 semanas)**
- Testing cross-browser (Chrome, Firefox, Safari, Edge)
- Mobile real devices (iOS Safari, Chrome Android)
- Performance (Lighthouse >90)
- Accesibilidad (WCAG 2.1 AA)
- UAT con cliente

**5. Launch (1-2 días)**
- DNS + SSL + CDN
- Go-live checklist
- Monitoreo 48h post-launch
- Entrega docs + accesos
- 30 días soporte post-launch incluido

**6. Crecimiento (continuo)**
- Mantenimiento plan elegido
- Analytics review mensual
- Iteraciones basadas en datos`, 'flujo, trabajo, discovery, diseño, desarrollo, testing, launch, crecimiento, fase, hito', 10],
    ['flujos', 'Metodología de comunicación con cliente', `**Herramientas**:
- **Proyectos**: Linear / Notion (roadmap, tasks, docs)
- **Comunicación diaria**: Slack Connect (canal compartido)
- **Reuniones**: Weekly sync 30min (Lunes) + Demo quincenal
- **Decisiones**: Registradas en Notion con owner + fecha

**Rituales**:
- **Kickoff**: 60-90 min al inicio
- **Weekly sync**: 30 min (qué se hizo, qué va, blockers)
- **Demo quincenal**: 45 min (mostramos avances en staging)
- **Retro post-launch**: 60 min a los 30 días

**Escalation path**:
1. Dev asignado (Slack/email, <4h respuesta)
2. Tech Lead (si bloquea >1 día)
3. Project Manager (cambios alcance, timeline)
4. Director (decisiones estratégicas, presupuesto)

**Transparencia**: Acceso 24/7 a repo (read-only), staging, analytics, Linear board.`, 'comunicación, metodología, slack, notion, linear, reunión, weekly, demo, escalation, transparencia', 9]
  ];

  for (const [category, title, content, keywords, priority] of items) {
    await client.query(`
      INSERT INTO knowledge_items (category_id, title, content, keywords, priority)
      SELECT id, $2, $3, $4, $5 FROM categories WHERE name = $1
    `, [category, title, content, keywords, priority]);
  }

  await client.query(`
    INSERT INTO users (username, email, password_hash, full_name, role)
    VALUES ('admin', 'admin@ia-consulta.com', $1, 'Administrador', 'admin')
    ON CONFLICT (username) DO NOTHING
  `, [seedAdminHash()]);

  console.log('🌱 Base de datos Supabase inicializada con datos por defecto');
}

// Hash por defecto para el usuario admin inicial (admin123)
function seedAdminHash() {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync('admin123', salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}