import React, { useState, useEffect } from 'react';
import { GraduationCap, AlertCircle, FileArchive, CheckCircle2, Download, Plus, BookOpen, Layers, Info } from 'lucide-react';
import { Project, LearningPackage } from '../types';

interface NotebookLMTabProps {
  projects: Project[];
  onPackageCreated: () => void;
}

export const NotebookLMTab: React.FC<NotebookLMTabProps> = ({ projects, onPackageCreated }) => {
  const [packages, setPackages] = useState<LearningPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<LearningPackage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [activeFile, setActiveFile] = useState<string>('01_FUNDAMENTOS.md');

  // Modal form states
  const [pkgTitle, setPkgTitle] = useState('');
  const [educationalGoal, setEducationalGoal] = useState('');
  const [selectedProjectSlug, setSelectedProjectSlug] = useState(projects[0]?.id || '');
  const [creating, setCreating] = useState(false);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/projects/p-hospital-001/learning-packages');
      const data = await res.json();
      if (data.success) {
        setPackages(data.data);
        if (!selectedPkg && data.data.length > 0) {
          setSelectedPkg(data.data[0]);
        }
      }
    } catch (err: any) {
      console.error('Error fetching learning packages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkgTitle || !educationalGoal) return;

    try {
      setCreating(true);
      const res = await fetch(`/api/v1/projects/${selectedProjectSlug}/learning-packages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pkgTitle,
          educational_goal: educationalGoal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPkgTitle('');
        setEducationalGoal('');
        setShowCreateModal(false);
        await fetchPackages();
        onPackageCreated();
      }
    } catch (err: any) {
      console.error('Error creating package:', err);
    } finally {
      setCreating(false);
    }
  };

  const samplePackageContent: Record<string, string> = {
    '01_FUNDAMENTOS.md': `# 01. Fundamentos Tecnológicos

Este documento pertenece exclusivamente a **NotebookLM** y tiene por objetivo capacitar al desarrollador en los conceptos clave del proyecto.

## Conceptos Esenciales
1. **Modelos Reactivos:** Comprensión de estados mutables e inmutables en interfaces móviles.
2. **Arquitectura por Capas:** Separación entre presentación, dominio y persistencia.
3. **Mecanismo SAF:** Storage Access Framework de Android para gestión local de vaults.
`,
    '02_GLOSARIO.md': `# 02. Glosario de Términos

* **SAF (Storage Access Framework):** API de almacenamiento seguro en Android que no requiere permisos amplios de disco.
* **RLS (Row Level Security):** Políticas a nivel de fila en PostgreSQL para aislar datos de usuarios.
* **Zero Data Retention:** Acuerdo contractual donde el proveedor de IA no almacena ni entrena con los prompts enviados.
* **Observado vs Inferido:** Principio de OPERION que distingue hechos verificables en código de suposiciones de la IA.
`,
    '03_ARQUITECTURA_EXPLICADA.md': `# 03. Arquitectura Explicada (Enfoque Didáctico)

> **Diferencia frente a Obsidian:** Mientras que el documento de Obsidian muestra la topología para toma de decisiones, este documento explica pedagógicamente **por qué** se tomó cada decisión arquitectónica.

### ¿Por qué FastAPI con SQLAlchemy?
FastAPI permite tipado estricto mediante Pydantic, reduciendo errores en la deserialización de mensajes de radiología...
`,
    '04_GUIA_DE_APRENDIZAJE.md': `# 04. Ruta y Guía de Aprendizaje

1. **Semana 1:** Configuración de entorno Supabase y migraciones locales con CLI.
2. **Semana 2:** Pruebas del motor de sanitización con expresiones regulares para RUNs.
3. **Semana 3:** Implementación de Jetpack Compose y patrones MVI.
`,
    '05_EJERCICIOS.md': `# 05. Ejercicios y Preguntas de Comprensión

1. ¿Qué ocurre si un repositorio institucional contiene un RUN en un archivo de configuración?
   * *Respuesta esperada:* El motor de sanitización bloquea el envío de payload a la IA.
2. ¿Por qué Obsidian no debe contener glosarios ni ejercicios didácticos?
   * *Respuesta esperada:* Por el principio de separación estricta de responsabilidades entre Obsidian y NotebookLM.
`,
    '06_FUENTES.md': `# 06. Fuentes y Referencias Técnicas

1. Documentación oficial de Android Storage Access Framework (SAF).
2. Especificación Supabase PostgreSQL 15 & Row Level Security.
3. Guía de contexto extenso de Google Gemini y directrices de protección de datos clínicos.
`,
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Paquetes Educativos // NotebookLM</h2>
                <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  Secciones 2.2 & 9
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Destino exclusivo de glosarios, lecciones, guías y ejercicios. Prohibido mezclar en Obsidian.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Generar Paquete Educativo
          </button>
        </div>
      </div>

      {/* Honest API Status Warning (Section 16: No simular respuestas exitosas de APIs externas) */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-start gap-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block">Estado del Conector API NotebookLM:</span>
          Cumpliendo con la Sección 16 (&quot;No simular respuestas exitosas de APIs externas&quot;), el conector informa con honestidad que la API de autoservicio para cuentas de consumo de NotebookLM está pendiente de habilitación pública. Por consiguiente, OPERION genera de forma fidedigna el manifiesto y paquete de fuentes (`01_FUNDAMENTOS.md` a `06_FUENTES.md`) listo para ser sincronizado con Google Cloud Enterprise o importado como texto fuente.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Paquetes Generados */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Paquetes Educativos Listos
          </h3>

          <div className="space-y-3">
            {packages.map((pkg) => {
              const isSelected = selectedPkg?.id === pkg.id;
              return (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-slate-850 border-amber-500/50 shadow-md ring-1 ring-amber-500/20'
                      : 'bg-slate-900 border-slate-800 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-slate-200">{pkg.title}</h4>
                    <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">
                      v{pkg.manifest.version}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2">
                    {pkg.manifest.educational_goal}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                    <span>{pkg.manifest.sources.length} fuentes .md</span>
                    <span className="text-amber-400">NOTEBOOKLM_PACKAGE</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Explorador del Paquete */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[650px]">
            {/* Header del paquete */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                <FileArchive className="w-4 h-4 text-amber-400" />
                <span className="font-bold">{selectedPkg?.manifest.origin_project}/NOTEBOOKLM_PACKAGE/</span>
              </div>
              <span className="text-[10px] font-mono bg-amber-950/60 text-amber-300 border border-amber-800/50 px-2 py-0.5 rounded">
                Estructura Sección 9
              </span>
            </div>

            {/* Selector de archivo fuente */}
            <div className="p-2 bg-slate-900 border-b border-slate-800 flex flex-wrap gap-1.5 text-xs font-mono">
              {[
                '01_FUNDAMENTOS.md',
                '02_GLOSARIO.md',
                '03_ARQUITECTURA_EXPLICADA.md',
                '04_GUIA_DE_APRENDIZAJE.md',
                '05_EJERCICIOS.md',
                '06_FUENTES.md',
              ].map((file) => (
                <button
                  key={file}
                  onClick={() => setActiveFile(file)}
                  className={`px-2.5 py-1 rounded text-xs transition ${
                    activeFile === file
                      ? 'bg-amber-600 text-white font-medium'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  {file}
                </button>
              ))}
            </div>

            {/* Contenido didáctico */}
            <div className="flex-1 p-5 overflow-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {samplePackageContent[activeFile] || '# Documento en proceso de compilación'}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para generar paquete */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              Generar Paquete Educativo para NotebookLM
            </h3>

            <form onSubmit={handleCreatePackage} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Proyecto de Origen
                </label>
                <select
                  value={selectedProjectSlug}
                  onChange={(e) => setSelectedProjectSlug(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.privacy_tier})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Título del Paquete Formativo *
                </label>
                <input
                  type="text"
                  required
                  value={pkgTitle}
                  onChange={(e) => setPkgTitle(e.target.value)}
                  placeholder="ej: Guía de Arquitectura Reactiva y Corrutinas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Objetivo de Aprendizaje *
                </label>
                <textarea
                  required
                  value={educationalGoal}
                  onChange={(e) => setEducationalGoal(e.target.value)}
                  rows={3}
                  placeholder="ej: Dominar la separación de capas y el consumo de SAF..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  {creating ? 'Generando...' : 'Crear Paquete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
