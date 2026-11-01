-- 20261031000002_core_projects_and_tasks.sql
-- Fase 1 OPERION: Tablas base de Proyectos y Tareas con RLS

-- Tabla: projects
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    slug VARCHAR(150) NOT NULL,
    description TEXT,
    purpose TEXT NOT NULL,
    status public.project_status NOT NULL DEFAULT 'active',
    privacy_tier public.privacy_tier NOT NULL DEFAULT 'personal',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_projects_owner_slug UNIQUE (owner_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON public.projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_privacy_tier ON public.projects(privacy_tier);

DROP TRIGGER IF EXISTS trg_projects_updated_at ON public.projects;
CREATE TRIGGER trg_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Tabla: tasks
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status public.task_status NOT NULL DEFAULT 'todo',
    priority public.task_priority NOT NULL DEFAULT 'medium',
    due_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_owner_id ON public.tasks(owner_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

DROP TRIGGER IF EXISTS trg_tasks_updated_at ON public.tasks;
CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS: projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
    CREATE POLICY "Users can view their own projects"
        ON public.projects FOR SELECT
        USING (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
    CREATE POLICY "Users can insert their own projects"
        ON public.projects FOR INSERT
        WITH CHECK (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
    CREATE POLICY "Users can update their own projects"
        ON public.projects FOR UPDATE
        USING (auth.uid() = owner_id)
        WITH CHECK (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;
    CREATE POLICY "Users can delete their own projects"
        ON public.projects FOR DELETE
        USING (auth.uid() = owner_id);
END $$;

-- RLS: tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
    CREATE POLICY "Users can view their own tasks"
        ON public.tasks FOR SELECT
        USING (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Users can insert their own tasks" ON public.tasks;
    CREATE POLICY "Users can insert their own tasks"
        ON public.tasks FOR INSERT
        WITH CHECK (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
    CREATE POLICY "Users can update their own tasks"
        ON public.tasks FOR UPDATE
        USING (auth.uid() = owner_id)
        WITH CHECK (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;
    CREATE POLICY "Users can delete their own tasks"
        ON public.tasks FOR DELETE
        USING (auth.uid() = owner_id);
END $$;
