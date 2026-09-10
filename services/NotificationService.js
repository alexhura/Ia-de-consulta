// Desarrollado por: Ing. Alejandro Huerta — https://alejandrohr.com
import { getSupabase } from './db.js';

// Un anuncio con target_roles vacío/nulo es visible para todos los roles.
function visibleTo(targetRoles, role) {
  if (!targetRoles || targetRoles.length === 0) return true;
  return targetRoles.includes(role);
}

export class NotificationService {
  async listForUser(userId, role) {
    const supabase = getSupabase();

    // Con target_user_id (columna nueva para tareas asignadas). Si la columna
    // aún no existe (ALTER pendiente), reintenta sin ella para no romper la
    // campanita.
    let query = supabase
      .from('notifications')
      .select('id, title, message, target_roles, target_user_id, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    let notifs = await query;
    if (notifs.error) {
      query = supabase
        .from('notifications')
        .select('id, title, message, target_roles, created_by, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      notifs = await query;
    }

    const [reads] = await Promise.all([
      supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', userId)
        .limit(1000)
    ]);

    if (notifs.error) throw notifs.error;
    if (reads.error) throw reads.error;

    const readSet = new Set((reads.data || []).map(r => r.notification_id));

    // Una notificación es visible si:
    //  - fue dirigida a este usuario específico (target_user_id), o
    //  - es general/por rol (sin target_user_id) y el rol del usuario califica.
    const list = (notifs.data || [])
      .filter(n => {
        if (n.target_user_id != null) return n.target_user_id === userId;
        return visibleTo(n.target_roles, role);
      })
      .map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        createdAt: n.created_at,
        read: readSet.has(n.id)
      }));

    return { list, unreadCount: list.filter(n => !n.read).length };
  }

  // Marca como leídos los anuncios listados (se llama también para "leer todo").
  async markRead(userId, ids) {
    if (!ids || ids.length === 0) return;
    const supabase = getSupabase();

    const rows = ids.map(notification_id => ({ user_id: userId, notification_id }));
    const { error } = await supabase
      .from('notification_reads')
      .upsert(rows, { onConflict: 'user_id,notification_id', ignoreDuplicates: true });
    if (error) throw error;
  }

  async create({ title, message, targetRoles, targetUserId, createdBy }) {
    const supabase = getSupabase();

    const row = { title, message, created_by: createdBy };
    if (targetRoles && targetRoles.length > 0) {
      row.target_roles = targetRoles;
    }
    if (targetUserId != null) {
      row.target_user_id = targetUserId;
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(row)
      .select()
      .single();
    if (error) throw error;

    return {
      id: data.id,
      title: data.title,
      message: data.message,
      targetRoles: data.target_roles,
      targetUserId: data.target_user_id,
      createdAt: data.created_at
    };
  }

  // Lista completa (solo admin) para gestionar anuncios publicados.
  async listAll() {
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, target_roles, created_by, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) throw error;

    return (data || []).map(n => ({
      id: n.id,
      title: n.title,
      message: n.message,
      targetRoles: n.target_roles,
      createdAt: n.created_at
    }));
  }
}

export const notificationService = new NotificationService();