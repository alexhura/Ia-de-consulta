import { getSupabase } from './db.js';

// Pipeline de tareas (etapas del PM)
export const PM_STAGES = ['por_iniciar', 'en_progreso', 'en_revision', 'finalizado_sin_errores', 'por_corregir'];
export const PM_STATUSES = ['pendiente', 'en_progreso', 'completado'];
export const PM_PRIORITIES = ['baja', 'media', 'alta'];

const FINALIZADO = 'finalizado_sin_errores';

function sanitize(val, allowed, fallback) {
  return allowed.includes(val) ? val : fallback;
}

async function loadUsersMap() {
  const { data, error } = await getSupabase().from('users').select('id, username, full_name');
  if (error) throw error;
  const map = new Map();
  for (const u of data || []) map.set(u.id, { id: u.id, username: u.username, full_name: u.full_name });
  return map;
}

function addTimestamps(d) {
  if (Object.keys(d).length > 0) d.updated_at = new Date().toISOString();
  return d;
}

function normProject(body) {
  const d = {};
  if (body.client !== undefined) d.client = String(body.client || '').trim();
  for (const f of ['business', 'description', 'email', 'phone', 'services', 'areas', 'url', 'wp_user', 'wp_pass']) {
    if (body[f] !== undefined) d[f] = String(body[f] || '').trim();
  }
  if (body.status !== undefined) d.status = sanitize(body.status, PM_STATUSES, 'pendiente');
  return addTimestamps(d);
}

function normTask(body) {
  const d = {};
  if (body.title !== undefined) d.title = String(body.title || '').trim();
  if (body.description !== undefined) d.description = String(body.description || '').trim();
  if (body.status !== undefined) d.status = sanitize(body.status, PM_STAGES, 'por_iniciar');
  if (body.priority !== undefined) d.priority = sanitize(body.priority, PM_PRIORITIES, 'media');
  if (body.assigned_to !== undefined) d.assigned_to = body.assigned_to ? parseInt(body.assigned_to) : null;
  if (body.due_date !== undefined) d.due_date = body.due_date ? String(body.due_date).slice(0, 10) : null;
  return addTimestamps(d);
}

// Progreso y eficiencia de un proyecto a partir de sus tareas.
// Eficiencia: completadas en tiempo y forma / (en tiempo + fuera de tiempo + por corregir).
function computeMetrics(project, tasks) {
  const total = tasks.length;
  const done = tasks.filter(t => t.status === FINALIZADO).length;
  let onTime = 0;
  let late = 0;
  let corrections = 0;
  for (const t of tasks) {
    corrections += t.corrections || 0;
    if (t.status === FINALIZADO) {
      const deadline = t.due_date ? new Date(t.due_date + 'T23:59:59') : null;
      const completed = t.completed_at ? new Date(t.completed_at) : (deadline || new Date());
      if (deadline && completed > deadline) {
        late += 1;
      } else {
        onTime += 1;
      }
    }
  }
  const judged = onTime + late + corrections;
  const efficiency = judged > 0 ? Math.round((onTime / judged) * 100) : null;
  return {
    ...project,
    tasks,
    task_count: total,
    progress: total > 0 ? Math.round((done / total) * 100) : 0,
    efficiency: efficiency === null ? null : `${efficiency}%`,
    efficiency_raw: efficiency
  };
}

export class PmService {
  async listProjects() {
    const users = await loadUsersMap();

    const { data: projects, error: pErr } = await getSupabase()
      .from('pm_projects')
      .select('*')
      .order('updated_at', { ascending: false })
      .order('id', { ascending: false });
    if (pErr) throw pErr;

    const ids = (projects || []).map(p => p.id);
    const tasks = [];
    if (ids.length > 0) {
      const { data, error: tErr } = await getSupabase()
        .from('pm_tasks')
        .select('*')
        .in('project_id', ids)
        .order('id', { ascending: true });
      if (tErr) throw tErr;
      tasks.push(...(data || []));
    }

    const byProject = new Map();
    for (const t of tasks) {
      if (!byProject.has(t.project_id)) byProject.set(t.project_id, []);
      const owner = t.owner_id ? users.get(t.owner_id) : null;
      const assignee = t.assigned_to ? users.get(t.assigned_to) : null;
      byProject.get(t.project_id).push({
        ...t,
        owner_name: owner ? (owner.full_name || owner.username) : null,
        owner_user: owner ? owner.username : null,
        assigned_name: assignee ? (assignee.full_name || assignee.username) : null,
        assigned_user: assignee ? assignee.username : null
      });
    }

    return (projects || []).map(p => computeMetrics(p, byProject.get(p.id) || []));
  }

  async getProject(id) {
    const { data: project, error } = await getSupabase()
      .from('pm_projects')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) throw error;

    const { data: tasks, error: tErr } = await getSupabase()
      .from('pm_tasks')
      .select('*')
      .eq('project_id', parseInt(id))
      .order('id', { ascending: true });
    if (tErr) throw tErr;

