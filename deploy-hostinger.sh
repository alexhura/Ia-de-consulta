#!/bin/bash
# Deploy script for Hostinger
# Usage: ./deploy-hostinger.sh

set -e

echo "🚀 Preparando deployment para Hostinger..."

# Build/prepare
echo "📦 Instalando dependencias de producción..."
npm ci --only=production 2>/dev/null || npm install --only=production

# Crear directorio de datos si no existe
mkdir -p data

# Verificar variables de entorno requeridas
if [ -z "$GROQ_API_KEY" ] || [ "$GROQ_API_KEY" = "tu_groq_api_key_aqui" ]; then
    echo "⚠️  ADVERTENCIA: GROQ_API_KEY no configurado en variables de entorno"
    echo "   Configúralo en el panel de Hostinger > Node.js > Environment Variables"
fi

echo "✅ Preparación completada"
echo ""
echo "📋 Para deployar en Hostinger:"
echo "   1. Sube todo el proyecto (excepto node_modules) via Git o File Manager"
echo "   2. En panel Hostinger > Node.js:"
echo "      - App Root: / (raíz del proyecto)"
echo "      - Startup File: server.js"
echo "      - Node.js Version: 20.x"
echo "   3. En Environment Variables, agrega:"
echo "      GROQ_API_KEY=tu_api_key_real"
echo "      GROQ_MODEL=llama-3.1-70b-versatile"
echo "      NODE_ENV=production"
echo "      PORT=3000"
echo "   4. Haz clic en 'Start App' o 'Restart'"
echo ""
echo "🔗 Tu app estará en: https://tu-dominio.hostingerapp.com (o tu dominio personalizado)"