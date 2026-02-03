<?php
ini_set('session.cookie_httponly', 1);
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_path', '/');
session_start();
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit();
}

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Config\Config;
use App\Services\GoogleSheetsService;
use App\Services\AIService;
use App\Services\AuthService;

Config::load();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Metodo no permitido']);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['message']) || empty(trim($input['message']))) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Mensaje vacio']);
    exit();
}

$userMessage = trim($input['message']);

if (strlen($userMessage) > 2000) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Mensaje demasiado largo (max 2000 caracteres)']);
    exit();
}

try {
    $sheetsService = new GoogleSheetsService();
    $aiService = new AIService();
    
    $clients = $sheetsService->searchClient($userMessage);
    
    if (empty($clients)) {
        $clients = $sheetsService->getAllClients();
    }
    
    $context = $aiService->formatContext(array_slice($clients, 0, 20));
    
    $response = $aiService->query($context, $userMessage);
    
    $authService = new AuthService();
    $authService->logQuery($_SESSION['user']['id'], $userMessage, $response);
    
    echo json_encode([
        'success' => true,
        'response' => $response,
        'timestamp' => date('c'),
        'results_count' => count($clients)
    ]);
    
} catch (\Exception $e) {
    error_log("Error en chat.php: " . $e->getMessage());
    
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Error interno del servidor',
        'message' => Config::isDebug() ? $e->getMessage() : null
    ]);
}
