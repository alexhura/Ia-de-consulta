import Database from 'better-sqlite3';
import { config } from '../config/index.js';
import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';

export class KnowledgeBaseService {
  constructor() {
    const dbDir = resolve(config.db.path).split('/').slice(0, -1).join('/');
    if (dbDir && !existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true });
    }
    this.db = new Database(config.db.path);
    this.initTables();
    this.seedIfEmpty();
  }

  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        icon TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS knowledge_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        keywords TEXT,
        priority INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE INDEX IF NOT EXISTS idx_keywords ON knowledge_items(keywords);
      CREATE INDEX IF NOT EXISTS idx_category ON knowledge_items(category_id);
    `);
  }

  seedIfEmpty() {
    const count = this.db.prepare('SELECT COUNT(*) as c FROM knowledge_items').get().c;
    if (count === 0) {
      this.seedDefaultData();
    }
  }

  seedDefaultData() {
    const insertCategory = this.db.prepare('INSERT INTO categories (name, description, icon) VALUES (?, ?, ?)');
    const insertItem = this.db.prepare(`
      INSERT INTO knowledge_items (category_id, title, content, keywords, priority)
      VALUES (?, ?, ?, ?, ?)
    `);

    const categories = [
      { name: 'cambios', description: 'Procesos para cambios y modificaciones en proyectos web', icon: '🔄' },
      { name: 'mantenimiento', description: 'Mantenimiento preventivo y correctivo de sitios web', icon: '🛠️' },
      { name: 'tiempos', description: 'Estimaciones y tiempos de desarrollo', icon: '⏱️' },
      { name: 'productos', description: 'Productos y servicios ofrecidos', icon: '📦' },
      { name: 'tecnologias', description: 'Stacks tecnológicos y herramientas utilizadas', icon: '💻' },
      { name: 'flujos', description: 'Flujos de trabajo y metodologías', icon: '📋' }
    ];

    const categoryIds = {};
    for (const cat of categories) {
      const result = insertCategory.run(cat.name, cat.description, cat.icon);
      categoryIds[cat.name] = result.lastInsertRowid;
    }

    const items = [
      // CAMBIOS
      {
        category: 'cambios',
        title: 'Proceso de solicitud de cambios',
        content: `Para solicitar un cambio en tu proyecto web:

1. **Registro**: Envía tu solicitud por email a cambios@agencia.com o usa el formulario en el portal del cliente
2. **Clasificación**: Evaluamos si es:
   - Cambio menor (texto, imágenes, colores) → 1-2 días hábiles
   - Cambio medio (funcionalidad, secciones) → 3-5 días hábiles
   - Cambio mayor (rediseño, nueva funcionalidad compleja) → 1-3 semanas
3. **Presupuesto**: Te enviamos cotización si aplica (cambios fuera de mantenimiento incluido)
4. **Aprobación**: Confirmas y agendamos
5. **Desarrollo y pruebas**: Implementamos en staging, tú revisas
6. **Despliegue**: Subimos a producción en horario de bajo tráfico

**Incluido en mantenimiento mensual**: Hasta 2 horas de cambios menores al mes.`,
        keywords: 'cambio, modificación, solicitud, proceso, menor, medio, mayor, presupuesto, mantenimiento',
        priority: 10
      },
      {
        category: 'cambios',
        title: 'Cambios urgentes / Hotfix',
        content: `Para errores críticos en producción (sitio caído, formularios que no envían, pagos fallando):

- **Tiempo de respuesta**: < 4 horas hábiles
- **Canal**: WhatsApp de emergencia + email con asunto [URGENTE]
- **Costo**: Incluido en planes Premium/Enterprise. Plan Básico: $50 USD/hora
- **Proceso**: Diagnóstico → Fix temporal → Fix definitivo → Post-mortem

No uses este canal para cambios estéticos o mejoras.`,
        keywords: 'urgente, hotfix, emergencia, crítico, producción, caída, error',
        priority: 9
      },
      {
        category: 'cambios',
        title: 'Cambios en contenido vs funcionalidad',
        content: `Diferencia importante para tiempos y costos:

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

