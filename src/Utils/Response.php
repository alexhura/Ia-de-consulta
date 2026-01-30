<?php
namespace App\Utils;

class Response {
    public static function json($data, int $statusCode = 200): void {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        echo json_encode($data);
        exit;
    }
    
    public static function success($data): void {
        self::json([
            'success' => true,
            'data' => $data
        ]);
    }
    
    public static function error(string $message, int $statusCode = 400): void {
        self::json([
            'success' => false,
            'error' => $message
        ], $statusCode);
    }
}
