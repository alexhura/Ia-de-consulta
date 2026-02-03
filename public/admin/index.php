<?php
session_start();

if (!isset($_SESSION['user']) || !$_SESSION['user']['is_admin']) {
    header('Location: /login.php');
    exit;
}

require_once __DIR__ . '/../../vendor/autoload.php';

use App\Services\AuthService;

$auth = new AuthService();
$users = $auth->getUsers();
$profiles = $auth->getProfiles();

$activeTab = $_GET['tab'] ?? 'users';
$searchQuery = $_GET['search'] ?? '';
$queryLogs = [];

if ($activeTab === 'logs') {
    $queryLogs = $auth->getQueryLogs($searchQuery);
}

$currentUser = $_SESSION['user'];
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Panel Admin - ADL Digital</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', sans-serif;
            background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
            min-height: 100vh;
            color: #e4e4e7;
        }
        
        .header {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding: 16px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .logo {
            font-size: 20px;
            font-weight: 600;
            color: #00d4ff;
        }
        
        .header-right {
            display: flex;
            align-items: center;
            gap: 16px;
        }
        
        .user-info {
            color: #a1a1aa;
            font-size: 14px;
        }
        
        .btn {
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-family: inherit;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #00d4ff 0%, #8b5cf6 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(0, 212, 255, 0.3);
        }
        
        .btn-primary:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(0, 212, 255, 0.4);
        }
        
        .btn-secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #a1a1aa;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .btn-secondary:hover {
            background: rgba(255, 255, 255, 0.15);
            color: white;
        }
        
        .btn-danger {
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
            border: 1px solid rgba(239, 68, 68, 0.3);
        }
        
        .btn-danger:hover {
            background: rgba(239, 68, 68, 0.3);
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 32px;
        }
        
        .tabs {
            display: flex;
            gap: 8px;
            margin-bottom: 32px;
        }
        
        .tab {
            padding: 12px 24px;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: #a1a1aa;
            text-decoration: none;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .tab:hover {
            background: rgba(255, 255, 255, 0.08);
            color: white;
        }
        
        .tab.active {
            background: rgba(0, 212, 255, 0.15);
            border-color: rgba(0, 212, 255, 0.3);
            color: #00d4ff;
        }
        
        .card {
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
        }
        
        .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .card-title {
            font-size: 18px;
            font-weight: 600;
            color: white;
        }
        
        .search-box {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
        }
        
        .search-input {
            flex: 1;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: white;
            font-size: 14px;
            font-family: inherit;
        }
        
        .search-input:focus {
            outline: none;
            border-color: rgba(0, 212, 255, 0.5);
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 14px 16px;
            text-align: left;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        th {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6b7280;
            font-weight: 600;
        }
        
        td {
            font-size: 14px;
            color: #d1d5db;
        }
        
        tr:hover td {
            background: rgba(255, 255, 255, 0.02);
        }
        
        .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .badge-success {
            background: rgba(34, 197, 94, 0.2);
            color: #4ade80;
        }
        
        .badge-warning {
            background: rgba(234, 179, 8, 0.2);
            color: #facc15;
        }
        
        .badge-info {
            background: rgba(0, 212, 255, 0.2);
            color: #00d4ff;
        }
        
        .badge-danger {
            background: rgba(239, 68, 68, 0.2);
            color: #f87171;
        }
        
        .actions {
            display: flex;
            gap: 8px;
        }
        
        .btn-sm {
            padding: 6px 12px;
            font-size: 12px;
        }
        
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            align-items: center;
            justify-content: center;
        }
        
        .modal.active {
            display: flex;
        }
        
        .modal-content {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 32px;
            width: 100%;
            max-width: 500px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
        }
        
        .modal-title {
            font-size: 20px;
            font-weight: 600;
            color: white;
        }
        
        .modal-close {
            background: none;
            border: none;
            color: #6b7280;
            font-size: 24px;
            cursor: pointer;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            color: #a1a1aa;
            font-size: 14px;
            margin-bottom: 8px;
            font-weight: 500;
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 12px 16px;
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            color: white;
            font-size: 14px;
            font-family: inherit;
        }
        
        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: rgba(0, 212, 255, 0.5);
        }
        
        .form-group select option {
            background: #1a1a2e;
        }
        
        .query-log-item {
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
        }
        
        .query-log-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .query-log-user {
            font-weight: 500;
            color: #00d4ff;
        }
        
        .query-log-date {
            color: #6b7280;
            font-size: 12px;
        }
        
        .query-log-query {
            color: #d1d5db;
            margin-bottom: 8px;
        }
        
        .query-log-response {
            color: #9ca3af;
            font-size: 13px;
            background: rgba(0, 0, 0, 0.2);
            padding: 12px;
            border-radius: 8px;
            max-height: 100px;
            overflow-y: auto;
        }
        
        .profile-permissions {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-top: 8px;
        }
        
        .permission-tag {
            padding: 4px 10px;
            background: rgba(139, 92, 246, 0.2);
            border-radius: 6px;
            font-size: 12px;
            color: #a78bfa;
        }
        
        @media (max-width: 768px) {
            .header { padding: 12px 16px; flex-wrap: wrap; gap: 12px; }
            .container { padding: 16px; }
            .tabs { flex-wrap: wrap; }
            table { font-size: 12px; }
            th, td { padding: 10px 8px; }
            .actions { flex-direction: column; }
        }
    </style>
