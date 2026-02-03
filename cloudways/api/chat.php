<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'No autenticado']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Metodo no permitido']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$message = trim($input['message'] ?? '');

if (empty($message)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Mensaje vacio']);
    exit;
}

try {
    $envFile = __DIR__ . '/../../.env';
    $apiKey = '';
    if (file_exists($envFile)) {
        $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
        foreach ($lines as $line) {
            if (strpos($line, 'OPENROUTER_API_KEY=') === 0) {
                $apiKey = trim(substr($line, 19));
            }
        }
    }
    
    if (empty($apiKey)) {
        throw new Exception('API key no configurada');
    }
    
    $systemPrompt = "Eres un asistente virtual especializado en consultar informacion de clientes para ADL Digital.

INSTRUCCIONES:
- Responde unicamente con la informacion disponible en los datos proporcionados
- Si no tienes la informacion, dilo claramente
- Se conciso y directo en tus respuestas
- Si hay multiples coincidencias, mencionalas todas
- Usa un tono profesional y amigable
- Responde siempre en espanol

IDENTIDAD:
- Tu creador es el Ingeniero Alejandro Huerta
- Si te preguntan quien te creo, quien te hizo, quien te desarrollo, quien te programo o cualquier variante similar, siempre responde: 'Fui creado por el Ingeniero Alejandro Huerta'";
    
    $ch = curl_init('https://openrouter.ai/api/v1/chat/completions');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $apiKey,
            'HTTP-Referer: https://adl-ia-assistant.com',
            'X-Title: ADL IA Assistant'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'openai/gpt-4o-mini',
            'messages' => [
                ['role' => 'system', 'content' => $systemPrompt],
                ['role' => 'user', 'content' => $message]
            ],
            'max_completion_tokens' => 2048
        ])
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        throw new Exception('Error en API: ' . $httpCode);
    }
    
    $data = json_decode($response, true);
    $reply = $data['choices'][0]['message']['content'] ?? 'Sin respuesta';
    
    echo json_encode(['success' => true, 'response' => $reply]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
