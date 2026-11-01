import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle, Key, UserCheck, Stethoscope, Mail, Phone, Lock, Sparkles } from 'lucide-react';

export const SanitizerTab: React.FC = () => {
  const sampleHospitalCode = `// src/controllers/radiology_triage.py
import requests
from sqlalchemy.orm import Session

# Credencial administrativa detectada
GITHUB_DEPLOY_TOKEN = "ghp_Abc987Xyz1234567890abcdefghijklmno"
DB_URL = "postgresql://postgres:AdminSecret2026!@10.0.4.15:5432/hospital_prod"

def process_urgent_exam(doctor_email="carlos.valenzuela@hospital-central.cl", contact="+56987654321"):
    # Registro de paciente en turno
    patient_run = "15.782.914-K"
    clinical_file = "Ficha clínica #948210"
    diagnosis = "Sospecha neumotórax paciente 15782914-K derivado a urgencias"

    print(f"Notificando guardia médica para {patient_run} con {clinical_file}")
    # Enviar payload a cola interna...
`;

  const [inputContent, setInputContent] = useState<string>(sampleHospitalCode);
  const [privacyTier, setPrivacyTier] = useState<'personal' | 'institutional'>('institutional');
  const [loading, setLoading] = useState<boolean>(false);
  const [report, setReport] = useState<any>(null);

  const handleRunSanitizer = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/sanitize/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputContent,
          privacy_tier: privacyTier,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReport(data.data);
      }
    } catch (err: any) {
      console.error('Error running sanitizer:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y resumen del mandato */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-lg">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100">Motor de Sanitización Automática</h2>
                <span className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-mono">
                  Secciones 10.1 & 15.1
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                Detección obligatoria de RUN chileno, datos clínicos, teléfonos, correos y tokens antes de cualquier transferencia a IA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <span className="text-xs text-slate-400 px-2 font-medium">Nivel de Proyecto:</span>
            <button
              onClick={() => setPrivacyTier('personal')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                privacyTier === 'personal'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Personal (Fase A)
            </button>
            <button
              onClick={() => setPrivacyTier('institutional')}
              className={`px-3 py-1 rounded text-xs font-semibold transition ${
                privacyTier === 'institutional'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Institucional (Fase B)
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor de entrada */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-400" />
                Payload de Entrada para Análisis (Simulación de Código)
              </span>
              <button
                onClick={() => setInputContent(sampleHospitalCode)}
                className="text-xs text-amber-400 hover:underline font-mono"
              >
                Cargar Caso Clínico
              </button>
            </div>

            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              rows={16}
              className="w-full mt-3 bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 leading-relaxed"
              placeholder="Pega aquí código o texto para verificar sanitización..."
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="text-[11px] text-slate-500 font-mono">
                {inputContent.length} caracteres • Detección multi-regex activa
              </div>
              <button
                onClick={handleRunSanitizer}
                disabled={loading}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {loading ? 'Analizando...' : 'Ejecutar Sanitización'}
              </button>
            </div>
          </div>
        </div>

        {/* Resultados y bloqueos */}
        <div className="lg:col-span-6 space-y-4">
          {report ? (
            <div className="space-y-4">
              {/* Alerta de bloqueo institucional */}
              {report.isBlockedForInstitutional ? (
                <div className="bg-rose-950/40 border border-rose-800 text-rose-200 rounded-xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>BLOQUEO DE PAYLOAD: Envío a IA Prohibido</span>
                  </div>
                  <p className="text-xs leading-relaxed text-rose-300">
                    Se detectaron identificadores clínicos o personales en un proyecto de categoría <strong>Institucional (Fase B)</strong>. El documento prohíbe explícitamente enviar registros de pacientes o código hospitalario a proveedores externos sin contrato de Cero Retención y autorización específica.
                  </p>
                </div>
              ) : (
                <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-200 rounded-xl p-4 shadow-sm flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold block text-emerald-300">Payload Sanitizado con Éxito</span>
                    Los datos sensibles han sido reemplazados por marcadores neutros y el payload es apto para inferencia.
                  </div>
                </div>
              )}

              {/* Hallazgos específicos */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-semibold text-slate-300">
                    Hallazgos Detectados ({report.findings.length})
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {report.findings.length === 0 ? 'Limpio' : 'Marcadores Aplicados'}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {report.findings.map((f: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 bg-slate-950 rounded-lg border border-slate-850 flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center gap-2">
                        {f.type === 'RUN' && <UserCheck className="w-4 h-4 text-cyan-400" />}
                        {f.type === 'CLINICAL_DATA' && <Stethoscope className="w-4 h-4 text-rose-400" />}
                        {f.type === 'SECRET_TOKEN' && <Key className="w-4 h-4 text-amber-400" />}
                        {f.type === 'CONNECTION_STRING' && <Lock className="w-4 h-4 text-purple-400" />}
                        {f.type === 'EMAIL' && <Mail className="w-4 h-4 text-blue-400" />}
                        {f.type === 'PHONE' && <Phone className="w-4 h-4 text-indigo-400" />}
                        <span className="text-slate-300">{f.type}:</span>
                        <span className="text-rose-400 line-through truncate max-w-[150px]">{f.match}</span>
                      </div>
                      <span className="text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900/60 text-[10px]">
                        {f.replacement}
                      </span>
                    </div>
                  ))}
                  {report.findings.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No se detectaron datos sensibles en la muestra.</p>
                  )}
                </div>
              </div>

              {/* Payload Limpio de Salida */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
                <span className="text-xs font-mono font-semibold text-slate-300 block pb-2 border-b border-slate-800">
                  Payload Sanitizado Resultante:
                </span>
                <div className="mt-2 p-3 bg-slate-950 rounded-lg font-mono text-[11px] text-emerald-300 max-h-48 overflow-y-auto whitespace-pre leading-relaxed border border-slate-850">
                  {report.cleanContent}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-xl p-12 text-center text-slate-500">
              <ShieldAlert className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Haz clic en &quot;Ejecutar Sanitización&quot; para comprobar la detección.</p>
              <p className="text-xs mt-1 text-slate-600">
                El sistema aplicará regex específicas para RUNs, fichas hospitalarias, claves privadas y tokens.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
