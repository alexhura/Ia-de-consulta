<?php
require_once __DIR__ . '/../vendor/autoload.php';

$host = $_ENV['DB_HOST'] ?? getenv('DB_HOST');
$db = $_ENV['DB_NAME'] ?? getenv('DB_NAME');
$user = $_ENV['DB_USER'] ?? getenv('DB_USER');
$pass = $_ENV['DB_PASSWORD'] ?? getenv('DB_PASSWORD');
$port = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?: '3306';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    $newHash = password_hash('Adldigital*26', PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'ADLadmin'");
    $result = $stmt->execute([$newHash]);
    
    if ($stmt->rowCount() > 0) {
        echo "Password actualizado correctamente para ADLadmin<br>";
        echo "Usuario: ADLadmin<br>";
        echo "Password: Adldigital*26<br>";
        echo "<br><strong>IMPORTANTE: Elimina este archivo despues de usarlo!</strong>";
    } else {
        $profileStmt = $pdo->query("SELECT id FROM profiles WHERE name = 'Administrador'");
        $profile = $profileStmt->fetch(PDO::FETCH_ASSOC);
        $profileId = $profile ? $profile['id'] : null;
        
        $insertStmt = $pdo->prepare("INSERT INTO users (username, password_hash, full_name, profile_id, is_admin, is_active) VALUES (?, ?, ?, ?, TRUE, TRUE)");
        $insertStmt->execute(['ADLadmin', $newHash, 'Administrador', $profileId]);
        
        echo "Usuario ADLadmin creado correctamente<br>";
        echo "Usuario: ADLadmin<br>";
        echo "Password: Adldigital*26<br>";
        echo "<br><strong>IMPORTANTE: Elimina este archivo despues de usarlo!</strong>";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage();
}
