#!/bin/bash
# Deploy script for Hostinger
# Usage: ./deploy-hostinger.sh

set -e

echo "🚀 Preparando deployment para Hostinger..."

# Build/prepare
echo "📦 Instalando dependencias de producción..."
npm ci --only=production 2>/dev/null || npm install --only=production

# Verificar variables de entorno requeridas
if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "gsk_tu_api_key_aqui" ]; then
    echo "⚠️  ADVERTENCIA: GROQ_API_KEY no configurado en variables de entorno"
    echo "   Configúralo en el panel de Hostinger > Node.js > Environment Variables"
fi

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_API_KEY" ]; then
    echo "⚠️  ADVERTENCIA: SUPABASE_URL / SUPABASE_API_KEY no configurados"
    echo "   La app no arrancará sin la conexión a Supabase"
fi

echo "✅ Preparación completada"
echo ""
echo "📋 Para deployar en Hostinger:"
echo "   1. Conecta el repo de GitHub en Hostinger (branch main)"
echo "   2. En panel Hostinger > Node.js:"
echo "      - App Root: / (raíz del proyecto)"
echo "      - Startup File: server.js"
echo "      - Node.js Version: 20.x"
echo "   3. En Environment Variables, agrega:"
echo "      GROQ_API_KEY=gsk_tu_api_key_real"
echo "      GROQ_MODEL=openai/gpt-oss-20b"
echo "      SUPABASE_URL=https://TU_PROJECT.supabase.co"
echo "      SUPABASE_API_KEY=tu_service_role_key"
echo "      JWT_SECRET=secreto_largo_aleatorio"
echo "      NODE_ENV=production"
echo "   4. Haz clic en 'Start App' o 'Restart'"
echo ""
echo "🔗 Tu app estará en: https://tu-dominio.hostingerapp.com (o tu dominio personalizado)"