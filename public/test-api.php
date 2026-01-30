<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Config;

Config::load();

$apiKey = getenv('OPENAI_API_KEY') ?: ($_ENV['OPENAI_API_KEY'] ?? 'NOT FOUND');
$masked = $apiKey !== 'NOT FOUND' ? substr($apiKey, 0, 10) . '...' : 'NOT FOUND';

$result = [
    'status' => 'ok',
    'api_key_found' => $apiKey !== 'NOT FOUND',
    'api_key_preview' => $masked,
    'php_version' => PHP_VERSION,
    'env_file_exists' => file_exists(__DIR__ . '/../.env'),
];

if ($apiKey !== 'NOT FOUND') {
    $ch = curl_init('https://api.openai.com/v1/models');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    $result['openai_test'] = [
        'http_code' => $httpCode,
        'success' => $httpCode === 200
    ];
}

echo json_encode($result, JSON_PRETTY_PRINT);
