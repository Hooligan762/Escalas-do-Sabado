"use client";

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Undo2 } from 'lucide-react';
import type { InventoryItem } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type DisposalViewProps = {
    items: InventoryItem[];
    onDelete: (id: string, isDisposal: true) => void;
    onRestore: (id: string) => void;
};

export default function DisposalView({ items = [], onDelete, onRestore }: DisposalViewProps) {
    const [filter, setFilter] = React.useState('');
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;
    
    const filteredItems = React.useMemo(() => {
        return items.filter(item =>
            item.category.toLowerCase().includes(filter.toLowerCase()) ||
            item.serial.toLowerCase().includes(filter.toLowerCase()) ||
            item.campus.toLowerCase().includes(filter.toLowerCase())
        ).sort((a,b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());
    }, [items, filter]);

    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const paginatedItems = filteredItems.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-4">
             <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                    placeholder="Filtrar por item, S/N, campus..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-grow"
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Item (S/N)</TableHead>
                            <TableHead>Campus</TableHead>
                            <TableHead>Data do Descarte</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedItems.length > 0 ? paginatedItems.map(item => (
                            <TableRow key={item.id} className="bg-gray-50 dark:bg-gray-900/20">
                                <TableCell>
                                    <div className="font-medium">{item.category}</div>
                                    <div className="text-sm text-muted-foreground">{item.serial}</div>
                                </TableCell>
                                <TableCell>{item.campus}</TableCell>
                                <TableCell>{format(parseISO(item.updated), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className="text-right space-x-2">
                                     <Button variant="outline" size="sm" onClick={() => onRestore(item.id)}>
                                        <Undo2 className="h-4 w-4 mr-2" /> Restaurar Item
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => onDelete(item.id, true)}>
                                        <Trash2 className="h-4 w-4 mr-2" /> Excluir Permanentemente
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={4} className="h-24 text-center">Nenhum item marcado para descarte.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between">
                 <div className="text-sm text-muted-foreground">
                    Exibindo {paginatedItems.length} de {filteredItems.length} itens.
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Próximo</Button>
                </div>
            </div>
        </div>
    );
}
