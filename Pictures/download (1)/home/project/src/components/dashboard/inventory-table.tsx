"use client";

import * as React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, FileDown, FileText, CheckCircle, AlertCircle, Wrench, Archive, PackageX, Handshake, Undo2, PlayCircle } from 'lucide-react';
import type { InventoryItem, User } from '@/lib/types';
import { ItemStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type InventoryTableProps = {
    inventory: InventoryItem[];
    sectors: string[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string) => void;
    onStatusChange: (id: string, status: keyof typeof ItemStatus) => void;
    onLoan: (items: InventoryItem[]) => void;
    onRegisterUse: (item: InventoryItem) => void;
    onReturnFromUse: (id: string) => void;
    user: User;
}

const getStatusStyles = (status: keyof typeof ItemStatus) => {
    switch (status) {
        case 'funcionando': return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
        case 'manutencao': return 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200';
        case 'defeito': return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
        case 'backup': return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
        case 'descarte': return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
        case 'emprestado': return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
        case 'emuso': return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
    }
};

const statusIcons: Record<keyof typeof ItemStatus, React.ElementType> = {
    funcionando: CheckCircle,
    defeito: AlertCircle,
    manutencao: Wrench,
    backup: Archive,
    descarte: PackageX,
    emprestado: Handshake,
    emuso: PlayCircle,
}

export default function InventoryTable({ inventory, sectors, onEdit, onDelete, onStatusChange, onLoan, onRegisterUse, onReturnFromUse, user }: InventoryTableProps) {
    const [filter, setFilter] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [sectorFilter, setSectorFilter] = React.useState('all');
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof InventoryItem, direction: 'asc' | 'desc' } | null>({ key: 'created', direction: 'desc' });
    const [currentPage, setCurrentPage] = React.useState(1);
    const [selectedItems, setSelectedItems] = React.useState<string[]>([]);
    const itemsPerPage = 10;
    const { toast } = useToast();


    const requestSort = (key: keyof InventoryItem) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndFilteredInventory = React.useMemo(() => {
        let sortableItems = [...inventory];
        
        sortableItems = sortableItems.filter(item => 
            (item.category?.toLowerCase().includes(filter.toLowerCase()) || 
             item.serial?.toLowerCase().includes(filter.toLowerCase()) || 
             item.patrimony?.toLowerCase().includes(filter.toLowerCase())) &&
            (statusFilter === 'all' || item.status === statusFilter) &&
            (sectorFilter === 'all' || item.setor === sectorFilter)
        );

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [inventory, filter, statusFilter, sectorFilter, sortConfig]);
    
    React.useEffect(() => {
        setSelectedItems([]);
    }, [filter, statusFilter, sectorFilter, currentPage]);

    const totalPages = Math.ceil(sortedAndFilteredInventory.length / itemsPerPage);
    const paginatedInventory = sortedAndFilteredInventory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedItems(paginatedInventory.map(item => item.id));
        } else {
            setSelectedItems([]);
        }
    }

    const handleSelectItem = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedItems(prev => [...prev, id]);
        } else {
            setSelectedItems(prev => prev.filter(itemId => itemId !== id));
        }
    }
    
    const handleLoanSelected = () => {
        const itemsToLoan = inventory.filter(item => selectedItems.includes(item.id));
        onLoan(itemsToLoan);
        setSelectedItems([]);
    }

    const exportToCSV = () => {
        const headers = ['Campus', 'Setor', 'Sala', 'Categoria', 'Marca', 'Nº de Série', 'Patrimônio', 'Status', 'Responsável', 'Observações', 'Criado em', 'Atualizado em'];
        const rows = sortedAndFilteredInventory.map(item => [
            item.campus, item.setor, item.sala, item.category, item.brand, item.serial, item.patrimony, item.status, item.responsible, item.obs.replace(/,/g, ';'), new Date(item.created).toLocaleDateString('pt-BR'), new Date(item.updated).toLocaleDateString('pt-BR')
        ].join(','));

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `inventario_export_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const exportToPDF = () => {
        const doc = new jsPDF();
        const tableColumns = ["S/N", "Categoria", "Localização", "Status", "Última Atualização"];
        const tableRows: (string | null)[][] = [];

        sortedAndFilteredInventory.forEach(item => {
            const itemData = [
                item.serial,
                item.category,
                `${item.setor} / ${item.sala}`,
                ItemStatus[item.status],
                new Date(item.updated).toLocaleDateString('pt-BR'),
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 20,
            didDrawPage: (data) => {
                // Header
                doc.setFontSize(20);
                doc.setTextColor(40);
                doc.text("Relatório de Inventário", data.settings.margin.left, 15);
                
                // Footer
                let str = "Página " + doc.internal.getNumberOfPages();
                doc.setFontSize(10);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
            },
        });
        
        doc.save(`inventario_${new Date().toISOString().split('T')[0]}.pdf`);
    }
    
    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                    placeholder="Filtrar por categoria, S/N, patrimônio..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-grow"
                />
                <div className="flex gap-2 flex-wrap">
                    {selectedItems.length > 0 && (
                        <Button onClick={handleLoanSelected}><Handshake className="h-4 w-4 mr-2" />Emprestar Selecionados ({selectedItems.length})</Button>
                    )}
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Status</SelectItem>
                            {(Object.keys(ItemStatus) as Array<keyof typeof ItemStatus>).map(s => <SelectItem key={s} value={s}>{ItemStatus[s]}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={sectorFilter} onValueChange={setSectorFilter}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                            <SelectValue placeholder="Setor" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Setores</SelectItem>
                             {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={exportToCSV}><FileDown className="h-4 w-4 mr-2" />CSV</Button>
                    <Button variant="outline" onClick={exportToPDF}><FileText className="h-4 w-4 mr-2" />PDF</Button>
                </div>
            </div>
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                               <Checkbox 
                                    checked={selectedItems.length > 0 && selectedItems.length === paginatedInventory.length}
                                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                               />
                            </TableHead>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('serial')}>S/N <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="hidden md:table-cell">Localização</TableHead>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('status')}>Status <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead className="hidden lg:table-cell"><button className="flex items-center gap-1" onClick={() => requestSort('updated')}>Última Atualização <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInventory.length > 0 ? paginatedInventory.map(item => (
                            <TableRow key={item.id} className={`${item.status === 'emprestado' ? 'bg-purple-50' : ''} ${item.status === 'emuso' ? 'bg-yellow-50' : ''}`} data-state={selectedItems.includes(item.id) && "selected"}>
                                <TableCell>
                                    <Checkbox 
                                        checked={selectedItems.includes(item.id)}
                                        onCheckedChange={(checked) => handleSelectItem(item.id, Boolean(checked))}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{item.serial}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="hidden md:table-cell">{item.setor} / {item.sala}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Badge className={`cursor-pointer ${getStatusStyles(item.status)}`}>{ItemStatus[item.status]}</Badge>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Mudar Status</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                    {(Object.keys(ItemStatus) as Array<keyof typeof ItemStatus>).map(statusKey => {
                                                        const Icon = statusIcons[statusKey];
                                                        const isDisabled = item.status === statusKey || 
                                                                           statusKey === 'emprestado' || 
                                                                           (item.status === 'emuso' || item.status === 'emprestado');

                                                        return (
                                                            <DropdownMenuItem key={statusKey} onClick={() => onStatusChange(item.id, statusKey)} disabled={isDisabled}>
                                                                <Icon className="mr-2 h-4 w-4" />
                                                                {ItemStatus[statusKey]}
                                                            </DropdownMenuItem>
                                                        )
                                                    })}
                                                    </DropdownMenuSubContent>
                                                </DropdownMenuPortal>
                                            </DropdownMenuSub>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">{new Date(item.updated).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Abrir menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(item)} disabled={item.status === 'emprestado' || item.status === 'emuso'}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                                            {item.status === 'emuso' ? (
                                                <DropdownMenuItem onClick={() => onReturnFromUse(item.id)}>
                                                    <Undo2 className="mr-2 h-4 w-4" /> Registrar Devolução
                                                </DropdownMenuItem>
                                            ) : (
                                                <>
                                                    <DropdownMenuItem onClick={() => onRegisterUse(item)} disabled={item.status !== 'funcionando' && item.status !== 'backup'}>
                                                        <PlayCircle className="mr-2 h-4 w-4" /> Registrar Uso
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onLoan([item])} disabled={item.status !== 'funcionando' && item.status !== 'backup'}>
                                                        <Handshake className="mr-2 h-4 w-4" /> Emprestar Item
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive focus:text-destructive focus:bg-destructive/10" disabled={item.status === 'emprestado' || item.status === 'emuso'}><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">Nenhum resultado encontrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                    Exibindo {paginatedInventory.length} de {sortedAndFilteredInventory.length} itens.
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Próximo</Button>
                </div>
            </div>
        </div>
    );
}
