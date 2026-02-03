<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

if (!isset($_SESSION['user'])) {
    header('Location: /login.php');
    exit;
}

$currentUser = $_SESSION['user'];

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

$greeting = 'Hola colaborador de ADL Digital';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Portal de Consulta</title>
    <link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&family=Inter:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
    <div class="user-header">
        <div class="user-info">
            <span class="user-name"><?= htmlspecialchars($currentUser['full_name'] ?? $currentUser['username']) ?></span>
            <span class="user-profile"><?= htmlspecialchars($currentUser['profile_name'] ?? '') ?></span>
        </div>
        <div class="user-actions">
            <?php if ($currentUser['is_admin']): ?>
            <a href="/admin/" class="header-btn">Panel Admin</a>
            <?php endif; ?>
            <a href="/api/logout.php" class="header-btn header-btn-logout">Salir</a>
        </div>
    </div>
    
    <div class="container">
        <div class="hero" id="heroSection">
            <div class="badge">ADL IA Assistant</div>
            
            <div class="greeting">
                <span class="icon">✺</span>
                <h1><?php echo $greeting; ?></h1>
            </div>
            
            <div class="input-container">
                <input 
                    type="text" 
                    id="messageInput" 
                    placeholder="Como puedo ayudarte hoy?"
                    autocomplete="off"
                />
                <div class="input-actions">
                    <button id="sendButton" class="send-btn" title="Enviar">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="19" x2="12" y2="5"></line>
                            <polyline points="5 12 12 5 19 12"></polyline>
                        </svg>
                    </button>
                </div>
            </div>
            
            <div class="quick-actions">
                <button class="action-btn" data-query="Muestrame todos los clientes">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                    </svg>
                    Clientes
                </button>
                <button class="action-btn" data-query="Clientes activos">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 11 12 14 22 4"></polyline>
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path>
                    </svg>
                    Activos
                </button>
                <button class="action-btn" data-query="Buscar por empresa">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    Buscar
                </button>
                <button class="action-btn" data-query="Estadisticas de clientes">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                    Estadisticas
                </button>
            </div>
        </div>
        
        <div class="chat-section" id="chatSection">
            <button class="back-btn" id="backBtn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Nueva consulta
            </button>
            
            <div id="chatContainer" class="chat-container"></div>
            
            <div class="chat-input-container">
                <input 
                    type="text" 
                    id="chatInput" 
                    placeholder="Escribe tu mensaje..."
                    autocomplete="off"
                />
                <button id="chatSendBtn" class="send-btn">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                    </svg>
                </button>
            </div>
        </div>
    </div>

    <script src="/assets/js/chat.js"></script>
</body>
</html>