    const users = await loadUsersMap();
    const hydrated = (tasks || []).map(t => {
      const owner = t.owner_id ? users.get(t.owner_id) : null;
      const assignee = t.assigned_to ? users.get(t.assigned_to) : null;
      return {
        ...t,
        owner_name: owner ? (owner.full_name || owner.username) : null,
        owner_user: owner ? owner.username : null,
        assigned_name: assignee ? (assignee.full_name || assignee.username) : null,
        assigned_user: assignee ? assignee.username : null
      };
    });
    return computeMetrics(project, hydrated);
  }

  async addProject(body, userId) {
    if (!body.client || !body.client.trim()) throw new Error('El cliente es requerido');
    const d = normProject(body);
    d.created_by = userId;
    d.status = d.status || 'pendiente';
    delete d.updated_at;
    const fields = {};
    for (const f of ['client', 'business', 'description', 'email', 'phone', 'services', 'areas', 'url', 'wp_user', 'wp_pass', 'status', 'created_by']) {
      fields[f] = d[f];
    }
    const { data, error } = await getSupabase().from('pm_projects').insert(fields).select('*').single();
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
    const { error } = await getSupabase().from('pm_projects').delete().eq('id', parseInt(id));
    if (error) throw error;
    return { success: true };
  }

  async addTask(body, userId) {
    if (!body.title || !body.title.trim()) throw new Error('El título de la tarea es requerido');
    const d = normTask(body);
    const { data, error } = await getSupabase()
      .from('pm_tasks')
      .insert({
        project_id: parseInt(body.project_id),
        title: d.title,
        description: d.description || '',
        status: d.status || 'por_iniciar',
        priority: d.priority || 'media',
        assigned_to: d.assigned_to != null ? d.assigned_to : null,
        due_date: d.due_date || null,
        owner_id: userId
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  // Transición de tarea: controla finalizado (completed_at) y los retornos
  // desde finalizado (cuentan como "por corregir").
  async updateTask(id, body) {
    const { data: cur, error: cErr } = await getSupabase()
      .from('pm_tasks')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (cErr) throw cErr;

    const d = normTask(body);
    if (d.project_id !== undefined) delete d.project_id;

    if (d.status !== undefined && d.status !== cur.status) {
      if (d.status === FINALIZADO && cur.status !== FINALIZADO) {
        d.completed_at = new Date().toISOString();
      } else if (cur.status === FINALIZADO && d.status !== FINALIZADO) {
        d.corrections = (cur.corrections || 0) + 1;
        d.completed_at = null;
      }
    }

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
    const { error } = await getSupabase().from('pm_tasks').delete().eq('id', parseInt(id));
    if (error) throw error;
    return { success: true };
  }

  async getTaskDetail(id) {
    const { data: task, error } = await getSupabase()
      .from('pm_tasks')
      .select('*')
      .eq('id', parseInt(id))
      .single();
    if (error) throw error;

    const users = await loadUsersMap();
    const owner = task.owner_id ? users.get(task.owner_id) : null;
    const assignee = task.assigned_to ? users.get(task.assigned_to) : null;
    const enriched = {
      ...task,
      owner_name: owner ? (owner.full_name || owner.username) : null,
      owner_user: owner ? owner.username : null,
      assigned_name: assignee ? (assignee.full_name || assignee.username) : null,
      assigned_user: assignee ? assignee.username : null
    };

    const { data: comments, error: cErr } = await getSupabase()
      .from('pm_task_comments')
      .select('*')
      .eq('task_id', parseInt(id))
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (cErr) throw cErr;

    const { data: attachments, error: aErr } = await getSupabase()
      .from('pm_task_attachments')
      .select('*')
      .eq('task_id', parseInt(id))
      .order('id', { ascending: true });
    if (aErr) throw aErr;

    return { task: enriched, comments: comments || [], attachments: attachments || [] };
  }

  async addComment(taskId, authorId, authorName, content) {
    if (!content || !content.trim()) throw new Error('El comentario es requerido');
    const { data, error } = await getSupabase()
      .from('pm_task_comments')
      .insert({ task_id: parseInt(taskId), author_id: authorId, author_name: authorName, content: content.trim() })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteComment(id) {
    const { error } = await getSupabase().from('pm_task_comments').delete().eq('id', parseInt(id));
    if (error) throw error;
    return { success: true };
  }

  async addAttachment(taskId, dataUrl) {
    if (!dataUrl) throw new Error('Imagen requerida');
    const { data, error } = await getSupabase()
      .from('pm_task_attachments')
      .insert({ task_id: parseInt(taskId), data_url: dataUrl })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  }

  async deleteAttachment(id) {
    const { error } = await getSupabase().from('pm_task_attachments').delete().eq('id', parseInt(id));
    if (error) throw error;
    return { success: true };
  }
}