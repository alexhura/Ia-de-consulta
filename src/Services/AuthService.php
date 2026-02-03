<?php

namespace App\Services;

use PDO;

class AuthService
{
    private ?PDO $pdo = null;
    private string $dbType = 'pgsql';
    
    public function __construct()
    {
        $this->connect();
    }
    
    private function connect(): void
    {
        $pgHost = $_ENV['PGHOST'] ?? getenv('PGHOST');
        $pgPort = $_ENV['PGPORT'] ?? getenv('PGPORT') ?: '5432';
        $pgDb = $_ENV['PGDATABASE'] ?? getenv('PGDATABASE');
        $pgUser = $_ENV['PGUSER'] ?? getenv('PGUSER');
        $pgPass = $_ENV['PGPASSWORD'] ?? getenv('PGPASSWORD');
        
        if ($pgHost && $pgDb && $pgUser) {
            try {
                $dsn = "pgsql:host=$pgHost;port=$pgPort;dbname=$pgDb";
                $this->pdo = new PDO($dsn, $pgUser, $pgPass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]);
                $this->dbType = 'pgsql';
                return;
            } catch (\Exception $e) {
                error_log("PostgreSQL connection error: " . $e->getMessage());
            }
        }
        
        $mysqlHost = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?: 'localhost';
        $mysqlDb = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?: 'qcfxqmtkpt';
        $mysqlUser = $_ENV['DB_USER'] ?? getenv('DB_USER') ?: 'qcfxqmtkpt';
        $mysqlPass = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD') ?: 'gjxv9npMnB';
        
        try {
            $port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';
            $dsn = "mysql:host=$mysqlHost;port=$port;dbname=$mysqlDb;charset=utf8mb4";
            $this->pdo = new PDO($dsn, $mysqlUser, $mysqlPass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ]);
            $this->dbType = 'mysql';
            return;
        } catch (\Exception $e) {
            error_log("MySQL connection error: " . $e->getMessage());
        }
    }
    
    private function getActiveCondition(): string
    {
        return $this->dbType === 'pgsql' ? 'TRUE' : '1';
    }
    
    public function login(string $username, string $password): ?array
    {
        if (!$this->pdo) return null;
        
        $active = $this->getActiveCondition();
        $stmt = $this->pdo->prepare("
            SELECT u.*, p.name as profile_name, p.permissions 
            FROM users u 
            LEFT JOIN profiles p ON u.profile_id = p.id 
            WHERE u.username = ? AND u.is_active = $active
        ");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password_hash'])) {
            unset($user['password_hash']);
            return $user;
        }
        
        return null;
    }
    
    public function createUser(array $data): ?int
    {
        if (!$this->pdo) return null;
        
        $stmt = $this->pdo->prepare("
            INSERT INTO users (username, password_hash, full_name, email, profile_id, is_admin) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $data['username'],
            password_hash($data['password'], PASSWORD_DEFAULT),
            $data['full_name'] ?? null,
            $data['email'] ?? null,
            $data['profile_id'] ?? null,
            $data['is_admin'] ?? false
        ]);
        
        return (int) $this->pdo->lastInsertId();
    }
    
    public function updateUser(int $id, array $data): bool
    {
        if (!$this->pdo) return false;
        
        $fields = [];
        $values = [];
        
        if (isset($data['full_name'])) {
            $fields[] = "full_name = ?";
            $values[] = $data['full_name'];
        }
        if (isset($data['email'])) {
            $fields[] = "email = ?";
            $values[] = $data['email'];
        }
        if (isset($data['profile_id'])) {
            $fields[] = "profile_id = ?";
            $values[] = $data['profile_id'];
        }
        if (isset($data['is_active'])) {
            $fields[] = "is_active = ?";
            $values[] = $data['is_active'];
        }
        if (!empty($data['password'])) {
            $fields[] = "password_hash = ?";
            $values[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (empty($fields)) return false;
        
        $fields[] = "updated_at = CURRENT_TIMESTAMP";
        $values[] = $id;
        
        $sql = "UPDATE users SET " . implode(", ", $fields) . " WHERE id = ?";
        $stmt = $this->pdo->prepare($sql);
        return $stmt->execute($values);
    }
    
    public function deleteUser(int $id): bool
    {
        if (!$this->pdo) return false;
        
        $stmt = $this->pdo->prepare("UPDATE users SET is_active = FALSE WHERE id = ? AND is_admin = FALSE");
        return $stmt->execute([$id]);
    }
    
    public function getUsers(): array
    {
        if (!$this->pdo) return [];
        
        $stmt = $this->pdo->query("
            SELECT u.id, u.username, u.full_name, u.email, u.is_admin, u.is_active, u.created_at,
                   p.name as profile_name, p.id as profile_id
            FROM users u 
            LEFT JOIN profiles p ON u.profile_id = p.id 
            ORDER BY u.created_at DESC
        ");
        return $stmt->fetchAll();
    }
    
    public function getUser(int $id): ?array
    {
        if (!$this->pdo) return null;
        
        $stmt = $this->pdo->prepare("
            SELECT u.*, p.name as profile_name 
            FROM users u 
            LEFT JOIN profiles p ON u.profile_id = p.id 
            WHERE u.id = ?
        ");
        $stmt->execute([$id]);
        return $stmt->fetch() ?: null;
    }
    
    public function getProfiles(): array
    {
        if (!$this->pdo) return [];
        
        $stmt = $this->pdo->query("SELECT * FROM profiles ORDER BY name");
        return $stmt->fetchAll();
    }
    
    public function updateProfile(int $id, array $data): bool
    {
        if (!$this->pdo) return false;
        
        $stmt = $this->pdo->prepare("
            UPDATE profiles SET permissions = ? WHERE id = ?
        ");
        return $stmt->execute([json_encode($data['permissions']), $id]);
    }
    
    public function logQuery(int $userId, string $query, string $response): void
    {
        if (!$this->pdo) return;
        
        $stmt = $this->pdo->prepare("
            INSERT INTO query_logs (user_id, query_text, response_text) VALUES (?, ?, ?)
        ");
        $stmt->execute([$userId, $query, $response]);
    }
    
    public function getQueryLogs(string $search = '', int $limit = 100): array
    {
        if (!$this->pdo) return [];
        
        $sql = "
            SELECT q.*, u.username, u.full_name 
            FROM query_logs q 
            JOIN users u ON q.user_id = u.id
        ";
        
        $params = [];
        if ($search) {
            $sql .= " WHERE q.query_text LIKE ? OR u.username LIKE ? OR u.full_name LIKE ?";
            $searchParam = "%$search%";
            $params = [$searchParam, $searchParam, $searchParam];
        }
        
        $sql .= " ORDER BY q.created_at DESC LIMIT " . intval($limit);
        
        $stmt = $this->pdo->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetchAll();
    }
    
    public function initAdminUser(): void
    {
        if (!$this->pdo) return;
        
        $stmt = $this->pdo->prepare("SELECT id FROM users WHERE username = ?");
        $stmt->execute(['ADLadmin']);
        
        if (!$stmt->fetch()) {
            $profileStmt = $this->pdo->prepare("SELECT id FROM profiles WHERE name = ?");
            $profileStmt->execute(['Administrador']);
            $profile = $profileStmt->fetch();
            
            $this->createUser([
                'username' => 'ADLadmin',
                'password' => 'Adldigital*26',
                'full_name' => 'Administrador',
                'profile_id' => $profile['id'] ?? null,
                'is_admin' => true
            ]);
        }
    }
}
