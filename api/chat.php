<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-cache, no-store, must-revalidate');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Config;
use App\Services\GoogleSheetsService;
use App\Services\AIService;

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

try {
    $sheetsService = new GoogleSheetsService();
    $aiService = new AIService();
    
    $clients = $sheetsService->searchClient($userMessage);
    
    if (empty($clients)) {
        $clients = $sheetsService->getAllClients();
    }
    
    $context = $aiService->formatContext(array_slice($clients, 0, 20));
    
    $response = $aiService->query($context, $userMessage);
    
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
