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

alter table users add column if not exists active_session_token text;
alter table users add column if not exists session_expires_at timestamptz;

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

-- Campos de detalle del proyecto (ejecutar ALTER incluso si la tabla ya existia)
alter table pm_projects add column if not exists business text default '';
alter table pm_projects add column if not exists email text default '';
alter table pm_projects add column if not exists phone text default '';
alter table pm_projects add column if not exists services text default '';
alter table pm_projects add column if not exists areas text default '';
alter table pm_projects add column if not exists url text default '';
alter table pm_projects add column if not exists wp_user text default '';
alter table pm_projects add column if not exists wp_pass text default '';
alter table pm_projects add column if not exists notif_email text default '';
alter table pm_projects add column if not exists share_token text default '';

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

alter table pm_tasks add column if not exists owner_id integer references users(id);
alter table pm_tasks add column if not exists due_date date;
alter table pm_tasks add column if not exists corrections integer default 0;
alter table pm_tasks add column if not exists completed_at timestamptz;

create index if not exists idx_pm_tasks_project on pm_tasks(project_id);

create table if not exists pm_task_comments (
  id serial primary key,
  task_id integer not null references pm_tasks(id) on delete cascade,
  author_id integer references users(id),
  author_name text default '',
  content text not null,
  created_at timestamptz default now()
);

create table if not exists pm_task_attachments (
  id serial primary key,
  task_id integer not null references pm_tasks(id) on delete cascade,
  data_url text not null,
  created_at timestamptz default now()
);

create index if not exists idx_pm_comments_task on pm_task_comments(task_id);
create index if not exists idx_pm_attachments_task on pm_task_attachments(task_id);

-- ============ RLS / POLÍTICAS ============
-- Importante: la app se conecta con la API key de Supabase (anon/publishable),
-- así que debe poder leer/escribir estas tablas.

alter table categories enable row level security;
alter table knowledge_items enable row level security;
alter table users enable row level security;
alter table pm_projects enable row level security;
alter table pm_tasks enable row level security;
alter table pm_task_comments enable row level security;
alter table pm_task_attachments enable row level security;

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

drop policy if exists "all_pm_comments" on pm_task_comments;
create policy "all_pm_comments" on pm_task_comments for all using (true) with check (true);

drop policy if exists "all_pm_attachments" on pm_task_attachments;
create policy "all_pm_attachments" on pm_task_attachments for all using (true) with check (true);