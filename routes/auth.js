import express from 'express';
import { userService } from '../services/UserService.js';

const router = express.Router();

// Roles permitidos en el sistema
export const VALID_ROLES = ['admin', 'call center', 'desarrollo', 'customer', 'sales'];

export function normalizeRole(role) {
  if (typeof role !== 'string') return null;
  const normalized = role.trim().toLowerCase();
  return VALID_ROLES.includes(normalized) ? normalized : null;
}

// Middleware de autenticación
export async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Token requerido' });
    }
    
    const token = authHeader.substring(7);
    const decoded = userService.verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Token inválido o expirado' });
    }
    
    const user = await userService.findById(decoded.sub);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, error: 'Usuario no encontrado o inactivo' });
    }
    
    req.user = { ...user, passwordHash: undefined };
    next();
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Error de autenticación' });
  }
}

// Middleware de roles
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Permisos insuficientes' });
    }
    next();
  };
}

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });
    }
    
    const user = await userService.findByUsername(username);
    if (!user) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ success: false, error: 'Cuenta desactivada' });
    }
    
    if (!userService.verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ success: false, error: 'Credenciales inválidas' });
    }
    
    await userService.updateLastLogin(user.id);
    
    const token = userService.generateToken(user);
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ success: true, user: req.user });
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, (req, res) => {
  res.json({ success: true, message: 'Sesión cerrada' });
});

// Admin: POST /api/admin/users - alta de usuario (user + password + rol)
router.post('/admin/users', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { username, password, role, fullName, email } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Usuario y contraseña requeridos' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'La contraseña debe tener al menos 6 caracteres' });
    }

    const normalizedRole = normalizeRole(role);
    if (!normalizedRole) {
      return res.status(400).json({ success: false, error: `Rol inválido. Roles permitidos: ${VALID_ROLES.join(', ')}` });
    }

    const user = await userService.createUser({
      username,
      password,
      role: normalizedRole,
      fullName: fullName || null,
      email: email || `${username}@ia-consulta.local`
    });

    const { passwordHash, ...safeUser } = user;
    res.status(201).json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// Admin/Desarrollo: GET /api/admin/users (lectura para asignar tareas)
router.get('/admin/users', authMiddleware, requireRole('admin', 'desarrollo'), async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo usuarios' });
  }
});

// Admin: PUT /api/admin/users/:id
router.put('/admin/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { fullName, email, role, isActive, password } = req.body;

    if (role !== undefined) {
      const normalizedRole = normalizeRole(role);
      if (!normalizedRole) {
        return res.status(400).json({ success: false, error: `Rol inválido. Roles permitidos: ${VALID_ROLES.join(', ')}` });
      }
      req.body.role = normalizedRole;
    }

    if (parseInt(req.params.id) === req.user.id && (isActive !== undefined || role !== undefined)) {
      return res.status(400).json({ success: false, error: 'No puedes cambiar tu propio rol o estado' });
    }

    const user = await userService.updateUser(req.params.id, { fullName, email, role, isActive, password });
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: DELETE /api/admin/users/:id
router.delete('/admin/users/:id', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, error: 'No puedes eliminarte a ti mismo' });
    }
    
    const deleted = await userService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, error: 'Error eliminando usuario' });
  }
});

export default router;