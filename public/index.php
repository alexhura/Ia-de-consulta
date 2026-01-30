<?php
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

if (strpos($path, '/api/') === 0) {
    $apiFile = __DIR__ . '/..' . $path . '.php';
    $apiFile = str_replace('.php.php', '.php', $apiFile);
    
    if (file_exists($apiFile)) {
        require $apiFile;
        exit;
    }
    
    $apiFile = __DIR__ . '/../api/' . basename($path) . '.php';
    if (file_exists($apiFile)) {
        require $apiFile;
        exit;
    }
}

if (preg_match('/\.(?:css|js|png|jpg|gif|ico|svg|woff|woff2|ttf|eot)$/', $path)) {
    $file = __DIR__ . $path;
    if (file_exists($file)) {
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $mimeTypes = [
            'css' => 'text/css',
            'js' => 'application/javascript',
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'gif' => 'image/gif',
            'ico' => 'image/x-icon',
            'svg' => 'image/svg+xml'
        ];
        header('Content-Type: ' . ($mimeTypes[$ext] ?? 'application/octet-stream'));
        readfile($file);
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal de Consulta - Chat IA</title>
    <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
    <div class="container mx-auto px-4 py-6 max-w-4xl">
        <div class="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div class="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
                <h1 class="text-2xl font-bold flex items-center gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    Portal de Consulta de Clientes
                </h1>
                <p class="text-blue-100 mt-2">Consulta informacion de clientes usando lenguaje natural</p>
            </div>
            
            <div id="chatContainer" class="chat-container p-4 bg-gray-50">
                <div class="message assistant">
                    <div class="message-avatar">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div class="message-content">
                        Hola! Soy tu asistente virtual. Puedo ayudarte a consultar informacion de clientes. Preguntame lo que necesites saber.
                        <br><br>
                        <span class="text-sm text-gray-500">Ejemplos de consultas:</span>
                        <ul class="text-sm text-gray-500 mt-1 list-disc list-inside">
                            <li>Quien es Juan Perez?</li>
                            <li>Muestrame los clientes activos</li>
                            <li>Cuantos clientes hay registrados?</li>
                        </ul>
                    </div>
                </div>
            </div>
            
            <div id="typingIndicator" class="typing-indicator mx-4 mb-2">
                <div class="message-avatar">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>
                <div class="typing-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                </div>
            </div>
            
            <div class="p-4 bg-white border-t">
                <div class="flex gap-3">
                    <input 
                        type="text" 
                        id="messageInput" 
                        placeholder="Escribe tu consulta aqui..."
                        class="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                    <button 
                        id="sendButton"
                        class="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2"
                    >
                        <span>Enviar</span>
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        
        <div class="text-center mt-4 text-gray-500 text-sm">
            Portal de Consulta con IA - Conectado a Google Sheets
        </div>
    </div>

    <script src="/assets/js/chat.js"></script>
</body>
</html>
