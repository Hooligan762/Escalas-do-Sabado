'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { requestSwapAction } from '@/lib/actions';
import { type Schedule, type Technician } from '@/lib/types';
import { DatePicker } from './date-picker';
import { Loader2 } from 'lucide-react';

type ShiftSwapDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: Schedule;
  onSwapApproved: (schedule: Schedule) => void;
  technicians: Technician[];
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Solicitar Troca
    </Button>
  );
}

export function ShiftSwapDialog({
  open,
  onOpenChange,
  schedule,
  onSwapApproved,
  technicians,
}: ShiftSwapDialogProps) {
  const [state, formAction] = useActionState(requestSwapAction, {});
  const { toast } = useToast();
  const [result, setResult] = useState<{ reason: string; approved: boolean } | null>(null);

  const [reqTech, setReqTech] = useState<Technician>();
  const [offTech, setOffTech] = useState<Technician>();
  const [reqShift, setReqShift] = useState<Date>();
  const [offShift, setOffShift] = useState<Date>();

  const techShifts = useMemo(() => {
    const shifts: Record<Technician, Date[]> = Object.fromEntries(technicians.map(t => [t, []]));
    for (const [dateStr, tech] of Object.entries(schedule)) {
      if (tech && technicians.includes(tech as Technician)) {
        shifts[tech as Technician].push(new Date(dateStr.replace(/-/g, '/')));
      }
    }
    return shifts;
  }, [schedule, technicians]);

  useEffect(() => {
    if (state.error) {
      toast({ variant: 'destructive', title: 'Erro', description: state.error });
    }
    if (state.reason) {
      setResult({ reason: state.reason, approved: !!state.swapApproved });
      if (state.swapApproved && state.updatedSchedule) {
        onSwapApproved(state.updatedSchedule);
      }
      onOpenChange(false);
    }
  }, [state, onSwapApproved, onOpenChange, toast]);

  const resetForm = () => {
    setReqTech(undefined);
    setOffTech(undefined);
    setReqShift(undefined);
    setOffShift(undefined);
  };
  
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetForm();
    }
    onOpenChange(isOpen);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle className="font-headline">Solicitar Troca de Turno</DialogTitle>
            <DialogDescription>
              Selecione os técnicos e seus turnos para trocar. A solicitação será
              avaliada para garantir a justiça.
            </DialogDescription>
          </DialogHeader>
          <form action={formAction}>
            <input type="hidden" name="currentSchedule" value={JSON.stringify(schedule)} />
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Técnico Solicitante</Label>
                  <Select name="requestingTechnician" onValueChange={(v) => { setReqShift(undefined); setReqTech(v as Technician)}}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{technicians.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label>Seu Turno a Oferecer</Label>
                  <DatePicker value={reqShift} onChange={setReqShift} calendarProps={{ disabled: (date) => !techShifts[reqTech!]?.some(d => d.getTime() === date.getTime()), month: reqShift || techShifts[reqTech!]?.[0] }} />
                  <input type="hidden" name="requestingTechnicianOriginalShift" value={reqShift?.toISOString() || ''} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Técnico Ofertado</Label>
                   <Select name="offeredTechnician" onValueChange={(v) => { setOffShift(undefined); setOffTech(v as Technician)}}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>{technicians.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Turno Dele a Pegar</Label>
                  <DatePicker value={offShift} onChange={setOffShift} calendarProps={{ disabled: (date) => !techShifts[offTech!]?.some(d => d.getTime() === date.getTime()), month: offShift || techShifts[offTech!]?.[0] }} />
                  <input type="hidden" name="offeredTechnicianOriginalShift" value={offShift?.toISOString() || ''} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <SubmitButton />
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!result} onOpenChange={() => setResult(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className={result?.approved ? 'text-green-600 font-headline' : 'text-destructive font-headline'}>
              {result?.approved ? 'Troca Aprovada' : 'Troca Rejeitada'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-foreground whitespace-pre-wrap">
              {result?.reason}
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
