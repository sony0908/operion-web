/**
 * OPERION Database Service & Model Implementation
 * Implementa el esquema relacional de Supabase en memoria y almacén local versionado.
 */

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 10);
}

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  purpose: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  privacy_tier: 'personal' | 'institutional';
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'blocked' | 'done';
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Integration {
  id: string;
  provider: string;
  display_name: string;
  status: string;
  created_at: string;
}

export interface ProjectIntegration {
  id: string;
  project_id: string;
  integration_id: string;
  external_reference: string;
  configuration: Record<string, unknown>;
  created_at: string;
}

export interface AnalysisJob {
  id: string;
  project_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
  analysis_type: string;
  repository_revision: string | null;
  sanitization_applied: boolean;
  requested_at: string;
  started_at: string | null;
  finished_at: string | null;
  error_summary: string | null;
}

export interface AnalysisResult {
  id: string;
  job_id: string;
  result_type: string;
  observed: Array<{ item: string; details: string; evidencePath: string; lineRange?: string }>;
  inferred: Array<{ item: string; hypothesis: string; rationale: string }>;
  unknown: Array<{ item: string; reason: string }>;
  risks?: Array<{ item: string; severity: 'critical' | 'high' | 'medium'; description: string; recommendation: string }>;
  missing?: Array<{ item: string; impact: string; suggestion: string }>;
  improvements?: Array<{ item: string; category: string; rationale: string }>;
  suggestedTasks?: Array<{ title: string; priority: 'low' | 'medium' | 'high' | 'critical'; reason: string }>;
  evidence: Record<string, unknown>;
  confidence: number;
  created_at: string;
}

