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
    onFixedChange: (id: string | number, newValue: boolean) => void;
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

const getStatusIcon = (status: keyof typeof ItemStatus) => {
    switch (status) {
        case 'funcionando': return <CheckCircle className="inline-block mr-1 h-4 w-4 align-text-bottom" />;
        case 'defeito': return <AlertCircle className="inline-block mr-1 h-4 w-4 align-text-bottom" />;
        case 'manutencao': return <Wrench className="inline-block mr-1 h-4 w-4 align-text-bottom" />;
        case 'backup': return <Archive className="inline-block mr-1 h-4 w-4 align-text-bottom" />;
        case 'descarte': return <PackageX className="inline-block mr-1 h-4 w-4 align-text-bottom" />;
        case 'emprestado': return <Handshake className="inline-block mr-1 h-4 w-4 align-text-bottom" />;
        case 'emuso': return <PlayCircle className="inline-block mr-1 h-4 w-4 align-text-bottom" />;
        default: return <CheckCircle className="inline-block mr-1 h-4 w-4 align-text-bottom" />;
    }
};

export default function InventoryGrid({ inventory, sectors, onEdit, onDelete, onStatusChange, onLoan, onRegisterUse, onReturnFromUse, onFixedChange, user }: InventoryGridProps) {
    const [filter, setFilter] = React.useState('');
    const [statusFilter, setStatusFilter] = React.useState('all');
    const [sectorFilter, setSectorFilter] = React.useState('all');
    const [loadingFixedId, setLoadingFixedId] = React.useState<string | number | null>(null);
    const [localizedFixed, setLocalizedFixed] = React.useState<Record<string | number, boolean>>({});
    const [mounted, setMounted] = React.useState(false);
    
    // Garantir hidratação adequada
    React.useEffect(() => {
        setMounted(true);
    }, []);
    
    // Sincronizar estado local com dados atualizados do inventário
    React.useEffect(() => {
        if (!mounted || !inventory) return;
        
        setLocalizedFixed(prev => {
            const updated = { ...prev };
            let hasChanges = false;
            
            inventory.forEach(item => {
                if (item && item.id && updated[item.id] !== undefined && updated[item.id] !== item.isFixed) {
                    updated[item.id] = item.isFixed;
                    hasChanges = true;
                }
            });
            
            return hasChanges ? updated : prev;
        });
    }, [inventory, mounted]);
    
    const groupedAndFilteredInventory = React.useMemo(() => {
        if (!mounted || !inventory || !Array.isArray(inventory)) {
            return [];
        }
        
        const filtered = inventory.filter(item => {
            if (!item || !item.id) return false;
            
            return (
                ((item.category && item.category.toLowerCase().includes(filter.toLowerCase())) ||
                    (item.serial && item.serial.toLowerCase().includes(filter.toLowerCase())) ||
                    (item.patrimony && item.patrimony.toLowerCase().includes(filter.toLowerCase()))) &&
                (statusFilter === 'all' || item.status === statusFilter) &&
                (sectorFilter === 'all' || item.setor === sectorFilter)
            );
        });

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
                items: items.sort((a,b) => {
                    const dateA = a.created ? new Date(a.created).getTime() : 0;
                    const dateB = b.created ? new Date(b.created).getTime() : 0;
                    return dateB - dateA;
                })
            }));
            
    }, [inventory, filter, statusFilter, sectorFilter, mounted]);

    const totalItems = groupedAndFilteredInventory.reduce((sum, group) => sum + group.items.length, 0);
    
    // Mostrar loading até o componente estar montado para evitar problemas de hidratação
    if (!mounted) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
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
                                                                <DropdownMenuItem onClick={() => onRegisterUse(item)} disabled={item.status !== 'funcionando' && item.status !== 'backup'}>
                                                                    <PlayCircle className="mr-2 h-4 w-4" /> Registrar Uso
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => onLoan(item)} disabled={item.status !== 'funcionando' && item.status !== 'backup'}>
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
                                            <div className="flex items-center gap-2 mt-2">
                                                <span className="text-xs">Fixo:</span>
                                                <Badge
                                                    className={`cursor-pointer px-2 py-0.5 text-xs font-bold rounded border transition-colors duration-200 ${(localizedFixed[item.id] !== undefined ? localizedFixed[item.id] : item.isFixed) ? 'bg-blue-500 text-white border-blue-600' : 'bg-red-500 text-white border-red-600'} active:scale-95`}
                                                    title={(localizedFixed[item.id] !== undefined ? localizedFixed[item.id] : item.isFixed) ? 'Clique para marcar como Não Fixo' : 'Clique para marcar como Fixo'}
                                                    style={{ userSelect: 'none' }}
                                                    onClick={async () => {
                                                        const currentValue = localizedFixed[item.id] !== undefined ? localizedFixed[item.id] : item.isFixed;
                                                        const newValue = !currentValue;
                                                        
                                                        // Atualizar visualmente primeiro
                                                        setLocalizedFixed(prev => ({ ...prev, [item.id]: newValue }));
                                                        setLoadingFixedId(item.id);
                                                        
                                                        try {
                                                            await onFixedChange(item.id, newValue);
                                                            // Manter o valor local atualizado após sucesso
                                                        } catch (e) {
                                                            console.error('Erro ao alterar campo Fixo:', e);
                                                            // Reverter para o valor original em caso de erro
                                                            setLocalizedFixed(prev => ({ ...prev, [item.id]: item.isFixed }));
                                                        } finally {
                                                            setLoadingFixedId(null);
                                                        }
                                                    }}
                                                >
                                                    {loadingFixedId === item.id ? (
                                                        <span className="flex items-center gap-1">
                                                            <svg className="animate-spin h-4 w-4 mr-1 text-white" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 01-8 8z" />
                                                            </svg>
                                                            {(localizedFixed[item.id] !== undefined ? localizedFixed[item.id] : item.isFixed) ? 'Sim' : 'Não'}
                                                        </span>
                                                    ) : (localizedFixed[item.id] !== undefined ? localizedFixed[item.id] : item.isFixed) ? 'Sim' : 'Não'}
                                                </Badge>
                                            </div>
                                        </CardContent>
                                        <CardFooter>
                                        <div className="flex items-center gap-2">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Badge
                                                        className={`cursor-pointer px-2 py-0.5 text-xs font-bold rounded border transition-colors duration-200 ${getStatusStyles(item.status)}`}
                                                        title={ItemStatus[item.status] + ' (Clique para mudar)'}
                                                        style={{ userSelect: 'none' }}
                                                    >
                                                        {mounted && getStatusIcon(item.status)}
                                                        {ItemStatus[item.status]}
                                                    </Badge>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {(Object.keys(ItemStatus) as Array<keyof typeof ItemStatus>).map(s => (
                                                        <DropdownMenuItem
                                                            key={s}
                                                            onClick={() => onStatusChange(item.id, s)}
                                                            disabled={item.status === s || s === 'emprestado' || s === 'emuso'}
                                                        >
                                                            {mounted && getStatusIcon(s)}
                                                            {ItemStatus[s]}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
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