export type PrivacyTier = 'personal' | 'institutional';
export type ProjectStatus = 'draft' | 'active' | 'paused' | 'archived';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'manual_required';

export interface Project {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string;
  purpose: string;
  status: ProjectStatus;
  privacy_tier: PrivacyTier;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  project_id: string;
  owner_id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MigrationFile {
  filename: string;
  applied: boolean;
  sql: string;
  sizeBytes: number;
}

export interface AnalysisFinding {
  item: string;
  details?: string;
  hypothesis?: string;
  rationale?: string;
  reason?: string;
  evidencePath?: string;
  lineRange?: string;
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

export interface RiskFinding {
  item: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  recommendation: string;
}

export interface MissingFinding {
  item: string;
  impact: string;
  suggestion: string;
}

export interface ImprovementFinding {
  item: string;
  category: string;
  rationale: string;
}

export interface SuggestedTask {
  title: string;
  priority: TaskPriority;
  reason: string;
}

export interface ProjectNote {
  id: string;
  project_id: string;
  author: 'user';
  note_type: 'idea' | 'note' | 'fix';
  content: string;
  ai_response?: string;
  ai_status: 'pending' | 'answered';
  created_at: string;
}

export interface AnalysisResult {
  id: string;
  job_id: string;
  result_type: string;
  observed: AnalysisFinding[];
  inferred: AnalysisFinding[];
  unknown: AnalysisFinding[];
  risks?: RiskFinding[];
  missing?: MissingFinding[];
  improvements?: ImprovementFinding[];
  suggestedTasks?: SuggestedTask[];
  evidence: Record<string, any>;
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
  export_status: SyncStatus;
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
  import_status: SyncStatus;
  error_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  owner_id: string;
  project_id: string | null;
  action: string;
  details: Record<string, any>;
  created_at: string;
}
