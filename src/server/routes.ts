/**
 * OPERION REST API v1 Router (Sección 7)
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { db, CURRENT_USER_ID } from './db.js';
import { sanitizeContent } from './sanitization.js';

export const apiRouter = Router();

// --- MIGRACIONES & SISTEMA ---

apiRouter.get('/migrations', (req: Request, res: Response) => {
  try {
    const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations');
    let files: string[] = [];
    if (fs.existsSync(migrationsDir)) {
      files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    }

    const migrations = files.map((file) => {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');
      const isApplied = db.migrationsApplied.includes(file);
      return {
        filename: file,
        applied: isApplied,
        sql,
        sizeBytes: Buffer.byteLength(sql, 'utf8'),
      };
    });

    res.json({
      success: true,
      data: {
        total: migrations.length,
        appliedCount: migrations.filter((m) => m.applied).length,
        migrations,
        databaseTarget: 'Supabase PostgreSQL 15 (RLS Enabled)',
        extensions: ['uuid-ossp', 'pgcrypto'],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

apiRouter.post('/migrations/apply', (req: Request, res: Response) => {
  try {
    const { filename } = req.body;
    if (filename && !db.migrationsApplied.includes(filename)) {
      db.migrationsApplied.push(filename);
    }
    db.logActivity(CURRENT_USER_ID, null, 'MIGRATION_EXECUTED', {
      filename: filename || 'ALL',
      timestamp: new Date().toISOString(),
    });
    res.json({ success: true, message: `Migración ${filename || 'todas'} aplicada con éxito` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- PROYECTOS (CRUD) ---

apiRouter.get('/projects', (req: Request, res: Response) => {
  const projects = db.getProjects(CURRENT_USER_ID);
  res.json({ success: true, data: projects });
});

apiRouter.post('/projects', (req: Request, res: Response) => {
  const { name, description, purpose, privacy_tier, status } = req.body;
  if (!name || !purpose) {
    return res.status(400).json({ success: false, error: 'name y purpose son campos obligatorios' });
  }

  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_-]/g, '-');

  const project = db.createProject(
    {
      name,
      slug,
      description: description || '',
      purpose,
      privacy_tier: privacy_tier === 'institutional' ? 'institutional' : 'personal',
      status: status || 'active',
    },
    CURRENT_USER_ID
  );

  res.status(201).json({ success: true, data: project });
});

apiRouter.get('/projects/:projectId', (req: Request, res: Response) => {
  const project = db.getProjectById(req.params.projectId, CURRENT_USER_ID);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
  }
  res.json({ success: true, data: project });
});

apiRouter.patch('/projects/:projectId', (req: Request, res: Response) => {
  const updated = db.updateProject(req.params.projectId, req.body, CURRENT_USER_ID);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
  }
  res.json({ success: true, data: updated });
});

apiRouter.delete('/projects/:projectId', (req: Request, res: Response) => {
  const deleted = db.deleteProject(req.params.projectId, CURRENT_USER_ID);
  if (!deleted) {
    return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
  }
  res.json({ success: true, message: 'Proyecto eliminado con éxito' });
});

// --- TAREAS ---

apiRouter.get('/projects/:projectId/tasks', (req: Request, res: Response) => {
  const tasks = db.getTasks(req.params.projectId, CURRENT_USER_ID);
  res.json({ success: true, data: tasks });
});

apiRouter.post('/projects/:projectId/tasks', (req: Request, res: Response) => {
  const { title, description, priority, due_at } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, error: 'title es requerido' });
  }

  const task = db.createTask(
    {
      project_id: req.params.projectId,
      title,
      description: description || '',
      status: 'todo',
      priority: priority || 'medium',
      due_at: due_at || null,
    },
    CURRENT_USER_ID
  );

  res.status(201).json({ success: true, data: task });
});

apiRouter.patch('/tasks/:taskId', (req: Request, res: Response) => {
  const updated = db.updateTask(req.params.taskId, req.body, CURRENT_USER_ID);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
  }
  res.json({ success: true, data: updated });
});

// --- INTEGRACIONES & CREDENCIALES ---

import { testSupabaseConnection, testGitHubConnection, fetchUserRepositories } from './integrations.js';

apiRouter.get('/integrations/credentials-status', async (req: Request, res: Response) => {
  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY');
  const supabaseUrlConfigured = Boolean(process.env.SUPABASE_URL && !process.env.SUPABASE_URL.includes('tu-proyecto'));
  const supabaseAnonConfigured = Boolean(process.env.SUPABASE_ANON_KEY && !process.env.SUPABASE_ANON_KEY.includes('tu-anon'));
  const supabaseServiceConfigured = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('tu-service'));
  const githubConfigured = Boolean(process.env.GITHUB_TOKEN && !process.env.GITHUB_TOKEN.includes('tu_token'));
  const gcpConfigured = Boolean(process.env.GCP_PROJECT_ID && !process.env.GCP_PROJECT_ID.includes('tu-gcp'));

  res.json({
    success: true,
    data: {
      gemini: {
        configured: geminiConfigured,
        source: 'AI Studio Secrets (GEMINI_API_KEY)',
        status: geminiConfigured ? 'CONNECTED' : 'WAITING_SECRET',
      },
      supabase: {
        configured: supabaseUrlConfigured && (supabaseAnonConfigured || supabaseServiceConfigured),
        url: supabaseUrlConfigured ? process.env.SUPABASE_URL : null,
        serviceRoleActive: supabaseServiceConfigured,
        status: supabaseUrlConfigured ? 'CONFIGURED' : 'PENDING_SETUP',
      },
      github: {
        configured: githubConfigured,
        mode: 'READ_ONLY_PER_MVP',
        status: githubConfigured ? 'CONNECTED' : 'OPTIONAL_TOKEN',
      },
      notebooklm: {
        configured: gcpConfigured,
        mode: gcpConfigured ? 'ENTERPRISE_GCP_API' : 'LOCAL_PACKAGE_MANIFEST',
        status: gcpConfigured ? 'ENTERPRISE_ENABLED' : 'PACKAGE_MODE_ACTIVE',
      },
    },
  });
});

apiRouter.post('/integrations/test-supabase', async (req: Request, res: Response) => {
  const result = await testSupabaseConnection();
  res.json({ success: true, data: result });
});

apiRouter.post('/integrations/test-github', async (req: Request, res: Response) => {
  const result = await testGitHubConnection();
  res.json({ success: true, data: result });
});

apiRouter.get('/integrations/github/repos', async (req: Request, res: Response) => {
  const repos = await fetchUserRepositories();
  res.json({ success: true, data: repos });
});

apiRouter.get('/integrations', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      catalog: db.integrations,
      projectIntegrations: db.project_integrations,
    },
  });
});

apiRouter.post('/integrations/github/connect', (req: Request, res: Response) => {
  const { project_id, repository_reference } = req.body;
  if (!project_id || !repository_reference) {
    return res.status(400).json({ success: false, error: 'project_id y repository_reference son requeridos' });
  }

  const integration = db.integrations.find((i) => i.provider === 'github');
  if (!integration) {
    return res.status(500).json({ success: false, error: 'Proveedor GitHub no registrado' });
  }

  // Comprobar si ya existe
  const existing = db.project_integrations.find(
    (pi) => pi.project_id === project_id && pi.integration_id === integration.id
  );

  if (existing) {
    existing.external_reference = repository_reference;
  } else {
    db.project_integrations.push({
      id: `pi-${Math.random().toString(36).slice(2, 9)}`,
      project_id,
      integration_id: integration.id,
      external_reference: repository_reference,
      configuration: { permissions: 'read_only', branch: 'main' },
      created_at: new Date().toISOString(),
    });
  }

  db.logActivity(CURRENT_USER_ID, project_id, 'GITHUB_INTEGRATION_CONNECTED', {
    repo: repository_reference,
  });

  res.json({
    success: true,
    message: `Repositorio ${repository_reference} conectado en modo SOLO LECTURA`,
  });
});

// --- ANÁLISIS DE REPOSITORIO (MOTOR IA & RESULTADOS ESTRUCTURADOS) ---

apiRouter.get('/projects/:projectId/analysis', (req: Request, res: Response) => {
  const jobs = db.getAnalysisJobs(req.params.projectId);
  res.json({ success: true, data: jobs });
});

import { executeAiRepositoryAnalysis, respondToProjectNote } from './aiAnalysis.js';

apiRouter.get('/projects/:projectId/notes', (req: Request, res: Response) => {
  const notes = db.getProjectNotes(req.params.projectId);
  res.json({ success: true, data: notes });
});

apiRouter.post('/projects/:projectId/notes', async (req: Request, res: Response) => {
  const { content, note_type } = req.body;
  const project = db.getProjectById(req.params.projectId, CURRENT_USER_ID);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
  }

  if (!content) {
    return res.status(400).json({ success: false, error: 'El contenido de la nota es requerido' });
  }

  const note = db.createProjectNote(project.id, content, note_type || 'idea');
  
  // Generar respuesta técnica de IA
  try {
    const aiResponse = await respondToProjectNote(project, content, note_type || 'idea');
    note.ai_response = aiResponse;
    note.ai_status = 'answered';
  } catch (err: any) {
    note.ai_response = `Nota registrada. Respuesta técnica: ${err.message}`;
    note.ai_status = 'answered';
  }

  res.status(201).json({ success: true, data: note });
});

apiRouter.post('/projects/:projectId/analysis', async (req: Request, res: Response) => {
  const { analysis_type, repository_revision, sample_code_payload, repo_reference } = req.body;
  const project = db.getProjectById(req.params.projectId, CURRENT_USER_ID);

  if (!project) {
    return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
  }

  const result = await executeAiRepositoryAnalysis({
    projectId: project.id,
    analysisType: analysis_type || 'architecture',
    repoReference: repo_reference,
    sampleCodePayload: sample_code_payload,
  });

  if (!result.success) {
    return res.status(result.blocked ? 403 : 500).json(result);
  }

  res.status(201).json({
    success: true,
    data: {
      job: db.getAnalysisJob(result.jobId || ''),
      result: result.result,
      sanitizationReport: result.sanitizationReport,
    },
  });
});

apiRouter.get('/analysis/:jobId', (req: Request, res: Response) => {
  const job = db.getAnalysisJob(req.params.jobId);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Trabajo de análisis no encontrado' });
  }
  res.json({ success: true, data: job });
});

apiRouter.get('/analysis/:jobId/results', (req: Request, res: Response) => {
  const results = db.getAnalysisResults(req.params.jobId);
  res.json({ success: true, data: results });
});

// --- ENTREGABLES: OBSIDIAN (ESTRATÉGICO) & NOTEBOOKLM (EDUCATIVO) ---

apiRouter.get('/projects/:projectId/documents', (req: Request, res: Response) => {
  const docs = db.getDocuments(req.params.projectId);
  res.json({ success: true, data: docs });
});

apiRouter.post('/projects/:projectId/documents/preview', (req: Request, res: Response) => {
  const { document_type, custom_markdown } = req.body;
  const project = db.getProjectById(req.params.projectId, CURRENT_USER_ID);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
  }

  const path = `01_PROYECTOS/${project.slug}/${document_type || 'Overview'}.md`;
  const existing = db.documents.find((d) => d.project_id === project.id && d.target_path === path);

  res.json({
    success: true,
    data: {
      targetPath: path,
      currentVersion: existing ? existing.version : 0,
      previousContent: existing ? existing.content_markdown : null,
      proposedContent: custom_markdown || `# ${project.name} - ${document_type}\n\n${project.description}`,
      diffStatus: existing ? 'MODIFIED' : 'NEW_FILE',
      safNotice: 'La escritura final se ejecutará en Android mediante Storage Access Framework.',
    },
  });
});

apiRouter.post('/documents/:documentId/approve-export', (req: Request, res: Response) => {
  const doc = db.documents.find((d) => d.id === req.params.documentId);
  if (!doc) {
    return res.status(404).json({ success: false, error: 'Documento no encontrado' });
  }

  doc.export_status = 'synced';
  doc.version += 1;
  doc.updated_at = new Date().toISOString();

  db.logActivity(CURRENT_USER_ID, doc.project_id, 'OBSIDIAN_DOCUMENT_EXPORTED', {
    target_path: doc.target_path,
    version: doc.version,
  });

  res.json({
    success: true,
    message: `Documento exportado exitosamente a ${doc.target_path}`,
    data: doc,
  });
});

apiRouter.get('/projects/:projectId/learning-packages', (req: Request, res: Response) => {
  const packages = db.getLearningPackages(req.params.projectId);
  res.json({ success: true, data: packages });
});

apiRouter.post('/projects/:projectId/learning-packages', (req: Request, res: Response) => {
  const { title, educational_goal, topics } = req.body;
  const project = db.getProjectById(req.params.projectId, CURRENT_USER_ID);
  if (!project) {
    return res.status(404).json({ success: false, error: 'Proyecto no encontrado' });
  }

  const pkg: any = {
    id: `pkg-${Math.random().toString(36).slice(2, 8)}`,
    project_id: project.id,
    title: title || `Guía Didáctica de ${project.name}`,
    manifest: {
      origin_project: project.slug,
      educational_goal: educational_goal || 'Aprender y dominar los conceptos técnicos del proyecto.',
      topics: topics || ['Fundamentos', 'Glosario', 'Arquitectura Explicada'],
      prerequisites: ['Conocimientos generales de programación'],
      sources: [
        '01_FUNDAMENTOS.md',
        '02_GLOSARIO.md',
        '03_ARQUITECTURA_EXPLICADA.md',
        '04_GUIA_DE_APRENDIZAJE.md',
        '05_EJERCICIOS.md',
        '06_FUENTES.md',
      ],
      version: '1.0.0',
      created_date: new Date().toISOString().slice(0, 10),
    },
    external_notebook_id: null,
    external_sources: [],
    import_status: 'manual_required', // Se ajusta con la regla estricta: API pública de consumo aún no abierta
    error_summary:
      'Conector NotebookLM: Los endpoints de consumo directo no están disponibles públicamente sin credencial Enterprise. El paquete está empaquetado para importación de fuentes.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.learning_packages.unshift(pkg);
  db.logActivity(CURRENT_USER_ID, project.id, 'LEARNING_PACKAGE_PREPARED', {
    packageId: pkg.id,
    status: pkg.import_status,
  });

  res.status(201).json({ success: true, data: pkg });
});

// --- PRUEBA DEL MOTOR DE SANITIZACIÓN ---

apiRouter.post('/sanitize/test', (req: Request, res: Response) => {
  const { content, privacy_tier } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, error: 'content es requerido' });
  }

  const result = sanitizeContent(content, {
    privacyTier: privacy_tier || 'institutional',
    allowExternalProvider: privacy_tier === 'personal',
  });

  res.json({ success: true, data: result });
});

// --- ACTIVIDAD / AUDITORÍA ---

apiRouter.get('/activity', (req: Request, res: Response) => {
  res.json({ success: true, data: db.activity_logs });
});
