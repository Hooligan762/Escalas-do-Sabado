'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  CalendarDays,
  GanttChartSquare,
  Repeat,
  Menu,
  PlusCircle,
  X,
} from 'lucide-react';
import type { Schedule, Technician } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Logo } from '@/components/icons/logo';
import { AnalyticsChart } from '@/components/analytics-chart';
import { ScheduleCalendar } from '@/components/schedule-calendar';
import { GenerateScheduleDialog } from './generate-schedule-dialog';
import { ShiftSwapDialog } from './shift-swap-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { technicians as initialTechnicians } from '@/lib/types';

const initialSchedule: Schedule = {
  '2026-01-03': 'Ismael',
  '2026-01-10': 'Batista',
  '2026-01-17': 'Geraldo',
  '2026-01-24': 'Bernardo',
  '2026-01-31': 'Ismael',
  '2026-02-07': 'Batista',
  '2026-02-14': 'Geraldo',
  '2026-02-21': 'Bernardo',
};

function AddTechnicianDialog({ open, onOpenChange, onAddTechnician }: { open: boolean, onOpenChange: (open: boolean) => void, onAddTechnician: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddTechnician(name.trim());
    setName('');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if(!isOpen) setName(''); onOpenChange(isOpen);}}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Técnico</DialogTitle>
          <DialogDescription>
            Insira o nome do novo técnico.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome do técnico" />
          </div>
          <DialogFooter>
            <Button type="submit">Adicionar</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function Dashboard() {
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule);
  const [technicians, setTechnicians] = useState<Technician[]>(initialTechnicians);
  const [month, setMonth] = useState<Date | undefined>();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [addTechnicianDialogOpen, setAddTechnicianDialogOpen] = useState(false);
  const [technicianToRemove, setTechnicianToRemove] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const firstDate = Object.keys(schedule)[0];
    if (firstDate) {
      setMonth(new Date(firstDate.replace(/-/g, '/')));
    } else {
      setMonth(new Date('2026-01-01'));
    }
  }, []);
  
  const handleScheduleUpdate = (newSchedule: Schedule) => {
    setSchedule(newSchedule);
    const firstDate = Object.keys(newSchedule)[0];
    if (firstDate) {
      setMonth(new Date(firstDate.replace(/-/g, '/')));
    }
  };

  const handleAddTechnician = (name: string) => {
    if (name && !technicians.includes(name)) {
      setTechnicians([...technicians, name]);
      setAddTechnicianDialogOpen(false);
    } else if (!name) {
       toast({
        variant: 'destructive',
        title: 'Nome inválido',
        description: 'O nome do técnico não pode estar vazio.',
      });
    } else {
       toast({
        variant: 'destructive',
        title: 'Técnico já existe',
        description: `O técnico '${name}' já existe.`,
      });
    }
  };

  const handleRemoveClick = (tech: string) => {
    const hasShifts = Object.values(schedule).some(t => t === tech);
    if (hasShifts) {
        toast({
            variant: 'destructive',
            title: 'Não é possível remover',
            description: `${tech} ainda tem turnos agendados. Reatribua ou marque-os como "Não Necessário" antes de remover.`,
        });
    } else {
        setTechnicianToRemove(tech);
    }
  }

  const confirmRemoveTechnician = () => {
      if (!technicianToRemove) return;
      setTechnicians(technicians.filter(t => t !== technicianToRemove));
      setTechnicianToRemove(null);
  };


  const SidebarContent = () => (
    <>
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Logo className="h-8 w-8 text-primary" />
          <span className="font-headline text-lg">Escala de Sábado</span>
        </Link>
      </div>
      <div className="flex-1">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-4 py-4">
          <Button
            variant="ghost"
            className="justify-start gap-3"
            onClick={() => setGenerateDialogOpen(true)}
          >
            <GanttChartSquare className="h-4 w-4" />
            Gerar Escala
          </Button>
          <Button
            variant="ghost"
            className="justify-start gap-3"
            onClick={() => setSwapDialogOpen(true)}
          >
            <Repeat className="h-4 w-4" />
            Solicitar Troca
          </Button>
          <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">
            Técnicos
          </div>
          {technicians.map((tech) => (
            <div key={tech} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-muted-foreground group">
              <div className='flex items-center gap-3'>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://i.pravatar.cc/40?u=${tech}`} alt={tech} />
                  <AvatarFallback>{tech.charAt(0)}</AvatarFallback>
                </Avatar>
                {tech}
              </div>
               <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemoveClick(tech)}>
                <X className="h-4 w-4" />
               </Button>
            </div>
          ))}
           <div className="px-3 mt-2">
            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => setAddTechnicianDialogOpen(true)}>
              <PlusCircle className="h-4 w-4" />
              Adicionar Técnico
            </Button>
          </div>
        </nav>
      </div>
    </>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card text-card-foreground md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <SidebarContent />
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <Menu className="h-5 w-5" />
                <span className="sr-only">Alternar menu de navegação</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0">
               <SidebarContent />
            </SheetContent>
          </Sheet>

          <div className="w-full flex-1">
            <h1 className="font-headline text-xl font-semibold">Painel</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-2">
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <CalendarDays className="h-6 w-6" />
                  Calendário de Turnos
                </CardTitle>
                <CardDescription>
                  Escala de turnos de sábado a partir de 2026.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ScheduleCalendar
                  schedule={schedule}
                  onScheduleChange={setSchedule}
                  month={month}
                  setMonth={setMonth}
                  technicians={technicians}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Users className="h-6 w-6" />
                  Análise de Carga de Trabalho
                </CardTitle>
                <CardDescription>
                  Distribuição de turnos entre os técnicos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AnalyticsChart schedule={schedule} technicians={technicians} />
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      <GenerateScheduleDialog
        open={generateDialogOpen}
        onOpenChange={setGenerateDialogOpen}
        onScheduleGenerated={handleScheduleUpdate}
        technicians={technicians}
      />
      <ShiftSwapDialog
        open={swapDialogOpen}
        onOpenChange={setSwapDialogOpen}
        schedule={schedule}
        onSwapApproved={handleScheduleUpdate}
        technicians={technicians}
      />
      <AddTechnicianDialog
        open={addTechnicianDialogOpen}
        onOpenChange={setAddTechnicianDialogOpen}
        onAddTechnician={handleAddTechnician}
      />
       <AlertDialog open={!!technicianToRemove} onOpenChange={() => setTechnicianToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Técnico?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover {technicianToRemove}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveTechnician}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
