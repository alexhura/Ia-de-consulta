import { config } from '../config/index.js';
import { query } from './db.js';
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
    const { rows } = await query(
      'SELECT * FROM users WHERE username = $1', [username]
    );
    return rows[0] ? this.toUser(rows[0]) : null;
  }

  async findByEmail(email) {
    const { rows } = await query(
      'SELECT * FROM users WHERE email = $1', [email]
    );
    return rows[0] ? this.toUser(rows[0]) : null;
  }

  async findById(id) {
    const { rows } = await query(
      'SELECT * FROM users WHERE id = $1', [parseInt(id)]
    );
    return rows[0] ? this.toUser(rows[0]) : null;
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

    const { rows } = await query(
      `INSERT INTO users (username, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [username, email, this.hashPassword(password), fullName || null, role]
    );

    return this.toUser(rows[0]);
  }

  async updateUser(id, updates) {
    const fields = [];
    const values = [];
    let index = 1;

    if (updates.fullName !== undefined) {
      fields.push(`full_name = $${index++}`);
      values.push(updates.fullName);
    }
    if (updates.email !== undefined) {
      fields.push(`email = $${index++}`);
      values.push(updates.email);
    }
    if (updates.role !== undefined) {
      fields.push(`role = $${index++}`);
      values.push(updates.role);
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${index++}`);
      values.push(updates.isActive);
    }
    if (updates.password) {
      fields.push(`password_hash = $${index++}`);
      values.push(this.hashPassword(updates.password));
    }

    if (fields.length === 0) return null;

    values.push(parseInt(id));
    const { rows } = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`,
      values
    );

    return rows[0] ? this.toUser(rows[0]) : null;
  }

  async updateLastLogin(id) {
    await query(
      'UPDATE users SET last_login = NOW() WHERE id = $1', [parseInt(id)]
    );
  }

  async getAllUsers() {
    const { rows } = await query(
      'SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY id'
    );
    return rows.map(r => ({
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
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [parseInt(id)]);
    return rowCount > 0;
  }
}

export const userService = new UserService();