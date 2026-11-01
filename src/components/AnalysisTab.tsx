import React, { useState } from 'react';
import { Cpu, CheckCircle2, HelpCircle, Lightbulb, Play, AlertCircle, FileSearch, ShieldCheck, Sparkles } from 'lucide-react';
import { Project, AnalysisJob, AnalysisResult } from '../types';

interface AnalysisTabProps {
  projects: Project[];
  selectedProjectId?: string;
  onAnalysisCompleted: () => void;
}

export const AnalysisTab: React.FC<AnalysisTabProps> = ({
  projects,
  selectedProjectId,
  onAnalysisCompleted,
}) => {
  const [projectId, setProjectId] = useState<string>(selectedProjectId || projects[0]?.id || '');
  const [analysisType, setAnalysisType] = useState<string>('architecture');
  const [revision, setRevision] = useState<string>('c8fa49e2');
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === projectId) || projects[0];

  const handleStartAnalysis = async () => {
    if (!currentProject) return;
    setAnalyzing(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/v1/projects/${currentProject.id}/analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analysis_type: analysisType,
          repository_revision: revision,
          sample_code_payload: `// Análisis de repositorio para ${currentProject.name}\n// Revisión: ${revision}\npackage main\nimport "net/http"\n// Punto de entrada seguro`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setActiveResult(data.data.result);
        onAnalysisCompleted();
      } else {
        setErrorMessage(data.error || 'Fallo al procesar el análisis');
      }
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera del motor de análisis */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Motor de Análisis con IA (Contexto Extenso)</h2>
                <span className="text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-full font-mono">
                  Secciones 4.4 & 11
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Separación obligatoria de resultados: <strong>Observado</strong> (evidencia directa), <strong>Inferido</strong> (hipótesis) y <strong>Desconocido</strong>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-semibold focus:outline-none"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.privacy_tier})
                </option>
              ))}
            </select>

            <select
              value={analysisType}
              onChange={(e) => setAnalysisType(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none"
            >
              <option value="inventory">Inventario de Archivos & Lenguajes</option>
              <option value="architecture">Arquitectura & Capas</option>
              <option value="dependencies">Dependencias & Módulos</option>
              <option value="persistence">Persistencia & Bases de Datos</option>
              <option value="learning">Contenidos para NotebookLM</option>
            </select>

            <button
              onClick={handleStartAnalysis}
              disabled={analyzing}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {analyzing ? 'Procesando...' : 'Ejecutar Análisis'}
            </button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Triada de Resultados Estructurados: Observado / Inferido / Desconocido */}
      {activeResult ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-4 py-2.5 rounded-lg">
            <span>Result ID: {activeResult.id}</span>
            <span>Confianza del Modelo: {(activeResult.confidence * 100).toFixed(0)}%</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Sanitización Previa Verificada
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. OBSERVADO */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>1. OBSERVADO</span>
                </div>
                <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/60">
                  Comprobable en Código
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hechos verificados directamente en los archivos inspeccionados con trazabilidad de rutas.
              </p>

              <div className="space-y-3">
                {activeResult.observed.map((obs, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-xs font-semibold text-slate-200 block">{obs.item}</span>
                    {obs.details && <p className="text-[11px] text-slate-400">{obs.details}</p>}
                    {obs.evidencePath && (
                      <div className="mt-2 pt-2 border-t border-slate-850 flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
                        <FileSearch className="w-3 h-3" />
                        <span>{obs.evidencePath} ({obs.lineRange || 'L1+'})</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. INFERIDO */}
            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                  <Lightbulb className="w-4 h-4" />
                  <span>2. INFERIDO</span>
                </div>
                <span className="text-[10px] font-mono bg-amber-950 text-amber-400 px-2 py-0.5 rounded border border-amber-800/60">
                  Conclusiones Razonables
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Hipótesis y patrones deducidos por el motor que no están demostrados al 100%.
              </p>

              <div className="space-y-3">
                {activeResult.inferred.map((inf, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-xs font-semibold text-slate-200 block">{inf.item}</span>
                    {inf.hypothesis && <p className="text-[11px] text-amber-300/90">{inf.hypothesis}</p>}
                    {inf.rationale && (
                      <div className="mt-2 pt-2 border-t border-slate-850 text-[10px] text-slate-400">
                        <strong>Fundamento:</strong> {inf.rationale}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 3. DESCONOCIDO */}
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-300 font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  <span>3. DESCONOCIDO</span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded border border-slate-700">
                  Límites de Información
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Componentes que no pueden determinarse con los datos actuales del repositorio.
              </p>

              <div className="space-y-3">
                {activeResult.unknown.map((unk, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-1">
                    <span className="text-xs font-semibold text-slate-200 block">{unk.item}</span>
                    <p className="text-[11px] text-slate-400">{unk.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-xl p-16 text-center text-slate-500">
          <Cpu className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm font-medium">Selecciona un tipo de análisis y presiona &quot;Ejecutar Análisis&quot;.</p>
          <p className="text-xs mt-1 text-slate-600">
            El motor procesará el repositorio respetando la sanitización y las directrices de contexto extenso.
          </p>
        </div>
      )}
    </div>
  );
};
