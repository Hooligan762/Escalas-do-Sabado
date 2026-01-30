'use client';

import { useState, useEffect } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: string) => boolean;
  customMessage?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Hook para validação de entrada de dados
 */
export function useInputValidation(
  initialValue: string = '',
  rules: ValidationRules = {}
): [
  string,
  (value: string) => void,
  ValidationResult,
  boolean,
  () => void
] {
  const [value, setValue] = useState<string>(initialValue);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    valid: true,
    errors: [],
  });

  // Função para validar o valor atual
  const validate = (valueToValidate: string): ValidationResult => {
    const errors: string[] = [];

    // Validação de campo obrigatório
    if (rules.required && !valueToValidate.trim()) {
      errors.push('Este campo é obrigatório');
    }

    // Validação de comprimento mínimo
    if (rules.minLength && valueToValidate.length < rules.minLength) {
      errors.push(`Deve ter pelo menos ${rules.minLength} caracteres`);
    }

    // Validação de comprimento máximo
    if (rules.maxLength && valueToValidate.length > rules.maxLength) {
      errors.push(`Não pode ter mais de ${rules.maxLength} caracteres`);
    }

    // Validação de padrão (regex)
    if (rules.pattern && !rules.pattern.test(valueToValidate)) {
      errors.push('Formato inválido');
    }

    // Validação personalizada
    if (rules.custom && !rules.custom(valueToValidate)) {
      errors.push(rules.customMessage || 'Entrada inválida');
    }

    // Sanitizar o valor (implementação básica)
    // Para uma sanitização mais completa, use a biblioteca DOMPurify
    const sanitizedValue = valueToValidate
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  // Handler para mudança de valor
  const handleChange = (newValue: string) => {
    setValue(newValue);
    setIsDirty(true);
  };

  // Reset do estado
  const resetValue = () => {
    setValue(initialValue);
    setIsDirty(false);
    setValidationResult({ valid: true, errors: [] });
  };

  // Efeito para validar quando o valor ou as regras mudam
  useEffect(() => {
    if (isDirty) {
      const result = validate(value);
      setValidationResult(result);
    }
  }, [value, isDirty, rules]);

  return [value, handleChange, validationResult, isDirty, resetValue];
}

// Validadores comuns que podem ser usados com o hook
export const validators = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
  username: /^[a-zA-Z0-9_]{3,20}$/,
  numeric: /^\d+$/,
  phone: /^\(\d{2}\)\s\d{4,5}-\d{4}$/,
  url: /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)$/,
  cpf: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
  cnpj: /^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/,
  cep: /^\d{5}-\d{3}$/,
};