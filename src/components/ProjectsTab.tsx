import React, { useState, useEffect, useRef } from 'react';
import {
  FolderGit2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Download,
  BookOpen,
  GraduationCap,
  Sparkles,
  MessageSquare,
  Send,
  HelpCircle,
  Lightbulb,
  Wrench,
  Check,
  ChevronRight,
  Flame,
  X,
  Menu,
  ChevronDown,
  Layers,
  ArrowUpRight,
  Search,
  PenSquare,
  FileText,
  AlertCircle,
  ArrowRight,
  Droplet,
  Waves,
  Scale,
} from 'lucide-react';
import mermaid from 'mermaid';
import { Project, Task, AnalysisResult, ProjectNote } from '../types';

interface ProjectsTabProps {
  projects: Project[];
  tasks: Task[];
  onProjectCreated: () => void;
  onSelectProjectForAnalysis: (projectId: string) => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  projects,
  tasks: initialTasks,
  onProjectCreated,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>(projects[0]?.id || '');
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [filterPrivacy, setFilterPrivacy] = useState<'all' | 'personal' | 'institutional'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Form states for project creation
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [description, setDescription] = useState('');
  const [privacyTier, setPrivacyTier] = useState<'personal' | 'institutional'>('personal');
  const [creating, setCreating] = useState(false);
  const [gitRepos, setGitRepos] = useState<any[]>([]);

  // AI Diagnosis State
  const [diagnosing, setDiagnosing] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [sanitizationAlert, setSanitizationAlert] = useState<string | null>(null);
  const [mermaidSvg, setMermaidSvg] = useState<string>('');

  // Active view in Step 3
  const [activeStep3Tab, setActiveStep3Tab] = useState<'dialogue' | 'diagnosis' | 'tasks' | 'obsidian'>('dialogue');

