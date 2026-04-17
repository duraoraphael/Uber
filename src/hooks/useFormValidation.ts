import { useState, useCallback } from 'react';

interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

interface FieldValidation<T> {
  value: T;
  error?: string;
  touched: boolean;
}

interface FormValidation<T extends Record<string, any>> {
  fields: { [K in keyof T]: FieldValidation<T[K]> };
  isValid: boolean;
  isDirty: boolean;
  validateField: (field: keyof T) => void;
  validateAll: () => boolean;
  setFieldValue: (field: keyof T, value: T[keyof T]) => void;
  setFieldTouched: (field: keyof T) => void;
  reset: () => void;
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: { [K in keyof T]?: ValidationRule<T[K]>[] }
): FormValidation<T> {
  const [fields, setFields] = useState<{ [K in keyof T]: FieldValidation<T[K]> }>(() =>
    Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = {
        value: initialValues[key as keyof T],
        touched: false,
      };
      return acc;
    }, {} as { [K in keyof T]: FieldValidation<T[K]> })
  );

  const validateField = useCallback((field: keyof T) => {
    const rules = validationRules[field];
    const fieldValue = fields[field];

    if (!rules || !fieldValue.touched) return;

    for (const rule of rules) {
      if (!rule.validate(fieldValue.value)) {
        setFields(prev => ({
          ...prev,
          [field]: { ...prev[field], error: rule.message }
        }));
        return;
      }
    }

    setFields(prev => ({
      ...prev,
      [field]: { ...prev[field], error: undefined }
    }));
  }, [fields, validationRules]);

  const validateAll = useCallback(() => {
    let allValid = true;

    Object.keys(validationRules).forEach(key => {
      const fieldKey = key as keyof T;
      const rules = validationRules[fieldKey];
      const fieldValue = fields[fieldKey];

      if (!rules) return;

      for (const rule of rules) {
        if (!rule.validate(fieldValue.value)) {
          setFields(prev => ({
            ...prev,
            [fieldKey]: { ...prev[fieldKey], error: rule.message, touched: true }
          }));
          allValid = false;
          break;
        }
      }

      if (allValid) {
        setFields(prev => ({
          ...prev,
          [fieldKey]: { ...prev[fieldKey], error: undefined, touched: true }
        }));
      }
    });

    return allValid;
  }, [fields, validationRules]);

  const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
    setFields(prev => ({
      ...prev,
      [field]: { ...prev[field], value, touched: true }
    }));
  }, []);

  const setFieldTouched = useCallback((field: keyof T) => {
    setFields(prev => ({
      ...prev,
      [field]: { ...prev[field], touched: true }
    }));
    validateField(field);
  }, [validateField]);

  const reset = useCallback(() => {
    setFields(Object.keys(initialValues).reduce((acc, key) => {
      acc[key as keyof T] = {
        value: initialValues[key as keyof T],
        touched: false,
        error: undefined,
      };
      return acc;
    }, {} as { [K in keyof T]: FieldValidation<T[K]> }));
  }, [initialValues]);

  const isValid = Object.values(fields).every(field => !field.error);
  const isDirty = Object.values(fields).some(field => field.touched);

  return {
    fields,
    isValid,
    isDirty,
    validateField,
    validateAll,
    setFieldValue,
    setFieldTouched,
    reset,
  };
}

// Common validation rules
export const validationRules = {
  required: <T,>(message = 'Campo obrigatório'): ValidationRule<T> => ({
    validate: (value) => value !== null && value !== undefined && value !== '',
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length >= min,
    message: message || `Mínimo ${min} caracteres`,
  }),

  maxLength: (max: number, message?: string): ValidationRule<string> => ({
    validate: (value) => value.length <= max,
    message: message || `Máximo ${max} caracteres`,
  }),

  email: (message = 'E-mail inválido'): ValidationRule<string> => ({
    validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message,
  }),

  min: (min: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value >= min,
    message: message || `Valor mínimo: ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule<number> => ({
    validate: (value) => value <= max,
    message: message || `Valor máximo: ${max}`,
  }),

  positive: (message = 'Valor deve ser positivo'): ValidationRule<number> => ({
    validate: (value) => value > 0,
    message,
  }),
};