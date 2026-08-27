# IA Consulta Chat - Asistente de Desarrollo Web

Chat IA funcional con base de conocimientos sobre procesos de desarrollo web, deployable en Hostinger.

## 🚀 Características

- **Groq API** como proveedor principal (llama-3.1-70b-versatile)
- **Base de conocimiento local** (SQLite) con datos de:
  - Procesos de cambios y modificaciones
  - Planes de mantenimiento web
  - Tiempos de desarrollo estimados
  - Productos y servicios
  - Stack tecnológico
  - Flujos de trabajo y metodologías
- **Tono conversacional amable** y profesional
- **Frontend moderno** con diseño oscuro, responsive
- **Deploy en Hostinger** (Node.js 20+)

## 📦 Instalación Local

```bash
# 1. Clonar/descargar proyecto
cd Ia-de-consulta

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env y agrega tu GROQ_API_KEY

# 4. Ejecutar en desarrollo
npm run dev

# 5. Abrir http://localhost:3000
```

## 🔑 Obtener Groq API Key

1. Ve a https://console.groq.com
2. Crea cuenta / inicia sesión
3. Ve a API Keys > Create API Key
4. Copia la key y pégala en `.env`

## 📁 Estructura del Proyecto

```
Ia-de-consulta/
├── server.js                 # Servidor Express principal
├── package.json
├── .env                      # Variables de entorno (no commitear)
├── .htaccess                 # Config Hostinger/Apache
├── ecosystem.config.js       # PM2 process manager
├── deploy-hostinger.sh       # Script de deployment
├── config/
│   └── index.js             # Configuración centralizada
├── services/
│   ├── GroqService.js       # Cliente Groq API
│   └── KnowledgeBaseService.js  # Base de conocimiento SQLite
├── public/                   # Frontend estático
│   ├── index.html
│   └── assets/
│       ├── css/styles.css
│       └── js/chat.js
└── data/
    └── knowledge.db         # Base de datos SQLite (auto-generada)
```

## 🌐 Deployment en Hostinger

### Opción A: Panel Hostinger Node.js (Recomendado)

1. **Sube el proyecto** via Git o File Manager (sin `node_modules`)
2. **En Panel Hostinger > Node.js**:
   - App Root: `/` (raíz del proyecto)
   - Startup File: `server.js`
   - Node.js Version: `20.x`
3. **Environment Variables** (agregar cada una):
   ```
   GROQ_API_KEY=gsk_tu_key_real_aqui
   GROQ_MODEL=llama-3.1-70b-versatile
   NODE_ENV=production
   PORT=3000
   ```
4. **Start App** / **Restart**

### Opción B: PM2 (si tienes acceso SSH)

```bash
# En el servidor
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

## 🧠 Base de Conocimiento

Los datos están en `data/knowledge.db` (SQLite). Para agregar/modificar:

### Via API (Admin)
```bash
# Agregar item
curl -X POST http://localhost:3000/api/admin/knowledge \
  -H "Content-Type: application/json" \
  -d '{
    "category": "cambios",
    "title": "Nuevo proceso",
    "content": "Descripción detallada...",
    "keywords": "palabra1, palabra2",
    "priority": 5
  }'

# Buscar
curl -X POST http://localhost:3000/api/knowledge/search \
  -H "Content-Type: application/json" \
  -d '{"query": "mantenimiento", "limit": 5}'
```

### Categorías existentes
- `cambios` - Procesos de cambios/modificaciones
- `mantenimiento` - Planes y tipos de mantenimiento
- `tiempos` - Estimaciones de desarrollo
- `productos` - Servicios y paquetes
- `tecnologias` - Stack tecnológico
- `flujos` - Metodologías y comunicación

## 💬 Uso del Chat

El chat mantiene **historial de conversación** (últimos 12 mensajes) para contexto.

Preguntas de ejemplo:
- "¿Cómo solicito un cambio en mi web?"
- "¿Qué incluye el mantenimiento mensual?"
- "¿Cuánto tarda una landing page?"
- "¿Qué stack usan para e-commerce?"
- "¿Cómo es el flujo de trabajo con clientes?"

## 🛠️ Scripts Disponibles

```bash
npm start          # Producción
npm run dev        # Desarrollo con auto-reload
npm run deploy     # Ejecuta deploy-hostinger.sh
```

## 📝 Variables de Entorno

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `GROQ_API_KEY` | Sí | - | Tu API key de Groq |
| `GROQ_MODEL` | No | llama-3.1-70b-versatile | Modelo a usar |
| `PORT` | No | 3000 | Puerto del servidor |
| `NODE_ENV` | No | development | Entorno |
| `APP_URL` | No | http://localhost:3000 | URL pública |
| `DB_PATH` | No | ./data/knowledge.db | Ruta SQLite |

## 🔧 Personalización

### Cambiar System Prompt
Edita `config/index.js` → `systemPrompt`

### Agregar nuevas categorías
```javascript
// En KnowledgeBaseService.seedDefaultData()
{ name: 'nueva_categoria', description: '...', icon: '🎯' }
```

### Cambiar modelo Groq
En `.env`: `GROQ_MODEL=llama-3.1-8b-instant` (más rápido) o `mixtral-8x7b-32768`

## 📄 Licencia

MIT - Desarrollado por Ingeniero Alejandro Huerta