export interface DocumentRecord {
  id: string;
  project_id: string;
  destination: 'obsidian' | 'notebooklm';
  document_type: string;
  title: string;
  target_path: string;
  content_markdown: string;
  version: number;
  export_status: 'pending' | 'syncing' | 'synced' | 'failed' | 'manual_required';
  error_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface LearningPackage {
  id: string;
  project_id: string;
  title: string;
  manifest: {
    origin_project: string;
    educational_goal: string;
    topics: string[];
    prerequisites: string[];
    sources: string[];
    version: string;
    created_date: string;
  };
  external_notebook_id: string | null;
  external_sources: Array<{ id: string; name: string; status: string }>;
  import_status: 'pending' | 'syncing' | 'synced' | 'failed' | 'manual_required';
  error_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  owner_id: string;
  project_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

// Current logged-in user in mock auth context (matches authenticated Supabase user)
export const CURRENT_USER_ID = '00000000-0000-4000-a000-000000000001';

class OperionDatabase {
  public projects: Project[] = [];
  public tasks: Task[] = [];
  public integrations: Integration[] = [];
  public project_integrations: ProjectIntegration[] = [];
  public analysis_jobs: AnalysisJob[] = [];
  public analysis_results: AnalysisResult[] = [];
  public documents: DocumentRecord[] = [];
  public learning_packages: LearningPackage[] = [];
  public activity_logs: ActivityLog[] = [];
  public migrationsApplied: string[] = [];
  public project_notes: any[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    const now = new Date().toISOString();

    // Migraciones registradas
    this.migrationsApplied = [
      '20261031000001_setup_extensions_and_types.sql',
      '20261031000002_core_projects_and_tasks.sql',
      '20261031000003_integrations_and_jobs.sql',
      '20261031000004_documents_and_learning_packages.sql',
      '20261031000005_activity_logs_and_triggers.sql',
    ];

    // Integraciones maestras
    const intGithub: Integration = {
      id: 'int-github-001',
      provider: 'github',
      display_name: 'GitHub App (Read-Only)',
      status: 'active',
      created_at: now,
    };
    const intNotebookLM: Integration = {
      id: 'int-notebooklm-002',
      provider: 'notebooklm',
      display_name: 'NotebookLM Enterprise Connector',
      status: 'pending_verification',
      created_at: now,
    };
    this.integrations = [intGithub, intNotebookLM];

    // Proyecto 1: Avisos Hospital (Institucional) - Mencionado en el doc v1.1
    const p1: Project = {
      id: 'p-hospital-001',
      owner_id: CURRENT_USER_ID,
      name: 'avisos-hospital',
      slug: 'avisos-hospital',
      description: 'Sistema hospitalario de gestión de alertas clínicas y radiológicas con turnos médicos.',
      purpose: 'Automatizar la difusión de avisos críticos de radiología e interconsultas a guardias médicas.',
      status: 'active',
      privacy_tier: 'institutional', // Fase B: Requiere Zero Data Retention y sanitización estricta
      created_at: now,
      updated_at: now,
    };

    // Proyecto 2: AlianApp (Personal) - Mencionado en el doc v1.1
    const p2: Project = {
      id: 'p-alianapp-002',
      owner_id: CURRENT_USER_ID,
      name: 'alianapp',
      slug: 'alianapp',
      description: 'Aplicación comunitaria de coordinación y marketplace local.',
      purpose: 'Prototipo personal para conectar organizaciones barriales y servicios compartidos.',
      status: 'active',
      privacy_tier: 'personal', // Fase A: Google AI Studio / Gemini gratuito
      created_at: now,
      updated_at: now,
    };

    // Proyecto 3: Datapack Generator (Personal) - Mencionado en el doc v1.1
    const p3: Project = {
      id: 'p-datapack-003',
      owner_id: CURRENT_USER_ID,
      name: 'datapack-generator',
      slug: 'datapack-generator',
      description: 'Herramienta CLI para generar y validar estructuras lógicas de datos y mods.',
      purpose: 'Generador automatizado de esquemas de datos y datapacks técnicos.',
      status: 'active',
      privacy_tier: 'personal',
      created_at: now,
      updated_at: now,
    };

    this.projects = [p1, p2, p3];

    // Integración de GitHub con los repositorios reales de @sony0908
    this.project_integrations = [
      {
        id: 'pi-001',
        project_id: p1.id,
        integration_id: intGithub.id,
        external_reference: 'sony0908/avisos-hospital',
        configuration: { branch: 'main', read_only: true },
        created_at: now,
      },
      {
        id: 'pi-002',
        project_id: p2.id,
        integration_id: intGithub.id,
        external_reference: 'sony0908/alianapp',
        configuration: { branch: 'main', read_only: true },
        created_at: now,
      },
      {
        id: 'pi-003',
        project_id: p3.id,
        integration_id: intGithub.id,
        external_reference: 'sony0908/mc-datapack-generator',
        configuration: { branch: 'main', read_only: true },
        created_at: now,
      },
    ];

    // Tareas iniciales
    this.tasks = [
      {
        id: 't-001',
        project_id: p1.id,
        owner_id: CURRENT_USER_ID,
        title: 'Verificar exclusión de archivos clínicos y sanitización RUN',
        description: 'Auditar que no se transmitan datos de pacientes en el análisis de código de avisos-hospital.',
        status: 'in_progress',
        priority: 'critical',
        due_at: '2026-11-05T18:00:00Z',
        created_at: now,
        updated_at: now,
      },
      {
        id: 't-002',
        project_id: p1.id,
        owner_id: CURRENT_USER_ID,
        title: 'Exportar diagrama de arquitectura a Obsidian OPERION_VAULT',
        description: 'Generar Mermaid con el flujo de mensajes y verificar diffs antes de sobrescribir en SAF.',
        status: 'todo',
        priority: 'high',
        due_at: '2026-11-08T15:00:00Z',
        created_at: now,
        updated_at: now,
      },
      {
        id: 't-003',
        project_id: p2.id,
        owner_id: CURRENT_USER_ID,
        title: 'Preparar paquete educativo de Jetpack Compose para NotebookLM',
        description: 'Generar 01_FUNDAMENTOS.md y 02_GLOSARIO.md para el equipo de desarrollo.',
        status: 'todo',
        priority: 'medium',
        due_at: '2026-11-12T12:00:00Z',
        created_at: now,
        updated_at: now,
      },
    ];

    // Job de análisis de ejemplo completado
    const jobId = 'job-init-001';
    this.analysis_jobs.push({
      id: jobId,
      project_id: p1.id,
      status: 'completed',
      analysis_type: 'architecture',
      repository_revision: 'c8fa49e29a98ef1b2c453',
      sanitization_applied: true,
      requested_at: new Date(Date.now() - 3600000).toISOString(),
      started_at: new Date(Date.now() - 3550000).toISOString(),
      finished_at: new Date(Date.now() - 3400000).toISOString(),
      error_summary: null,
    });

    // Resultado estructurado: Observado vs Inferido vs Desconocido (Sección 4.4)
    this.analysis_results.push({
      id: 'res-init-001',
      job_id: jobId,
      result_type: 'architecture',
      observed: [
        {
          item: 'Backend FastAPI y PostgreSQL con SQLAlchemy 2.0',
          details: 'Definido explícitamente en pyproject.toml y src/db/session.py',
          evidencePath: 'pyproject.toml',
          lineRange: 'L14-L28',
        },
        {
          item: 'Módulo de notificaciones push via FCM (Firebase Cloud Messaging)',
          details: 'Instanciación de credenciales de servicio en src/services/push_notifications.py',
          evidencePath: 'src/services/push_notifications.py',
          lineRange: 'L45-L70',
        },
        {
          item: 'Autenticación JWT con rotación de claves en encabezado Authorization',
          details: 'Implementado en src/security/jwt_handler.py',
          evidencePath: 'src/security/jwt_handler.py',
          lineRange: 'L12-L35',
        },
      ],
      inferred: [
        {
          item: 'Patrón de Arquitectura Limpia / Capas desacopladas',
          hypothesis: 'El proyecto separa controladores HTTP de la lógica de dominio en routers/ y services/',
          rationale: 'Estructura de directorios consistente con separación hexagonal de responsabilidades.',
        },
        {
          item: 'Uso de cola de mensajería asíncrona para avisos urgentes',
          hypothesis: 'Se intuye consumo de Redis o RabbitMQ para el despacho de alertas de radiología',
          rationale: 'Importaciones en worker.py referencian tareas Celery.',
        },
      ],
      unknown: [
        {
          item: 'Configuración de balanceador de carga y certificados mTLS',
          reason: 'No existen manifiestos de Kubernetes ni archivos de Terraform en el repositorio analizado.',
        },
        {
          item: 'Contrato de integración con el software de RIS/PACS hospitalario',
          reason: 'Solo existen modelos abstractos de interoperabilidad HL7/FHIR sin endpoints configurados.',
        },
      ],
      evidence: {
        total_files_analyzed: 48,
        excluded_files_count: 5,
        sanitized_tokens_count: 3,
        repository_sha: 'c8fa49e29a98ef1b2c453',
      },
      confidence: 0.94,
      created_at: now,
    });

    // Documento inicial Obsidian (Sección 8)
    this.documents.push({
      id: 'doc-obsidian-001',
      project_id: p1.id,
      destination: 'obsidian',
      document_type: 'Arquitectura',
      title: 'Arquitectura del Sistema avisos-hospital',
      target_path: '01_PROYECTOS/avisos-hospital/Arquitectura.md',
      content_markdown: `# Arquitectura: avisos-hospital

> Generado automáticamente por **OPERION v1.1**
> **Fecha:** ${now.slice(0, 10)} | **Revisión Git:** \`c8fa49e\` | **Nivel:** Institucional

## 1. Visión Estructural

El sistema está organizado bajo una arquitectura por capas desacopladas orientada a eventos clínicos.

\`\`\`mermaid
flowchart TD
    subgraph Cliente
        AppMedica["App Médica Android (OPERION)"]
        WebGuardia["Dashboard Web Guardia"]
    end

    subgraph Backend ["Backend Hospitalario"]
        ApiGateway["API Gateway / FastAPI"]
        AuthModule["Módulo Auth (JWT)"]
        AlertEngine["Motor de Alertas y Triage"]
        Sanitizer["Sanitizador de Datos Clínicos"]
    end

    subgraph Persistencia
        Postgres[(PostgreSQL 15 - RLS)]
        RedisQueue[(Cola Redis Celery)]
    end

    subgraph Notificaciones
        FCM["Firebase Cloud Messaging"]
        SMS["SMS Urgencias"]
    end

    AppMedica -->|HTTPS/mTLS| ApiGateway
    WebGuardia -->|HTTPS| ApiGateway
    ApiGateway --> AuthModule
    ApiGateway --> Sanitizer
    Sanitizer --> AlertEngine
    AlertEngine --> Postgres
    AlertEngine --> RedisQueue
    RedisQueue --> FCM
    RedisQueue --> SMS
\`\`\`

## 2. Tecnologías Observadas en Repositorio
* **Lenguaje:** Python 3.11 / Kotlin
* **Framework:** FastAPI, SQLAlchemy 2.0
* **Base de Datos:** PostgreSQL con Row Level Security (RLS)
* **Seguridad:** Tokens JWT de corta duración

## 3. Decisiones Técnicas Registradas
1. Separación estricta entre datos estructurados hospitalarios y payloads enviados a análisis.
2. Escritura local en Obsidian mediante Storage Access Framework (SAF).
`,
      version: 1,
      export_status: 'synced',
      error_summary: null,
      created_at: now,
      updated_at: now,
    });

    // Paquete educativo inicial NotebookLM (Sección 9)
    this.learning_packages.push({
      id: 'pkg-init-001',
      project_id: p2.id,
      title: 'Fundamentos de Arquitectura Android Jetpack Compose en AlianApp',
      manifest: {
        origin_project: 'alianapp',
        educational_goal: 'Comprender el ciclo de vida reactivo de Compose y ViewModel en aplicaciones comunitarias.',
        topics: ['Jetpack Compose', 'State Hoisting', 'Corrutinas & Flow', 'SAF (Storage Access Framework)'],
        prerequisites: ['Kotlin Básico', 'Programación Orientada a Objetos'],
        sources: [
          '01_FUNDAMENTOS.md',
          '02_GLOSARIO.md',
          '03_ARQUITECTURA_EXPLICADA.md',
          '04_GUIA_DE_APRENDIZAJE.md',
          '05_EJERCICIOS.md',
          '06_FUENTES.md',
        ],
        version: '1.0.0',
        created_date: now.slice(0, 10),
      },
      external_notebook_id: 'nb-alianapp-learn-994',
      external_sources: [
        { id: 'src-01', name: '01_FUNDAMENTOS.md', status: 'ready' },
        { id: 'src-02', name: '02_GLOSARIO.md', status: 'ready' },
        { id: 'src-03', name: '03_ARQUITECTURA_EXPLICADA.md', status: 'ready' },
      ],
      import_status: 'synced',
      error_summary: null,
      created_at: now,
      updated_at: now,
    });

    // Notas e Ideas iniciales con respuestas de IA
    this.project_notes = [
      {
        id: 'note-init-001',
        project_id: p1.id,
        author: 'user',
        note_type: 'idea',
        content: '¿Conviene migrar de WebSocket a SSE (Server-Sent Events) para que la batería del celular de los médicos no se agote tan rápido?',
        ai_response: 'Diagnóstico: Excelente propuesta técnica. SSE es unidireccional y utiliza HTTP/2 estándar, lo que permite al sistema operativo suspender la radio celular cuando no hay alertas, ahorrando hasta un 35% de batería en guardias médicas. Solo conserva WebSocket si los médicos necesitan responder o confirmar recepción en tiempo real sobre el mismo canal.',
        ai_status: 'answered',
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'note-init-002',
        project_id: p1.id,
        author: 'user',
        note_type: 'fix',
        content: 'En la sala de tomografía el WiFi tiene micro-cortes cada 20 minutos. ¿Qué estrategia de reintento recomiendas?',
        ai_response: 'Diagnóstico: Micro-cortes en salas blindadas (Faraday). Recomendación: Implementar Exponential Backoff con jitter (1s, 2s, 4s, máx 15s) y una cola local en SQLite/Room para encolar eventos salientes hasta que el socket reconecte.',
        ai_status: 'answered',
        created_at: new Date(Date.now() - 1800000).toISOString(),
      },
    ];

    // Registro de logs inicial
    this.activity_logs.push(
      {
        id: 'act-001',
        owner_id: CURRENT_USER_ID,
        project_id: p1.id,
        action: 'PROJECT_INITIALIZED',
        details: { name: p1.name, privacy_tier: p1.privacy_tier },
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: 'act-002',
        owner_id: CURRENT_USER_ID,
        project_id: p1.id,
        action: 'MIGRATION_EXECUTED',
        details: { count: 5, status: 'SUCCESS' },
        created_at: new Date(Date.now() - 7000000).toISOString(),
      },
      {
        id: 'act-003',
        owner_id: CURRENT_USER_ID,
        project_id: p1.id,
        action: 'ANALYSIS_JOB_COMPLETED',
        details: { jobId, confidence: 0.94, sanitized: true },
        created_at: new Date(Date.now() - 3400000).toISOString(),
      }
    );
  }

  // --- MÉTODOS DE PROYECTOS ---
  public getProjects(ownerId: string = CURRENT_USER_ID): Project[] {
    return this.projects.filter((p) => p.owner_id === ownerId);
  }

  public getProjectById(id: string, ownerId: string = CURRENT_USER_ID): Project | undefined {
    return this.projects.find((p) => (p.id === id || p.slug === id) && p.owner_id === ownerId);
  }

  public createProject(
    data: Omit<Project, 'id' | 'owner_id' | 'created_at' | 'updated_at'>,
    ownerId: string = CURRENT_USER_ID
  ): Project {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...data,
      id: `p-${generateId().slice(0, 8)}`,
      owner_id: ownerId,
      created_at: now,
      updated_at: now,
    };
    this.projects.push(newProject);
    this.logActivity(ownerId, newProject.id, 'PROJECT_CREATED', { name: newProject.name });
    return newProject;
  }

  public updateProject(
    id: string,
    data: Partial<Project>,
    ownerId: string = CURRENT_USER_ID
  ): Project | null {
    const project = this.getProjectById(id, ownerId);
    if (!project) return null;

    Object.assign(project, data, { updated_at: new Date().toISOString() });
    this.logActivity(ownerId, project.id, 'PROJECT_UPDATED', { updated_fields: Object.keys(data) });
    return project;
  }

  public deleteProject(id: string, ownerId: string = CURRENT_USER_ID): boolean {
    const index = this.projects.findIndex((p) => p.id === id && p.owner_id === ownerId);
    if (index === -1) return false;

    const [deleted] = this.projects.splice(index, 1);
    this.tasks = this.tasks.filter((t) => t.project_id !== id);
    this.analysis_jobs = this.analysis_jobs.filter((j) => j.project_id !== id);
    this.documents = this.documents.filter((d) => d.project_id !== id);
    this.learning_packages = this.learning_packages.filter((lp) => lp.project_id !== id);

    this.logActivity(ownerId, null, 'PROJECT_DELETED', { deleted_id: id, name: deleted.name });
    return true;
  }

  // --- MÉTODOS DE TAREAS ---
  public getTasks(projectId?: string, ownerId: string = CURRENT_USER_ID): Task[] {
    return this.tasks.filter((t) => {
      if (t.owner_id !== ownerId) return false;
      if (projectId && t.project_id !== projectId) return false;
      return true;
    });
  }

  public createTask(
    data: Omit<Task, 'id' | 'owner_id' | 'created_at' | 'updated_at'>,
    ownerId: string = CURRENT_USER_ID
  ): Task {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...data,
      id: `t-${generateId().slice(0, 8)}`,
      owner_id: ownerId,
      created_at: now,
      updated_at: now,
    };
    this.tasks.push(newTask);
    this.logActivity(ownerId, newTask.project_id, 'TASK_CREATED', { title: newTask.title });
    return newTask;
  }

