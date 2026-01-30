'use client';

import type { Dispatch, SetStateAction } from 'react';
import { useState, useMemo } from 'react';
import { format, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DayContentProps } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import type { Schedule, ScheduleStatus, Technician } from '@/lib/types';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from './ui/button';

type ScheduleCalendarProps = {
  schedule: Schedule;
  onScheduleChange: (schedule: Schedule) => void;
  month: Date | undefined;
  setMonth: Dispatch<SetStateAction<Date | undefined>>;
  technicians: Technician[];
};

const colorClasses = [
    'bg-blue-200 text-blue-800',
    'bg-green-200 text-green-800',
    'bg-yellow-200 text-yellow-800',
    'bg-purple-200 text-purple-800',
    'bg-pink-200 text-pink-800',
    'bg-indigo-200 text-indigo-800',
    'bg-red-200 text-red-800',
    'bg-orange-200 text-orange-800',
];

type ConfirmationState = {
  isOpen: boolean;
  date: Date | null;
  technician: string | null;
};

type ReassignState = {
  isOpen: boolean;
  date: Date | null;
}

export function ScheduleCalendar({
  schedule,
  onScheduleChange,
  month,
  setMonth,
  technicians,
}: ScheduleCalendarProps) {
  const [confirmation, setConfirmation] = useState<ConfirmationState>({
    isOpen: false,
    date: null,
    technician: null,
  });
  const [reassign, setReassign] = useState<ReassignState>({ isOpen: false, date: null });
  
  const technicianColors = useMemo(() => {
    const colors: Record<string, string> = {
        'Não Necessário': 'bg-gray-300 text-gray-800',
    };
    technicians.forEach((tech, index) => {
        colors[tech] = colorClasses[index % colorClasses.length];
    });
    return colors;
  }, [technicians]);


  const handleDayClick = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const technician = schedule[dateString];

    if (!isSaturday(date)) return;

    if (technician && technician !== 'Não Necessário') {
      setConfirmation({ isOpen: true, date, technician });
    } else {
      setReassign({ isOpen: true, date });
    }
  };

  const handleConfirm = () => {
    if (confirmation.date) {
      const dateString = format(confirmation.date, 'yyyy-MM-dd');
      const newSchedule = { ...schedule, [dateString]: 'Não Necessário' as const };
      onScheduleChange(newSchedule);
    }
    setConfirmation({ isOpen: false, date: null, technician: null });
  };

  const handleCancel = () => {
    setConfirmation({ isOpen: false, date: null, technician: null });
  };

  const handleReassign = (technician: Technician) => {
    if (reassign.date) {
      const dateString = format(reassign.date, 'yyyy-MM-dd');
      const newSchedule = { ...schedule, [dateString]: technician };
      onScheduleChange(newSchedule);
    }
    setReassign({ isOpen: false, date: null });
  };
  
  const isSaturday = (date: Date) => getDay(date) === 6;

  const DayContent = (props: DayContentProps) => {
    const date = props.date;
    const isDaySaturday = isSaturday(date);
    
    if (!isDaySaturday) {
      return <>{format(date, 'd')}</>;
    }
    const dateString = format(date, 'yyyy-MM-dd');
    const status = schedule[dateString];

    return (
      <div
        className={cn(
          'relative h-full w-full flex items-center justify-center',
          'cursor-pointer'
        )}
        onClick={() => handleDayClick(date)}
      >
        <span>{format(date, 'd')}</span>
        {status && (
          <Badge
            variant="secondary"
            className={cn(
              'absolute -bottom-2.5 text-[10px] h-auto leading-tight px-1.5 py-0.5 font-semibold whitespace-nowrap',
              technicianColors[status] || 'bg-gray-200 text-gray-800'
            )}
          >
            {status}
          </Badge>
        )}
      </div>
    );
  };

  if (!month) {
    return null; // or a loading indicator
  }

  return (
    <>
      <Calendar
        locale={ptBR}
        month={month}
        onMonthChange={setMonth}
        mode="single"
        className="w-full"
        classNames={{
          day_cell: 'h-14 w-14 text-center text-sm p-0 relative',
          day: 'h-14 w-14 p-0 font-normal aria-selected:opacity-100',
        }}
        components={{
          DayContent,
        }}
        modifiers={{
          saturdays: { dayOfWeek: [6] },
          scheduled: Object.keys(schedule).map((dateStr) =>
            new Date(dateStr.replace(/-/g, '/'))
          ),
        }}
        modifiersClassNames={{
          saturdays: 'font-bold',
          scheduled: 'scheduled-day',
        }}
        fromDate={new Date('2026-01-01')}
        toDate={new Date('2035-12-31')}
      />
      <AlertDialog open={confirmation.isOpen} onOpenChange={handleCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Ação</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja marcar o turno de{' '}
              <strong>{confirmation.technician}</strong> no dia{' '}
              <strong>
                {confirmation.date &&
                  format(confirmation.date, 'dd/MM/yyyy')}
              </strong>{' '}
              como "Não Necessário"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={reassign.isOpen} onOpenChange={() => setReassign({ isOpen: false, date: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reatribuir Turno</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <p>Selecione o técnico para o dia <strong>{reassign.date && format(reassign.date, 'dd/MM/yyyy')}</strong>:</p>
            {technicians.map((tech) => (
              <Button
                key={tech}
                variant="outline"
                onClick={() => handleReassign(tech)}
              >
                {tech}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

    </>
  );
}
