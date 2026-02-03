<?php
session_start();

if (isset($_SESSION['user'])) {
    header('Location: /');
    exit;
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $pdo = new PDO("mysql:host=localhost;dbname=qcfxqmtkpt;charset=utf8mb4", "qcfxqmtkpt", "gjxv9npMnB");
    $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_active = 1");
    $stmt->execute([$_POST['username']]);
    $userData = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($userData && password_verify($_POST['password'], $userData['password_hash'])) {
        unset($userData['password_hash']);
        $_SESSION['user'] = $userData;
        header('Location: /');
        exit;
    }
    $error = 'Usuario o contraseña incorrectos';
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
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .login-container { width: 100%; max-width: 420px; padding: 20px; }
        .login-card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border-radius: 24px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 48px 40px;
        }
        .logo { text-align: center; margin-bottom: 40px; }
        .logo-icon {
            width: 80px; height: 80px;
            background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%);
            border-radius: 20px;
            display: flex; align-items: center; justify-content: center;
            margin: 0 auto 20px;
            color: white;
        }
        .logo h1 { color: #ffffff; font-size: 24px; margin-bottom: 8px; }
        .logo p { color: #6b7280; font-size: 14px; }
        .form-group { margin-bottom: 24px; }
        .form-group label { display: block; color: #a1a1aa; font-size: 14px; margin-bottom: 8px; }
        .form-group input {
            width: 100%; padding: 16px 20px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px; color: #ffffff; font-size: 16px;
        }
        .form-group input:focus { outline: none; border-color: rgba(0, 212, 255, 0.5); }
        .form-group input::placeholder { color: #4b5563; }
        .error-message {
            background: rgba(239, 68, 68, 0.1);
            border: 1px solid rgba(239, 68, 68, 0.3);
            color: #f87171; padding: 12px 16px;
            border-radius: 10px; margin-bottom: 24px; text-align: center;
        }
        .submit-btn {
            width: 100%; padding: 16px;
            background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%);
            border: none; border-radius: 12px;
            color: #ffffff; font-size: 16px; font-weight: 600; cursor: pointer;
        }
        .footer { text-align: center; margin-top: 32px; color: #4b5563; font-size: 13px; }
    </style>
</head>
<body>
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
                    <input type="text" id="username" name="username" placeholder="Ingresa tu usuario" required>
                </div>
                <div class="form-group">
                    <label for="password">Contraseña</label>
                    <input type="password" id="password" name="password" placeholder="Ingresa tu contraseña" required>
                </div>
                <button type="submit" class="submit-btn">Iniciar Sesion</button>
            </form>
            <div class="footer">Powered by ADL IA Assistant</div>
        </div>
    </div>
</body>
</html>
