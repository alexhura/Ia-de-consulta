import { query } from './db.js';

export class KnowledgeBaseService {
  constructor() {}

  async search(q, limit = 8) {
    const words = q.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (words.length === 0) return [];

    const conditions = [];
    const values = [];
    let index = 1;

    // PostgreSQL ILIKE para cada palabra
    const wordPatterns = words.map(w => `%${w}%`);
    for (const pattern of wordPatterns) {
      conditions.push(`(ki.keywords ILIKE $${index} OR ki.title ILIKE $${index} OR ki.content ILIKE $${index})`);
      values.push(pattern);
      index++;
    }

    const { rows } = await query(`
      SELECT ki.id, ki.category_id, ki.title, ki.content, ki.keywords, ki.priority,
             ki.created_at, ki.updated_at, c.name as category, c.icon
      FROM knowledge_items ki
      JOIN categories c ON ki.category_id = c.id
      WHERE ${conditions.join(' OR ')}
      ORDER BY ki.priority DESC, ki.updated_at DESC
      LIMIT $${index}
    `, [...values, limit]);

    return rows.map(r => ({
      id: r.id,
      category_id: r.category_id,
      title: r.title,
      content: r.content,
      keywords: r.keywords,
      priority: r.priority,
      created_at: r.created_at,
      updated_at: r.updated_at,
      category: r.category,
      icon: r.icon
    }));
  }

  async getByCategory(categoryName, limit = 20) {
    const { rows } = await query(`
      SELECT ki.id, ki.title, ki.content, ki.keywords, ki.priority,
             c.name as category, c.icon
      FROM knowledge_items ki
      JOIN categories c ON ki.category_id = c.id
      WHERE c.name = $1
      ORDER BY ki.priority DESC
      LIMIT $2
    `, [categoryName, limit]);

    return rows.map(r => ({ ...r }));
  }

  async getAllCategories() {
    const { rows } = await query('SELECT * FROM categories ORDER BY name');
    return rows;
  }

  async getContextForQuery(q, maxItems = 6) {
    const results = await this.search(q, maxItems);
    if (results.length === 0) return '';

    let context = 'INFORMACIÓN RELEVANTE DE LA BASE DE CONOCIMIENTO:\n\n';
    for (const item of results) {
      context += `## ${item.icon || '📄'} ${item.title} (${item.category})\n${item.content}\n\n`;
    }
    return context;
  }

  async addItem(category, title, content, keywords, priority = 0) {
    const { rows: catRows } = await query(
      'SELECT id FROM categories WHERE name = $1', [category]
    );
    if (catRows.length === 0) throw new Error(`Categoría "${category}" no existe`);

    const { rows } = await query(`
      INSERT INTO knowledge_items (category_id, title, content, keywords, priority)
      VALUES ($1, $2, $3, $4, $5) RETURNING id
    `, [catRows[0].id, title, content, keywords || '', priority]);

    return { lastInsertRowid: rows[0].id };
  }

  async updateItem(id, data) {
    const fields = [];
    const values = [];
    let index = 1;

    if (data.title !== undefined) { fields.push(`title = $${index++}`); values.push(data.title); }
    if (data.content !== undefined) { fields.push(`content = $${index++}`); values.push(data.content); }
    if (data.keywords !== undefined) { fields.push(`keywords = $${index++}`); values.push(data.keywords); }
    if (data.priority !== undefined) { fields.push(`priority = $${index++}`); values.push(data.priority); }
    if (data.category !== undefined) {
      const { rows } = await query('SELECT id FROM categories WHERE name = $1', [data.category]);
      if (rows.length === 0) throw new Error(`Categoría "${data.category}" no existe`);
      fields.push(`category_id = $${index++}`); values.push(rows[0].id);
    }

    if (fields.length === 0) return { changes: 0 };

    fields.push('updated_at = NOW()');
    values.push(parseInt(id));

    const { rowCount } = await query(
      `UPDATE knowledge_items SET ${fields.join(', ')} WHERE id = $${index}`,
      values
    );

    return { changes: rowCount };
  }

  async deleteItem(id) {
    const { rowCount } = await query('DELETE FROM knowledge_items WHERE id = $1', [parseInt(id)]);
    return { changes: rowCount };
  }

  async close() {}
}