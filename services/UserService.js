import { config } from '../config/index.js';
import { getSupabase } from './db.js';
import crypto from 'crypto';

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

  generateToken(user) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 días
    })).toString('base64url');

    const secret = config.jwtSecret || 'fallback-secret-change-in-production';
    const signature = crypto.createHmac('sha256', secret)
      .update(`${header}.${payload}`)
      .digest('base64url');

    return `${header}.${payload}.${signature}`;
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
    if (data) return this.toUser(data);

    ({ data, error } = await getSupabase()
      .from('users')
      .select('*')
      .ilike('username', username)
      .limit(1));
    if (error) throw error;

    return data && data[0] ? this.toUser(data[0]) : null;
  }

  async findByEmail(email) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error) throw error;
    return data ? this.toUser(data) : null;
  }

  async findById(id) {
    const { data, error } = await getSupabase()
      .from('users')
      .select('*')
      .eq('id', parseInt(id))
      .maybeSingle();
    if (error) throw error;
    return data ? this.toUser(data) : null;
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
      lastLogin: row.last_login
    };
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
      lastLogin: r.last_login
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