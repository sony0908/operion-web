-- 20261031000004_documents_and_learning_packages.sql
-- Fase 1 OPERION: Entregables - Documentos Obsidian (Estratégico) y Paquetes NotebookLM (Educativo)

-- Documentación Estratégica (Obsidian) y Documentos Generales
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    destination public.destination_target NOT NULL DEFAULT 'obsidian',
    document_type VARCHAR(100) NOT NULL, -- 'Overview', 'Arquitectura', 'Estructura', 'Dependencias', 'Decisiones'
    title VARCHAR(255) NOT NULL,
    target_path VARCHAR(500) NOT NULL,   -- Ej: "01_PROYECTOS/avisos-hospital/Arquitectura.md"
    content_markdown TEXT NOT NULL,
    version INT NOT NULL DEFAULT 1,
    export_status public.sync_status NOT NULL DEFAULT 'pending',
    error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_documents_project_dest ON public.documents(project_id, destination);

DROP TRIGGER IF EXISTS trg_documents_updated_at ON public.documents;
CREATE TRIGGER trg_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Paquetes Educativos (NotebookLM)
CREATE TABLE IF NOT EXISTS public.learning_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    manifest JSONB NOT NULL DEFAULT '{}'::jsonb, -- Contiene listado de fuentes, temas y prerrequisitos
    external_notebook_id VARCHAR(255),          -- ID asignado por NotebookLM API (si está disponible)
    external_sources JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array con IDs y metadata de fuentes incorporadas
    import_status public.sync_status NOT NULL DEFAULT 'pending',
    error_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_learning_packages_project ON public.learning_packages(project_id);

DROP TRIGGER IF EXISTS trg_learning_packages_updated_at ON public.learning_packages;
CREATE TRIGGER trg_learning_packages_updated_at
    BEFORE UPDATE ON public.learning_packages
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_packages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    DROP POLICY IF EXISTS "Users can manage documents of their projects" ON public.documents;
    CREATE POLICY "Users can manage documents of their projects"
        ON public.documents FOR ALL
        USING (EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = documents.project_id AND p.owner_id = auth.uid()
        ));

    DROP POLICY IF EXISTS "Users can manage learning packages of their projects" ON public.learning_packages;
    CREATE POLICY "Users can manage learning packages of their projects"
        ON public.learning_packages FOR ALL
        USING (EXISTS (
            SELECT 1 FROM public.projects p 
            WHERE p.id = learning_packages.project_id AND p.owner_id = auth.uid()
        ));
END $$;
