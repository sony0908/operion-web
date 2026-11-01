/**
 * OPERION v1.1 - Minimalist Developer Control Center
 * Diseñado con estética Titanium / Graphite, marca oficial OPERION y navegación móvil ergonómica.
 */

import React, { useState, useEffect } from 'react';
import {
  FolderGit2,
  ShieldCheck,
  BookOpen,
  Settings,
  Sparkles,
  Layers,
} from 'lucide-react';

import { Project, Task } from './types';
import { ProjectsTab } from './components/ProjectsTab';
import { SanitizerTab } from './components/SanitizerTab';
import { ObsidianTab } from './components/ObsidianTab';
import { MigrationsTab } from './components/MigrationsTab';

export default function App() {
  const [activeTab, setActiveTab] = useState<'projects' | 'sanitizer' | 'obsidian' | 'system'>('projects');
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchGlobalData = async () => {
    try {
      setLoading(true);
      const resProj = await fetch('/api/v1/projects');
      const dataProj = await resProj.json();
      if (dataProj.success) {
        setProjects(dataProj.data);
        if (!selectedProjectId && dataProj.data.length > 0) {
          setSelectedProjectId(dataProj.data[0].id);
        }
      }

      const resTasks = await fetch('/api/v1/projects/p-hospital-001/tasks');
      const dataTasks = await resTasks.json();
      if (dataTasks.success) {
        setTasks(dataTasks.data);
      }
    } catch (e: any) {
      console.error('Error fetching global state:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const handleSelectProjectForAnalysis = (projId: string) => {
    setSelectedProjectId(projId);
    setActiveTab('projects');
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-zinc-100 flex flex-col font-sans selection:bg-amber-500/20 pb-20 antialiased relative overflow-x-hidden">
      
      {/* ======================================================== */}
      {/* LOGOTIPO OFICIAL OPERION DE FONDO (LISO Y VISIBLE)       */}
      {/* ======================================================== */}
      <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
        <img
          src="/operion-logo.png"
          alt="OPERION Logo"
          className="w-[460px] max-w-[88vw] object-contain opacity-35 filter contrast-125 transition-opacity duration-700"
        />
      </div>

      {/* ======================================================== */}
      {/* HEADER SUPERIOR ELEGANTE (SIN RECUADRO OP, SCRIPT FONT)   */}
      {/* ======================================================== */}
      <header className="bg-[#090a0d]/85 backdrop-blur-md border-b border-white/[0.04] sticky top-0 z-40">
        <div className="max-w-xl mx-auto px-5">
          <div className="flex items-center justify-between h-16">
            
            {/* Nombre Operion en tipografía mano escrita elegante (Alex Brush / Great Vibes) */}
            <div className="flex items-center gap-2">
              <span className="font-operion-script text-3xl sm:text-4xl text-zinc-100 font-normal tracking-wide drop-shadow-sm select-none leading-none pt-1">
                Operion
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/90 ml-0.5 mt-2 shadow-[0_0_8px_rgba(52,211,153,0.6)]" title="Sistema conectado & en línea" />
            </div>

            {/* Navegación Desktop */}
            <nav className="hidden sm:flex items-center space-x-1 text-xs">
              <button
                onClick={() => setActiveTab('projects')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'projects'
                    ? 'bg-[#18191f] text-white font-medium border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Proyectos
              </button>
              <button
                onClick={() => setActiveTab('sanitizer')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'sanitizer'
                    ? 'bg-[#18191f] text-white font-medium border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Sanitización
              </button>
              <button
                onClick={() => setActiveTab('obsidian')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'obsidian'
                    ? 'bg-[#18191f] text-white font-medium border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Obsidian
              </button>
              <button
                onClick={() => setActiveTab('system')}
                className={`px-3 py-1.5 rounded-xl transition ${
                  activeTab === 'system'
                    ? 'bg-[#18191f] text-white font-medium border border-white/[0.08]'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Ajustes
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* CONTENIDO PRINCIPAL                                      */}
      {/* ======================================================== */}
      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-4 relative z-10">
        {activeTab === 'projects' && (
          <ProjectsTab
            projects={projects}
            tasks={tasks}
            onProjectCreated={fetchGlobalData}
            onSelectProjectForAnalysis={handleSelectProjectForAnalysis}
          />
        )}
        {activeTab === 'sanitizer' && <SanitizerTab />}
        {activeTab === 'obsidian' && (
          <ObsidianTab projects={projects} onDocumentExported={fetchGlobalData} />
        )}
        {activeTab === 'system' && <MigrationsTab onRefreshAll={fetchGlobalData} />}
      </main>

      {/* ======================================================== */}
      {/* BARRA INFERIOR MÓVIL MATE                                */}
      {/* ======================================================== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#0e0f14]/95 backdrop-blur-md border-t border-white/[0.06] px-6 py-2.5 flex items-center justify-between z-40 max-w-xl mx-auto text-[11px] font-medium shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
        <button
          onClick={() => setActiveTab('projects')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'projects' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Proyectos</span>
        </button>

        <button
          onClick={() => setActiveTab('sanitizer')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'sanitizer' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sanitización</span>
        </button>

        <button
          onClick={() => setActiveTab('obsidian')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'obsidian' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Obsidian</span>
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`flex flex-col items-center gap-1 transition ${
            activeTab === 'system' ? 'text-amber-400 font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Ajustes</span>
        </button>
      </nav>

    </div>
  );
}
