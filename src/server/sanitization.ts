/**
 * OPERION Sanitization Engine (Sección 10.1 y 10.2)
 * Proceso automático previo al envío de cualquier payload a proveedores de IA.
 * Detecta: RUN chileno, emails, teléfonos, datos clínicos, tokens, contraseñas y claves privadas.
 */

export interface SanitizationFinding {
  type: 'RUN' | 'EMAIL' | 'PHONE' | 'CLINICAL_DATA' | 'SECRET_TOKEN' | 'PRIVATE_KEY' | 'CONNECTION_STRING';
  match: string;
  location?: string;
  replacement: string;
}

export interface SanitizationResult {
  cleanContent: string;
  findings: SanitizationFinding[];
  isBlockedForInstitutional: boolean;
  warnings: string[];
}

// Regex patterns según Sección 10.1
const RUN_REGEX = /\b(\d{1,2}(?:\.\d{3}){2}-[\dkK]|\d{7,8}-[\dkK])\b/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
const PHONE_REGEX = /(\+?56\s?9\s?\d{4}\s?\d{4}|\b9\s?\d{4}\s?\d{4}\b|\b\d{2}\s?\d{4}\s?\d{4}\b)/g;
const CLINICAL_ID_REGEX = /\b(?:ficha|historia|folio|atención|atencion|paciente|registro\s*cl[ií]nico)[\s:#_-]+(\d{4,10}|[A-Z0-9-]{6,12})\b/gi;
const PRIVATE_KEY_REGEX = /-----BEGIN[ A-Z0-9_-]+PRIVATE KEY-----[\s\S]+?-----END[ A-Z0-9_-]+PRIVATE KEY-----/g;
const JWT_OR_AUTH_TOKEN_REGEX = /\b(?:eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*|ghp_[A-Za-z0-9]{36}|gho_[A-Za-z0-9]{36}|github_pat_[A-Za-z0-9_]{50,}|sk-[a-zA-Z0-9]{32,}|AKIA[0-9A-Z]{16})\b/g;
const CONNECTION_STRING_REGEX = /(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"'`]+:[^\s"'`]+@[^\s"'`]+/gi;

export function sanitizeContent(
  rawContent: string,
  options?: {
    privacyTier?: 'personal' | 'institutional';
    allowExternalProvider?: boolean;
    fileName?: string;
  }
): SanitizationResult {
  const findings: SanitizationFinding[] = [];
  const warnings: string[] = [];
  let clean = rawContent;

  // 1. Detección y sanitización de Claves Privadas
  clean = clean.replace(PRIVATE_KEY_REGEX, (match) => {
    findings.push({
      type: 'PRIVATE_KEY',
      match: match.slice(0, 30) + '...',
      location: options?.fileName,
      replacement: '<REDACTED_PRIVATE_KEY>',
    });
    return '<REDACTED_PRIVATE_KEY>';
  });

  // 2. Detección y sanitización de Tokens y Secretos
  clean = clean.replace(JWT_OR_AUTH_TOKEN_REGEX, (match) => {
    findings.push({
      type: 'SECRET_TOKEN',
      match: match.slice(0, 6) + '***',
      location: options?.fileName,
      replacement: '<REDACTED_SECRET_TOKEN>',
    });
    return '<REDACTED_SECRET_TOKEN>';
  });

  // 3. Detección y sanitización de Cadenas de Conexión con credenciales
  clean = clean.replace(CONNECTION_STRING_REGEX, (match) => {
    findings.push({
      type: 'CONNECTION_STRING',
      match: match.slice(0, 15) + '***',
      location: options?.fileName,
      replacement: '<REDACTED_CONNECTION_STRING>',
    });
    return '<REDACTED_CONNECTION_STRING>';
  });

  // 4. Detección y sanitización de RUN chileno
  clean = clean.replace(RUN_REGEX, (match) => {
    findings.push({
      type: 'RUN',
      match,
      location: options?.fileName,
      replacement: '<REDACTED_RUN>',
    });
    return '<REDACTED_RUN>';
  });

  // 5. Detección de Fichas Clínicas e identificadores hospitalarios
  clean = clean.replace(CLINICAL_ID_REGEX, (match) => {
    findings.push({
      type: 'CLINICAL_DATA',
      match,
      location: options?.fileName,
      replacement: '<REDACTED_CLINICAL_ID>',
    });
    return '<REDACTED_CLINICAL_ID>';
  });

  // 6. Detección y sanitización de Emails
  clean = clean.replace(EMAIL_REGEX, (match) => {
    findings.push({
      type: 'EMAIL',
      match,
      location: options?.fileName,
      replacement: '<REDACTED_EMAIL>',
    });
    return '<REDACTED_EMAIL>';
  });

  // 7. Detección y sanitización de Teléfonos
  clean = clean.replace(PHONE_REGEX, (match) => {
    findings.push({
      type: 'PHONE',
      match,
      location: options?.fileName,
      replacement: '<REDACTED_PHONE>',
    });
    return '<REDACTED_PHONE>';
  });

  // Reglas de gobernanza según Sección 15.1 (Personal vs Institucional)
  let isBlockedForInstitutional = false;
  if (options?.privacyTier === 'institutional') {
    const hasSensitiveData = findings.some((f) => f.type === 'CLINICAL_DATA' || f.type === 'RUN');
    if (hasSensitiveData) {
      isBlockedForInstitutional = true;
      warnings.push(
        'BLOQUEO INSTITUCIONAL: Se detectaron identificadores clínicos o personales en código hospitalario. Está prohibido el envío a proveedores externos sin autorización expresa y marco legal aprobado.'
      );
    }
    if (!options?.allowExternalProvider) {
      warnings.push(
        'POLÍTICA INSTITUCIONAL ACTIVA: Debe verificarse que el proveedor de IA contratado opere en modalidad Pay-as-you-go con cláusula de CERO retención de datos antes de transferir payloads.'
      );
    }
  }

  return {
    cleanContent: clean,
    findings,
    isBlockedForInstitutional,
    warnings,
  };
}
