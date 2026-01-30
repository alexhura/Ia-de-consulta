<?php
namespace App\Services;

use App\Config\Config;

class GoogleSheetsService {
    private $service = null;
    private string $spreadsheetId;
    private bool $initialized = false;
    
    public function __construct() {
        $this->spreadsheetId = Config::getSpreadsheetId();
        $this->initialize();
    }
    
    private function initialize(): void {
        $credentialsPath = Config::getGoogleCredentials();
        
        if (!file_exists($credentialsPath) || empty($this->spreadsheetId)) {
            $this->initialized = false;
            return;
        }
        
        try {
            $client = new \Google\Client();
            $client->setApplicationName('Chat Portal');
            $client->setScopes([\Google\Service\Sheets::SPREADSHEETS_READONLY]);
            $client->setAuthConfig($credentialsPath);
            
            $this->service = new \Google\Service\Sheets($client);
            $this->initialized = true;
        } catch (\Exception $e) {
            error_log("Error initializing Google Sheets: " . $e->getMessage());
            $this->initialized = false;
        }
    }
    
    public function isInitialized(): bool {
        return $this->initialized;
    }
    
    public function getSheetData(string $range = 'A1:Z1000'): array {
        if (!$this->initialized) {
            return $this->getDemoData();
        }
        
        try {
            $response = $this->service->spreadsheets_values->get(
                $this->spreadsheetId,
                $range
            );
            
            return $response->getValues() ?? [];
        } catch (\Exception $e) {
            error_log("Error reading Google Sheets: " . $e->getMessage());
            return $this->getDemoData();
        }
    }
    
    public function searchClient(string $query): array {
        $data = $this->getSheetData();
        
        if (empty($data)) {
            return [];
        }
        
        $headers = array_shift($data);
        $results = [];
        
        foreach ($data as $row) {
            $row = array_pad($row, count($headers), '');
            $client = array_combine($headers, $row);
            
            foreach ($client as $field => $value) {
                if (stripos((string)$value, $query) !== false) {
                    $results[] = $client;
                    break;
                }
            }
        }
        
        return $results;
    }
    
    public function getAllClients(): array {
        $data = $this->getSheetData();
        
        if (empty($data)) {
            return [];
        }
        
        $headers = array_shift($data);
        $clients = [];
        
        foreach ($data as $row) {
            $row = array_pad($row, count($headers), '');
            $clients[] = array_combine($headers, $row);
        }
        
        return $clients;
    }
    
    private function getDemoData(): array {
        return [
            ['ID', 'Nombre', 'Email', 'Telefono', 'Empresa', 'Estado', 'Fecha_Registro'],
            ['1', 'Juan Perez', 'juan@empresa.com', '+52 555 123 4567', 'Tech Solutions', 'Activo', '2025-01-15'],
            ['2', 'Maria Garcia', 'maria@comercio.mx', '+52 555 234 5678', 'Comercio Digital', 'Activo', '2025-01-10'],
            ['3', 'Carlos Rodriguez', 'carlos@industrial.com', '+52 555 345 6789', 'Industrial MX', 'Pendiente', '2025-01-08'],
            ['4', 'Ana Martinez', 'ana@startup.io', '+52 555 456 7890', 'StartUp Innovation', 'Activo', '2025-01-05'],
            ['5', 'Roberto Sanchez', 'roberto@logistica.com', '+52 555 567 8901', 'Logistica Express', 'Inactivo', '2024-12-20'],
            ['6', 'Laura Hernandez', 'laura@finanzas.mx', '+52 555 678 9012', 'Finanzas Plus', 'Activo', '2025-01-12'],
            ['7', 'Miguel Torres', 'miguel@construccion.com', '+52 555 789 0123', 'Construcciones MT', 'Activo', '2025-01-18'],
            ['8', 'Patricia Lopez', 'patricia@salud.org', '+52 555 890 1234', 'Salud Integral', 'Pendiente', '2025-01-20']
        ];
    }
}
