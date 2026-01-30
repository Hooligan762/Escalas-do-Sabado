'use server';

import { z } from 'zod';
import { sanitizeHtmlSync } from './xss-utils';

/**
 * Utilitários para validação de dados no servidor
 */

/**
 * Esquemas de validação comuns
 */

// Em vez de exportar um objeto diretamente, exportamos funções assíncronas
// que retornam os esquemas. Isso atende à exigência do Next.js de que
// arquivos com 'use server' só podem exportar funções assíncronas.

// Esquema de login
export async function getLoginSchema() {
  return z.object({
    username: z.string().min(3).max(50).transform((val) => sanitizeHtmlSync(val)),
    password: z.string().min(4),
    campus: z.string().min(2).max(50).transform((val) => sanitizeHtmlSync(val)).optional().or(z.literal(''))
  });
}

// Esquema de usuário
export async function getUserSchema() {
  return z.object({
    username: z.string().min(3).max(50).transform((val) => sanitizeHtmlSync(val)),
    name: z.string().min(2).max(100).transform((val) => sanitizeHtmlSync(val)),
    role: z.enum(['admin', 'super', 'tecnico']),
    campus: z.string().min(2).max(50).optional().transform((val) => val ? sanitizeHtmlSync(val) : val),
    password: z.string().min(4).optional()
  });
}

// Esquema de alteração de senha
export async function getChangePasswordSchema() {
  return z.object({
    currentPassword: z.string().min(4),
    newPassword: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/,
      'A senha deve conter pelo menos 8 caracteres, incluindo letras e números'),
    confirmPassword: z.string().min(8)
  }).refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não conferem",
    path: ["confirmPassword"]
  });
}

// Esquema de campus
export async function getCampusSchema() {
  return z.object({
    name: z.string().min(2).max(50).transform((val) => sanitizeHtmlSync(val)),
    city: z.string().min(2).max(50).transform((val) => sanitizeHtmlSync(val)),
    state: z.string().length(2).transform((val) => sanitizeHtmlSync(val)),
    active: z.boolean().default(true)
  });
}

// Esquema de solicitação
export async function getRequestSchema() {
  return z.object({
    title: z.string().min(5).max(100).transform((val) => sanitizeHtmlSync(val)),
    description: z.string().min(10).max(1000).transform((val) => sanitizeHtmlSync(val)),
    campus: z.string().min(2).max(50).transform((val) => sanitizeHtmlSync(val)),
    requesterName: z.string().min(3).max(100).transform((val) => sanitizeHtmlSync(val)),
    requesterEmail: z.string().email().transform((val) => sanitizeHtmlSync(val)),
    requesterPhone: z.string().min(10).max(20).transform((val) => sanitizeHtmlSync(val)),
    priority: z.enum(['baixa', 'média', 'alta', 'crítica']),
    type: z.enum(['manutenção', 'suporte', 'instalação', 'outro']),
    status: z.enum(['aberto', 'em_andamento', 'concluído', 'cancelado']).default('aberto')
  });
}

/**
 * Função genérica para validar dados com um esquema Zod
 */
export async function validateData<T>(
  schema: z.ZodType<T>,
  data: unknown
): Promise<{ success: boolean; data?: T; errors?: z.ZodError }> {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Função para validar dados de formulários
 */
export async function validateFormData<T>(
  schema: z.ZodType<T>,
  formData: FormData
): Promise<{ success: boolean; data?: T; errors?: z.ZodError }> {
  // Converter FormData para objeto
  const data: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  return validateData(schema, data);
}

/**
 * Função para validar dados de requisição JSON
 */
export async function validateRequestData<T>(
  schema: z.ZodType<T>,
  request: Request
): Promise<{ success: boolean; data?: T; errors?: z.ZodError }> {
  try {
    const body = await request.json();
    return validateData(schema, body);
  } catch (error) {
    return {
      success: false,
      errors: new z.ZodError([
        {
          code: 'custom',
          path: ['_root'],
          message: 'Erro ao analisar o corpo da requisição JSON'
        }
      ])
    };
  }
}
