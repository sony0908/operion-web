import React, { useState } from 'react';
import { Send, Terminal, ArrowUpRight, Copy, Check } from 'lucide-react';

export const ApiConsoleTab: React.FC = () => {
  const endpoints = [
    { method: 'GET', path: '/api/v1/projects', desc: 'Listar todos los proyectos del usuario' },
    { method: 'GET', path: '/api/v1/projects/p-hospital-001/tasks', desc: 'Listar tareas del proyecto avisos-hospital' },
    { method: 'GET', path: '/api/v1/migrations', desc: 'Estado de las 5 migraciones SQL' },
    { method: 'GET', path: '/api/v1/integrations', desc: 'Catálogo de proveedores externos (GitHub)' },
    { method: 'GET', path: '/api/v1/activity', desc: 'Bitácora inmutable de auditoría' },
    { method: 'GET', path: '/api/v1/analysis/job-init-001/results', desc: 'Resultados del análisis (Observado/Inferido/Desconocido)' },
    { method: 'GET', path: '/api/v1/projects/p-hospital-001/documents', desc: 'Documentos generados para Obsidian' },
    { method: 'GET', path: '/api/v1/projects/p-alianapp-002/learning-packages', desc: 'Paquetes educativos NotebookLM' },
  ];

  const [selectedEndpoint, setSelectedEndpoint] = useState(endpoints[0]);
  const [responseJson, setResponseJson] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleTestEndpoint = async (ep = selectedEndpoint) => {
    try {
      setLoading(true);
      const res = await fetch(ep.path);
      const data = await res.json();
      setResponseJson(data);
    } catch (err: any) {
      setResponseJson({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (responseJson) {
      navigator.clipboard.writeText(JSON.stringify(responseJson, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-lg">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100">Explorador de API REST /api/v1 (Sección 7)</h2>
              <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full font-mono">
                Endpoints en Vivo
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-0.5">
              Prueba en tiempo real de los contratos funcionales del backend administrado.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Lista de Endpoints */}
        <div className="lg:col-span-5 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
            Rutas Disponibles
          </h3>

          <div className="space-y-2">
            {endpoints.map((ep, i) => {
              const isSelected = selectedEndpoint.path === ep.path;
              return (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedEndpoint(ep);
                    handleTestEndpoint(ep);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                    isSelected
                      ? 'bg-slate-850 border-cyan-500 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-850 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 font-mono text-xs truncate">
                    <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-800/60 px-1.5 py-0.5 rounded font-bold">
                      {ep.method}
                    </span>
                    <span className="truncate">{ep.path}</span>
                  </div>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Visor de Respuesta JSON */}
        <div className="lg:col-span-7">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col h-[550px]">
            <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300">
                <span className="text-cyan-400 font-bold">{selectedEndpoint.method}</span>
                <span>{selectedEndpoint.path}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copiado' : 'Copiar JSON'}
                </button>
                <button
                  onClick={() => handleTestEndpoint()}
                  disabled={loading}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition flex items-center gap-1 disabled:opacity-50"
                >
                  <Send className="w-3 h-3" />
                  {loading ? 'Petición en curso...' : 'Enviar'}
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-auto bg-slate-950 font-mono text-xs text-cyan-300 leading-relaxed">
              <pre>{responseJson ? JSON.stringify(responseJson, null, 2) : '// Haz clic en "Enviar" para probar la ruta'}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
