// Desarrollado por: Ing. Alejandro Huerta — https://alejandrohr.com
import { config } from '../config/index.js';
import { getSupabase } from './db.js';
import crypto from 'node:crypto';

export class UserService {
  constructor() {}

  hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password, storedHash) {
    const [salt, hash] = storedHash.split(':');
    const verifyHash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    return hash === verifyHash;
  }

  static SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 días, igual que el JWT

  generateToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + this.constructor.SESSION_DURATION_MS // 7 días
    })).toString('base64url');

    const secret = config.jwtSecret || 'fallback-secret-change-in-production';
    const signature = crypto.createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
  }

  // Obtiene el token de la sesión activa si sigue vigente (no expirada)
  async getActiveSessionToken(userId) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('active_session_token, session_expires_at')
      .eq('id', parseInt(userId))
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.active_session_token) return null;
    const expires = data.session_expires_at ? new Date(data.session_expires_at).getTime() : 0;
    if (expires && Date.now() < expires) return data.active_session_token;
    await this.clearSession(userId);
    return null;
  }

  // Verifica si un usuario ya tiene una sesión activa (no expirada)
  async hasActiveSession(userId) {
    const token = await this.getActiveSessionToken(userId);
    return !!token;
  }

  // Registra el token como la sesión activa del usuario
  async registerSession(userId, token) {
    const { error } = await getSupabase()
      .from('users')
      .update({
        active_session_token: token,
        session_expires_at: new Date(Date.now() + this.constructor.SESSION_DURATION_MS).toISOString()
      })
      .eq('id', parseInt(userId));
    if (error) throw error;
  }

  // Limpia la sesión activa del usuario (logout)
  async clearSession(userId) {
    const { error } = await getSupabase()
      .from('users')
      .update({ active_session_token: null, session_expires_at: null })
      .eq('id', parseInt(userId));
    if (error) throw error;
  }

  // Valida que un token sea la sesión activa vigente de su usuario
  async isTokenSessionActive(userId, token) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('active_session_token, session_expires_at')
      .eq('id', parseInt(userId))
      .maybeSingle();
    if (error) throw error;
    if (!data || !data.active_session_token) return false;
    if (data.active_session_token !== token) return false;
    if (data.session_expires_at) {
      const expires = new Date(data.session_expires_at).getTime();
      if (Date.now() > expires) {
        await this.clearSession(userId);
        return false;
      }
    }
    return true;
  }

  verifyToken(token) {
    try {
      const [header, payload, signature] = token.split('.');
      const secret = config.jwtSecret || 'fallback-secret-change-in-production';
      const expectedSig = crypto.createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSig) return null;

      const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (data.exp && Date.now() > data.exp) return null;

      return data;
    } catch {
      return null;
    }
  }

  async findByUsername(username) {
    // Caso exacto primero, luego coincidencia sin distinguir mayúsculas
    let { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('username', username)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const u = this.toUser(data);
      if (!u.avatar) u.avatar = await this.getAvatar(u.id);
      return u;
    }

    ({ data, error } = await getSupabase()
      .from('users')
      .select('*')
      .ilike('username', username)
      .limit(1));
    if (error) throw error;

    if (data && data[0]) {
      const u = this.toUser(data[0]);
      if (!u.avatar) u.avatar = await this.getAvatar(u.id);
      return u;
    }
    return null;
  }

  async findByEmail(email) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const u = this.toUser(data);
      if (!u.avatar) u.avatar = await this.getAvatar(u.id);
      return u;
    }
    return null;
  }

  async findById(id) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const u = this.toUser(data);
      if (!u.avatar) u.avatar = await this.getAvatar(u.id);
      return u;
    }
    return null;
  }

  toUser(row) {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      passwordHash: row.password_hash,
      fullName: row.full_name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      lastLogin: row.last_login,
      avatar: row.avatar || null
    };
  }

  // Carga el mapa de todos los avatares desde Supabase (tabla users y respaldo garantizado)
  async getAllAvatars() {
    if (this._avatarsCache) return { ...this._avatarsCache };

    const avatars = {};

    // 1. Intentar leer desde columna avatar de tabla users
    try {
      const { data, error } = await getSupabase()
        .from('users')
        .select('id, avatar');
      if (!error && data) {
        for (const u of data) {
          if (u.avatar) avatars[u.id] = u.avatar;
        }
      }
    } catch (e) {
      // Ignorar si la columna aún no existe
    }

    // 2. Leer desde store de respaldo en categories '__user_avatars__'
    try {
      const { data, error } = await getSupabase()
        .from('categories')
        .select('description')
        .eq('name', '__user_avatars__')
        .maybeSingle();
      if (!error && data && data.description) {
        const stored = JSON.parse(data.description);
        for (const [uid, av] of Object.entries(stored)) {
          if (av && !avatars[uid]) avatars[uid] = av;
        }
      }
    } catch (e) {
      // Ignorar
    }

    this._avatarsCache = avatars;
    return { ...avatars };
  }

  async getAvatar(userId) {
    const all = await this.getAllAvatars();
    return all[userId] || null;
  }

  async updateAvatar(userId, avatar) {
    const uid = parseInt(userId);
    if (!uid) throw new Error('ID de usuario requerido');

    // 1. Intentar guardar en la tabla users directamente
    try {
      await getSupabase()
        .from('users')
        .update({ avatar })
        .eq('id', uid);
    } catch (e) {
      // Si la columna no existe en Supabase, se guarda en el store de respaldo
    }

    // 2. Guardar en el store de respaldo garantizado en categories ('__user_avatars__')
    try {
      const all = await this.getAllAvatars();
      if (avatar) {
        all[uid] = avatar;
      } else {
        delete all[uid];
      }
      this._avatarsCache = all;

      const supabase = getSupabase();
      const { data: existing } = await supabase
        .from('categories')
        .select('id')
        .eq('name', '__user_avatars__')
        .maybeSingle();

      const payload = {
        name: '__user_avatars__',
        description: JSON.stringify(all),
        icon: '👤'
      };

      if (existing) {
        await supabase
          .from('categories')
          .update(payload)
          .eq('id', existing.id);
      } else {
        await supabase
          .from('categories')
          .insert(payload);
      }
    } catch (e) {
      console.error('Error guardando avatar en respaldo:', e.message);
    }

    return avatar;
  }

  async createUser({ username, email, password, fullName, role = 'user' }) {
    const exists = await this.findByUsername(username);
    if (exists) throw new Error('El nombre de usuario ya existe');

    const emailExists = await this.findByEmail(email);
    if (emailExists) throw new Error('El email ya está registrado');

    const { data, error } = await getSupabase()
      .from('users')
      .insert({
        username,
        email,
        password_hash: this.hashPassword(password),
        full_name: fullName || null,
        role
      })
      .select()
      .single();
    if (error) throw error;

    return this.toUser(data);
  }

  async updateUser(id, updates) {
    const data = {};
    if (updates.fullName !== undefined) data.full_name = updates.fullName;
    if (updates.email !== undefined) data.email = updates.email;
    if (updates.role !== undefined) data.role = updates.role;
    if (updates.isActive !== undefined) data.is_active = updates.isActive;
    if (updates.password) data.password_hash = this.hashPassword(updates.password);

    if (Object.keys(data).length === 0) return null;

    const { data: updated, error } = await getSupabase()
      .from('users')
      .update(data)
      .eq('id', parseInt(id))
      .select()
      .maybeSingle();
    if (error) throw error;

    return updated ? this.toUser(updated) : null;
  }

  async updateLastLogin(id) {
    const { error } = await getSupabase()
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', parseInt(id));
    if (error) throw error;
  }

  async getAllUsers() {
    const avatars = await this.getAllAvatars();
    const { data, error } = await getSupabase()
      .from('users')
      .select('id, username, email, full_name, role, is_active, created_at, last_login')
      .order('id', { ascending: true });
    if (error) throw error;

    return (data || []).map(r => ({
      id: r.id,
      username: r.username,
      email: r.email,
      fullName: r.full_name,
      role: r.role,
      isActive: r.is_active,
      createdAt: r.created_at,
      lastLogin: r.last_login,
      avatar: avatars[r.id] || null
    }));
  }

  async deleteUser(id) {
    const existing = await getSupabase()
      .from('users')
      .select('id')
      .eq('id', parseInt(id))
      .maybeSingle();
    if (existing.error) throw existing.error;
    if (!existing.data) return false;

    const { error } = await getSupabase()
      .from('users')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;

    return true;
  }
}

export const userService = new UserService();