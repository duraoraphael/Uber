// src/lib/validation.ts
/**
 * Validação segura de inputs para a aplicação
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

// ============================================================
// Password Validation - Política forte de senhas
// ============================================================

export function validatePassword(password: string): ValidationResult {
  // Verificações de força
  const checks = {
    minLength: password.length >= 12,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password),
    noCommonPatterns: !/(123|password|111|abc|qwerty)/i.test(password),
  };

  const failedChecks = [];
  if (!checks.minLength) failedChecks.push('Mínimo 12 caracteres');
  if (!checks.hasUpperCase) failedChecks.push('Pelo menos 1 letra maiúscula');
  if (!checks.hasLowerCase) failedChecks.push('Pelo menos 1 letra minúscula');
  if (!checks.hasNumbers) failedChecks.push('Pelo menos 1 número');
  if (!checks.hasSpecialChar) failedChecks.push('Pelo menos 1 caractere especial');
  if (!checks.noCommonPatterns) failedChecks.push('Senha muito comum');

  if (failedChecks.length > 0) {
    return {
      valid: false,
      error: failedChecks.join(', '),
    };
  }

  return { valid: true };
}

// ============================================================
// Email Validation
// ============================================================

export function validateEmail(email: string): ValidationResult {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Email inválido' };
  }

  if (email.length > 254) {
    return { valid: false, error: 'Email muito longo' };
  }

  return { valid: true };
}

// ============================================================
// Financial Data Validation
// ============================================================

export function validateAmount(value: number): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'Valor deve ser um número' };
  }

  if (value < 0) {
    return { valid: false, error: 'Valor não pode ser negativo' };
  }

  if (value > 1000000) {
    return { valid: false, error: 'Valor muito alto' };
  }

  return { valid: true };
}

export function validateHours(value: number): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'Horas deve ser um número' };
  }

  if (value < 0 || value > 24) {
    return { valid: false, error: 'Horas deve estar entre 0 e 24' };
  }

  return { valid: true };
}

export function validateKm(value: number): ValidationResult {
  if (typeof value !== 'number' || isNaN(value)) {
    return { valid: false, error: 'KM deve ser um número' };
  }

  if (value < 0 || value > 5000) {
    return { valid: false, error: 'KM deve estar entre 0 e 5000' };
  }

  return { valid: true };
}

export function validateDate(dateString: string): ValidationResult {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  if (!dateRegex.test(dateString)) {
    return { valid: false, error: 'Data deve estar no formato YYYY-MM-DD' };
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Data inválida' };
  }

  if (date > new Date()) {
    return { valid: false, error: 'Data não pode ser no futuro' };
  }

  return { valid: true };
}

export function validateDisplayName(name: string): ValidationResult {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Nome deve ser texto' };
  }

  const trimmed = name.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Nome não pode estar vazio' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Nome muito longo (máx 100 caracteres)' };
  }

  // Bloquear script injections
  if (/<[^>]*>/g.test(trimmed)) {
    return { valid: false, error: 'Nome contém caracteres inválidos' };
  }

  return { valid: true };
}

export function sanitizeString(str: string, maxLength: number = 200): string {
  if (typeof str !== 'string') return '';

  return str
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove HTML brackets
}

// ============================================================
// Compound Validations
// ============================================================

export function validateEarningData(data: any) {
  const errors: string[] = [];

  const dateValidation = validateDate(data.date);
  if (!dateValidation.valid) errors.push(`Data: ${dateValidation.error}`);

  if (!['uber', '99', 'outros'].includes(data.platform)) {
    errors.push('Plataforma inválida');
  }

  const amountValidation = validateAmount(data.amount);
  if (!amountValidation.valid) errors.push(`Valor: ${amountValidation.error}`);

  const hoursValidation = validateHours(data.hours);
  if (!hoursValidation.valid) errors.push(`Horas: ${hoursValidation.error}`);

  const kmValidation = validateKm(data.km);
  if (!kmValidation.valid) errors.push(`KM: ${kmValidation.error}`);

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateExpenseData(data: any) {
  const errors: string[] = [];

  const dateValidation = validateDate(data.date);
  if (!dateValidation.valid) errors.push(`Data: ${dateValidation.error}`);

  if (!['combustivel', 'alimentacao', 'taxas', 'lavagem', 'outros'].includes(data.category)) {
    errors.push('Categoria inválida');
  }

  const amountValidation = validateAmount(data.amount);
  if (!amountValidation.valid) errors.push(`Valor: ${amountValidation.error}`);

  const description = sanitizeString(data.description || '', 200);
  if (description.length === 0 && data.category !== 'outros') {
    errors.push('Descrição é obrigatória');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