  public updateTask(id: string, data: Partial<Task>, ownerId: string = CURRENT_USER_ID): Task | null {
    const task = this.tasks.find((t) => t.id === id && t.owner_id === ownerId);
    if (!task) return null;

    Object.assign(task, data, { updated_at: new Date().toISOString() });
    this.logActivity(ownerId, task.project_id, 'TASK_UPDATED', { id, status: task.status });
    return task;
  }

  // --- MÉTODOS DE JOBS Y ANÁLISIS ---
  public getAnalysisJobs(projectId?: string): AnalysisJob[] {
    return projectId
      ? this.analysis_jobs.filter((j) => j.project_id === projectId)
      : this.analysis_jobs;
  }

  public getAnalysisJob(id: string): AnalysisJob | undefined {
    return this.analysis_jobs.find((j) => j.id === id);
  }

  public getAnalysisResults(jobId: string): AnalysisResult[] {
    return this.analysis_results.filter((r) => r.job_id === jobId);
  }

  public createAnalysisJob(
    projectId: string,
    analysisType: string,
    revision: string | null = 'HEAD'
  ): AnalysisJob {
    const now = new Date().toISOString();
    const job: AnalysisJob = {
      id: `job-${generateId().slice(0, 8)}`,
      project_id: projectId,
      status: 'queued',
      analysis_type: analysisType,
      repository_revision: revision,
      sanitization_applied: true,
      requested_at: now,
      started_at: null,
      finished_at: null,
      error_summary: null,
    };
    this.analysis_jobs.unshift(job);
    this.logActivity(CURRENT_USER_ID, projectId, 'ANALYSIS_JOB_QUEUED', {
      jobId: job.id,
      analysisType,
    });
    return job;
  }