</head>
<body>
    <header class="header">
        <div class="header-left">
            <span class="logo">ADL Admin</span>
        </div>
        <div class="header-right">
            <span class="user-info"><?= htmlspecialchars($currentUser['full_name'] ?? $currentUser['username']) ?></span>
            <a href="/" class="btn btn-secondary">Ir al Chat</a>
            <a href="/api/logout.php" class="btn btn-secondary">Cerrar Sesion</a>
        </div>
    </header>
    
    <div class="container">
        <div class="tabs">
            <a href="?tab=users" class="tab <?= $activeTab === 'users' ? 'active' : '' ?>">Usuarios</a>
            <a href="?tab=profiles" class="tab <?= $activeTab === 'profiles' ? 'active' : '' ?>">Perfiles</a>
            <a href="?tab=logs" class="tab <?= $activeTab === 'logs' ? 'active' : '' ?>">Consultas</a>
        </div>
        
        <?php if ($activeTab === 'users'): ?>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Gestion de Usuarios</h2>
                <button class="btn btn-primary" onclick="openModal('userModal')">+ Nuevo Usuario</button>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Perfil</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($users as $user): ?>
                    <tr>
                        <td><?= htmlspecialchars($user['username']) ?></td>
                        <td><?= htmlspecialchars($user['full_name'] ?? '-') ?></td>
                        <td><?= htmlspecialchars($user['email'] ?? '-') ?></td>
                        <td><span class="badge badge-info"><?= htmlspecialchars($user['profile_name'] ?? 'Sin perfil') ?></span></td>
                        <td>
                            <?php if ($user['is_active']): ?>
                            <span class="badge badge-success">Activo</span>
                            <?php else: ?>
                            <span class="badge badge-danger">Inactivo</span>
                            <?php endif; ?>
                        </td>
                        <td class="actions">
                            <button class="btn btn-secondary btn-sm" onclick="editUser(<?= htmlspecialchars(json_encode($user)) ?>)">Editar</button>
                            <?php if (!$user['is_admin']): ?>
                            <button class="btn btn-danger btn-sm" onclick="deleteUser(<?= $user['id'] ?>)">Eliminar</button>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <?php elseif ($activeTab === 'profiles'): ?>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Perfiles y Permisos</h2>
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Perfil</th>
                        <th>Descripcion</th>
                        <th>Permisos</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($profiles as $profile): ?>
                    <?php $perms = json_decode($profile['permissions'] ?? '{}', true); ?>
                    <tr>
                        <td><strong><?= htmlspecialchars($profile['name']) ?></strong></td>
                        <td><?= htmlspecialchars($profile['description'] ?? '') ?></td>
                        <td>
                            <div class="profile-permissions">
                                <?php foreach ($perms as $perm => $enabled): ?>
                                    <?php if ($enabled): ?>
                                    <span class="permission-tag"><?= htmlspecialchars($perm) ?></span>
                                    <?php endif; ?>
                                <?php endforeach; ?>
                            </div>
                        </td>
                        <td class="actions">
                            <button class="btn btn-secondary btn-sm" onclick="editProfile(<?= htmlspecialchars(json_encode($profile)) ?>)">Editar Permisos</button>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
        
        <?php elseif ($activeTab === 'logs'): ?>
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Historial de Consultas</h2>
            </div>
            
            <form method="GET" class="search-box">
                <input type="hidden" name="tab" value="logs">
                <input type="text" name="search" class="search-input" placeholder="Buscar por usuario o consulta..." value="<?= htmlspecialchars($searchQuery) ?>">
                <button type="submit" class="btn btn-primary">Buscar</button>
            </form>
            
            <?php if (empty($queryLogs)): ?>
            <p style="color: #6b7280; text-align: center; padding: 40px;">No hay consultas registradas</p>
            <?php else: ?>
            <?php foreach ($queryLogs as $log): ?>
            <div class="query-log-item">
                <div class="query-log-header">
                    <span class="query-log-user"><?= htmlspecialchars($log['full_name'] ?? $log['username']) ?></span>
                    <span class="query-log-date"><?= date('d/m/Y H:i', strtotime($log['created_at'])) ?></span>
                </div>
                <div class="query-log-query"><strong>Consulta:</strong> <?= htmlspecialchars($log['query_text']) ?></div>
                <div class="query-log-response"><?= htmlspecialchars(mb_substr($log['response_text'] ?? '', 0, 300)) ?>...</div>
            </div>
            <?php endforeach; ?>
            <?php endif; ?>
        </div>
        <?php endif; ?>
    </div>
    
    <div id="userModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title" id="userModalTitle">Nuevo Usuario</h3>
                <button class="modal-close" onclick="closeModal('userModal')">&times;</button>
            </div>
            <form id="userForm" onsubmit="saveUser(event)">
                <input type="hidden" id="userId" name="id">
                <div class="form-group">
                    <label>Usuario</label>
                    <input type="text" id="userUsername" name="username" required>
                </div>
                <div class="form-group">
                    <label>Contrasena <small>(dejar vacio para no cambiar)</small></label>
                    <input type="password" id="userPassword" name="password">
                </div>
                <div class="form-group">
                    <label>Nombre Completo</label>
                    <input type="text" id="userFullName" name="full_name">
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" id="userEmail" name="email">
                </div>
                <div class="form-group">
                    <label>Perfil</label>
                    <select id="userProfile" name="profile_id">
                        <option value="">Sin perfil</option>
                        <?php foreach ($profiles as $profile): ?>
                        <option value="<?= $profile['id'] ?>"><?= htmlspecialchars($profile['name']) ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Guardar</button>
            </form>
        </div>
    </div>
    
    <div id="profileModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3 class="modal-title">Editar Permisos</h3>
                <button class="modal-close" onclick="closeModal('profileModal')">&times;</button>
            </div>
            <form id="profileForm" onsubmit="saveProfile(event)">
                <input type="hidden" id="profileId" name="id">
                <p style="color: #a1a1aa; margin-bottom: 20px;" id="profileName"></p>
                <div class="form-group">
                    <label><input type="checkbox" id="permChat" name="chat"> Acceso al Chat</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="permClients" name="clients"> Ver Clientes</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="permUsers" name="users"> Gestionar Usuarios</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="permLogs" name="logs"> Ver Consultas</label>
                </div>
                <div class="form-group">
                    <label><input type="checkbox" id="permAdmin" name="admin"> Administrador Total</label>
                </div>
                <button type="submit" class="btn btn-primary" style="width: 100%;">Guardar Permisos</button>
            </form>
        </div>
    </div>
    
    <script>
        function openModal(id) {
            document.getElementById(id).classList.add('active');
        }
        
        function closeModal(id) {
            document.getElementById(id).classList.remove('active');
        }
        
        function editUser(user) {
            document.getElementById('userModalTitle').textContent = 'Editar Usuario';
            document.getElementById('userId').value = user.id;
            document.getElementById('userUsername').value = user.username;
            document.getElementById('userPassword').value = '';
            document.getElementById('userFullName').value = user.full_name || '';
            document.getElementById('userEmail').value = user.email || '';
            document.getElementById('userProfile').value = user.profile_id || '';
            openModal('userModal');
        }
        
        function editProfile(profile) {
            const perms = JSON.parse(profile.permissions || '{}');
            document.getElementById('profileId').value = profile.id;
            document.getElementById('profileName').textContent = 'Perfil: ' + profile.name;
            document.getElementById('permChat').checked = perms.chat || false;
            document.getElementById('permClients').checked = perms.clients || false;
            document.getElementById('permUsers').checked = perms.users || false;
            document.getElementById('permLogs').checked = perms.logs || false;
            document.getElementById('permAdmin').checked = perms.admin || false;
            openModal('profileModal');
        }
        
        async function saveUser(e) {
            e.preventDefault();
            const form = document.getElementById('userForm');
            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            
            const response = await fetch('/api/admin/users.php', {
                method: data.id ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                location.reload();
            } else {
                const error = await response.json();
                alert(error.error || 'Error al guardar');
            }
        }
        
        async function deleteUser(id) {
            if (!confirm('Deseas desactivar este usuario?')) return;
            
            const response = await fetch('/api/admin/users.php?id=' + id, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                location.reload();
            }
        }
        
        async function saveProfile(e) {
            e.preventDefault();
            const data = {
                id: document.getElementById('profileId').value,
                permissions: {
                    chat: document.getElementById('permChat').checked,
                    clients: document.getElementById('permClients').checked,
                    users: document.getElementById('permUsers').checked,
                    logs: document.getElementById('permLogs').checked,
                    admin: document.getElementById('permAdmin').checked
                }
            };
            
            const response = await fetch('/api/admin/profiles.php', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                location.reload();
            }
        }
        
        document.getElementById('userModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal('userModal');
        });
        
        document.getElementById('profileModal').addEventListener('click', function(e) {
            if (e.target === this) closeModal('profileModal');
        });
    </script>
</body>
</html>
