// Desarrollado por: Ing. Alejandro Huerta — https://alejandrohr.com
import { getSupabase } from './db.js';

// Pipeline de tareas (etapas del PM)
export const PM_STAGES = ['por_iniciar', 'en_progreso', 'en_revision', 'finalizado_sin_errores', 'por_corregir'];
export const PM_STATUSES = ['pendiente', 'en_progreso', 'completado'];
export const PM_PRIORITIES = ['baja', 'media', 'alta'];

const FINALIZADO = 'finalizado_sin_errores';

function generateToken() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

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
  for (const f of ['business', 'description', 'email', 'email2', 'phone', 'services', 'areas', 'url', 'wp_user', 'wp_pass', 'notif_email', 'notif_email_fb']) {
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
  if (body.notify_client !== undefined) d.notify_client = !!body.notify_client;
  return addTimestamps(d);
}

// Progreso y eficiencia de un proyecto a partir de sus tareas.
// Progreso: promedio del avance de cada tarea según su etapa en el pipeline
// (no solo cuenta "finalizado sin errores").
// Eficiencia: completadas en tiempo y forma / (en tiempo + fuera de tiempo + por corregir).
const PM_STAGE_PROGRESS = {
  por_iniciar: 0,
  en_progreso: 40,
  en_revision: 70,
  finalizado_sin_errores: 100,
  por_corregir: 45
};

