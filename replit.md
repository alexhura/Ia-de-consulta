# Portal de Consulta con Chat IA + Google Sheets

## Overview
Portal web que permite consultar informacion de clientes almacenada en Google Sheets a traves de una interfaz de chat conversacional con Inteligencia Artificial. Incluye sistema de autenticacion y panel de administracion.

## Current State
- Portal funcional con chat IA integrado
- Sistema de login con diseno futurista
- Panel de administracion para gestion de usuarios
- Perfiles con permisos ajustables (Ventas, Callcenter, etc.)
- Registro de consultas con buscador
- Desplegado en Cloudways con OpenRouter

## Architecture

### Stack
- **Backend:** PHP 8.4 con Composer
- **Frontend:** HTML5, CSS custom (diseno futurista), JavaScript vanilla
- **AI:** OpenRouter (modelo openai/gpt-4o-mini)
- **Database:** PostgreSQL (usuarios, perfiles, logs)
- **Data:** Google Sheets API (opcional) con datos de demo

### Project Structure
```
/
├── public/                 # Frontend publico
│   ├── index.php          # Pagina principal con chat (requiere auth)
│   ├── login.php          # Pagina de inicio de sesion
│   ├── admin/
│   │   └── index.php      # Panel de administracion
│   ├── api/
│   │   ├── chat.php       # POST /api/chat
│   │   ├── logout.php     # Cerrar sesion
│   │   └── admin/
│   │       ├── users.php  # CRUD usuarios
│   │       └── profiles.php
│   └── assets/
│       ├── css/styles.css # Estilos futuristas
│       └── js/chat.js
├── src/
│   ├── Config/Config.php
│   └── Services/
│       ├── AIService.php
│       ├── AuthService.php  # Autenticacion y usuarios
│       └── GoogleSheetsService.php
├── database/
│   └── init.sql           # Script de inicializacion DB
├── credentials/
├── composer.json
└── .env.example
```

### API Endpoints
- `POST /api/chat` - Enviar mensaje al chat IA (requiere auth)
- `GET /api/logout.php` - Cerrar sesion
- `POST/PUT/DELETE /api/admin/users.php` - Gestion usuarios (admin)
- `PUT /api/admin/profiles.php` - Editar perfiles (admin)

## Authentication

### Usuario Admin Predeterminado
- **Usuario:** ADLadmin
- **Password:** Adldigital*26

### Perfiles Disponibles
- **Administrador:** Acceso total
- **Ventas:** Chat + clientes
- **Callcenter:** Chat + clientes
- **Consulta:** Solo chat

## Configuration

### Base de Datos (PostgreSQL)
Ejecutar `database/init.sql` para crear las tablas y usuario admin.

### Variables de Entorno
- `PGHOST`, `PGPORT`, `PGDATABASE`, `PGUSER`, `PGPASSWORD` - PostgreSQL
- `OPENROUTER_API_KEY` - API key de OpenRouter
- `SPREADSHEET_ID` - ID del Google Sheet

## Development

### Run Server
```bash
php -S 0.0.0.0:5000 -t public
```

### Workflow
- **Portal Chat**: Servidor PHP en puerto 5000

## Recent Changes
- 2025-02-03: Sistema de autenticacion y panel admin
  - Login futurista con efectos neon
  - Panel admin: gestion usuarios, perfiles, consultas
  - Registro de consultas de usuarios
  - Permisos por perfil ajustables
- 2025-01-30: Proyecto inicial creado
  - Estructura PHP pura con Composer
  - Interfaz de chat moderna futurista
  - Integracion OpenRouter