  // User Notes & AI Feedback state
  const [notes, setNotes] = useState<ProjectNote[]>([]);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteType, setNewNoteType] = useState<'idea' | 'fix' | 'note'>('idea');
  const [submittingNote, setSubmittingNote] = useState(false);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'monospace',
    });
  }, []);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  useEffect(() => {
    fetch('/api/v1/integrations/github/repos')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setGitRepos(data.data);
        }
      })
      .catch(() => {});
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectTasks = tasks.filter((t) => t.project_id === selectedProject?.id);

  // Fetch diagnosis & notes when selected project changes
  useEffect(() => {
    if (selectedProject) {
      setSanitizationAlert(null);

      // Cargar análisis previo
      fetch(`/api/v1/projects/${selectedProject.id}/analysis`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data && data.data.length > 0) {
            const latestJob = data.data[0];
            fetch(`/api/v1/analysis/${latestJob.id}/results`)
              .then((r) => r.json())
              .then((resData) => {
                if (resData.success) {
                  setAnalysisResult(resData.data);
                  renderMermaid(resData.data);
                }
              })
              .catch(() => {});
          } else {
            setAnalysisResult(null);
            setMermaidSvg('');
          }
        })
        .catch(() => {});

      // Cargar notas del proyecto
      fetchNotes(selectedProject.id);
    }
  }, [selectedProject?.id]);

  const fetchNotes = (projectId: string) => {
    fetch(`/api/v1/projects/${projectId}/notes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setNotes(data.data);
        }
      })
      .catch(() => {});
  };

  const renderMermaid = async (result: AnalysisResult) => {
    const defaultGraph = `graph TD
  App["${selectedProject?.name || 'App'}"] --> API["Backend"]
  API --> DB[("Supabase Postgres")]`;

    const chart = (result.evidence as any)?.mermaidDiagram || defaultGraph;
    try {
      const { svg } = await mermaid.render('mermaid-' + Math.random().toString(36).slice(2, 7), chart);
      setMermaidSvg(svg);
    } catch {
      // Ignorar error
    }
  };

  // Diagnóstico autónomo con IA
  const handleRunAiDiagnosis = async () => {
    if (!selectedProject) return;
    try {
      setDiagnosing(true);
      setSanitizationAlert(null);
      const res = await fetch(`/api/v1/projects/${selectedProject.id}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_type: 'architecture',
          repo_reference: `sony0908/${selectedProject.slug}`,
        }),
      });
      const data = await res.json();
      if (!data.success && data.blocked) {
        setSanitizationAlert(data.error || 'Bloqueo Institucional: Se detectaron identificadores de pacientes.');
      } else if (data.success && data.data?.result) {
        setAnalysisResult(data.data.result);
        renderMermaid(data.data.result);
        setActiveStep3Tab('diagnosis');

        const tRes = await fetch(`/api/v1/projects/${selectedProject.id}/tasks`);
        const tData = await tRes.json();
        if (tData.success) {
          setTasks((prev) => {
            const others = prev.filter((t) => t.project_id !== selectedProject.id);
            return [...others, ...tData.data];
          });
        }
      }
    } catch (err: any) {
      setSanitizationAlert(`Error de conexión al diagnosticar: ${err.message}`);
    } finally {
      setDiagnosing(false);
    }
  };

  // Enviar Idea o Nota a la IA
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim() || !selectedProject) return;

    try {
      setSubmittingNote(true);
      const res = await fetch(`/api/v1/projects/${selectedProject.id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: newNoteContent,
          note_type: newNoteType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNotes((prev) => [data.data, ...prev]);
        setNewNoteContent('');
        setActiveStep3Tab('dialogue');
      }
    } catch (err: any) {
      console.error('Error al guardar nota:', err);
    } finally {
      setSubmittingNote(false);
    }
  };

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === taskId) {
          const nextStatus = t.status === 'done' ? 'todo' : 'done';
          fetch(`/api/v1/tasks/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus }),
          }).catch(() => {});
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const downloadObsidianVaultDoc = () => {
    if (!selectedProject) return;
    const content = `# Arquitectura y Decisiones: ${selectedProject.name}

> Generado automáticamente por **OPERION v1.1**
> **Proyecto:** \`${selectedProject.slug}\` | **Privacidad:** \`${selectedProject.privacy_tier.toUpperCase()}\`
> **Repositorio:** \`sony0908/${selectedProject.slug}\`

## 1. Propósito y Misión
${selectedProject.purpose}

## 2. Diagrama de Arquitectura
\`\`\`mermaid
${(analysisResult?.evidence as any)?.mermaidDiagram || 'graph TD\n  App --> Backend\n  Backend --> DB'}
\`\`\`

## 3. Diagnóstico de Salud Técnica
### Posibles Fallos y Riesgos:
${(analysisResult?.risks || [
  { item: 'Concurrencia de datos', description: 'Riesgo de colisión en estado offline', recommendation: 'Caché con SQLite local' }
]).map((r: any) => `* **[${r.severity?.toUpperCase() || 'INFO'}] ${r.item}:** ${r.description} ➔ *Solución:* ${r.recommendation}`).join('\n')}

### Qué Falta en el Proyecto:
${(analysisResult?.missing || [
  { item: 'Pruebas unitarias de flujo', impact: 'Dificultad de refactorización', suggestion: 'Añadir test suite' }
]).map((m: any) => `* **${m.item}:** ${m.impact} ➔ *Sugerencia:* ${m.suggestion}`).join('\n')}

## 4. Tareas del Proyecto
${projectTasks.map((t) => `- [${t.status === 'done' ? 'x' : ' '}] ${t.title} (${t.priority})`).join('\n')}
`;
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedProject.slug}-Arquitectura.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purpose) return;

    try {
      setCreating(true);
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          purpose,
          description,
          privacy_tier: privacyTier,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setName('');
        setPurpose('');
        setDescription('');
        setShowCreateModal(false);
        onProjectCreated();
      }
    } catch (err: any) {
      console.error('Error creating project:', err);
    } finally {
      setCreating(false);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const matchesPrivacy = filterPrivacy === 'all' || p.privacy_tier === filterPrivacy;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPrivacy && matchesSearch;
  });

  return (
    <div className="space-y-0 max-w-lg mx-auto w-full relative z-10 text-left py-2">
      
      {/* ========================================================= */}
      {/* RECUADRO 1 (STEP 1): PROYECTO ACTIVO                      */}
      {/* ========================================================= */}
      <div className="relative group">
        <div
          onClick={() => setIsSidebarOpen(true)}
          className="bg-[#131418] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-4 sm:p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] cursor-pointer transition active:scale-[0.99] relative overflow-hidden"
        >
          {/* Barra superior de la ventana: 3 micro-dots de navegador y pill de repositorio */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-white/[0.04]">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#e05d44]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#e5a93b]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#52a567]" />
            </div>

            <div className="flex items-center gap-2">
              <div className="h-5 px-2.5 bg-black/40 rounded-full border border-white/[0.05] flex items-center text-[10px] font-mono text-zinc-400">
                sony0908/{selectedProject?.slug || 'repositorio'}
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-medium tracking-[0.22em] text-[#e58a5b] uppercase font-mono block">
                STEP 1
              </span>
              <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-white/95">
                {selectedProject ? selectedProject.name : 'Selecciona un Proyecto'}
              </h2>
              <p className="text-xs text-[#8a8d98] font-normal leading-relaxed pt-0.5">
                {selectedProject?.purpose || 'Centro de control de arquitectura y tareas'}
              </p>
            </div>

            {/* Isotipo tenue en la esquina derecha del recuadro */}
            <div className="w-12 h-12 opacity-20 flex-shrink-0 -mr-1 -mt-1 pointer-events-none">
              <img src="/operion-logo.png" alt="" className="w-full h-full object-contain filter contrast-125" />
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* LÍNEA DE CIRCUITO CONECTORA (STEP 1 -> STEP 2)            */}
      {/* ========================================================= */}
      <div className="flex justify-center h-10 relative my-[-2px] z-20 pointer-events-none">
        <svg className="w-48 h-full overflow-visible" viewBox="0 0 192 40" fill="none">
          {/* Nodo de salida */}
          <circle cx="96" cy="0" r="3.5" fill="#e58a5b" className="drop-shadow-[0_0_6px_#e58a5b]" />
          {/* Trazado estilo circuito */}
          <path
            d="M 96 0 L 96 16 L 48 16 L 48 40"
            stroke="#e58a5b"
            strokeWidth="1.8"
            strokeOpacity="0.85"
            className="drop-shadow-[0_0_6px_rgba(229,138,91,0.7)]"
          />
          {/* Nodo de entrada */}
          <circle cx="48" cy="40" r="3.5" fill="#e58a5b" className="drop-shadow-[0_0_6px_#e58a5b]" />
        </svg>
      </div>

      {/* ========================================================= */}
      {/* RECUADRO 2 (STEP 2): CUADERNO & LOS RECUADROS PEQUEÑOS    */}
      {/* ========================================================= */}
      <div className="bg-[#131418] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] relative overflow-hidden space-y-3.5">
        
        {/* Cabecera Step 2 */}
        <div className="space-y-0.5">
          <span className="text-[10px] font-medium tracking-[0.22em] text-[#e58a5b] uppercase font-mono block">
            STEP 2
          </span>
          <h3 className="text-lg font-normal tracking-tight text-white/95">
            ¿Qué quieres registrar?
          </h3>
          <p className="text-xs text-[#8a8d98] font-normal leading-relaxed">
            Elige el tipo de registro técnico y consulta al asesor IA
          </p>
        </div>

        {/* LOS RECUADROS PEQUEÑOS (Estilo 'Oily', 'Dry', 'Balanced' de la referencia) */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          {/* Recuadro 1: Idea */}
          <div
            onClick={() => setNewNoteType('idea')}
            className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
              newNoteType === 'idea'
                ? 'border-[#e58a5b] bg-[#e58a5b]/[0.08] shadow-[0_0_12px_rgba(229,138,91,0.2)]'
                : 'border-white/[0.06] bg-[#0c0d10] hover:border-white/10 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                newNoteType === 'idea' ? 'border-[#e58a5b]' : 'border-zinc-600'
              }`}>
                {newNoteType === 'idea' && <span className="w-1.5 h-1.5 rounded-full bg-[#e58a5b]" />}
              </span>
              <span className="text-xs font-medium text-zinc-100">Idea</span>
            </div>
            <Lightbulb className={`w-3.5 h-3.5 ${newNoteType === 'idea' ? 'text-[#e58a5b]' : 'text-zinc-500'}`} />
          </div>

          {/* Recuadro 2: Fallo */}
          <div
            onClick={() => setNewNoteType('fix')}
            className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
              newNoteType === 'fix'
                ? 'border-[#e58a5b] bg-[#e58a5b]/[0.08] shadow-[0_0_12px_rgba(229,138,91,0.2)]'
                : 'border-white/[0.06] bg-[#0c0d10] hover:border-white/10 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                newNoteType === 'fix' ? 'border-[#e58a5b]' : 'border-zinc-600'
              }`}>
                {newNoteType === 'fix' && <span className="w-1.5 h-1.5 rounded-full bg-[#e58a5b]" />}
              </span>
              <span className="text-xs font-medium text-zinc-100">Fallo</span>
            </div>
            <AlertTriangle className={`w-3.5 h-3.5 ${newNoteType === 'fix' ? 'text-[#e58a5b]' : 'text-zinc-500'}`} />
          </div>

          {/* Recuadro 3: Nota */}
          <div
            onClick={() => setNewNoteType('note')}
            className={`p-2.5 sm:p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
              newNoteType === 'note'
                ? 'border-[#e58a5b] bg-[#e58a5b]/[0.08] shadow-[0_0_12px_rgba(229,138,91,0.2)]'
                : 'border-white/[0.06] bg-[#0c0d10] hover:border-white/10 text-zinc-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                newNoteType === 'note' ? 'border-[#e58a5b]' : 'border-zinc-600'
              }`}>
                {newNoteType === 'note' && <span className="w-1.5 h-1.5 rounded-full bg-[#e58a5b]" />}
              </span>
              <span className="text-xs font-medium text-zinc-100">Nota</span>
            </div>
            <FileText className={`w-3.5 h-3.5 ${newNoteType === 'note' ? 'text-[#e58a5b]' : 'text-zinc-500'}`} />
          </div>
        </div>

        {/* Formulario de entrada de texto */}
        <form onSubmit={handleAddNote} className="space-y-3 pt-1">
          <div className="bg-[#0c0d10] border border-white/[0.06] focus-within:border-[#e58a5b]/70 focus-within:ring-1 focus-within:ring-[#e58a5b]/20 rounded-xl p-3 transition shadow-inner">
            <textarea
              required
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.target.value)}
              rows={2}
              placeholder={`Escribe aquí tu observación o idea técnica para ${selectedProject?.name}...`}
              className="w-full bg-transparent text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none resize-none leading-relaxed font-sans"
            />
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <span className="text-[11px] text-[#8a8d98] font-sans">
              Diagnóstico con Gemini 3.8 Flash
            </span>

            {/* Botón cálido exacto a 'See Your Ritual ->' */}
            <button
              type="submit"
              disabled={submittingNote || !newNoteContent.trim()}
              className="px-4 py-2.5 bg-[#f2996e] hover:bg-[#e0895e] text-[#090a0d] font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(242,153,110,0.25)] active:scale-[0.98] disabled:opacity-50"
            >
              <span>{submittingNote ? 'Consultando...' : 'Consultar asesor IA'}</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </form>

      </div>

      {/* ========================================================= */}
      {/* LÍNEA DE CIRCUITO CONECTORA (STEP 2 -> STEP 3)            */}
      {/* ========================================================= */}
      <div className="flex justify-center h-10 relative my-[-2px] z-20 pointer-events-none">
        <svg className="w-48 h-full overflow-visible" viewBox="0 0 192 40" fill="none">
          {/* Nodo de salida */}
          <circle cx="144" cy="0" r="3.5" fill="#e58a5b" className="drop-shadow-[0_0_6px_#e58a5b]" />
          {/* Trazado estilo circuito */}
          <path
            d="M 144 0 L 144 20 L 96 20 L 96 40"
            stroke="#e58a5b"
            strokeWidth="1.8"
            strokeOpacity="0.85"
            className="drop-shadow-[0_0_6px_rgba(229,138,91,0.7)]"
          />
          {/* Nodo de entrada */}
          <circle cx="96" cy="40" r="3.5" fill="#e58a5b" className="drop-shadow-[0_0_6px_#e58a5b]" />
        </svg>
      </div>

      {/* ========================================================= */}
      {/* RECUADRO 3 (STEP 3): DIAGNÓSTICO & ENTREGABLES            */}
      {/* ========================================================= */}
      <div className="bg-[#131418] border border-white/[0.06] rounded-2xl p-4 sm:p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] relative overflow-hidden space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.04] pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-medium tracking-[0.22em] text-[#e58a5b] uppercase font-mono block">
              STEP 3
            </span>
            <h3 className="text-lg font-normal tracking-tight text-white/95">
              Diagnóstico & Entregables
            </h3>
            <p className="text-xs text-[#8a8d98] font-normal leading-relaxed">
              Auditoría continua de repositorio, tareas, Obsidian y NotebookLM
            </p>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setActiveStep3Tab('dialogue')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeStep3Tab === 'dialogue' ? 'bg-[#e58a5b]/15 text-[#e58a5b] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Diálogo ({notes.length})
            </button>
            <button
              onClick={() => setActiveStep3Tab('diagnosis')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeStep3Tab === 'diagnosis' ? 'bg-[#e59874]/15 text-[#e59874] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Diagnóstico IA
            </button>
            <button
              onClick={() => setActiveStep3Tab('tasks')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeStep3Tab === 'tasks' ? 'bg-[#e59874]/15 text-[#e59874] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Tareas ({projectTasks.filter((t) => t.status !== 'done').length})
            </button>
            <button
              onClick={() => setActiveStep3Tab('obsidian')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                activeStep3Tab === 'obsidian' ? 'bg-[#e59874]/15 text-[#e59874] font-bold' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              Obsidian
            </button>
          </div>
        </div>

        {/* CTA RITUAL DE DIAGNÓSTICO AUTÓNOMO (Como 'See Your Ritual ->') */}
        <div className="p-3 bg-[#0c0d10] border border-white/[0.04] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-zinc-200 block">
              {analysisResult ? 'Diagnóstico IA actualizado' : 'Auditoría autónoma pendiente'}
            </span>
            <span className="text-[11px] text-[#8a8d98]">
              {analysisResult ? `${(analysisResult.risks || []).length} riesgos analizados` : 'Revisa repositorio y extrae tareas sin registro manual'}
            </span>
          </div>

          <button
            onClick={handleRunAiDiagnosis}
            disabled={diagnosing}
            className="px-4 py-2 bg-[#f2996e] hover:bg-[#e0895e] text-[#090a0d] font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(242,153,110,0.25)] active:scale-[0.98] disabled:opacity-60"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{diagnosing ? 'Auditando...' : 'Ejecutar Diagnóstico'}</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        {/* FEED DE DIÁLOGO */}
        {activeStep3Tab === 'dialogue' && (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="bg-[#0c0d10] border border-white/[0.06] rounded-xl p-3.5 space-y-2 text-left"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span className="text-[#e59874] font-bold uppercase tracking-wider">
                    {note.note_type}
                  </span>
                  <span>{new Date(note.created_at).toLocaleDateString()}</span>
                </div>

                <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                  {note.content}
                </p>

                {note.ai_response && (
                  <div className="mt-2 p-3 bg-[#13141a] border-l-2 border-[#e59874] rounded-r-lg space-y-1 text-left">
                    <span className="text-[10px] font-mono font-bold text-[#e59874] block">
                      DIAGNÓSTICO TÉCNICO IA
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-sans">
                      {note.ai_response}
                    </p>
                  </div>
                )}
              </div>
            ))}

            {notes.length === 0 && (
              <p className="text-xs text-zinc-500 py-6 text-center">
                Aún no has registrado notas. Escribe arriba para consultar a la IA.
              </p>
            )}
          </div>
        )}

        {/* DIAGNÓSTICO IA */}
        {activeStep3Tab === 'diagnosis' && (
          <div className="space-y-3">
            {analysisResult ? (
              <div className="space-y-3 text-left">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold font-mono">
                    Posibles Fallos & Riesgos Detectados
                  </span>
                  {(analysisResult.risks || []).map((r, i) => (
                    <div key={i} className="p-3 bg-[#0c0d10] border border-rose-500/20 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-zinc-200">{r.item}</span>
                        <span className="text-[9px] font-mono text-rose-400 uppercase font-bold">
                          {r.severity}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed">{r.description}</p>
                      <p className="text-[11px] text-zinc-400 pt-0.5">
                        ➔ <strong className="text-zinc-300">Solución:</strong> {r.recommendation}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-[10px] uppercase tracking-wider text-[#e59874] font-bold font-mono">
                    Qué Puede Faltar en el Proyecto
                  </span>
                  {(analysisResult.missing || []).map((m, i) => (
                    <div key={i} className="p-3 bg-[#0c0d10] border border-white/[0.05] rounded-xl space-y-1">
                      <span className="text-xs font-bold text-zinc-200">{m.item}</span>
                      <p className="text-xs text-zinc-400">{m.impact}</p>
                      <p className="text-[11px] text-zinc-400">
                        ➔ <strong className="text-zinc-300">Sugerencia:</strong> {m.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <p className="text-xs text-zinc-400">Sin diagnóstico previo.</p>
                <button
                  onClick={handleRunAiDiagnosis}
                  className="px-4 py-2 bg-[#e59874] text-[#090a0d] font-bold rounded-xl text-xs hover:bg-[#d88963] transition"
                >
                  Ejecutar Diagnóstico
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAREAS */}
        {activeStep3Tab === 'tasks' && (
          <div className="space-y-2 max-h-[380px] overflow-y-auto">
            {projectTasks.map((t) => (
              <div
                key={t.id}
                onClick={() => toggleTaskStatus(t.id)}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-2.5 cursor-pointer text-left ${
                  t.status === 'done'
                    ? 'bg-[#090a0d]/60 border-white/[0.03] opacity-40'
                    : 'bg-[#0c0d10] border-white/[0.06] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={t.status === 'done'}
                    onChange={() => {}}
                    className="rounded border-zinc-700 text-[#e59874] focus:ring-0 cursor-pointer"
                  />
                  <span className={`text-xs ${t.status === 'done' ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {t.title}
                  </span>
                </div>
                <span className="text-[9px] font-mono text-zinc-500 uppercase font-bold">
                  {t.priority}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* OBSIDIAN */}
        {activeStep3Tab === 'obsidian' && (
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-200">Vault: OPERION_VAULT</span>
              <button
                onClick={downloadObsidianVaultDoc}
                className="px-4 py-2 bg-[#e59874] text-[#090a0d] font-bold rounded-xl text-xs flex items-center gap-2 shadow-md hover:bg-[#d88963] transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar .md</span>
              </button>
            </div>
            {mermaidSvg && (
              <div className="p-3 bg-[#0c0d10] rounded-xl border border-white/[0.05] overflow-x-auto flex justify-center">
                <div dangerouslySetInnerHTML={{ __html: mermaidSvg }} />
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* DRAWER LATERAL DE PROYECTOS (ESTILO MATE OSCURO)          */}
      {/* ========================================================= */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          />

          <div className="relative w-80 max-w-[85vw] bg-[#0e0f14] border-r border-white/[0.08] h-full flex flex-col p-5 shadow-2xl z-10 space-y-4">
            
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <img src="/operion-logo.png" alt="OPERION" className="w-5 h-5 object-contain" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 font-mono">
                  Proyectos ({projects.length})
                </h3>
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Buscador */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar proyecto..."
                className="w-full bg-[#14151a] border border-white/[0.08] rounded-xl pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#e59874]/60"
              />
            </div>

            {/* Lista de Proyectos */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {filteredProjects.map((p) => {
                const isSelected = selectedProject?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProjectId(p.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      isSelected
                        ? 'bg-[#181920] border-[#e59874] shadow-sm'
                        : 'bg-[#121317] border-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-100">{p.name}</span>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">
                        {p.privacy_tier}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 block mt-0.5">
                      sony0908/{p.slug}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setIsSidebarOpen(false);
                setShowCreateModal(true);
              }}
              className="w-full py-2.5 bg-[#e59874] hover:bg-[#d88963] text-[#090a0d] rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Proyecto</span>
            </button>

          </div>
        </div>
      )}

      {/* Modal de Creación de Proyecto */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#14151a] border border-white/[0.08] rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <h3 className="text-sm font-bold text-zinc-100">Registrar Proyecto</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3">
              {gitRepos.length > 0 && (
                <div className="p-3 bg-[#0c0d10] border border-white/[0.06] rounded-xl space-y-1">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase block">
                    Vincular Repositorio GitHub (@sony0908)
                  </label>
                  <select
                    onChange={(e) => {
                      const selected = gitRepos.find((r) => r.full_name === e.target.value);
                      if (selected) {
                        setName(selected.name);
                        setDescription(selected.description || `Repositorio ${selected.full_name}`);
                        setPurpose(selected.description || `Desarrollo de ${selected.name}`);
                        if (selected.name.includes('hospital') || selected.name.includes('turno')) {
                          setPrivacyTier('institutional');
                        } else {
                          setPrivacyTier('personal');
                        }
                      }
                    }}
                    className="w-full bg-[#14151a] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 font-mono focus:outline-none"
                  >
                    <option value="">-- Seleccionar de tus 14 repositorios --</option>
                    {gitRepos.map((r) => (
                      <option key={r.full_name} value={r.full_name}>
                        {r.name} ({r.language || 'Code'}) {r.private ? '🔒' : '🌐'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: avisos-hospital"
                  className="w-full bg-[#0c0d10] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#e59874]"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-zinc-400 uppercase block mb-1">Propósito</label>
                <textarea
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  rows={2}
                  placeholder="Objetivo principal del proyecto..."
                  className="w-full bg-[#0c0d10] border border-white/[0.08] rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-[#e59874]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#e59874] text-[#090a0d] font-bold rounded-xl text-xs transition disabled:opacity-50"
                >
                  {creating ? 'Guardando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
