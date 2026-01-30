'use server';

/**
 * @fileOverview A flow for generating an optimized Saturday shift schedule for technicians.
 *
 * - suggestOptimalSchedule - A function that generates an optimized schedule.
 * - SuggestOptimalScheduleInput - The input type for the suggestOptimalSchedule function.
 * - SuggestOptimalScheduleOutput - The return type for the suggestOptimalSchedule function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestOptimalScheduleInputSchema = z.object({
  technicianNames: z.array(z.string()).describe('An array of technician names.'),
  startDate: z.string().describe('The start date for the schedule (YYYY-MM-DD).'),
  endDate: z.string().describe('The end date for the schedule (YYYY-MM-DD).'),
  rules: z.string().optional().describe('Any specific rules to apply to the schedule generation.'),
});
export type SuggestOptimalScheduleInput = z.infer<typeof SuggestOptimalScheduleInputSchema>;

const SuggestOptimalScheduleOutputSchema = z.object({
  schedule: z.record(z.string(), z.string()).describe('A map of dates to technician names.'),
  analysis: z.string().describe('An analysis of the generated schedule.'),
});
export type SuggestOptimalScheduleOutput = z.infer<typeof SuggestOptimalScheduleOutputSchema>;

export async function suggestOptimalSchedule(input: SuggestOptimalScheduleInput): Promise<SuggestOptimalScheduleOutput> {
  return suggestOptimalScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalSchedulePrompt',
  input: {schema: SuggestOptimalScheduleInputSchema},
  output: {schema: SuggestOptimalScheduleOutputSchema},
  prompt: `Você é um especialista em otimização de escalas.

Sua tarefa é gerar uma escala de turnos de sábado otimizada para os técnicos fornecidos, garantindo uma distribuição justa e equilibrada.

A escala deve cobrir o período de {{startDate}} a {{endDate}}.

Nomes dos técnicos: {{#each technicianNames}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}.

Regras a seguir:
1.  **Distribuição Equitativa**: Distribua os turnos de sábado o mais uniformemente possível entre todos os técnicos.
2.  **Apenas Sábados**: A escala deve conter APENAS as datas que caem em um sábado dentro do período especificado.
3.  **Regras Adicionais**: Considere as seguintes regras extras, se fornecidas: {{rules}}
4.  **Análise**: Após gerar a escala, forneça uma breve análise explicando por que a escala é justa e otimizada.
5.  **Formato de Saída**: A saída deve ser um objeto JSON válido. O campo 'schedule' deve ser um objeto onde as chaves são as datas do sábado no formato 'YYYY-MM-DD' e os valores são os nomes dos técnicos.

Exemplo de Saída Esperada:
{
  "schedule": {
    "2025-01-04": "Ismael",
    "2025-01-11": "Batista",
    "2025-01-18": "Geraldo",
    "2025-01-25": "Bernardo"
  },
  "analysis": "A escala foi distribuída uniformemente entre os quatro técnicos, com cada um recebendo um turno durante o mês de janeiro."
}

A resposta e a análise devem estar em português.
  `,
});

const suggestOptimalScheduleFlow = ai.defineFlow(
  {
    name: 'suggestOptimalScheduleFlow',
    inputSchema: SuggestOptimalScheduleInputSchema,
    outputSchema: SuggestOptimalScheduleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