Siempre especificamos en la cotización qué tipo es cada item.`,
        keywords: 'contenido, funcionalidad, diferencia, texto, imagen, formulario, integración, lógica',
        priority: 8
      },

      // MANTENIMIENTO
      {
        category: 'mantenimiento',
        title: 'Planes de mantenimiento web',
        content: `Ofrecemos 3 planes:

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
- Gestor de cuenta dedicado`,
        keywords: 'mantenimiento, plan, básico, profesional, enterprise, precio, backup, actualización, soporte',
        priority: 10
      },
      {
        category: 'mantenimiento',
        title: 'Qué incluye el mantenimiento preventivo',
        content: `Mensualmente realizamos:
- Actualización WordPress core, plugins, temas (tras testing en staging)
- Verificación de backups (test de restauración trimestral)
- Escaneo seguridad (malware, vulnerabilidades, archivos sospechosos)
- Optimización DB (limpieza revisions, transients, spam)
- Revisión velocidad (Core Web Vitals)
- Check enlaces rotos (Broken Link Checker)
- Renovación certificados SSL
- Limpieza cache servidor + CDN
- Revisión logs de errores (PHP, JS, servidor)
- Reporte entregado días 1-5 de cada mes`,
        keywords: 'preventivo, mensual, actualización, backup, seguridad, optimización, velocidad, ssl, cache',
        priority: 9
      },
      {
        category: 'mantenimiento',
        title: 'Mantenimiento correctivo / Reparaciones',
        content: `Cuando algo falla:

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

Tiempos: Crítico <4h, Alto <24h, Normal <72h.`,
        keywords: 'correctivo, reparación, error, caída, hack, malware, ssl, cobertura, tiempo',
        priority: 8
      },

      // TIEMPOS
      {
        category: 'tiempos',
        title: 'Tiempos estimados de desarrollo web',
        content: `Rangos típicos (días hábiles, equipo 1-2 devs):

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
- Disponibilidad del cliente para feedback`,
        keywords: 'tiempo, estimación, desarrollo, landing, corporativa, ecommerce, saas, web app, días',
        priority: 10
      },
      {
        category: 'tiempos',
        title: 'Tiempos de respuesta y soporte',
        content: `**SLA por plan**:

| Tipo | Básico | Profesional | Enterprise |
|------|--------|-------------|------------|
| Crítico (sitio caído) | 8h | 4h | 1h |
| Alto (función principal rota) | 24h | 8h | 4h |
| Normal (bug menor, duda) | 72h | 24h | 8h |
| Cambio menor incluido | 5 días | 3 días | 2 días |

**Horario soporte**: Lun-Vie 9:00-18:00 (CDMX)
**Emergencias 24/7**: Solo Enterprise

**Canales**: Email, Portal tickets, WhatsApp (Pro+), Teléfono (Ent)´`,
        keywords: 'sla, tiempo, respuesta, soporte, crítico, alto, normal, horario, canal',
        priority: 9
      },

      // PRODUCTOS
      {
        category: 'productos',
        title: 'Productos y servicios principales',
        content: `**Desarrollo Web**
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
- Disaster Recovery`,
        keywords: 'producto, servicio, landing, corporativo, ecommerce, saas, pwa, mantenimiento, seo, cro, integración, crm, hosting',
        priority: 10
      },
      {
        category: 'productos',
        title: 'Paquetes de inicio rápido (Starter Packs)',
        content: `Para clientes que quieren empezar ya:

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
- 3 meses mantenimiento Enterprise gratis`,
        keywords: 'starter, paquete, inicio, rápido, web, ecommerce, saas, mvp, precio, entrega',
        priority: 9
      },

      // TECNOLOGÍAS
      {
        category: 'tecnologias',
        title: 'Stack tecnológico principal',
        content: `**Frontend**: React, Next.js, Vue, Nuxt, Astro, TypeScript, Tailwind CSS
**Backend**: Node.js (Express, Fastify, NestJS), PHP (Laravel, WordPress), Python (FastAPI)
**Bases de datos**: PostgreSQL, MySQL, MongoDB, Redis, SQLite
**CMS**: WordPress (Gutenberg, ACF, Elementor), Headless (Strapi, Sanity, Contentful)
**E-commerce**: WooCommerce, Shopify, Medusa, Saleor
**DevOps**: Docker, GitHub Actions, Vercel, Netlify, AWS, DigitalOcean, Coolify
**Testing**: Vitest, Playwright, Cypress
**Monitoreo**: Sentry, UptimeRobot, LogRocket