function computeMetrics(project, tasks) {
  const total = tasks.length;
  let onTime = 0;
  let late = 0;
  let corrections = 0;
  let progressSum = 0;
  for (const t of tasks) {
    corrections += t.corrections || 0;
    progressSum += PM_STAGE_PROGRESS[t.status] ?? 0;
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
    progress: total > 0 ? Math.round(progressSum / total) : 0,
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

  // Lista todas las tareas activas asignadas a un usuario (ordenadas de más antigua a más reciente)
  async listTasksForUser(userId) {
    const uid = parseInt(userId);
    if (!uid || isNaN(uid)) return [];

    const { data: tasks, error: tErr } = await getSupabase()
      .from('pm_tasks')
      .select('*')
      .eq('assigned_to', uid)
      .neq('status', FINALIZADO)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true });
    if (tErr) throw tErr;

    if (!tasks || tasks.length === 0) return [];

    const projectIds = [...new Set(tasks.map(t => t.project_id).filter(Boolean))];
    let projectMap = new Map();
    if (projectIds.length > 0) {
      const { data: projects, error: pErr } = await getSupabase()
        .from('pm_projects')
        .select('id, client, business, status')
        .in('id', projectIds);
      if (!pErr && projects) {
        projectMap = new Map(projects.map(p => [p.id, p]));
      }
    }

    const users = await loadUsersMap();

    return tasks.map(t => {
      const p = projectMap.get(t.project_id) || {};
      const owner = t.owner_id ? users.get(t.owner_id) : null;
      const assignee = t.assigned_to ? users.get(t.assigned_to) : null;
      return {
        ...t,
        project_client: p.client || null,
        project_business: p.business || null,
        project_status: p.status || null,
        owner_name: owner ? (owner.full_name || owner.username) : null,
        owner_user: owner ? owner.username : null,
        assigned_name: assignee ? (assignee.full_name || assignee.username) : null,
        assigned_user: assignee ? assignee.username : null
      };
    });
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
    d.share_token = d.share_token || generateToken();
    d.share_token_fb = d.share_token_fb || generateToken();

    // Asignar correos predeterminados de automatizaciones si no vienen definidos
    if (!d.notif_email || !d.notif_email_fb) {
      try {
        const globalSettings = await this.getSettings();
        if (!d.notif_email && globalSettings.notif_email) {
          d.notif_email = globalSettings.notif_email;
        }
        if (!d.notif_email_fb && globalSettings.notif_email_fb) {
          d.notif_email_fb = globalSettings.notif_email_fb;
        }
      } catch (e) {
        // Continuar si falla la lectura de settings
      }
    }

    delete d.updated_at;
    const fields = {};
    for (const f of ['client', 'business', 'description', 'email', 'email2', 'phone', 'services', 'areas', 'url', 'wp_user', 'wp_pass', 'notif_email', 'notif_email_fb', 'share_token', 'share_token_fb', 'status', 'created_by']) {
      fields[f] = d[f];
    }
    let result = await getSupabase().from('pm_projects').insert(fields).select('*').single();
    // Si la tabla aún no tiene las columnas nuevas (share_token/notif_email),
    // reintenta solo con los campos base para no romper el alta.
    if (result.error) {
      const base = {};
      for (const f of ['client', 'business', 'description', 'email', 'phone', 'services', 'areas', 'url', 'wp_user', 'wp_pass', 'status', 'created_by']) {
        base[f] = fields[f];
      }
      result = await getSupabase().from('pm_projects').insert(base).select('*').single();
    }
    if (result.error) throw result.error;
    return result.data;
  }

  async updateProject(id, body) {
    const d = normProject(body);
    if (Object.keys(d).length === 0) throw new Error('Sin datos para actualizar');
    let result = await getSupabase()
      .from('pm_projects')
      .update(d)
      .eq('id', parseInt(id))
      .select('*')
      .single();
    // Si la columna email2 aún no existe (ALTER pendiente), reintenta
    // sin ese campo para no romper la edición del proyecto.
    if (result.error && d.email2 !== undefined) {
      const { email2, ...rest } = d;
      result = await getSupabase()
        .from('pm_projects')
        .update(rest)
        .eq('id', parseInt(id))
        .select('*')
        .single();
    }
    if (result.error) throw result.error;
    return result.data;
  }

  async deleteProject(id) {
    const { error } = await getSupabase().from('pm_projects').delete().eq('id', parseInt(id));
    if (error) throw error;
    return { success: true };
  }

  async addTask(body, userId) {
    if (!body.title || !body.title.trim()) throw new Error('El título de la tarea es requerido');
    const d = normTask(body);
    let result = await getSupabase()
      .from('pm_tasks')
      .insert({
        project_id: parseInt(body.project_id),
        title: d.title,
        description: d.description || '',
        status: d.status || 'por_iniciar',
        priority: d.priority || 'media',
        assigned_to: d.assigned_to != null ? d.assigned_to : null,
        due_date: d.due_date || null,
        notify_client: d.notify_client != null ? d.notify_client : false,
        owner_id: userId
      })
      .select('*')
      .single();
    // Si la columna notify_client aún no existe (ALTER pendiente), reintenta
    // sin ese campo para no romper el alta de la tarea.
    if (result.error) {
      result = await getSupabase()
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
    }
    if (result.error) throw result.error;
    return result.data;
  }

  // Devuelve una tarea cruda (sin enriquecer) para comparar antes de actualizar.
  async getTask(id) {
    const { data, error } = await getSupabase()
      .from('pm_tasks')
      .select('*')
      .eq('id', parseInt(id))
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
    let result = await getSupabase()
      .from('pm_tasks')
      .update(d)
      .eq('id', parseInt(id))
      .select('*')
      .single();
    // Si la columna notify_client aún no existe (ALTER pendiente), reintenta
    // sin ese campo para no romper la actualización de la tarea.
    if (result.error && d.notify_client !== undefined) {
      const { notify_client, ...rest } = d;
      result = await getSupabase()
        .from('pm_tasks')
        .update(rest)
        .eq('id', parseInt(id))
        .select('*')
        .single();
    }
    if (result.error) throw result.error;
    return result.data;
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

  // Resuelve el token público de compartir de un proyecto, generándolo si falta.
  async ensureShareToken(projectId) {
    const id = parseInt(projectId);
    const { data, error } = await getSupabase().from('pm_projects').select('share_token').eq('id', id).single();
    if (error) return generateToken();
    if (data && data.share_token) return data.share_token;
    const token = generateToken();
    try {
      await getSupabase().from('pm_projects').update({ share_token: token }).eq('id', id);
    } catch (e) {
      // columna aún no existe: usamos el token en memoria
    }
    return token;
  }

  // Invalida el enlace actual de compartir generando un token nuevo.
  // Así una misma página/enlace solo sirve una vez (uso único).
  async rotateShareToken(projectId) {
    const id = parseInt(projectId);
    const token = generateToken();
    try {
      await getSupabase().from('pm_projects').update({ share_token: token }).eq('id', id);
    } catch (e) {
      // columna aún no existe: el token sigue vigente
    }
    return token;
  }

  // Busca un proyecto por su token público de compartir (devuelve null si no existe).
  async findProjectByToken(token) {
    if (!token) return null;
    const { data, error } = await getSupabase()
      .from('pm_projects')
      .select('*')
      .eq('share_token', token)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  // Token de compartir de redes sociales (Facebook/Instagram). Independiente
  // del token de Google para que cada enlace/mail sea de un solo uso propio.
  async ensureShareTokenFb(projectId) {
    const id = parseInt(projectId);
    const { data, error } = await getSupabase().from('pm_projects').select('share_token_fb').eq('id', id).single();
    if (error) return generateToken();
    if (data && data.share_token_fb) return data.share_token_fb;
    const token = generateToken();
    try {
      await getSupabase().from('pm_projects').update({ share_token_fb: token }).eq('id', id);
    } catch (e) {
      // columna aún no existe: usamos el token en memoria
    }
    return token;
  }

  async rotateShareTokenFb(projectId) {
    const id = parseInt(projectId);
    const token = generateToken();
    try {
      await getSupabase().from('pm_projects').update({ share_token_fb: token }).eq('id', id);
    } catch (e) {
      // columna aún no existe: el token sigue vigente
    }
    return token;
  }

  async findProjectByFbToken(token) {
    if (!token) return null;
    const { data, error } = await getSupabase()
      .from('pm_projects')
      .select('*')
      .eq('share_token_fb', token)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  }

  // Reconstruye/alimenta el share_token de proyectos existentes que no lo tengan.
  async backfillShareTokens() {
    const { data, error } = await getSupabase().from('pm_projects').select('id, share_token');
    if (error) throw error;
    for (const p of data || []) {
      if (!p.share_token) {
        await getSupabase().from('pm_projects').update({ share_token: generateToken() }).eq('id', p.id);
      }
    }
  }

  // Busca el id de un usuario por palabra clave (nombre de usuario o nombre completo).
  async findUserByKeyword(keyword) {
    const term = String(keyword || '').trim().toLowerCase();
    if (!term) return null;
    try {
      const { data, error } = await getSupabase()
        .from('users')
        .select('id, username, full_name')
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
        .limit(1);
      if (!error && data && data[0]) {
        return data[0].id;
      }
    } catch (e) {
      console.warn(`[PmService] No se pudo encontrar usuario para "${term}":`, e.message);
    }
    return null;
  }

  // Carga la configuración global de automatizaciones (emails predeterminados de Google y Facebook).
  async getSettings() {
    // 1. Intentar leer desde tabla pm_settings
    try {
      const { data, error } = await getSupabase()
        .from('pm_settings')
        .select('key, value');
      if (!error && data && data.length > 0) {
        const s = {};
        for (const r of data) s[r.key] = r.value;
        return {
          notif_email: s.notif_email || '',
          notif_email_fb: s.notif_email_fb || ''
        };
      }
    } catch (e) {
      // Seguir al fallback
    }

    // 2. Fallback: categories con nombre '__pm_settings__'
    try {
      const { data, error } = await getSupabase()
        .from('categories')
        .select('description')
        .eq('name', '__pm_settings__')
        .maybeSingle();
      if (!error && data && data.description) {
        const parsed = JSON.parse(data.description);
        return {
          notif_email: parsed.notif_email || '',
          notif_email_fb: parsed.notif_email_fb || ''
        };
      }
    } catch (e) {
      // Ignorar
    }

    return {
      notif_email: '',
      notif_email_fb: ''
    };
  }

  // Guarda la configuración global de automatizaciones (persistente en Supabase).
  async saveSettings(settings) {
    const clean = {
      notif_email: String(settings.notif_email || '').trim(),
      notif_email_fb: String(settings.notif_email_fb || '').trim()
    };

    let saved = false;

    // 1. Intentar guardar en pm_settings
    try {
      const rows = [
        { key: 'notif_email', value: clean.notif_email },
        { key: 'notif_email_fb', value: clean.notif_email_fb }
      ];
      const { error } = await getSupabase()
        .from('pm_settings')
        .upsert(rows);
      if (!error) saved = true;
    } catch (e) {
      // Intentar fallback
    }

    // 2. Guardar en categories como respaldo garantizado
    try {
      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('name', '__pm_settings__')
        .maybeSingle();

      const payload = {
        name: '__pm_settings__',
        description: JSON.stringify(clean),
        icon: '⚙️'
      };

      if (existing) {
        const { error } = await supabase.from('categories').update(payload).eq('id', existing.id);
        if (!error) saved = true;
      } else {
        const { error } = await supabase.from('categories').insert(payload);
        if (!error) saved = true;
      }
    } catch (e) {
      if (!saved) throw e;
    }

    return clean;
  }

  // Busca información de un proyecto en base a la consulta del usuario en el chat de IA.
  // Protege la privacidad omitiendo contraseñas, teléfonos, correos y datos sensibles.
  async findProjectContextForChat(query) {
    if (!query || typeof query !== 'string') return null;
    const raw = query.trim();
    if (!raw) return null;

    const normQuery = raw
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    // Palabras vacías comunes en consultas de proyectos
    const STOP_WORDS = new Set([
      'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas',
      'de', 'del', 'al', 'a', 'en', 'con', 'por', 'para', 'sin', 'sobre',
      'que', 'cual', 'quien', 'como', 'donde', 'cuando', 'cuanto', 'porque',
      'va', 'esta', 'estan', 'estara', 'ha', 'han', 'sido', 'fue', 'era', 'son',
      'proyecto', 'projecto', 'proyectos', 'projectos', 'cliente', 'clientes',
      'negocio', 'empresa', 'sitio', 'web', 'website', 'pagina', 'paginas',
      'one', 'page', 'onepage', 'full', 'fullweb', 'dominio', 'entrega', 'entregado', 'entregada',
      'hola', 'buenas', 'buenos', 'dias', 'tardes', 'noches', 'favor', 'dime', 'saber',
      'tiene', 'tienen', 'cuenta', 'cuentan', 'contratado', 'servicio', 'servicios',
      'informacion', 'info', 'avance', 'estatus', 'status', 'ver', 'revisar'
    ]);

    const isProjectQuery = /(proyecto|projecto|cliente|negocio|one\s*page|full\s*web|dominio|como\s*va|c[oó]mo\s*va|estatus|status|avance|portal\s*de\s*pagos|tienda|sitio\s*web|p[aá]gina)/i.test(raw);

    // Obtener proyectos (solo campos seguros)
    let projects = [];
    try {
      const { data, error } = await getSupabase()
        .from('pm_projects')
        .select('id, client, business, url, status')
        .order('id', { ascending: false });
      if (!error && data) projects = data;
    } catch (e) {
      console.warn('[PmService] Error obteniendo proyectos para el chat:', e.message);
      return null;
    }

    if (!projects.length) return null;

    // Tokens de la consulta
    const queryTokens = normQuery
      .split(/[^a-z0-9]+/)
      .filter(t => t.length >= 3 && !STOP_WORDS.has(t));

    let bestScore = 0;
    let bestProject = null;

    for (const p of projects) {
      const normClient = (p.client || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      const normBusiness = (p.business || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      let score = 0;

      // Coincidencia exacta de frase completa
      if (normClient && normQuery.includes(normClient)) score += 14;
      if (normBusiness && normQuery.includes(normBusiness)) score += 14;

      // Coincidencia por tokens de cliente
      const clientTokens = normClient.split(/[^a-z0-9]+/).filter(t => t.length >= 3);
      for (const t of clientTokens) {
        if (queryTokens.includes(t)) score += 4;
        else if (normQuery.includes(t)) score += 2;
      }

      // Coincidencia por tokens de negocio
      const businessTokens = normBusiness.split(/[^a-z0-9]+/).filter(t => t.length >= 3);
      for (const t of businessTokens) {
        if (queryTokens.includes(t)) score += 4;
        else if (normQuery.includes(t)) score += 2;
      }

      if (score > bestScore) {
        bestScore = score;
        bestProject = p;
      }
    }

    // Si la consulta pregunta explícitamente por un proyecto/cliente pero no hubo coincidencia:
    if (bestScore < 3) {
      if (isProjectQuery && queryTokens.length > 0) {
        return `[BÚSQUEDA DE PROYECTOS]:\nEl usuario preguntó por un proyecto o cliente, pero NO se encontró ningún proyecto registrado en el sistema que coincida con esa búsqueda.\nInstrucción: Informa brevemente que no se encontró ningún proyecto registrado para ese cliente o negocio.`;
      }
      return null;
    }

    // Cargar tareas y comentarios del proyecto encontrado (estrictamente seguro, sin contraseñas ni datos sensibles)
    try {
      const supabase = getSupabase();
      const { data: tasks, error: tErr } = await supabase
        .from('pm_tasks')
        .select('id, project_id, title, description, status, completed_at, updated_at, created_at')
        .eq('project_id', bestProject.id)
        .order('id', { ascending: true });

      if (tErr) throw tErr;

      const taskList = tasks || [];
      const taskIds = taskList.map(t => t.id);

      const commentsMap = new Map();
      if (taskIds.length > 0) {
        const { data: comments } = await supabase
          .from('pm_task_comments')
          .select('task_id, content, created_at')
          .in('task_id', taskIds)
          .order('created_at', { ascending: false });
        for (const c of comments || []) {
          if (!commentsMap.has(c.task_id)) commentsMap.set(c.task_id, []);
          commentsMap.get(c.task_id).push(c.content);
        }
      }

      const totalTasks = taskList.length;
      const completedTasks = taskList.filter(t => t.status === FINALIZADO);
      const progressPercent = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

      const statusMap = {
        'por_iniciar': 'Por iniciar',
        'en_progreso': 'En progreso',
        'en_revision': 'En revisión',
        'por_corregir': 'Por corregir',
        'finalizado_sin_errores': 'Finalizado sin errores'
      };

      function formatDateEs(dStr) {
        if (!dStr) return null;
        try {
          const d = new Date(dStr);
          return new Intl.DateTimeFormat('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            timeZone: 'America/Mexico_City'
          }).format(d);
        } catch (e) {
          return dStr;
        }
      }

      const taskLines = taskList.map((t, idx) => {
        const st = statusMap[t.status] || t.status;
        const compDate = t.status === FINALIZADO && t.completed_at ? formatDateEs(t.completed_at) : null;
        const notes = commentsMap.get(t.id) || [];
        const notesStr = notes.length ? notes.map(n => `"${n.trim()}"`).join(', ') : 'Ninguna';
        return `  ${idx + 1}. Tarea: "${t.title}"
     - Estado: ${st}${compDate ? ` (Entregado / Finalizado el: ${compDate})` : ''}
     - Descripción: ${t.description || 'Sin descripción'}
     - Comentarios / Notas: ${notesStr}`;
      });

      return `[INFORMACIÓN DEL PROYECTO]:
- Nombre del Cliente: ${bestProject.client || 'No especificado'}
- Nombre del Negocio: ${bestProject.business || 'No especificado'}
- Link del Website: ${bestProject.url || 'No especificado'}
- Avance General: ${progressPercent}% (${completedTasks.length} de ${totalTasks} tareas finalizadas)
- Estado General: ${bestProject.status || 'pendiente'}
- Tareas Registradas en este Proyecto:
${taskLines.length ? taskLines.join('\n') : '  (No hay tareas registradas en este proyecto)'}
[FIN DE INFORMACIÓN DEL PROYECTO]`;
    } catch (err) {
      console.warn('[PmService] Error enriqueciendo proyecto para chat:', err.message);
      return null;
    }
  }
}