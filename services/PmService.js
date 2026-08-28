import { getSupabase } from './db.js';

// STATUS / PRIORIDAD permitidos
export const PM_STATUSES = ['pendiente', 'en_progreso', 'completado'];
export const PM_PRIORITIES = ['baja', 'media', 'alta'];

function sanitize(val, allowed, fallback) {
  return allowed.includes(val) ? val : fallback;
}

// Normaliza campos que llegan del body (proyectos o tareas)
function normProject(body) {
  const d = {};
  if (body.client !== undefined) d.client = String(body.client || '').trim();
  if (body.description !== undefined) d.description = String(body.description || '');
  if (body.status !== undefined) d.status = sanitize(body.status, PM_STATUSES, 'pendiente');
  if (Object.keys(d).length > 0) d.updated_at = new Date().toISOString();
  return d;
}

function normTask(body) {
  const d = {};
  if (body.project_id !== undefined) d.project_id = parseInt(body.project_id);
  if (body.title !== undefined) d.title = String(body.title || '').trim();
  if (body.description !== undefined) d.description = String(body.description || '');
  if (body.status !== undefined) d.status = sanitize(body.status, PM_STATUSES, 'pendiente');
  if (body.priority !== undefined) d.priority = sanitize(body.priority, PM_PRIORITIES, 'media');
  if (Object.keys(d).length > 0) d.updated_at = new Date().toISOString();
  return d;
}

export class PmService {
  async listProjects() {
    const { data, error } = await getSupabase()
      .from('pm_projects')
      .select('*, pm_tasks(*)')
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false });
    if (error) throw error;
    return (data || []).map(p => ({
      ...p,
      tasks: (p.pm_tasks || []).sort((a, b) => a.id - b.id)
    }));
  }

  async addProject(body, userId) {
    const d = normProject(body);
    if (!d.client) throw new Error('El cliente es requerido');
    d.created_by = userId;
    d.status = d.status || 'pendiente';
    d.updated_at = undefined;
    const { data, error } = await getSupabase()
      .from('pm_projects')
      .insert({ client: d.client, description: d.description || '', status: d.status, created_by: userId })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateProject(id, body) {
    const d = normProject(body);
    if (Object.keys(d).length === 0) throw new Error('Sin datos para actualizar');
    const { data, error } = await getSupabase()
      .from('pm_projects')
      .update(d)
      .eq('id', parseInt(id))
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteProject(id) {
    const { error } = await getSupabase()
      .from('pm_projects')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return { success: true };
  }

  async addTask(body) {
    const d = normTask(body);
    if (!d.project_id) throw new Error('El proyecto es requerido');
    if (!d.title) throw new Error('El título de la tarea es requerido');
    const { data, error } = await getSupabase()
      .from('pm_tasks')
      .insert({
        project_id: d.project_id,
        title: d.title,
        description: d.description || '',
        status: d.status || 'pendiente',
        priority: d.priority || 'media'
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async updateTask(id, body) {
    const d = normTask(body);
    if (d.project_id !== undefined) delete d.project_id;
    if (Object.keys(d).length === 0) throw new Error('Sin datos para actualizar');
    const { data, error } = await getSupabase()
      .from('pm_tasks')
      .update(d)
      .eq('id', parseInt(id))
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteTask(id) {
    const { error } = await getSupabase()
      .from('pm_tasks')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;
    return { success: true };
  }
}