**Elegimos la mejor herramienta para cada proyecto**, no forzamos un stack.`,
        keywords: 'stack, tecnología, frontend, backend, base de datos, cms, ecommerce, devops, testing',
        priority: 10
      },
      {
        category: 'tecnologias',
        title: 'WordPress: Nuestro enfoque',
        content: `Usamos WordPress moderno, no "constructores visuales" pesados:

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

Evitamos: Elementor, Divi, WPBakery, plugins "todo en uno" pesados.`,
        keywords: 'wordpress, tema, bloque, gutenberg, acf, performance, seguridad, plugin, elementor',
        priority: 9
      },

      // FLUJOS
      {
        category: 'flujos',
        title: 'Flujo de trabajo estándar (Discovery → Launch)',
        content: `**1. Discovery (1-2 semanas)**
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
- Iteraciones basadas en datos`,
        keywords: 'flujo, trabajo, discovery, diseño, desarrollo, testing, launch, crecimiento, fase, hito',
        priority: 10
      },
      {
        category: 'flujos',
        title: 'Metodología de comunicación con cliente',
        content: `**Herramientas**:
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

**Transparencia**: Acceso 24/7 a repo (read-only), staging, analytics, Linear board.`,
        keywords: 'comunicación, metodología, slack, notion, linear, reunión, weekly, demo, escalation, transparencia',
        priority: 9
      }
    ];

    for (const item of items) {
      insertItem.run(
        categoryIds[item.category],
        item.title,
        item.content,
        item.keywords,
        item.priority
      );
    }

    console.log('Base de conocimiento inicializada con datos por defecto');
  }

  search(query, limit = 8) {
    const words = query.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);
    
    if (words.length === 0) return [];

    const likePatterns = words.map(w => `%${w}%`);
    const placeholders = likePatterns.map(() => 
      'ki.keywords LIKE ? OR ki.title LIKE ? OR ki.content LIKE ?'
    ).join(' OR ');

    const stmt = this.db.prepare(`
      SELECT ki.*, c.name as category, c.icon
      FROM knowledge_items ki
      JOIN categories c ON ki.category_id = c.id
      WHERE ${placeholders}
      ORDER BY ki.priority DESC, ki.updated_at DESC
      LIMIT ?
    `);

    const params = [];
    for (const pattern of likePatterns) {
      params.push(pattern, pattern, pattern);
    }
    params.push(limit);

    return stmt.all(...params);
  }

  getByCategory(categoryName, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT ki.*, c.name as category, c.icon
      FROM knowledge_items ki
      JOIN categories c ON ki.category_id = c.id
      WHERE c.name = ?
      ORDER BY ki.priority DESC
      LIMIT ?
    `);
    return stmt.all(categoryName, limit);
  }

  getAllCategories() {
    return this.db.prepare('SELECT * FROM categories ORDER BY name').all();
  }

  getContextForQuery(query, maxItems = 6) {
    const results = this.search(query, maxItems);
    if (results.length === 0) return '';

    let context = 'INFORMACIÓN RELEVANTE DE LA BASE DE CONOCIMIENTO:\n\n';
    for (const item of results) {
      context += `## ${item.icon || '📄'} ${item.title} (${item.category})\n${item.content}\n\n`;
    }
    return context;
  }

  addItem(category, title, content, keywords, priority = 0) {
    const cat = this.db.prepare('SELECT id FROM categories WHERE name = ?').get(category);
    if (!cat) throw new Error(`Categoría "${category}" no existe`);
    
    const stmt = this.db.prepare(`
      INSERT INTO knowledge_items (category_id, title, content, keywords, priority)
      VALUES (?, ?, ?, ?, ?)
    `);
    return stmt.run(cat.id, title, content, keywords, priority);
  }

  updateItem(id, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      if (['title', 'content', 'keywords', 'priority', 'category_id'].includes(key)) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return { changes: 0 };
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const stmt = this.db.prepare(`UPDATE knowledge_items SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  }

  deleteItem(id) {
    return this.db.prepare('DELETE FROM knowledge_items WHERE id = ?').run(id);
  }

  close() {
    this.db.close();
  }
}