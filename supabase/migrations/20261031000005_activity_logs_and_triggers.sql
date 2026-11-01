-- 20261031000005_activity_logs_and_triggers.sql
-- Fase 1 OPERION: Registro Histórico de Auditoría y Trazabilidad

CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- 'PROJECT_CREATED', 'ANALYSIS_STARTED', 'OBSIDIAN_EXPORT_APPROVED', etc.
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_owner_created ON public.activity_logs(owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_project ON public.activity_logs(project_id);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can view only their own activity logs" ON public.activity_logs;
    CREATE POLICY "Users can view only their own activity logs"
        ON public.activity_logs FOR SELECT
        USING (auth.uid() = owner_id);

    DROP POLICY IF EXISTS "Users can insert activity logs for their actions" ON public.activity_logs;
    CREATE POLICY "Users can insert activity logs for their actions"
        ON public.activity_logs FOR INSERT
        WITH CHECK (auth.uid() = owner_id);
END $$;
