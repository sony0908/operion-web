# OPERION — Centro de Control, Arquitectura y Migraciones (v1.1)

> **Documento maestro de producto, arquitectura e implementación**  
> **Plataforma:** Android Nativo (Jetpack Compose / SAF) + Backend Administrado (Supabase PostgreSQL 15 & RLS)  
> **Gobernanza:** Separación estricta entre **Obsidian** (Estructura/Decisiones) y **NotebookLM** (Aprendizaje Didáctico).

---

## 1. Visión General

OPERION es el centro de control para organizar, analizar y administrar múltiples proyectos personales y técnicos. Centraliza la información de repositorios, comprende su arquitectura con IA de contexto extenso, ejecuta sanitización automática de datos sensibles y genera documentación especializada para dos entornos complementarios:

* **Obsidian (`OPERION_VAULT`):** Estructura visual de componentes, arquitectura de software, diagramas Mermaid, dependencias y registro de decisiones técnicas.
* **NotebookLM (`NOTEBOOKLM_PACKAGE`):** Contenido educativo, glosarios, lecciones, guías didácticas y ejercicios para comprender el código.

---

## 2. Arquitectura del Sistema

```text
USUARIO (Android / Web Control Center)
   │
   ▼
BACKEND OPERION (Express + Vite + Supabase Client)
   ├── Base de Datos (PostgreSQL 15 + Row Level Security)
   ├── Motor de Sanitización Automática (Regex: RUN, datos clínicos, tokens)
   ├── Conector GitHub (Solo Lectura - Sección 4.3)
   │     └── Inspección de repositorios autorizados
   ├── Motor de Análisis con IA (Gemini - Contexto Extenso)
   │     └── Clasificación: Observado / Inferido / Desconocido
   │
   ├── [Destino Estratégico] ➔ OBSIDIAN (Escritura SAF / OPERION_VAULT)
   └── [Destino Educativo]  ➔ NOTEBOOKLM (Paquetes NOTEBOOKLM_PACKAGE)
```

---

## 3. Migraciones SQL Versionadas (`supabase/migrations/`)

El backend cuenta con 5 migraciones SQL listas para Supabase CLI o despliegue en la nube:

1. `20261031000001_setup_extensions_and_types.sql`: Extensiones `uuid-ossp`, `pgcrypto`, trigger `updated_at` y ENUMs del dominio (`project_status`, `privacy_tier`, `job_status`, etc.).
2. `20261031000002_core_projects_and_tasks.sql`: Tablas `projects` y `tasks` con llaves foráneas y aislamiento mediante RLS (`auth.uid() = owner_id`).
3. `20261031000003_integrations_and_jobs.sql`: Catálogo de `integrations` (GitHub solo lectura), `project_integrations`, cola asíncrona de `analysis_jobs` y `analysis_results` (con campos JSONB: `observed`, `inferred`, `unknown`, `evidence`).
4. `20261031000004_documents_and_learning_packages.sql`: Tablas de entregables para Obsidian (`documents`) y NotebookLM (`learning_packages`).
5. `20261031000005_activity_logs_and_triggers.sql`: Bitácora inmutable de auditoría y trazabilidad histórica.

---

## 4. Estructura de Vault y Paquetes de Salida

### A. Obsidian (`OPERION_VAULT/`)
```text
OPERION_VAULT/
├── 00_DASHBOARD/
│   ├── Inicio.md
│   └── Mapa_Global.md
├── 01_PROYECTOS/
│   ├── avisos-hospital/
│   │   ├── Overview.md
│   │   ├── Arquitectura.md  (con diagramas Mermaid)
│   │   ├── Estructura.md
│   │   ├── Herramientas.md
│   │   ├── Dependencias.md
│   │   └── Decisiones.md
│   ├── alianapp/
│   └── datapack-generator/
├── 02_RELACIONES/
│   └── Dependencias_entre_proyectos.md
└── 03_PLANTILLAS/
    ├── Proyecto.md
    └── Decision_Tecnica.md
```

### B. NotebookLM (`NOTEBOOKLM_PACKAGE/`)
```text
NOTEBOOKLM_PACKAGE/
├── README.md
├── manifest.json
├── 01_FUNDAMENTOS.md
├── 02_GLOSARIO.md
├── 03_ARQUITECTURA_EXPLICADA.md
├── 04_GUIA_DE_APRENDIZAJE.md
├── 05_EJERCICIOS.md
└── 06_FUENTES.md
```

---

## 5. Políticas de Privacidad y Sanitización (Sección 10.1 & 15.1)

* **Fase A — Personal:** Proyectos propios (ej. `alianapp`, `mc-datapack-generator`), elegibles para modelos generales en Google AI Studio.
* **Fase B — Institucional:** Proyectos con datos sensibles (ej. `avisos-hospital`, `app-turnos`). Exige **Cero Retención de Datos**, validación contractual de IA y bloqueo estricto si se detectan RUNs chilenos o fichas médicas de pacientes.
* **Detección Automática:** Regex para RUN chileno, correos electrónicos, teléfonos, fichas hospitalarias, claves privadas (`-----BEGIN PRIVATE KEY-----`), tokens GitHub (`ghp_...`, `github_pat_...`), JWTs y cadenas de conexión a bases de datos.

---

## 6. Instalación y Ejecución Local

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/sony0908/operion-web.git
   cd operion-web
   ```

2. Instalar dependencias:
   ```bash
   npm install
   ```

3. Configurar variables de entorno en `.env` (guíate con `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Iniciar el servidor Full-Stack en modo desarrollo:
   ```bash
   npm run dev
   ```
   * El servidor iniciará en `http://localhost:3000` con la API REST `/api/v1` y el dashboard interactivo montados en vivo.

---

## 7. Contratos de la API REST (`/api/v1`)

* `GET /api/v1/projects`: Listar proyectos del usuario autenticado.
* `POST /api/v1/projects`: Crear nuevo proyecto con política de privacidad (`personal` | `institutional`).
* `GET /api/v1/projects/:id/tasks`: Listar tareas del proyecto.
* `POST /api/v1/projects/:id/analysis`: Ejecutar análisis de repositorio con IA de contexto extenso.
* `GET /api/v1/migrations`: Inspeccionar estado de las 5 migraciones SQL.
* `POST /api/v1/sanitize/test`: Evaluar y probar detección de datos sensibles en código.
* `GET /api/v1/integrations/github/repos`: Listar repositorios autorizados de GitHub (Solo Lectura).
* `GET /api/v1/activity`: Bitácora inmutable de auditoría.
