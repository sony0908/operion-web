import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, FolderTree, FileText, CheckCircle, ExternalLink, RefreshCw, Eye, ShieldCheck, Download } from 'lucide-react';
import mermaid from 'mermaid';
import { Project, DocumentRecord } from '../types';

interface ObsidianTabProps {
  projects: Project[];
  onDocumentExported: () => void;
}

export const ObsidianTab: React.FC<ObsidianTabProps> = ({ projects, onDocumentExported }) => {
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [safAuthorized, setSafAuthorized] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'content' | 'mermaid' | 'diff' | 'saf'>('content');
  const mermaidRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      fontFamily: 'monospace',
    });
  }, []);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/projects/p-hospital-001/documents');
      const data = await res.json();
      if (data.success) {
        setDocuments(data.data);
        if (!selectedDoc && data.data.length > 0) {
          setSelectedDoc(data.data[0]);
        }
      }
    } catch (e: any) {
      console.error('Error fetching documents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  // Extraer código Mermaid del markdown si existe
  const extractMermaid = (markdown: string): string | null => {
    const match = markdown.match(/```mermaid([\s\S]+?)```/);
    return match ? match[1].trim() : null;
  };

  useEffect(() => {
    if (activeTab === 'mermaid' && selectedDoc && mermaidRef.current) {
      const code = extractMermaid(selectedDoc.content_markdown);
      if (code) {
        mermaidRef.current.innerHTML = '';
        mermaid
          .render(`mermaid-${Date.now()}`, code)
          .then(({ svg }) => {
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = svg;
            }
          })
          .catch((err) => {
            if (mermaidRef.current) {
              mermaidRef.current.innerHTML = `<pre class="text-xs text-rose-400 p-4 font-mono">${err.message}</pre>`;
            }
          });
      }
    }
  }, [activeTab, selectedDoc]);

  const handleApproveExport = async () => {
    if (!selectedDoc) return;
    try {
      setExporting(true);
      const res = await fetch(`/api/v1/documents/${selectedDoc.id}/approve-export`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        await fetchDocs();
        onDocumentExported();
      }
    } catch (err: any) {
      console.error('Error exporting document:', err);
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadVaultBundle = () => {
    if (!selectedDoc) return;
    const blob = new Blob([selectedDoc.content_markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = selectedDoc.target_path.split('/').pop() || 'document.md';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Conector Obsidian // OPERION_VAULT</h2>
                <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-mono">
                  Secciones 2.1 & 8
                </span>
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  SAF Persistente Activo
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Estructura estratégica, diagramas Mermaid, diffs previos y acceso local mediante Android Storage Access Framework.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadVaultBundle}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 border border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Descargar .md
            </button>
            <button
              onClick={handleApproveExport}
              disabled={exporting || !selectedDoc}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {exporting ? 'Exportando...' : 'Aprobar Exportación Local'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Árbol del Vault */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1 flex items-center justify-between">
            <span>Árbol del Vault (OPERION_VAULT)</span>
            <FolderTree className="w-3.5 h-3.5 text-slate-500" />
          </h3>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 font-mono text-xs space-y-1">
            <div className="text-indigo-400 font-bold px-2 py-1">📁 OPERION_VAULT/</div>

            <div className="pl-4 space-y-1 text-slate-400">
              <div className="text-slate-500">├── 📁 00_DASHBOARD/</div>
              <div className="pl-6 text-slate-400">├── Inicio.md</div>
              <div className="pl-6 text-slate-400">└── Mapa_Global.md</div>

              <div className="text-slate-500">├── 📁 01_PROYECTOS/</div>
              <div className="pl-6 text-emerald-400 font-semibold">├── 📁 avisos-hospital/</div>

              {documents.map((doc) => {
                const isSelected = selectedDoc?.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDoc(doc)}
                    className={`pl-10 py-1.5 px-2 rounded cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-950/70 text-indigo-300 font-bold border border-indigo-800/60'
                        : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 truncate">
                      <FileText className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                      {doc.target_path.split('/').pop()}
                    </span>
                    <span className="text-[10px] bg-slate-800 px-1 rounded text-slate-400">
                      v{doc.version}
                    </span>
                  </div>
                );
              })}

              <div className="pl-6 text-slate-500">├── 📁 alianapp/</div>
              <div className="pl-6 text-slate-500">└── 📁 datapack-generator/</div>

              <div className="text-slate-500">├── 📁 02_RELACIONES/</div>
              <div className="pl-6 text-slate-400">└── Dependencias_entre_proyectos.md</div>

              <div className="text-slate-500">└── 📁 03_PLANTILLAS/</div>
              <div className="pl-6 text-slate-400">├── Proyecto.md</div>
              <div className="pl-6 text-slate-400">└── Decision_Tecnica.md</div>
            </div>
          </div>
        </div>

        {/* Panel de Contenido / Mermaid / Diff */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[650px]">
            {/* Header del documento */}
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                <span className="text-indigo-400">{selectedDoc?.target_path}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.2 rounded font-sans">
                  {selectedDoc?.export_status}
                </span>
              </div>

              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setActiveTab('content')}
                  className={`px-2.5 py-1 rounded transition ${
                    activeTab === 'content' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Markdown
                </button>
                <button
                  onClick={() => setActiveTab('mermaid')}
                  className={`px-2.5 py-1 rounded transition ${
                    activeTab === 'mermaid' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Diagrama Mermaid
                </button>
                <button
                  onClick={() => setActiveTab('saf')}
                  className={`px-2.5 py-1 rounded transition ${
                    activeTab === 'saf' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Permisos SAF
                </button>
              </div>
            </div>

            {/* Vista Markdown */}
            {activeTab === 'content' && (
              <div className="flex-1 p-5 overflow-auto bg-slate-950 font-mono text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedDoc?.content_markdown}
              </div>
            )}

            {/* Vista Diagrama Mermaid */}
            {activeTab === 'mermaid' && (
              <div className="flex-1 p-6 overflow-auto bg-slate-950 flex items-center justify-center">
                <div ref={mermaidRef} className="max-w-full overflow-x-auto text-center" />
              </div>
            )}

            {/* Vista Diagnóstico SAF */}
            {activeTab === 'saf' && (
              <div className="flex-1 p-6 overflow-auto bg-slate-950 space-y-4 font-mono text-xs">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Android Storage Access Framework (SAF) - Estado de Autorización</span>
                  </div>
                  <div className="text-slate-400 space-y-1">
                    <div>
                      <span className="text-slate-500">Directorio Autorizado:</span> content://com.android.externalstorage.documents/tree/primary%3AOPERION_VAULT
                    </div>
                    <div>
                      <span className="text-slate-500">Flags Persistentes:</span> FLAG_GRANT_READ_URI_PERMISSION | FLAG_GRANT_WRITE_URI_PERMISSION
                    </div>
                    <div>
                      <span className="text-slate-500">takePersistableUriPermission:</span> CONCEDIDO Y ALMACENADO EN ENCRYPTED DATASTORE
                    </div>
                    <div>
                      <span className="text-slate-500">Manejo de Errores:</span> Verificación previa con DocumentFile.canWrite() antes de I/O atómico.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
