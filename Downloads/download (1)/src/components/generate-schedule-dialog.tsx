'use client';

import { useEffect, useState } from 'react';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateScheduleAction } from '@/lib/actions';
import type { Schedule, Technician } from '@/lib/types';
import { DatePicker } from './date-picker';
import { Loader2 } from 'lucide-react';

type GenerateScheduleDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduleGenerated: (schedule: Schedule) => void;
  technicians: Technician[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Gerar Escala
    </Button>
  );
}

export function GenerateScheduleDialog({
  open,
  onOpenChange,
  onScheduleGenerated,
  technicians,
}: GenerateScheduleDialogProps) {
  const [state, formAction] = useActionState(generateScheduleAction, {});
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStartDate(new Date('2026-01-01'));
      setEndDate(new Date('2026-03-31'));
    }
  }, [open]);

  useEffect(() => {
    if (state.error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao gerar escala',
        description: state.error,
      });
    }
    if (state.schedule && state.analysis) {
      onScheduleGenerated(state.schedule);
      setAnalysisResult(state.analysis);
      onOpenChange(false);
    }
  }, [state, onScheduleGenerated, onOpenChange, toast]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="font-headline">
              Gerar Nova Escala
            </DialogTitle>
            <DialogDescription>
              A IA irá gerar uma escala de turnos de sábado otimizada para os
              técnicos.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <input type="hidden" name="technicianNames" value={JSON.stringify(technicians)} />
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="startDate" className="text-right">
                  Data de Início
                </Label>
                <div className="col-span-3">
                   <DatePicker value={startDate} onChange={setStartDate} calendarProps={{fromDate: new Date('2026-01-01')}} />
                   <input type="hidden" name="startDate" value={startDate?.toISOString() || ''} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="endDate" className="text-right">
                  Data de Fim
                </Label>
                <div className="col-span-3">
                   <DatePicker value={endDate} onChange={setEndDate} calendarProps={{fromDate: new Date('2026-01-01')}}/>
                   <input type="hidden" name="endDate" value={endDate?.toISOString() || ''} />
                </div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="rules" className="text-right pt-2">
                  Regras
                </Label>
                <Textarea
                  id="rules"
                  name="rules"
                  placeholder="Opcional: ex., 'Ismael prefere turnos da manhã.'"
                  className="col-span-3"
                />
              </div>
            </div>
            <DialogFooter>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!analysisResult}
        onOpenChange={() => setAnalysisResult(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-headline">
              Análise da Geração de Escala
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-foreground whitespace-pre-wrap">
              {analysisResult}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
