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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpDown, Edit, FilePlus, PenSquare, Trash2, Handshake, Undo2 } from 'lucide-react';
import type { AuditLogEntry, InventoryItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type AuditLogTableProps = {
    auditLog: AuditLogEntry[];
    onEdit: (item: InventoryItem) => void;
};

const ActionBadge = ({ action }: { action: AuditLogEntry['action'] }) => {
    switch (action) {
        case 'create': return <Badge variant="default" className="bg-green-500 hover:bg-green-600"><FilePlus className="h-3 w-3 mr-1" />Criado</Badge>;
        case 'update': return <Badge variant="secondary"><PenSquare className="h-3 w-3 mr-1" />Atualizado</Badge>;
        case 'delete': return <Badge variant="destructive"><Trash2 className="h-3 w-3 mr-1" />Excluído</Badge>;
        case 'loan': return <Badge variant="default" className="bg-blue-500 hover:bg-blue-600"><Handshake className="h-3 w-3 mr-1" />Emprestado</Badge>;
        case 'return': return <Badge variant="default" className="bg-purple-500 hover:bg-purple-600"><Undo2 className="h-3 w-3 mr-1" />Devolvido</Badge>;
    }
}

export default function AuditLogTable({ auditLog, onEdit }: AuditLogTableProps) {
    const { toast } = useToast();
    const [filter, setFilter] = React.useState('');
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof AuditLogEntry, direction: 'asc' | 'desc' }>({ key: 'timestamp', direction: 'desc' });
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const handleEditClick = (item: InventoryItem | null) => {
        if (!item) {
            toast({
                variant: 'destructive',
                title: 'Item não encontrado',
                description: 'Este item não existe mais no inventário, mas seu registro de auditoria foi preservado.'
            });
            return;
        }
        onEdit(item);
    }

    const requestSort = (key: keyof AuditLogEntry) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredLog = React.useMemo(() => {
        let filtered = auditLog.filter(log =>
            (log.user ? log.user.toLowerCase() : '').includes(filter.toLowerCase()) ||
            (log.item?.serial ? log.item.serial.toLowerCase() : '').includes(filter.toLowerCase()) ||
            (log.details ? log.details.toLowerCase() : '').includes(filter.toLowerCase())
        );

        console.log('Filtrado log de auditoria:', filtered.length, 'entradas');

        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key] as any;
                const bValue = b[sortConfig.key] as any;
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return filtered;
    }, [auditLog, filter, sortConfig]);

    const totalPages = Math.ceil(sortedAndFilteredLog.length / itemsPerPage);
    const paginatedLog = sortedAndFilteredLog.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-4">
            <div className="flex">
                <Input
                    placeholder="Filtrar por usuário, S/N, detalhes..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                />
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('timestamp')}>Data <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('user')}>Usuário <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead>Ação</TableHead>
                            <TableHead>Detalhes</TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLog.length > 0 ? paginatedLog.map(log => (
                            <TableRow key={log.id}>
                                <TableCell>{new Date(log.timestamp).toLocaleString('pt-BR')}</TableCell>
                                <TableCell className="font-medium">{log.user}</TableCell>
                                <TableCell><ActionBadge action={log.action} /></TableCell>
                                <TableCell>
                                    <div className="font-medium">{log.details}</div>
                                    <div className="text-xs text-muted-foreground">{log.item?.category} no Campus {log.campus}</div>
                                </TableCell>
                                <TableCell>
                                    {log.action !== 'delete' && log.item && (
                                        <Button variant="outline" size="sm" onClick={() => handleEditClick(log.item)}>
                                            <Edit className="h-3 w-3 mr-1" /> Ver/Editar Item
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">Nenhum registro de auditoria encontrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between">
                 <div className="text-sm text-muted-foreground">
                    Exibindo {paginatedLog.length} de {sortedAndFilteredLog.length} registros.
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Próximo</Button>
                </div>
            </div>
        </div>
    );
}
