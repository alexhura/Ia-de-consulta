<?php
namespace App\Services;

use App\Config\Config;
use GuzzleHttp\Client;

class AIService {
    private Client $client;
    private string $apiKey;
    private string $baseUrl;
    private string $model;
    private string $provider;
    
    public function __construct() {
        $config = Config::getAIConfig();
        
        $this->client = new Client(['timeout' => 60]);
        $this->apiKey = $config['api_key'];
        $this->baseUrl = $config['base_url'];
        $this->model = $config['model'];
        $this->provider = $config['provider'] ?? 'openai';
        
        if (empty($this->apiKey)) {
            error_log("AI Service: Missing API key configuration");
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
            
            $headers = [
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json'
            ];
            
            if ($this->provider === 'openrouter') {
                $headers['HTTP-Referer'] = Config::get('APP_URL', 'https://adl-ia-assistant.com');
                $headers['X-Title'] = 'ADL IA Assistant';
            }
            
            $response = $this->client->post($url, [
                'headers' => $headers,
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
                    'max_tokens' => 2048
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
