import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Clock, RefreshCw } from 'lucide-react';
import { ActivityLog } from '../types';

export const ActivityLogsTab: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/activity');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (err: any) {
      console.error('Error fetching activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-lg">
              <History className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Bitácora de Actividad y Auditoría</h2>
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-mono">
                  Inmutable
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Trazabilidad completa de proyectos creados, análisis de código, sanitización y exportaciones.
              </p>
            </div>
          </div>

          <button
            onClick={fetchLogs}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition"
            title="Refrescar logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3 font-semibold">Timestamp UTC</th>
                <th className="p-3 font-semibold">Acción</th>
                <th className="p-3 font-semibold">Proyecto ID</th>
                <th className="p-3 font-semibold">Detalles de Operación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-850">
                  <td className="p-3 text-slate-500 whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-cyan-300 border border-slate-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-400">
                    {log.project_id ? log.project_id : 'GLOBAL_SYSTEM'}
                  </td>
                  <td className="p-3 text-slate-300 max-w-md truncate">
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
