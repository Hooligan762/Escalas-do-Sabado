'use server';

/**
 * @fileOverview Manages shift swap requests between technicians, ensuring fairness and adherence to the 'rule of saturday'.
 *
 * - manageShiftSwap - A function to handle shift swap requests.
 * - ManageShiftSwapInput - The input type for the manageShiftSwap function.
 * - ManageShiftSwapOutput - The return type for the manageShiftSwap function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ManageShiftSwapInputSchema = z.object({
  requestingTechnician: z.string().describe('The name of the technician requesting the shift swap (Ismael, Batista, Geraldo, or Bernardo).'),
  offeredTechnician: z.string().describe('The name of the technician being offered the shift (Ismael, Batista, Geraldo, or Bernardo).'),
  requestingTechnicianOriginalShift: z.string().describe('The original Saturday shift date (YYYY-MM-DD) of the requesting technician.'),
  offeredTechnicianOriginalShift: z.string().describe('The original Saturday shift date (YYYY-MM-DD) of the offered technician.'),
});
export type ManageShiftSwapInput = z.infer<typeof ManageShiftSwapInputSchema>;

const ManageShiftSwapOutputSchema = z.object({
  swapApproved: z.boolean().describe('Whether the shift swap is approved based on the rule of saturday.'),
  reason: z.string().describe('The detailed reason for approving or rejecting the shift swap.'),
});
export type ManageShiftSwapOutput = z.infer<typeof ManageShiftSwapOutputSchema>;

export async function manageShiftSwap(input: ManageShiftSwapInput): Promise<ManageShiftSwapOutput> {
  return manageShiftSwapFlow(input);
}

const prompt = ai.definePrompt({
  name: 'manageShiftSwapPrompt',
  input: {schema: ManageShiftSwapInputSchema},
  output: {schema: ManageShiftSwapOutputSchema},
  prompt: `Você é um assistente de IA especializado em gerenciar trocas de turno entre técnicos, garantindo justiça e adesão à 'regra do sábado'.

Os técnicos são: Ismael, Batista, Geraldo e Bernardo.

A regra do sábado afirma que um técnico não deve trabalhar dois sábados seguidos, a menos que seja absolutamente necessário.

Considere a seguinte solicitação de troca de turno:

Técnico Solicitante: {{requestingTechnician}}
Técnico Ofertado: {{offeredTechnician}}
Turno Original do Técnico Solicitante: {{requestingTechnicianOriginalShift}}
Turno Original do Técnico Ofertado: {{offeredTechnicianOriginalShift}}

Avalie a solicitação de troca de turno e determine se ela deve ser aprovada ou rejeitada com base na regra do sábado. Forneça um motivo detalhado para sua decisão. A resposta e o motivo devem estar em português.

Saída em formato JSON:
{ 
  "swapApproved": true ou false,
  "reason": "motivo detalhado aqui"
}
`,
});

const manageShiftSwapFlow = ai.defineFlow(
  {
    name: 'manageShiftSwapFlow',
    inputSchema: ManageShiftSwapInputSchema,
    outputSchema: ManageShiftSwapOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
