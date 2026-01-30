<?php
namespace App\Services;

use App\Config\Config;
use GuzzleHttp\Client;

class AIService {
    private Client $client;
    private string $apiKey;
    private string $baseUrl;
    private string $model;
    
    public function __construct() {
        $config = Config::getAIConfig();
        
        $this->client = new Client(['timeout' => 60]);
        $this->apiKey = $config['api_key'];
        $this->baseUrl = $config['base_url'];
        $this->model = $config['model'];
        
        if (empty($this->baseUrl) || empty($this->apiKey)) {
            error_log("AI Service: Missing AI_INTEGRATIONS_OPENAI_BASE_URL or AI_INTEGRATIONS_OPENAI_API_KEY");
        }
    }
    
    public function query(string $context, string $userMessage): string {
        $systemPrompt = "Eres un asistente virtual especializado en consultar informacion de clientes.

INSTRUCCIONES:
- Responde unicamente con la informacion disponible en los datos proporcionados
- Si no tienes la informacion, dilo claramente
- Se conciso y directo en tus respuestas
- Si hay multiples coincidencias, mencionalas todas
- Usa un tono profesional y amigable
- Responde siempre en espanol

DATOS DISPONIBLES:
" . $context;

        try {
            $url = rtrim($this->baseUrl, '/') . '/chat/completions';
            
            $response = $this->client->post($url, [
                'headers' => [
                    'Authorization' => 'Bearer ' . $this->apiKey,
                    'Content-Type' => 'application/json'
                ],
                'json' => [
                    'model' => $this->model,
                    'messages' => [
                        [
                            'role' => 'system',
                            'content' => $systemPrompt
                        ],
                        [
                            'role' => 'user',
                            'content' => $userMessage
                        ]
                    ],
                    'max_completion_tokens' => 8192
                ]
            ]);
            
            $data = json_decode($response->getBody()->getContents(), true);
            return $data['choices'][0]['message']['content'] ?? 'No pude generar una respuesta';
            
        } catch (\Exception $e) {
            error_log("Error en AI API: " . $e->getMessage());
            return "Error al procesar tu consulta. Por favor intenta de nuevo.";
        }
    }
    
    public function formatContext(array $clients): string {
        if (empty($clients)) {
            return "No hay datos de clientes disponibles.";
        }
        
        $context = "Lista de clientes:\n\n";
        
        foreach ($clients as $index => $client) {
            $context .= "Cliente " . ($index + 1) . ":\n";
            foreach ($client as $key => $value) {
                $context .= "  - $key: $value\n";
            }
            $context .= "\n";
        }
        
        return $context;
    }
}
