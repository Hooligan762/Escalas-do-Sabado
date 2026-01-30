'use server';

import { z } from 'zod';
import { suggestOptimalSchedule } from '@/ai/flows/suggest-optimal-schedule';
import { manageShiftSwap } from '@/ai/flows/manage-shift-swaps-fairly';
import { type Technician, type Schedule } from '@/lib/types';
import { revalidatePath } from 'next/cache';
import { format } from 'date-fns';

const generateScheduleSchema = z
  .object({
    technicianNames: z.string().transform((val) => JSON.parse(val) as string[]),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    rules: z.string().optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'A data final deve ser posterior à data de início.',
    path: ['endDate'],
  });

type GenerateScheduleState = {
  schedule?: Schedule;
  analysis?: string;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function generateScheduleAction(
  prevState: GenerateScheduleState,
  formData: FormData
): Promise<GenerateScheduleState> {
  const validatedFields = generateScheduleSchema.safeParse({
    technicianNames: formData.get('technicianNames'),
    startDate: formData.get('startDate'),
    endDate: formData.get('endDate'),
    rules: formData.get('rules'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Dados do formulário inválidos.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const result = await suggestOptimalSchedule({
      technicianNames: validatedFields.data.technicianNames,
      startDate: format(validatedFields.data.startDate, 'yyyy-MM-dd'),
      endDate: format(validatedFields.data.endDate, 'yyyy-MM-dd'),
      rules: validatedFields.data.rules,
    });
    revalidatePath('/');
    return { schedule: result.schedule as Schedule, analysis: result.analysis };
  } catch (e) {
    return { error: 'Falha ao gerar a escala. Por favor, tente novamente.' };
  }
}

const shiftSwapSchema = z.object({
  requestingTechnician: z.string(),
  offeredTechnician: z.string(),
  requestingTechnicianOriginalShift: z.coerce.date(),
  offeredTechnicianOriginalShift: z.coerce.date(),
  currentSchedule: z.string(),
});

type ShiftSwapState = {
  updatedSchedule?: Schedule;
  reason?: string;
  swapApproved?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
};

export async function requestSwapAction(prevState: ShiftSwapState, formData: FormData): Promise<ShiftSwapState> {
  const validatedFields = shiftSwapSchema.safeParse({
    requestingTechnician: formData.get('requestingTechnician'),
    offeredTechnician: formData.get('offeredTechnician'),
    requestingTechnicianOriginalShift: formData.get('requestingTechnicianOriginalShift'),
    offeredTechnicianOriginalShift: formData.get('offeredTechnicianOriginalShift'),
    currentSchedule: formData.get('currentSchedule'),
  });

  if (!validatedFields.success) {
    return {
      error: 'Dados do formulário inválidos.',
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    requestingTechnician,
    offeredTechnician,
    requestingTechnicianOriginalShift,
    offeredTechnicianOriginalShift,
    currentSchedule,
  } = validatedFields.data;
  
  const schedule = JSON.parse(currentSchedule) as Schedule;

  try {
    const result = await manageShiftSwap({
      requestingTechnician,
      offeredTechnician,
      requestingTechnicianOriginalShift: format(requestingTechnicianOriginalShift, 'yyyy-MM-dd'),
      offeredTechnicianOriginalShift: format(offeredTechnicianOriginalShift, 'yyyy-MM-dd'),
    });

    let updatedSchedule = schedule;
    if (result.swapApproved) {
      const reqDateStr = format(requestingTechnicianOriginalShift, 'yyyy-MM-dd');
      const offDateStr = format(offeredTechnicianOriginalShift, 'yyyy-MM-dd');

      updatedSchedule = {
        ...schedule,
        [reqDateStr]: offeredTechnician,
        [offDateStr]: requestingTechnician,
      };
      revalidatePath('/');
    }

    return {
      updatedSchedule,
      reason: result.reason,
      swapApproved: result.swapApproved,
    };
  } catch (e) {
    return { error: 'Falha ao processar a solicitação de troca. Por favor, tente novamente.' };
  }
}
