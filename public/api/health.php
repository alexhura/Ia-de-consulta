<?php
header('Content-Type: application/json');
header('Cache-Control: no-cache, no-store, must-revalidate');

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Config\Config;
use App\Services\GoogleSheetsService;

Config::load();

$sheetsService = new GoogleSheetsService();

echo json_encode([
    'status' => 'ok',
    'timestamp' => date('c'),
    'services' => [
        'google_sheets' => $sheetsService->isInitialized() ? 'connected' : 'demo_mode',
        'ai' => !empty(Config::get('AI_INTEGRATIONS_OPENAI_API_KEY')) ? 'configured' : 'not_configured'
    ]
]);
