import express from 'express';
import { authMiddleware, requireRole, VALID_ROLES } from './auth.js';
import { notificationService } from '../services/NotificationService.js';

const router = express.Router();

// GET /api/notifications — anuncios visibles para el usuario (con estado leído)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { list, unreadCount } = await notificationService.listForUser(req.user.id, req.user.role);
    res.json({ success: true, unreadCount, notifications: list });
  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo notificaciones' });
  }
});

// POST /api/notifications/read — marca como leídos los ids indicados
router.post('/read', authMiddleware, async (req, res) => {
  try {
    const ids = Array.isArray(req.body && req.body.ids) ? req.body.ids : [];
    await notificationService.markRead(req.user.id, ids);
    res.json({ success: true });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ success: false, error: 'Error actualizando notificaciones' });
  }
});

// Admin: GET /api/notifications/admin — todos los anuncios publicados
router.get('/admin', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const notifications = await notificationService.listAll();
    res.json({ success: true, notifications });
  } catch (error) {
    console.error('Error listing all notifications:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo anuncios' });
  }
});

// Admin: POST /api/notifications — publicar un anuncio
router.post('/', authMiddleware, requireRole('admin'), async (req, res) => {
  try {
    const { title, message, targetRoles } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'El título es requerido' });
    }
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'El mensaje es requerido' });
    }
    if (title.trim().length > 200) {
      return res.status(400).json({ success: false, error: 'Título muy largo (máx 200 caracteres)' });
    }
    if (message.trim().length > 5000) {
      return res.status(400).json({ success: false, error: 'Mensaje muy largo (máx 5000 caracteres)' });
    }

    const roles = Array.isArray(targetRoles)
      ? targetRoles.filter(r => VALID_ROLES.includes(r))
      : [];

    const notification = await notificationService.create({
      title: title.trim(),
      message: message.trim(),
      targetRoles: roles,
      createdBy: req.user.id
    });

    res.status(201).json({ success: true, notification });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ success: false, error: 'Error publicando el anuncio' });
  }
});

export default router;