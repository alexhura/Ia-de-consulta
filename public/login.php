<?php
session_start();

if (isset($_SESSION['user'])) {
    header('Location: /');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if ($username && $password) {
        $user = null;
        
        // Detectar entorno
        if (getenv('PGHOST')) {
            // Replit - PostgreSQL
            require_once __DIR__ . '/../vendor/autoload.php';
            $auth = new \App\Services\AuthService();
            $user = $auth->login($username, $password);
        } else {
            // Cloudways - MySQL
            $pdo = new PDO("mysql:host=localhost;dbname=qcfxqmtkpt;charset=utf8mb4", "qcfxqmtkpt", "gjxv9npMnB");
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1");
            $stmt->execute([$username]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($userData && password_verify($password, $userData['password_hash'])) {
                unset($userData['password_hash']);
                $user = $userData;
            }
        }
        
        if ($user) {
            $_SESSION['user'] = $user;
            header('Location: /');
            exit;
        } else {
            $error = 'Usuario o contraseña incorrectos';
        }
    } else {
        $error = 'Ingresa usuario y contraseña';
    }
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - ADL Digital</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            position: relative;
            overflow: hidden;
        }
        
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: 
                radial-gradient(ellipse at 20% 20%, rgba(0, 212, 255, 0.1) 0%, transparent 50%),
                radial-gradient(ellipse at 80% 80%, rgba(139, 92, 246, 0.1) 0%, transparent 50%);
            pointer-events: none;
        }
        
        .particles {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            overflow: hidden;
            pointer-events: none;
        }
        
        .particle {
            position: absolute;
            width: 4px;
            height: 4px;
            background: rgba(0, 212, 255, 0.5);
            border-radius: 50%;
            animation: float 15s infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(-100vh) rotate(720deg); opacity: 0; }
        }
        
        .login-container {
            position: relative;
            z-index: 1;
            width: 100%;
            max-width: 420px;
            padding: 20px;
        }
        
        .login-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 48px 40px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }
        
        .logo {
            text-align: center;
            margin-bottom: 40px;
        }
        
        .logo-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 36px;
            color: white;
            box-shadow: 0 10px 40px rgba(0, 212, 255, 0.3);
            animation: pulse 3s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { box-shadow: 0 10px 40px rgba(0, 212, 255, 0.3); }
            50% { box-shadow: 0 10px 60px rgba(0, 212, 255, 0.5); }
        }
        
        .logo h1 {
            color: #ffffff;
            font-size: 24px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        
        .logo p {
            color: #6b7280;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 24px;
        }
        
        .form-group label {
            display: block;
            color: #a1a1aa;
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .form-group input {
            width: 100%;
            padding: 16px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            color: #ffffff;
            font-size: 16px;
            font-family: inherit;
            transition: all 0.3s ease;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: rgba(0, 212, 255, 0.5);
            box-shadow: 0 0 20px rgba(0, 212, 255, 0.15);
        }
        
        .form-group input::placeholder {
            color: #4b5563;
        }
        
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #f87171;
            padding: 12px 16px;
            border-radius: 10px;
            font-size: 14px;
            margin-bottom: 24px;
            text-align: center;
        }
        
        .submit-btn {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%);
            border: none;
            border-radius: 12px;
            color: #ffffff;
            font-size: 16px;
            font-weight: 600;
            font-family: inherit;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 20px rgba(0, 212, 255, 0.3);
        }
        
        .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(0, 212, 255, 0.4);
        }
        
        .submit-btn:active {
            transform: translateY(0);
        }
        
        .footer {
            text-align: center;
            margin-top: 32px;
            color: #4b5563;
            font-size: 13px;
        }
        
        @media (max-width: 480px) {
            .login-card {
                padding: 32px 24px;
            }
        }
    </style>
</head>
<body>
    <div class="particles">
        <?php for ($i = 0; $i < 20; $i++): ?>
        <div class="particle" style="left: <?= rand(0, 100) ?>%; animation-delay: <?= rand(0, 15) ?>s; animation-duration: <?= rand(10, 20) ?>s;"></div>
        <?php endfor; ?>
    </div>
    
    <div class="login-container">
        <div class="login-card">
            <div class="logo">
                <div class="logo-icon">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                        <path d="M2 17l10 5 10-5"/>
                        <path d="M2 12l10 5 10-5"/>
                    </svg>
                </div>
                <h1>ADL Digital</h1>
                <p>Portal de Consulta IA</p>
            </div>
            
            <?php if ($error): ?>
            <div class="error-message"><?= htmlspecialchars($error) ?></div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label for="username">Usuario</label>
                    <input type="text" id="username" name="username" placeholder="Ingresa tu usuario" required autofocus>
                </div>
                
                <div class="form-group">
                    <label for="password">Contrasena</label>
                    <input type="password" id="password" name="password" placeholder="Ingresa tu contrasena" required>
                </div>
                
                <button type="submit" class="submit-btn">Iniciar Sesion</button>
            </form>
            
            <div class="footer">
                Powered by ADL IA Assistant
            </div>
        </div>
    </div>
</body>
</html>
