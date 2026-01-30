<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Config;
use App\Services\GoogleSheetsService;
use App\Services\AIService;

try {
    Config::load();
    
    $result = ['step' => 'config', 'status' => 'OK'];
    
    $sheetsService = new GoogleSheetsService();
    $result['sheets_service'] = 'OK';
    
    $clients = $sheetsService->getAllClients();
    $result['clients_count'] = count($clients);
    
    $aiService = new AIService();
    $result['ai_service'] = 'OK';
    
    $context = $aiService->formatContext(array_slice($clients, 0, 5));
    $result['context'] = 'OK (length: ' . strlen($context) . ')';
    
    $response = $aiService->query($context, 'Hola, prueba rapida');
    $result['ai_response'] = $response;
    $result['success'] = true;
    
} catch (\Exception $e) {
    $result['error'] = $e->getMessage();
    $result['file'] = $e->getFile();
    $result['line'] = $e->getLine();
    $result['success'] = false;
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
