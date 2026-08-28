import { getSupabase } from './db.js';

// Un anuncio con target_roles vacío/nulo es visible para todos los roles.
function visibleTo(targetRoles, role) {
  if (!targetRoles || targetRoles.length === 0) return true;
  return targetRoles.includes(role);
}

export class NotificationService {
  async listForUser(userId, role) {
    const supabase = getSupabase();

    const [notifs, reads] = await Promise.all([
      supabase
        .from('notifications')
        .select('id, title, message, target_roles, created_by, created_at')
        .order('created_at', { ascending: false })
        .limit(100),
      supabase
        .from('notification_reads')
        .select('notification_id')
        .eq('user_id', userId)
        .limit(1000)
    ]);

    if (notifs.error) throw notifs.error;
    if (reads.error) throw reads.error;

    const readSet = new Set((reads.data || []).map(r => r.notification_id));

    const list = (notifs.data || [])
      .filter(n => visibleTo(n.target_roles, role))
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

  async create({ title, message, targetRoles, createdBy }) {
    const supabase = getSupabase();

    const row = { title, message, created_by: createdBy };
    if (targetRoles && targetRoles.length > 0) {
      row.target_roles = targetRoles;
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