-- ============================================================
-- Notificaciones (anuncios del admin)
-- Ejecutar UNA SOLA VEZ en Supabase → SQL Editor
-- ============================================================

-- Anuncios publicados por el administrador.
-- target_roles: NULL o arreglo vacío = visible para TODOS los roles.
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    message text not null,
    target_roles text[],
    created_by integer,
    created_at timestamptz not null default now()
);

-- Lecturas por usuario (marca de "leído" o "no leído").
create table if not exists public.notification_reads (
    user_id integer not null,
    notification_id uuid not null references public.notifications (id) on delete cascade,
    read_at timestamptz not null default now(),
    primary key (user_id, notification_id)
);

-- Índice para listar anuncios por fecha.
create index if not exists notifications_created_at_idx
    on public.notifications (created_at desc);