  // --- DOCUMENTOS Y OBSERVABLES ---
  public getDocuments(projectId?: string, destination?: 'obsidian' | 'notebooklm'): DocumentRecord[] {
    return this.documents.filter((d) => {
      if (projectId && d.project_id !== projectId) return false;
      if (destination && d.destination !== destination) return false;
      return true;
    });
  }

  public getLearningPackages(projectId?: string): LearningPackage[] {
    return projectId
      ? this.learning_packages.filter((lp) => lp.project_id === projectId)
      : this.learning_packages;
  }

  public logActivity(
    ownerId: string,
    projectId: string | null,
    action: string,
    details: Record<string, unknown>
  ): ActivityLog {
    const log: ActivityLog = {
      id: `act-${generateId().slice(0, 8)}`,
      owner_id: ownerId,
      project_id: projectId,
      action,
      details,
      created_at: new Date().toISOString(),
    };
    this.activity_logs.unshift(log);
    return log;
  }

  // --- NOTAS E IDEAS CON RESPUESTAS DE IA ---
  public getProjectNotes(projectId: string): any[] {
    return this.project_notes
      .filter((n) => n.project_id === projectId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createProjectNote(projectId: string, content: string, noteType: string = 'idea'): any {
    const note = {
      id: `note-${generateId().slice(0, 8)}`,
      project_id: projectId,
      author: 'user',
      note_type: noteType,
      content,
      ai_response: null,
      ai_status: 'pending',
      created_at: new Date().toISOString(),
    };
    this.project_notes.unshift(note);
    return note;
  }
}

export const db = new OperionDatabase();
