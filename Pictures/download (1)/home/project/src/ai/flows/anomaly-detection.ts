'use server';

/**
 * @fileOverview Anomaly detection AI agent for identifying potentially incorrect or missing equipment status data.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DetectInventoryAnomaliesInputSchema } from '@/lib/types';
import type { DetectInventoryAnomaliesInput } from '@/lib/types';

const AnomalyReportSchema = z.object({
  report: z.string().describe('Um relatório conciso em markdown listando as anomalias encontradas. Se nenhuma anomalia for encontrada, retorne "Nenhuma anomalia detectada."'),
});

const anomalyPrompt = ai.definePrompt({
  name: 'inventoryAnomalyPrompt',
  input: { schema: DetectInventoryAnomaliesInputSchema },
  output: { schema: AnomalyReportSchema },
  prompt: `Você é um gerente de inventário de TI experiente analisando os dados de inventário para o campus '{{campus}}'. Sua tarefa é identificar anomalias nos dados JSON fornecidos.

Dados do Inventário:
{{{inventoryData}}}

Analise os dados e identifique os seguintes tipos de anomalias:
1.  **Dados Faltando:** Itens com números de série ou patrimônio ausentes.
2.  **Status Inconsistente:** Itens marcados como 'descarte' que ainda estão no inventário ativo.
3.  **Manutenção Prolongada:** Itens em 'manutencao' por mais de 30 dias (compare a data de hoje com a data 'updated').
4.  **Distribuição Estranha:** Proporções incomuns, como muito mais monitores do que desktops em um laboratório.
5.  **Estoque Baixo:** Categorias com poucos itens disponíveis ('funcionando' ou 'backup').

Gere um relatório conciso em formato de lista markdown. Para cada anomalia, liste o número de série do item e uma breve descrição do problema. Se nenhuma anomalia for encontrada, responda EXATAMENTE com "Nenhuma anomalia detectada.".`,
});

const detectInventoryAnomaliesFlow = ai.defineFlow(
  {
    name: 'detectInventoryAnomaliesFlow',
    inputSchema: DetectInventoryAnomaliesInputSchema,
    outputSchema: AnomalyReportSchema,
  },
  async (input) => {
    const { output } = await anomalyPrompt(input);
    return output!;
  }
);

export async function detectInventoryAnomalies(input: DetectInventoryAnomaliesInput): Promise<string> {
  const result = await detectInventoryAnomaliesFlow(input);
  return result.report;
}
