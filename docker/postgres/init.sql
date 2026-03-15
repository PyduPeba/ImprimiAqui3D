-- ImprimiAqui3D Database Initialization Script
-- This script runs automatically when the PostgreSQL container is first created

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database if not exists (already created by POSTGRES_DB env var)
-- This is just for documentation purposes

-- Set timezone
SET timezone = 'America/Sao_Paulo';

-- Create custom types/enums (will be created by TypeORM migrations)
-- This file can be extended with custom functions, triggers, etc.

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'ImprimiAqui3D database initialized successfully';
    RAISE NOTICE 'Database: imprimiaqui3d';
    RAISE NOTICE 'User: imprimiaqui';
    RAISE NOTICE 'Timezone: America/Sao_Paulo';
    RAISE NOTICE 'UUID extension: enabled';
END $$;
