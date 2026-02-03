<?php
$host = getenv('DB_HOST') ?: 'localhost';
$db = getenv('DB_NAME') ?: 'qcfxqmtkpt';
$user = getenv('DB_USER') ?: 'qcfxqmtkpt';
$pass = getenv('DB_PASSWORD') ?: '';
$port = getenv('DB_PORT') ?: '3306';

echo "<h2>Reset Admin Password</h2>";

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
    ]);
    
    echo "Conexion exitosa a la base de datos<br><br>";
    
    $newHash = password_hash('Adldigital*26', PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("UPDATE users SET password_hash = ? WHERE username = 'ADLadmin'");
    $stmt->execute([$newHash]);
    
    if ($stmt->rowCount() > 0) {
        echo "<strong style='color:green'>Password actualizado correctamente!</strong><br><br>";
        echo "Usuario: <strong>ADLadmin</strong><br>";
        echo "Password: <strong>Adldigital*26</strong><br>";
    } else {
        $profileStmt = $pdo->query("SELECT id FROM profiles WHERE name = 'Administrador'");
        $profile = $profileStmt->fetch(PDO::FETCH_ASSOC);
        $profileId = $profile ? $profile['id'] : null;
        
        $insertStmt = $pdo->prepare("INSERT INTO users (username, password_hash, full_name, profile_id, is_admin, is_active) VALUES (?, ?, ?, ?, TRUE, TRUE)");
        $insertStmt->execute(['ADLadmin', $newHash, 'Administrador', $profileId]);
        
        echo "<strong style='color:green'>Usuario ADLadmin creado!</strong><br><br>";
        echo "Usuario: <strong>ADLadmin</strong><br>";
        echo "Password: <strong>Adldigital*26</strong><br>";
    }
    
    echo "<br><strong style='color:red'>IMPORTANTE: Elimina este archivo despues de usarlo!</strong>";
    
} catch (Exception $e) {
    echo "<strong style='color:red'>Error: " . $e->getMessage() . "</strong>";
}
