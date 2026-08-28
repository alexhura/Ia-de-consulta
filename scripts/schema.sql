-- Esquema de tablas para IA Consulta Chat (Supabase PostgreSQL)
-- Ejecuta este script en: Supabase Dashboard > SQL Editor > New query
-- Es SEGURO ejecutarlo las veces que sea necesario (todo es idempotente).
-- Luego la app crea los datos por defecto automáticamente al arrancar.

-- ============ TABLAS ============

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

-- ============ PROJECT MANAGER ============

create table if not exists pm_projects (
  id serial primary key,
  client text not null,
  description text default '',
  status text not null default 'pendiente',
  created_by integer references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists pm_tasks (
  id serial primary key,
  project_id integer not null references pm_projects(id) on delete cascade,
  title text not null,
  description text default '',
  status text not null default 'pendiente',
  priority text not null default 'media',
  assigned_to integer references users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_pm_tasks_project on pm_tasks(project_id);

-- ============ RLS / POLÍTICAS ============
-- Importante: la app se conecta con la API key de Supabase (anon/publishable),
-- así que debe poder leer/escribir estas tablas.

alter table categories enable row level security;
alter table knowledge_items enable row level security;
alter table users enable row level security;
alter table pm_projects enable row level security;
alter table pm_tasks enable row level security;

drop policy if exists "all_categories" on categories;
create policy "all_categories" on categories for all using (true) with check (true);

drop policy if exists "all_knowledge_items" on knowledge_items;
create policy "all_knowledge_items" on knowledge_items for all using (true) with check (true);

drop policy if exists "all_users" on users;
create policy "all_users" on users for all using (true) with check (true);

drop policy if exists "all_pm_projects" on pm_projects;
create policy "all_pm_projects" on pm_projects for all using (true) with check (true);

drop policy if exists "all_pm_tasks" on pm_tasks;
create policy "all_pm_tasks" on pm_tasks for all using (true) with check (true);