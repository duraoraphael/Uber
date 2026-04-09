import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Formata valor em Reais */
export function currency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Gera ID único simples */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Retorna a data de hoje em ISO (YYYY-MM-DD) */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}
