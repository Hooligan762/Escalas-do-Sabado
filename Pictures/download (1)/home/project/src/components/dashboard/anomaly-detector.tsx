"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Wand2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { detectInventoryAnomalies } from '@/ai/flows/anomaly-detection';
import type { InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface AnomalyDetectorProps {
  inventory: InventoryItem[];
  campus: string;
}

export default function AnomalyDetector({ inventory, campus }: AnomalyDetectorProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [report, setReport] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleAnalysis = async () => {
    if (inventory.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Inventário Vazio',
        description: 'Não há itens no inventário para analisar.',
      });
      return;
    }
    
    setIsLoading(true);
    setReport(null);
    try {
      const inventoryData = JSON.stringify(inventory);
      const result = await detectInventoryAnomalies({ inventoryData, campus });
      setReport(result);
    } catch (error) {
      console.error("Failed to run anomaly detection:", error);
      toast({
        variant: 'destructive',
        title: 'Falha na Análise',
        description: 'Ocorreu um erro ao tentar analisar o inventário. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" onClick={handleAnalysis} disabled={isLoading}>
        {isLoading ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Wand2 className="mr-2 h-4 w-4" />
        )}
        Analisar com IA
      </Button>

      <AlertDialog open={!!report} onOpenChange={() => setReport(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Relatório de Anomalias do Inventário</AlertDialogTitle>
            <AlertDialogDescription>
              A IA analisou os dados e encontrou as seguintes potenciais inconsistências:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div 
            className="prose prose-sm max-h-[400px] overflow-y-auto rounded-md border p-4"
            dangerouslySetInnerHTML={{ __html: report ? report.replace(/\n/g, '<br />') : '' }}
          />
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setReport(null)}>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
