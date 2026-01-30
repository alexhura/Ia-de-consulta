<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Config;
use App\Services\GoogleSheetsService;
use App\Services\AIService;

$result = [];

try {
    Config::load();
    $result['config'] = 'OK';
    
    $aiConfig = Config::getAIConfig();
    $result['ai_provider'] = $aiConfig['provider'] ?? 'unknown';
    $result['ai_key_preview'] = substr($aiConfig['api_key'], 0, 12) . '...';
    $result['ai_model'] = $aiConfig['model'];
    $result['ai_base_url'] = $aiConfig['base_url'];
    
    $sheetsService = new GoogleSheetsService();
    $clients = $sheetsService->getAllClients();
    $result['clients'] = count($clients);
    
    $aiService = new AIService();
    $result['ai_service'] = 'OK';
    
    $context = $aiService->formatContext(array_slice($clients, 0, 3));
    $result['context_length'] = strlen($context);
    
    $response = $aiService->query($context, 'Hola, cuantos clientes hay?');
    $result['ai_response'] = $response;
    $result['success'] = true;
    
} catch (\Exception $e) {
    $result['error'] = $e->getMessage();
    $result['error_file'] = $e->getFile();
    $result['error_line'] = $e->getLine();
    $result['success'] = false;
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
