# Portal de Consulta con Chat IA + Google Sheets

## Overview
Portal web que permite consultar informacion de clientes almacenada en Google Sheets a traves de una interfaz de chat conversacional con Inteligencia Artificial.

## Current State
- Portal funcional con chat IA integrado
- Datos de demo disponibles (8 clientes de ejemplo)
- Integrado con Replit AI Integrations (OpenAI) - no requiere API key propia

## Architecture

### Stack
- **Backend:** PHP 8.4 con Composer
- **Frontend:** HTML5, Tailwind CSS, JavaScript vanilla
- **AI:** OpenAI via Replit AI Integrations (modelo gpt-5)
- **Data:** Google Sheets API (opcional) con datos de demo

### Project Structure
```
/
├── public/                 # Frontend publico
│   ├── index.php          # Pagina principal con chat
│   └── assets/
│       ├── css/styles.css
│       └── js/chat.js
├── src/                    # Codigo backend
│   ├── Config/Config.php   # Configuracion
│   └── Services/
│       ├── AIService.php         # Integracion con OpenAI
│       └── GoogleSheetsService.php
├── api/                    # Endpoints API
│   ├── chat.php           # POST /api/chat
│   └── health.php         # GET /api/health
├── credentials/           # Credenciales Google (gitignore)
├── composer.json
└── .env.example
```

### API Endpoints
- `POST /api/chat` - Enviar mensaje al chat IA
- `GET /api/health` - Health check del sistema

## Configuration

### Google Sheets (Opcional)
1. Crear proyecto en Google Cloud Console
2. Habilitar Google Sheets API
3. Crear Service Account y descargar JSON
4. Guardar como `credentials/google-credentials.json`
5. Configurar `SPREADSHEET_ID` en variables de entorno

### Variables de Entorno
- `SPREADSHEET_ID` - ID del Google Sheet
- `APP_DEBUG` - Modo debug (true/false)
- `AI_INTEGRATIONS_OPENAI_*` - Configurados automaticamente

## Development

### Run Server
```bash
php -S 0.0.0.0:5000 -t public
```

### Workflow
- **Portal Chat**: Servidor PHP en puerto 5000

## Recent Changes
- 2025-01-30: Proyecto inicial creado
  - Estructura PHP pura con Composer
  - Integracion OpenAI via AI Integrations
  - Interfaz de chat moderna con Tailwind CSS
  - Datos de demo para pruebas
