import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import { initDatabase } from './services/db.js';
import { GroqService } from './services/GroqService.js';
import { KnowledgeBaseService } from './services/KnowledgeBaseService.js';
import authRoutes, { authMiddleware } from './routes/auth.js';

const app = express();
export { app };
const groqService = new GroqService();
const kbService = new KnowledgeBaseService();

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
app.use(express.json({ limit: '1mb' }));
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    groqConfigured: !!config.groq.apiKey
  });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Chat endpoint (protected)
app.post('/api/chat', authMiddleware, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

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

    // Buscar conocimiento relevante
    const context = await kbService.getContextForQuery(message, 6);

    // Generar respuesta con Groq
    const response = await groqService.chat(message.trim(), context, history);

    res.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
      contextUsed: context.length > 0
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