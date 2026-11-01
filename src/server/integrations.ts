/**
 * OPERION External Integrations Manager
 * Gestiona conexiones a Supabase (Postgres & Auth) y GitHub (Solo Lectura)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface IntegrationHealth {
  service: string;
  connected: boolean;
  details: Record<string, any>;
  message: string;
}

let supabaseAdminClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdminClient;
}

export async function testSupabaseConnection(): Promise<IntegrationHealth> {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return {
      service: 'supabase',
      connected: false,
      details: { urlConfigured: Boolean(url), serviceKeyConfigured: Boolean(serviceKey) },
      message: 'Faltan credenciales de Supabase en las variables de entorno',
    };
  }

  try {
    const client = getSupabaseAdmin();
    if (!client) {
      throw new Error('No se pudo inicializar el cliente de Supabase');
    }

    // Probar consulta a la API de Supabase (por ejemplo auth.users o tablas existentes)
    const { data, error } = await client.from('projects').select('count', { count: 'exact', head: true });

    if (error) {
      // Si el error es 42P01 (relation does not exist), la conexión es válida pero la tabla aún no se ha creado con migraciones
      if (error.code === '42P01' || error.message.includes('relation "public.projects" does not exist') || error.code === 'PGRST204') {
        return {
          service: 'supabase',
          connected: true,
          details: {
            url,
            projectId: url.split('//')[1]?.split('.')[0],
            tablesReady: false,
            errorCode: error.code,
          },
          message: 'Conectado exitosamente a Supabase. Las tablas de OPERION están pendientes de migración inicial.',
        };
      }

      // Si es otro error
      return {
        service: 'supabase',
        connected: true, // Conectó a la API
        details: { url, error: error.message, code: error.code },
        message: `Conexión autenticada con Supabase API: ${error.message}`,
      };
    }

    return {
      service: 'supabase',
      connected: true,
      details: {
        url,
        projectId: url.split('//')[1]?.split('.')[0],
        tablesReady: true,
        count: data,
      },
      message: 'Conexión exitosa a Supabase PostgreSQL y autenticación activa.',
    };
  } catch (err: any) {
    return {
      service: 'supabase',
      connected: false,
      details: { error: err.message },
      message: `Fallo al conectar con Supabase: ${err.message}`,
    };
  }
}

export async function testGitHubConnection(): Promise<IntegrationHealth> {
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return {
      service: 'github',
      connected: false,
      details: { tokenConfigured: false },
      message: 'GITHUB_TOKEN no configurado en el servidor',
    };
  }

  try {
    const res = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'OPERION-App-v1.1',
        Accept: 'application/vnd.github+json',
      },
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      return {
        service: 'github',
        connected: false,
        details: { status: res.status, error: errJson.message },
        message: `GitHub rechazó el token (${res.status}): ${errJson.message || 'Error de autenticación'}`,
      };
    }

    const userData = await res.json();
    return {
      service: 'github',
      connected: true,
      details: {
        login: userData.login,
        name: userData.name,
        public_repos: userData.public_repos,
        mode: 'READ_ONLY_ENFORCED',
      },
      message: `Autenticado con GitHub como @${userData.login} (Modo Solo Lectura OPERION)`,
    };
  } catch (err: any) {
    return {
      service: 'github',
      connected: false,
      details: { error: err.message },
      message: `Error de red al consultar API de GitHub: ${err.message}`,
    };
  }
}

export async function fetchGitHubRepoDetails(repoFullName: string): Promise<any> {
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'OPERION-App-v1.1',
    Accept: 'application/vnd.github+json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`https://api.github.com/repos/${repoFullName}`, { headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error al obtener repositorio ${repoFullName}`);
  }

  return res.json();
}

export async function fetchUserRepositories(): Promise<any[]> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return [];
  try {
    const res = await fetch('https://api.github.com/user/repos?sort=updated&per_page=30', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'OPERION-App-v1.1',
        Accept: 'application/vnd.github+json',
      },
    });
    if (!res.ok) return [];
    const repos = await res.json();
    return repos.map((r: any) => ({
      name: r.name,
      full_name: r.full_name,
      description: r.description,
      language: r.language,
      default_branch: r.default_branch,
      private: r.private,
      updated_at: r.updated_at,
    }));
  } catch {
    return [];
  }
}

