// src/lib/sanitize.ts
/**
 * Sanitização de HTML e conteúdo de usuário
 * Protege contra XSS (Cross-Site Scripting)
 */

// Note: Para usar, instale DOMPurify com:
// npm install dompurify isomorphic-dompurify
// npm install --save-dev @types/dompurify

import DOMPurify from 'isomorphic-dompurify';

// ============================================================
// Configurações de sanitização
// ============================================================

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li',
    'blockquote', 'code', 'pre', 'hr', 'a',
  ],
  ALLOWED_ATTR: ['class', 'href'],
  ALLOW_DATA_ATTR: false,
  KEEP_CONTENT: true,
};

// ============================================================
// Markdown to Safe HTML
// ============================================================

/**
 * Converte markdown para HTML De forma SEGURA
 * Bloqueia qualquer tentativa de XSS
 */
export function markdownToSafeHtml(md: string): string {
  // 1. Escapar HTML entities primeiro
  let safe = escapeHtml(md);

  // 2. Aplicar transformações markdown
  let html = safe
    // Headers
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Underline
    .replace(/__(.+?)__/g, '<u>$1</u>')
    // URLs
    .replace(/\[([^\]]+)\]\(https?:\/\/[^\)]+\)/g, '<a href="$2">$1</a>')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    // Code blocks
    .replace(/```([^`]+)```/g, '<pre><code>$1</code></pre>')
    // Line breaks
    .replace(/\n\n/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');

  // 3. Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li[^>]*>.*?<\/li>(?:<br\/>)?)+)/g, '<ul>$1</ul>');

  // 4. Remove stray <br/> inside <ul>
  html = html.replace(/<ul([^>]*)>(.*?)<\/ul>/gs, (match) =>
    match.replace(/<br\/>/g, ''),
  );

  // 5. Sanitizar com DOMPurify
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

// ============================================================
// HTML Escaping
// ============================================================

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// ============================================================
// Sanitização de conteúdo JSON da API
// ============================================================

/**
 * Sanitiza string que veio de API externa (Groq, etc)
 */
export function sanitizeApiContent(content: string, maxLength: number = 10000): string {
  if (typeof content !== 'string') return '';

  // Truncar se muito grande
  let sanitized = content.slice(0, maxLength);

  // Remover script tags
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');

  // Remover event handlers
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remover iframe, embed, object
  sanitized = sanitized.replace(/<(iframe|embed|object|script)[^>]*>/gi, '');

  return sanitized;
}

// ============================================================
// Sanitização de User Input (forms)
// ============================================================

export function sanitizeUserInput(input: string, maxLength: number = 500): string {
  if (typeof input !== 'string') return '';

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove HTML brackets
}

// ============================================================
// Validação de URLs
// ============================================================

export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Apenas permitir HTTP e HTTPS
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

// ============================================================
// Sanitização completa para renderização
// ============================================================

export function sanitizeForDisplay(html: string): string {
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
}

// ============================================================
// Remover potenciais XSS vectors
// ============================================================

export const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /on\w+\s*=\s*["'][^"']*["']/gi,
  /javascript:/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /<iframe/gi,
  /<embed/gi,
  /<object/gi,
  /<link/gi,
  /<meta/gi,
  /<style/gi,
  /expression\s*\(/gi,
  /behavior\s*:/gi,
  /-moz-binding\s*:/gi,
];

export function removeXssPatterns(text: string): string {
  let result = text;
  XSS_PATTERNS.forEach(pattern => {
    result = result.replace(pattern, '');
  });
  return result;
}
