-- Inicializacion de base de datos para Portal ADL Digital
-- Ejecutar en PostgreSQL en Cloudways

CREATE TABLE IF NOT EXISTS profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(200),
    email VARCHAR(200),
    profile_id INTEGER REFERENCES profiles(id),
    is_admin BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS query_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    query_text TEXT NOT NULL,
    response_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Perfiles predeterminados
INSERT INTO profiles (name, description, permissions) VALUES
    ('Administrador', 'Acceso total al sistema', '{"admin": true, "chat": true, "users": true, "logs": true}'),
    ('Ventas', 'Equipo de ventas', '{"chat": true, "clients": true}'),
    ('Callcenter', 'Equipo de call center', '{"chat": true, "clients": true}'),
    ('Consulta', 'Solo consulta', '{"chat": true}')
ON CONFLICT (name) DO NOTHING;

-- Usuario administrador (password: Adldigital*26)
INSERT INTO users (username, password_hash, full_name, profile_id, is_admin) 
SELECT 'ADLadmin', '$2y$12$liaZBe/uP77s0ex5YMrjrevSZuhzDdGJjjzWp0.6.0cXKWbaVg7yC', 'Administrador', id, TRUE
FROM profiles WHERE name = 'Administrador'
ON CONFLICT (username) DO NOTHING;
