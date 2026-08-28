import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { initDatabase } from './services/db.js';
import { GroqService } from './services/GroqService.js';
import { KnowledgeBaseService } from './services/KnowledgeBaseService.js';
import { detectPlatform, extractUrl, trimNextSteps } from './services/siteDetectorService.js';
import authRoutes, { authMiddleware, requireRole } from './routes/auth.js';
import notificationRoutes from './routes/notifications.js';
import { PmService, PM_STATUSES, PM_PRIORITIES } from './services/PmService.js';

const app = express();
export { app };
const groqService = new GroqService();
const kbService = new KnowledgeBaseService();
const pmService = new PmService();

// Inicializa la base de datos y el usuario admin inicial.
// - Local (local.js): se llama al arrancar.
// - Cloudflare (src/worker.js): se llama en el primer request (los workers
//   no permiten I/O asíncrono en scope global).
export async function bootstrap() {
  await initDatabase();
}

// Middleware
app.use(cors({
  origin: config.nodeEnv === 'production' ? config.appUrl : '*',
  credentials: true
}));
app.use(express.json({ limit: '12mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check (sin auth ni DB, para diagnosticar el despliegue)
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    groqConfigured: !!config.groq.apiKey,
    supabaseConfigured: !!config.supabase.url && !!config.supabase.key
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Notifications routes
app.use('/api/notifications', notificationRoutes);

// Chat endpoint (protected)
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [], image } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mensaje vacío' 
      });
    }

    if (message.length > 3000) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mensaje demasiado largo (máx 3000 caracteres)' 
      });
    }

    // Imagen opcional: data URL de imagen. Se valida tipo y tamaño.
    let safeImage = null;
    if (image) {
      if (typeof image !== 'string' || !/^data:image\/(png|jpeg|webp|gif);base64,/.test(image)) {
        return res.status(400).json({ success: false, error: 'Imagen inválida' });
      }
      if (image.length > 5 * 1024 * 1024) {
        return res.status(400).json({ success: false, error: 'Imagen demasiado grande (máx 5MB)' });
      }
      safeImage = image;
    }

    // Buscar conocimiento relevante
    let context = await kbService.getContextForQuery(message, 8);

    // Detección de plataforma: si el usuario manda una URL (en texto o dentro
    // de una imagen), el servidor inspecciona el sitio y decide si es apto
    // para migrar/trabajar (WordPress o HTML puro = sí; otro CMS/constructor = no).
    let platformUrl = extractUrl(message);
    if (!platformUrl && safeImage) {
      try {
        const extracted = await groqService.extractUrlFromImage(safeImage);
        platformUrl = extractUrl(extracted);
      } catch (err) {
        console.error('Error extrayendo URL de la imagen:', err.message);
      }
    }

    let platformInfo = null;
    if (platformUrl) {
      platformInfo = await detectPlatform(platformUrl);
      if (platformInfo && platformInfo.summary) {
        context += (context ? '\n\n' : '') + platformInfo.summary;
      }
    }

    // Generar respuesta con Groq
    let response = await groqService.chat(message.trim(), context, history, safeImage);

    // En un análisis de plataforma, eliminar pasos siguientes/ofertas que el
    // modelo suelte tras el veredicto (solo es un escaneo).
    if (platformInfo) response = trimNextSteps(response);

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      contextUsed: context.length > 0,
      platform: platformInfo ? {
        url: platformInfo.url,
        platform: platformInfo.platform,
        apta: platformInfo.apta
      } : null
    });

  } catch (error) {
    console.error('Error en /api/chat:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: config.nodeEnv === 'development' ? error.message : undefined
    });
  }
});

// Streaming chat endpoint (protected)
app.post('/api/chat/stream', authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Mensaje vacío' 
      });
    }

    // Configurar SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const context = await kbService.getContextForQuery(message, 6);
    let fullResponse = '';

    await groqService.chatStream(message.trim(), context, history, (chunk) => {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ done: true, response: fullResponse })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Error en /api/chat/stream:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: 'Error interno' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Error generando respuesta' })}\n\n`);
      res.end();
    }
  }
});

// Transcripción de audio por dictado (protected)
app.post('/api/chat/transcribe', authMiddleware, async (req, res) => {
  try {
    const { audio, mime } = req.body;

    if (!audio || typeof audio !== 'string') {
      return res.status(400).json({ success: false, error: 'Audio requerido' });
    }
    if (audio.length > 6 * 1024 * 1024) {
      return res.status(400).json({ success: false, error: 'Audio demasiado largo' });
    }

    const text = await groqService.transcribe(audio, typeof mime === 'string' && mime ? mime : 'audio/webm');
    res.json({ success: true, text });
  } catch (error) {
    console.error('Error en /api/chat/transcribe:', error.message);
    res.status(500).json({ success: false, error: error.message || 'Error transcribiendo audio' });
  }
});

// Knowledge base endpoints
app.get('/api/knowledge/categories', async (req, res) => {
  try {
    const categories = await kbService.getAllCategories();
    res.json({ success: true, categories });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo categorías' });
  }
});

app.get('/api/knowledge/category/:name', async (req, res) => {
  try {
    const items = await kbService.getByCategory(req.params.name);
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error getting category items:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo items' });
  }
});

