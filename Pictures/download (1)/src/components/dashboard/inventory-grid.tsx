"use client";

import * as React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuPortal, DropdownMenuSubContent, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Edit, Trash2, CheckCircle, AlertCircle, Wrench, Archive, PackageX, Handshake, Undo2, PlayCircle } from 'lucide-react';
import type { InventoryItem, User } from '@/lib/types';
import { ItemStatus } from '@/lib/types';

type InventoryGridProps = {
    inventory: InventoryItem[];
    sectors: string[];
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string | number, isDisposal?: boolean) => void;
    onStatusChange: (id: string | number, status: keyof typeof ItemStatus) => void;
    onLoan: (item: InventoryItem) => void;
    onRegisterUse: (item: InventoryItem) => void;
    onReturnFromUse: (id: string | number) => void;
    user: User;
}

const getStatusStyles = (status: keyof typeof ItemStatus) => {
    switch (status) {
        case 'funcionando': return 'bg-green-100 text-green-800 border-green-200';
        case 'manutencao': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'defeito': return 'bg-red-100 text-red-800 border-red-200';
        case 'backup': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'descarte': return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'emprestado': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'emuso': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

export default function InventoryGrid({ inventory, sectors, onEdit, onDelete, onStatusChange, onLoan, onRegisterUse, onReturnFromUse, user }: InventoryGridProps) {
    const [filter, setFilter] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [sectorFilter, setSectorFilter] = React.useState('all');
    
    const groupedAndFilteredInventory = React.useMemo(() => {
        const filtered = inventory.filter(item =>
            (item.category?.toLowerCase().includes(filter.toLowerCase()) ||
                item.serial?.toLowerCase().includes(filter.toLowerCase()) ||
                (item.patrimony || '')?.toLowerCase().includes(filter.toLowerCase())) &&
            (statusFilter === 'all' || item.status === statusFilter) &&
            (sectorFilter === 'all' || item.setor === sectorFilter)
        );

        const grouped = filtered.reduce((acc, item) => {
            const category = item.category || 'Sem Categoria';
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(item);
            return acc;
        }, {} as Record<string, InventoryItem[]>);

        return Object.entries(grouped)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, items]) => ({
                category,
                items: items.sort((a,b) => new Date(b.created).getTime() - new Date(a.created).getTime())
            }));
            
    }, [inventory, filter, statusFilter, sectorFilter]);

    const totalItems = groupedAndFilteredInventory.reduce((sum, group) => sum + group.items.length, 0);
    
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
                </div>
            </div>

            {totalItems > 0 ? (
                <div className="space-y-8">
                    {groupedAndFilteredInventory.map(({ category, items }) => (
                        <div key={category}>
                            <div className="mb-4">
                                <h3 className="text-xl font-semibold tracking-tight">{category}</h3>
                                <p className="text-sm text-muted-foreground">{items.length} item(s) nesta categoria</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {items.map(item => (
                                    <Card key={item.id} className={`flex flex-col ${item.status === 'emprestado' ? 'bg-purple-50' : ''} ${item.status === 'emuso' ? 'bg-yellow-50' : ''}`}>
                                        <CardHeader>
                                            <div className="flex justify-between items-start">
                                                <CardTitle className="text-lg">{item.category}</CardTitle>
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
                                                                <DropdownMenuItem onClick={() => onRegisterUse(item)} disabled={(item.status !== 'funcionando' && item.status !== 'backup') || item.isFixed}>
                                                                    <PlayCircle className="mr-2 h-4 w-4" /> Registrar Uso
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => onLoan(item)} disabled={(item.status !== 'funcionando' && item.status !== 'backup') || item.isFixed}>
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
                                            </div>
                                            <CardDescription>{item.brand}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="flex-grow space-y-2 text-sm">
                                            <div><strong>S/N:</strong> {item.serial}</div>
                                            <div><strong>Patrimônio:</strong> {item.patrimony || 'N/A'}</div>
                                            <div><strong>Local:</strong> {item.setor} / {item.sala}</div>
                                            <div><strong>Campus:</strong> {item.campus}</div>
                                        </CardContent>
                                        <CardFooter>
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
                                        </CardFooter>
                                    </Card>
                                ))}
                            </div>
                         </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground">
                    <p>Nenhum resultado encontrado para os filtros aplicados.</p>
                </div>
            )}
           
            <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-muted-foreground">
                    Exibindo {totalItems} item(ns) no total.
                </div>
                {/* A paginação foi removida pois a lógica de agrupamento a torna complexa e menos útil. O scroll é a forma primária de navegação agora. */}
            </div>
        </div>
    );
}