<?php
namespace App\Config;

class Config {
    private static bool $loaded = false;
    
    public static function load(): void {
        if (self::$loaded) {
            return;
        }
        
        $envFile = __DIR__ . '/../../.env';
        if (file_exists($envFile)) {
            $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
            foreach ($lines as $line) {
                if (strpos(trim($line), '#') === 0) continue;
                if (strpos($line, '=') === false) continue;
                
                list($name, $value) = explode('=', $line, 2);
                $name = trim($name);
                $value = trim($value);
                
                if (!array_key_exists($name, $_ENV)) {
                    $_ENV[$name] = $value;
                }
            }
        }
        
        self::$loaded = true;
    }
    
    public static function get(string $key, $default = null) {
        self::load();
        return $_ENV[$key] ?? getenv($key) ?: $default;
    }
    
    public static function getGoogleCredentials(): string {
        return __DIR__ . '/../../credentials/google-credentials.json';
    }
    
    public static function getSpreadsheetId(): string {
        return self::get('SPREADSHEET_ID', '');
    }
    
    public static function getAIConfig(): array {
        $apiKey = self::get('AI_INTEGRATIONS_OPENAI_API_KEY', '') 
                  ?: self::get('OPENAI_API_KEY', '');
        
        $baseUrl = self::get('AI_INTEGRATIONS_OPENAI_BASE_URL', '') 
                   ?: 'https://api.openai.com/v1';
        
        $model = self::get('AI_INTEGRATIONS_OPENAI_BASE_URL', '') 
                 ? 'gpt-5' 
                 : 'gpt-4o-mini';
        
        return [
            'api_key' => $apiKey,
            'base_url' => $baseUrl,
            'model' => $model
        ];
    }
    
    public static function isDebug(): bool {
        return self::get('APP_DEBUG', 'false') === 'true';
    }
}
