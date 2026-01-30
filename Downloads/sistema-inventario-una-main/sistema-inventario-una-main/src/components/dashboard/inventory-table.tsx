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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, MoreHorizontal, Edit, Trash2, FileDown, FileText, CheckCircle, AlertCircle, Wrench, Archive, PackageX, Handshake, Undo2, PlayCircle, Download } from 'lucide-react';
import { ExportButton } from '@/components/ui/export-button';
import type { InventoryItem, User } from '@/lib/types';
import { ItemStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

type InventoryTableProps = {
    inventory: InventoryItem[];
    sectors: string[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string | number, isDisposal?: boolean) => void;
    onStatusChange: (id: string | number, status: keyof typeof ItemStatus) => void;
    onLoan: (items: InventoryItem[]) => void;
    onRegisterUse: (item: InventoryItem) => void;
    onReturnFromUse: (id: string | number) => void;
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
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    const [selectedItems, setSelectedItems] = React.useState<(string | number)[]>([]);
    const itemsPerPage = 10;
    const { toast } = useToast();

    // Resetar página e filtros ao receber novo inventário ou ao ativar a aba de inventário
    React.useEffect(() => {
        setCurrentPage(1);
        setFilter('');
        setStatusFilter('all');
        setSectorFilter('all');
    }, [inventory, user]);


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
            ((item.category && item.category.toLowerCase().includes(filter.toLowerCase())) ||
                (item.serial && item.serial.toLowerCase().includes(filter.toLowerCase())) ||
                (item.patrimony && item.patrimony.toLowerCase().includes(filter.toLowerCase()))) &&
            (statusFilter === 'all' || item.status === statusFilter) &&
            (sectorFilter === 'all' || item.setor === sectorFilter)
        );

        if (sortConfig !== null) {
            sortableItems.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (aValue === null || aValue === undefined) return 1;
                if (bValue === null || bValue === undefined) return -1;

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

    const handleSelectItem = (id: string | number, checked: boolean) => {
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
        const headers = ["S/N", "Categoria", "Marca", "Patrimônio", "Campus", "Setor", "Sala", "Status", "Responsável", "Observações", "Fixo", "Última Atualização"];
        const csvContent = [
            headers.join(','),
            ...sortedAndFilteredInventory.map(item => [
                `"${item.serial || ''}"`,
                `"${item.category || ''}"`,
                `"${item.brand || ''}"`,
                `"${item.patrimony || ''}"`,
                `"${item.campus || ''}"`,
                `"${item.setor || ''}"`,
                `"${item.sala || ''}"`,
                `"${ItemStatus[item.status] || ''}"`,
                `"${item.responsible_name || item.responsible || ''}"`,
                `"${(item.obs || '').replace(/"/g, '""')}"`, // Escape aspas duplas
                `"${item.isFixed ? 'Sim' : 'Não'}"`,
                `"${new Date(item.updated).toLocaleDateString('pt-BR')}"`,
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const fileName = `inventario_${timestamp[0]}_${timestamp[1].split('.')[0]}.csv`;
        link.setAttribute("download", fileName);

        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    const exportToPDF = () => {
        const doc = new jsPDF('landscape'); // Modo paisagem para mais colunas
        const tableColumns = ["S/N", "Categoria", "Marca", "Patrimônio", "Localização", "Status", "Responsável", "Última Atualização"];
        const tableRows: (string | null)[][] = [];

        sortedAndFilteredInventory.forEach(item => {
            const itemData = [
                item.serial || '-',
                item.category || '-',
                item.brand || '-',
                item.patrimony || '-',
                `${item.setor}${item.sala ? ` / ${item.sala}` : ''}`,
                ItemStatus[item.status],
                item.responsible_name || item.responsible || '-',
                new Date(item.updated).toLocaleDateString('pt-BR'),
            ];
            tableRows.push(itemData);
        });

        autoTable(doc, {
            head: [tableColumns],
            body: tableRows,
            startY: 35,
            styles: {
                fontSize: 8,
                cellPadding: 2,
            },
            headStyles: {
                fillColor: [59, 130, 246], // Azul
                textColor: 255,
                fontStyle: 'bold',
            },
            alternateRowStyles: {
                fillColor: [248, 249, 250], // Cinza claro
            },
            didDrawPage: (data) => {
                // Cabeçalho
                doc.setFontSize(16);
                doc.setTextColor(40);
                doc.text("Relatório de Inventário", data.settings.margin.left, 15);

                // Informações do relatório
                doc.setFontSize(10);
                doc.setTextColor(100);
                const currentDate = new Date().toLocaleDateString('pt-BR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
                doc.text(`Gerado em: ${currentDate}`, data.settings.margin.left, 22);
                doc.text(`Total de equipamentos: ${sortedAndFilteredInventory.length}`, data.settings.margin.left + 100, 22);

                // Mostrar filtros aplicados se houver
                if (filter.trim()) {
                    doc.text(`Filtro aplicado: "${filter}"`, data.settings.margin.left + 200, 22);
                }

                // Estatísticas por status
                const statusStats = sortedAndFilteredInventory.reduce((acc, item) => {
                    acc[item.status] = (acc[item.status] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                let yPosition = 25;
                const statusEntries = Object.entries(statusStats);
                if (statusEntries.length > 0) {
                    doc.setFontSize(8);
                    doc.text('Status: ', data.settings.margin.left, yPosition);
                    let xPosition = data.settings.margin.left + 25;
                    statusEntries.forEach(([status, count], index) => {
                        const text = `${ItemStatus[status as keyof typeof ItemStatus]}: ${count}`;
                        doc.text(text, xPosition, yPosition);
                        xPosition += text.length * 2 + 15;
                        if (xPosition > 250 && index < statusEntries.length - 1) {
                            yPosition += 3;
                            xPosition = data.settings.margin.left + 25;
                        }
                    });
                }

                // Rodapé com numeração
                const pageCount = doc.getNumberOfPages();
                const pageNumber = (doc as any).internal.getCurrentPageInfo()?.pageNumber || 1;
                let str = `Página ${pageNumber} de ${pageCount}`;
                doc.setFontSize(10);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
                doc.text(str, pageWidth - data.settings.margin.right - 30, pageHeight - 10);
            },
        });

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T');
        const fileName = `inventario_${timestamp[0]}_${timestamp[1].split('.')[0]}.pdf`;
        doc.save(fileName);
    }

    // Definir colunas para exportação
    const exportColumns = [
        { header: 'S/N', key: 'serial', width: 15 },
        { header: 'Categoria', key: 'category', width: 15 },
        { header: 'Marca', key: 'brand', width: 15 },
        { header: 'Patrimônio', key: 'patrimony', width: 15 },
        { header: 'Campus', key: 'campus', width: 20 },
        { header: 'Setor', key: 'setor', width: 15 },
        { header: 'Sala', key: 'sala', width: 10 },
        { 
            header: 'Status', 
            key: 'status', 
            width: 15,
            format: (value: string) => ItemStatus[value as keyof typeof ItemStatus] || value
        },
        { 
            header: 'Responsável', 
            key: 'responsible_name', 
            width: 20,
            format: (value: string, item: any) => value || item.responsible || ''
        },
        { header: 'Observações', key: 'obs', width: 30 },
        { 
            header: 'Fixo', 
            key: 'isFixed', 
            width: 8,
            format: (value: boolean) => value ? 'Sim' : 'Não'
        },
        { 
            header: 'Criado', 
            key: 'created', 
            width: 12,
            format: (value: string) => new Date(value).toLocaleDateString('pt-BR')
        },
        { 
            header: 'Última Atualização', 
            key: 'updated', 
            width: 12,
            format: (value: string) => new Date(value).toLocaleDateString('pt-BR')
        },
    ];

    return (
        <div className="space-y-4">
            <div className="space-y-3 sm:space-y-0">
                {/* Busca principal */}
                <Input
                    placeholder="Filtrar por categoria, S/N, patrimônio..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full"
                />
                
                {/* Linha de controles - responsiva */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Botão de empréstimo se houver selecionados */}
                    {selectedItems.length > 0 && (
                        <Button onClick={handleLoanSelected} className="w-full sm:w-auto">
                            <Handshake className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Emprestar Selecionados</span> 
                            <span className="sm:hidden">Emprestar</span>
                            ({selectedItems.length})
                        </Button>
                    )}
                    
                    {/* Filtros e exportação */}
                    <div className="flex gap-2 flex-wrap">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[120px] sm:w-[150px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                {(Object.keys(ItemStatus) as Array<keyof typeof ItemStatus>).map(s => <SelectItem key={s} value={s}>{ItemStatus[s]}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <Select value={sectorFilter} onValueChange={setSectorFilter}>
                            <SelectTrigger className="w-[120px] sm:w-[150px]">
                                <SelectValue placeholder="Setor" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Setores</SelectItem>
                                {sectors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                            </SelectContent>
                        </Select>
                        <ExportButton
                            data={sortedAndFilteredInventory}
                            columns={exportColumns}
                            filename="inventario"
                            title="Relatório de Inventário"
                            campus={user?.campus}
                            variant="outline"
                            size="sm"
                            showAdvanced={true}
                        />
                    </div>
                </div>
            </div>
            <div className="rounded-md border bg-card overflow-hidden">
                <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[40px]">
                                <Checkbox
                                    checked={selectedItems.length > 0 && paginatedInventory.length > 0 && selectedItems.length === paginatedInventory.length}
                                    onCheckedChange={(checked) => handleSelectAll(Boolean(checked))}
                                />
                            </TableHead>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('serial')}>S/N <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead className="hidden md:table-cell">Localização</TableHead>
                            <TableHead>Fixo</TableHead>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('status')}>Status <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead className="hidden lg:table-cell"><button className="flex items-center gap-1" onClick={() => requestSort('updated')}>Última Atualização <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedInventory.length > 0 ? paginatedInventory.map(item => (
                            <TableRow key={item.id} className={`${item.status === 'emprestado' ? 'bg-purple-50/50' : ''} ${item.status === 'emuso' ? 'bg-yellow-50/50' : ''}`} data-state={selectedItems.includes(item.id) && "selected"}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedItems.includes(item.id)}
                                        onCheckedChange={(checked) => handleSelectItem(item.id, Boolean(checked))}
                                    />
                                </TableCell>
                                <TableCell className="font-medium">{item.serial}</TableCell>
                                <TableCell>{item.category}</TableCell>
                                <TableCell className="hidden md:table-cell">{item.setor} / {item.sala}</TableCell>
                                <TableCell>{item.isFixed ? 'Sim' : 'Não'}</TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild disabled={item.status === 'emprestado' || item.status === 'emuso'}>
                                            <Button variant="ghost" className={`h-auto p-1 ${getStatusStyles(item.status)}`} disabled={item.status === 'emprestado' || item.status === 'emuso'}>
                                                <Badge className={`cursor-pointer ${getStatusStyles(item.status)}`}>{ItemStatus[item.status]}</Badge>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuSub>
                                                <DropdownMenuSubTrigger>Mudar Status</DropdownMenuSubTrigger>
                                                <DropdownMenuPortal>
                                                    <DropdownMenuSubContent>
                                                        {(Object.keys(ItemStatus) as Array<keyof typeof ItemStatus>).map(statusKey => {
                                                            const IconComponent = statusIcons[statusKey];
                                                            const isDisabled = item.status === statusKey || statusKey === 'emprestado' || statusKey === 'emuso';
                                                            return (
                                                                <DropdownMenuItem key={statusKey} onClick={() => onStatusChange(item.id, statusKey)} disabled={isDisabled}>
                                                                    <IconComponent className="mr-2 h-4 w-4" />
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
                                <TableCell>{item.responsible_name || item.responsible}</TableCell>
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
                                            <DropdownMenuItem onClick={() => onStatusChange(item.id, 'descarte')} disabled={item.status === 'emprestado' || item.status === 'emuso'}>
                                                <Trash2 className="mr-2 h-4 w-4" /> Mover para Descarte
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => onDelete(item.id, true)} disabled={item.status === 'emprestado' || item.status === 'emuso'} className="text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:text-red-400">
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
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
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    Exibindo {paginatedInventory.length} de {sortedAndFilteredInventory.length} itens.
                </div>
                <div className="flex gap-2 order-1 sm:order-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                        <span className="hidden sm:inline">Anterior</span>
                        <span className="sm:hidden">‹</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>
                        <span className="hidden sm:inline">Próximo</span>
                        <span className="sm:hidden">›</span>
                    </Button>
                </div>
            </div>
        </div>
    );
}
