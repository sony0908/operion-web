-- 20261031000003_integrations_and_jobs.sql
-- Fase 1 OPERION: Integraciones, Jobs de Análisis y Resultados (Observado/Inferido/Desconocido)

-- Catálogo de proveedores de integración
CREATE TABLE IF NOT EXISTS public.integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL UNIQUE, -- 'github', 'notebooklm_enterprise'
    display_name VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Inserción de proveedores iniciales del MVP
INSERT INTO public.integrations (provider, display_name)
VALUES
    ('github', 'GitHub App (Read-Only)'),
    ('notebooklm', 'NotebookLM Enterprise Connector')
ON CONFLICT (provider) DO NOTHING;

-- Conexiones de repositorios/servicios por proyecto
CREATE TABLE IF NOT EXISTS public.project_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    integration_id UUID NOT NULL REFERENCES public.integrations(id) ON DELETE RESTRICT,
    external_reference VARCHAR(255) NOT NULL, -- Ej: "operion-org/hospital-alerts"
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb, -- Sin credenciales ni secretos
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_project_integration UNIQUE (project_id, integration_id, external_reference)
);

CREATE INDEX IF NOT EXISTS idx_project_integrations_project ON public.project_integrations(project_id);

-- Trabajos de análisis (Jobs asíncronos)
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    status public.job_status NOT NULL DEFAULT 'queued',
    analysis_type VARCHAR(100) NOT NULL, -- 'inventory', 'architecture', 'dependencies', 'learning'
    repository_revision VARCHAR(64),     -- Git Commit SHA inspeccionado
    sanitization_applied BOOLEAN NOT NULL DEFAULT false,
    requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_summary TEXT
);

CREATE INDEX IF NOT EXISTS idx_analysis_jobs_project_status ON public.analysis_jobs(project_id, status);

-- Resultados estructurados con separación formal: Observado / Inferido / Desconocido
CREATE TABLE IF NOT EXISTS public.analysis_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.analysis_jobs(id) ON DELETE CASCADE,
    result_type VARCHAR(100) NOT NULL,
    observed JSONB NOT NULL DEFAULT '[]'::jsonb,    -- Hechos verificados en código
    inferred JSONB NOT NULL DEFAULT '[]'::jsonb,    -- Conclusiones de la IA
    unknown JSONB NOT NULL DEFAULT '[]'::jsonb,     -- Datos no determinables
    evidence JSONB NOT NULL DEFAULT '{}'::jsonb,    -- Rutas de archivos y líneas
    confidence NUMERIC(3, 2) CHECK (confidence >= 0.0 AND confidence <= 1.0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_analysis_results_job_id ON public.analysis_results(job_id);

-- RLS
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Anyone authenticated can view integrations catalog" ON public.integrations;
    CREATE POLICY "Anyone authenticated can view integrations catalog"
        ON public.integrations FOR SELECT TO authenticated USING (true);

    DROP POLICY IF EXISTS "Users can manage integrations of their projects" ON public.project_integrations;
    CREATE POLICY "Users can manage integrations of their projects"
        ON public.project_integrations FOR ALL
        USING (EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = project_integrations.project_id AND p.owner_id = auth.uid()
        ));

    DROP POLICY IF EXISTS "Users can manage analysis jobs of their projects" ON public.analysis_jobs;
    CREATE POLICY "Users can manage analysis jobs of their projects"
        ON public.analysis_jobs FOR ALL
        USING (EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = analysis_jobs.project_id AND p.owner_id = auth.uid()
        ));

    DROP POLICY IF EXISTS "Users can view analysis results of their projects" ON public.analysis_results;
    CREATE POLICY "Users can view analysis results of their projects"
        ON public.analysis_results FOR ALL
        USING (EXISTS (
            SELECT 1 FROM public.analysis_jobs j
            JOIN public.projects p ON p.id = j.project_id
            WHERE j.id = analysis_results.job_id AND p.owner_id = auth.uid()
        ));
END $$;
