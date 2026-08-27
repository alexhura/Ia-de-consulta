import { getSupabase } from './db.js';

const KB_SELECT = 'id, category_id, title, content, keywords, priority, created_at, updated_at, categories(name, icon)';

function mapItem(row) {
  return {
    id: row.id,
    category_id: row.category_id,
    title: row.title,
    content: row.content,
    keywords: row.keywords,
    priority: row.priority,
    created_at: row.created_at,
    updated_at: row.updated_at,
    category: row.categories?.name ?? null,
    icon: row.categories?.icon ?? null
  };
}

export class KnowledgeBaseService {
  constructor() {}

  async search(q, limit = 8) {
    const words = q.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2);

    if (words.length === 0) return [];

    // PostgREST: cada palabra busca en keywords/title/content (OR), palabras en OR entre sí.
    // '*' se traduce a '%' en ILIKE.
    const perWord = words.map(w =>
      `or(keywords.ilike.*${w}*,title.ilike.*${w}*,content.ilike.*${w}*)`
    );

    const { data, error } = await getSupabase()
      .from('knowledge_items')
      .select(KB_SELECT)
      .or(perWord.join(','))
      .order('priority', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data || []).map(mapItem);
  }

  async getByCategory(categoryName, limit = 20) {
    const { data, error } = await getSupabase()
      .from('knowledge_items')
      .select('id, title, content, keywords, priority, categories(name, icon)')
      .eq('categories.name', categoryName)
      .order('priority', { ascending: false })
      .limit(limit);
    if (error) throw error;

    return (data || []).map(r => ({
      id: r.id,
      title: r.title,
      content: r.content,
      keywords: r.keywords,
      priority: r.priority,
      category: r.categories?.name ?? null,
      icon: r.categories?.icon ?? null
    }));
  }

  async getAllCategories() {
    const { data, error } = await getSupabase()
      .from('categories')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;

    return data || [];
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
    const { data: cat, error: catErr } = await getSupabase()
      .from('categories')
      .select('id')
      .eq('name', category)
      .maybeSingle();
    if (catErr) throw catErr;
    if (!cat) throw new Error(`Categoría "${category}" no existe`);

    const { data, error } = await getSupabase()
      .from('knowledge_items')
      .insert({
        category_id: cat.id,
        title,
        content,
        keywords: keywords || '',
        priority
      })
      .select('id')
      .single();
    if (error) throw error;

    return { lastInsertRowid: data.id };
  }

  async updateItem(id, data) {
    const updates = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.content !== undefined) updates.content = data.content;
    if (data.keywords !== undefined) updates.keywords = data.keywords;
    if (data.priority !== undefined) updates.priority = data.priority;
    if (data.category !== undefined) {
      const { data: cat, error: catErr } = await getSupabase()
        .from('categories')
        .select('id')
        .eq('name', data.category)
        .maybeSingle();
      if (catErr) throw catErr;
      if (!cat) throw new Error(`Categoría "${data.category}" no existe`);
      updates.category_id = cat.id;
    }

    if (Object.keys(updates).length === 0) return { changes: 0 };

    updates.updated_at = new Date().toISOString();

    const { error } = await getSupabase()
      .from('knowledge_items')
      .update(updates)
      .eq('id', parseInt(id));
    if (error) throw error;

    return { changes: 1 };
  }

  async deleteItem(id) {
    const { error } = await getSupabase()
      .from('knowledge_items')
      .delete()
      .eq('id', parseInt(id));
    if (error) throw error;

    return { changes: 1 };
  }

  async close() {}
}