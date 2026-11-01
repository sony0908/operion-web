-- 20261031000001_setup_extensions_and_types.sql
-- Fase 1 OPERION: Extensiones de base de datos, tipos y funciones auxiliares

-- Extensiones base
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Función reutilizable para actualizar el campo updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tipos enumerados del dominio OPERION
DO $$ BEGIN
    CREATE TYPE public.project_status AS ENUM ('draft', 'active', 'paused', 'archived');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.privacy_tier AS ENUM (
        'personal',        -- Fase A: Proyectos propios, elegible para modelos generales
        'institutional'    -- Fase B: Exige cero retención de datos, pago y sanitización estricta
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_status AS ENUM ('todo', 'in_progress', 'blocked', 'done');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.job_status AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.destination_target AS ENUM ('obsidian', 'notebooklm');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.sync_status AS ENUM ('pending', 'syncing', 'synced', 'failed', 'manual_required');
EXCEPTION WHEN duplicate_object THEN null;
END $$;
