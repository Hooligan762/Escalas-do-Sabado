"use client";

import * as React from 'react';
import { differenceInDays, isBefore, sub, format, parseISO } from 'date-fns';
import { Wrench } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';
import type { InventoryItem } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


type AlertCategory = 'maintenance';

interface SmartAlertsProps {
  inventory: InventoryItem[];
}

export default function SmartAlerts({ inventory }: SmartAlertsProps) {
  const [activeAlerts, setActiveAlerts] = React.useState<string[]>([]);

  const alerts = React.useMemo(() => {
    const now = new Date();
    const maintenanceThreshold = sub(now, { days: 30 });

    const maintenanceAlerts = inventory.filter(item => {
        if (item.status !== 'manutencao') return false;
        
        // Verificar se updated existe e é válido
        if (!item.updated) return false;
        
        let updatedDate: Date;
        try {
            // Se é string, usar parseISO; se é Date, usar diretamente
            updatedDate = typeof item.updated === 'string' 
                ? parseISO(item.updated) 
                : new Date(item.updated);
        } catch {
            // Se não conseguir converter, ignorar este item
            return false;
        }
        
        return isBefore(updatedDate, maintenanceThreshold);
    });

    if (maintenanceAlerts.length > 0) {
        setActiveAlerts(['maintenance']);
    }

    return { maintenanceAlerts };

  }, [inventory]);

  const totalAlerts = alerts.maintenanceAlerts.length;

  if (totalAlerts === 0) {
    return null; // Não renderiza nada se não houver alertas
  }

  return (
    <div className="mb-6 px-4 md:px-0">
        <Accordion type="multiple" value={activeAlerts} onValueChange={setActiveAlerts}>
             {alerts.maintenanceAlerts.length > 0 && (
                <AccordionItem value="maintenance" className="border border-red-300 bg-red-50 rounded-lg">
                    <AccordionTrigger className="p-4 text-red-800 hover:no-underline">
                         <div className="flex items-center gap-3">
                            <Wrench className="h-5 w-5" />
                            <span className="font-bold">Manutenção Prolongada</span>
                             <Badge variant="destructive">{alerts.maintenanceAlerts.length}</Badge>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                         <div className="border-t border-red-200 bg-white">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Item (S/N)</TableHead>
                                        <TableHead>Campus</TableHead>
                                        <TableHead className="text-right">Em Manutenção Desde</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {alerts.maintenanceAlerts.map(item => {
                                        // Converter updated para Date de forma segura
                                        const updatedDate = typeof item.updated === 'string' 
                                            ? parseISO(item.updated) 
                                            : new Date(item.updated);
                                        
                                        return (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <div className="font-medium">{item.category}</div>
                                                    <div className="text-xs text-muted-foreground">{item.serial}</div>
                                                </TableCell>
                                                <TableCell>{item.campus}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {format(updatedDate, 'dd/MM/yyyy')} ({differenceInDays(new Date(), updatedDate)} dias)
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            )}
        </Accordion>
    </div>
  );
}