app.post('/api/knowledge/search', async (req, res) => {
  try {
    const { query, limit = 10 } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Query requerido' });
    }
    const results = await kbService.search(query, limit);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    res.status(500).json({ success: false, error: 'Error en búsqueda' });
  }
});

// Listar toda la base de conocimiento (admin - para gestión)
app.get('/api/admin/knowledge', authMiddleware, async (req, res) => {
  try {
    const items = await kbService.getAllItems();
    res.json({ success: true, items });
  } catch (error) {
    console.error('Error listing knowledge:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear categoría (admin)
app.post('/api/admin/knowledge/categories', authMiddleware, async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Nombre de categoría requerido' });
    }
    const category = await kbService.addCategory(name.trim(), description || '', icon || '📄');
    res.json({ success: true, category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Eliminar categoría (admin)
app.delete('/api/admin/knowledge/categories/:id', authMiddleware, async (req, res) => {
  try {
    await kbService.deleteCategory(parseInt(req.params.id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Admin endpoints para gestionar knowledge base (protegidos con auth)
app.post('/api/admin/knowledge', authMiddleware, async (req, res) => {
  try {
    const { category, title, content, keywords, priority } = req.body;
    if (!category || !title || !content) {
      return res.status(400).json({ success: false, error: 'Campos requeridos: category, title, content' });
    }
    const result = await kbService.addItem(category, title, content, keywords || '', priority || 0);
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (error) {
    console.error('Error adding knowledge item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/admin/knowledge/:id', authMiddleware, async (req, res) => {
  try {
    const result = await kbService.updateItem(parseInt(req.params.id), req.body);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Error updating knowledge item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/admin/knowledge/:id', authMiddleware, async (req, res) => {
  try {
    const result = await kbService.deleteItem(parseInt(req.params.id));
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error('Error deleting knowledge item:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ---- Project Manager (solo admin y Desarrollo) ----
const pmOnly = [authMiddleware, requireRole('admin', 'desarrollo')];

app.get('/api/pm/projects', pmOnly, async (req, res) => {
  try {
    const projects = await pmService.listProjects();
    res.json({ success: true, projects });
  } catch (error) {
    console.error('Error listing PM projects:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/pm/projects', pmOnly, async (req, res) => {
  try {
    const project = await pmService.addProject(req.body, req.user.id);
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error creating PM project:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.put('/api/pm/projects/:id', pmOnly, async (req, res) => {
  try {
    const project = await pmService.updateProject(req.params.id, req.body);
    res.json({ success: true, project });
  } catch (error) {
    console.error('Error updating PM project:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Eliminar tareas/proyectos: solo admin.
app.delete('/api/pm/projects/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pmService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting PM project:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/pm/tasks', pmOnly, async (req, res) => {
  try {
    const task = await pmService.addTask(req.body, req.user.id);
    res.json({ success: true, task });
  } catch (error) {
    console.error('Error creating PM task:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Solo admin puede mover una tarea al estado finalizado_sin_errores.
app.put('/api/pm/tasks/:id', pmOnly, async (req, res) => {
  try {
    if (req.body.status === 'finalizado_sin_errores' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Solo el admin puede mover a "Finalizado sin errores"' });
    }
    const task = await pmService.updateTask(req.params.id, req.body);
    res.json({ success: true, task });
  } catch (error) {
    console.error('Error updating PM task:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/pm/tasks/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pmService.deleteTask(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting PM task:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Detalle de tarea (descripcion completa, comentarios y adjuntos)
app.get('/api/pm/tasks/:id/detail', pmOnly, async (req, res) => {
  try {
    const detail = await pmService.getTaskDetail(req.params.id);
    res.json({ success: true, ...detail });
  } catch (error) {
    console.error('Error getting PM task detail:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/pm/tasks/:id/comments', pmOnly, async (req, res) => {
  try {
    const authorName = req.user.full_name || req.user.username;
    const comment = await pmService.addComment(req.params.id, req.user.id, authorName, req.body.content);
    res.json({ success: true, comment });
  } catch (error) {
    console.error('Error adding PM comment:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/pm/comments/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pmService.deleteComment(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting PM comment:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/pm/tasks/:id/attachments', pmOnly, async (req, res) => {
  try {
    const attachment = await pmService.addAttachment(req.params.id, req.body.data_url);
    res.json({ success: true, attachment });
  } catch (error) {
    console.error('Error adding PM attachment:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.delete('/api/pm/attachments/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    await pmService.deleteAttachment(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting PM attachment:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Servir archivos estáticos (frontend)
import { resolve } from 'node:path';
const publicPath = resolve('./public');
app.use(express.static(publicPath));

// SPA fallback - servir index.html para rutas no API
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(resolve(publicPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Error interno del servidor' 
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`
╔═══════════════════════════════════════════════╗
║     🤖 IA Consulta Chat - Servidor           ║
╠═══════════════════════════════════════════════╣
║  Puerto: ${config.port}                               ║
║  Entorno: ${config.nodeEnv}                          ║
║  Groq: ${config.groq.apiKey ? '✅ Configurado' : '❌ No configurado'}                      ║
║  DB: ${config.supabase.url ? '✅ Supabase (PostgreSQL)' : '❌ Sin SUPABASE_URL'}                    ║
╚═══════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  kbService.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  kbService.close();
  process.exit(0);
});