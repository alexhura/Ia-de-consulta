<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Config;
use App\Services\GoogleSheetsService;
use GuzzleHttp\Client;

try {
    Config::load();
    
    $result = ['step' => 'config', 'status' => 'OK'];
    
    $aiConfig = Config::getAIConfig();
    $result['ai_config'] = [
        'api_key_preview' => substr($aiConfig['api_key'], 0, 12) . '...',
        'base_url' => $aiConfig['base_url'],
        'model' => $aiConfig['model']
    ];
    
    $sheetsService = new GoogleSheetsService();
    $clients = $sheetsService->getAllClients();
    $result['clients_count'] = count($clients);
    
    $client = new Client(['timeout' => 60]);
    $url = rtrim($aiConfig['base_url'], '/') . '/chat/completions';
    
    $result['request_url'] = $url;
    
    $response = $client->post($url, [
        'headers' => [
            'Authorization' => 'Bearer ' . $aiConfig['api_key'],
            'Content-Type' => 'application/json'
        ],
        'json' => [
            'model' => $aiConfig['model'],
            'messages' => [
                ['role' => 'user', 'content' => 'Di hola']
            ],
            'max_tokens' => 20
        ]
    ]);
    
    $data = json_decode($response->getBody()->getContents(), true);
    $result['openai_response'] = $data;
    $result['success'] = true;
    
} catch (\GuzzleHttp\Exception\ClientException $e) {
    $result['error'] = $e->getMessage();
    $result['response_body'] = $e->getResponse()->getBody()->getContents();
    $result['success'] = false;
} catch (\Exception $e) {
    $result['error'] = $e->getMessage();
    $result['error_class'] = get_class($e);
    $result['success'] = false;
}

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
