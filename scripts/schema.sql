-- Esquema de tables para IA Consulta Chat (Supabase PostgreSQL)
-- Ejecuta este script UNA sola vez en: Supabase Dashboard > SQL Editor > New query
-- Luego la app crea los datos por defecto automáticamente al arrancar.

create table if not exists categories (
  id serial primary key,
  name text unique not null,
  description text,
  icon text default '📄',
  created_at timestamptz default now()
);

create table if not exists knowledge_items (
  id serial primary key,
  category_id integer not null references categories(id),
  title text not null,
  content text not null,
  keywords text,
  priority integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_kb_keywords on knowledge_items(keywords);
create index if not exists idx_kb_category on knowledge_items(category_id);

create table if not exists users (
  id serial primary key,
  username text unique not null,
  email text unique not null,
  password_hash text not null,
  full_name text,
  role text not null default 'user',
  is_active boolean default true,
  created_at timestamptz default now(),
  last_login timestamptz
);

-- Habilita RLS pero con política de acceso total para servicio backend
alter table categories enable row level security;
alter table knowledge_items enable row level security;
alter table users enable row level security;

create policy "categories_all" on categories for all using (true) with check (true);
create policy "knowledge_items_all" on knowledge_items for all using (true) with check (true);
create policy "users_all" on users for all using (true) with check (true);