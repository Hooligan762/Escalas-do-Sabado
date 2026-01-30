"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClipboardList, History, BarChart2, LayoutGrid, List, Handshake, Settings, FolderKanban, Trash2, Wrench } from 'lucide-react';
import type { InventoryItem, AuditLogEntry, User, Loan, Category, Sector, Campus } from "@/lib/types";
import { ItemStatus } from "@/lib/types";

import InventoryTable from './inventory-table';
import InventoryGrid from './inventory-grid';
import InventoryAccordionView from './inventory-accordion-view';
import AuditLogTable from './audit-log-table';
import StatisticsView from './statistics-view';
import LoanTable from './loan-table';
import DisposalView from "./disposal-view";
import ManagementView from "./management-view";
import { useLocalStorage } from '@/hooks/use-local-storage';

type InventoryTabsProps = {
    inventory: InventoryItem[]; // Inventário completo para estatísticas
    userVisibleInventory: InventoryItem[]; // Inventário filtrado por campus para visualizações
    auditLog: AuditLogEntry[];
    userVisibleLoans: Loan[];
    categories: Category[];
    sectors: Sector[];
    campusList: Campus[];
    users: User[];
    highlightedItemId?: string | null;
    onEdit: (item: InventoryItem) => void;
    onDelete: (id: string | number, isDisposal?: boolean) => void;
    onStatusChange: (id: string | number, newStatus: keyof typeof ItemStatus) => void;
    onLoan: (items: InventoryItem[]) => void;
    onReturnLoan: (loanId: string | number) => void;
    onRegisterUse: (item: InventoryItem) => void;
    onReturnFromUse: (id: string | number) => void;
    onAddCategory: (name: string) => void;
    onDeleteCategory: (id: string | number) => void;
    onEditCategory: (id: string | number, newName: string) => void;
    onAddSector: (name: string) => void;
    onDeleteSector: (id: string | number) => void;
    onEditSector: (id: string | number, newName: string) => void;
    onFixedChange: (id: string | number, newValue: boolean) => void;
    user: User;
}

export type InventoryTabsHandle = {
    setTab: (tab: 'inventory' | 'loans' | 'disposal' | 'audit' | 'statistics' | 'management' | 'settings') => void;
    setActiveTab: (tab: 'inventory' | 'loans' | 'disposal' | 'audit' | 'statistics' | 'management' | 'settings') => void;
};

type ViewMode = 'accordion' | 'table' | 'grid';

const InventoryTabs = React.forwardRef<InventoryTabsHandle, InventoryTabsProps>(function InventoryTabs({
    inventory,
    userVisibleInventory,
    auditLog,
    userVisibleLoans,
    categories,
    sectors,
    campusList,
    users,
    onEdit,
    onDelete,
    onStatusChange,
    onLoan,
    onReturnLoan,
    onRegisterUse,
    onReturnFromUse,
    onAddCategory,
    onDeleteCategory,
    onEditCategory,
    onAddSector,
    onDeleteSector,
    onEditSector,
    onFixedChange,
    user,
    highlightedItemId
}: InventoryTabsProps, ref) {
    // Extract campus name for filtering
    const userCampusName = typeof user.campus === 'object' ? user.campus?.name : user.campus;

    const [viewMode, setViewMode] = useLocalStorage<ViewMode>('inventory-view-mode', 'accordion');
    const [activeTab, setActiveTab] = React.useState<'inventory' | 'loans' | 'disposal' | 'audit' | 'statistics' | 'management' | 'settings'>('inventory');

    React.useImperativeHandle(ref, () => ({
        setTab: (tab) => setActiveTab(tab),
        setActiveTab: (tab) => setActiveTab(tab),
    }), []);

    const sectorNames = React.useMemo(() => sectors.map(s => s.name), [sectors]);
    const categoryNames = React.useMemo(() => categories.map(c => c.name), [categories]);

    const renderInventoryView = () => {
        const props = {
            inventory: userVisibleInventory.filter(item => item.status !== 'descarte'), // Exclui itens de descarte da visão principal
            onEdit,
            onDelete,
            onStatusChange,
            onRegisterUse,
            onReturnFromUse,
            onFixedChange,
            user,
            highlightedItemId,
        };

        switch (viewMode) {
            case 'table':
                return <InventoryTable {...props} sectors={sectorNames} onLoan={onLoan} />;
            case 'grid':
                return <InventoryGrid {...props} sectors={sectorNames} onLoan={(item) => onLoan([item])} />;
            case 'accordion':
                return <InventoryAccordionView {...props} onLoan={onLoan} />;
            default:
                return <InventoryAccordionView {...props} onLoan={onLoan} />;
        }
    };

    const disposalItems = React.useMemo(() => {
        const allDisposalItems = inventory.filter(item => item.status === 'descarte');
        if (user.role === 'admin') return allDisposalItems;
        return allDisposalItems.filter(item => item.campus === userCampusName);
    }, [inventory, user, userCampusName]);

    const isAdmin = user.role === 'admin';
    // Agora todos os usuários têm acesso ao gerenciamento (não apenas admins)
    // Removemos a aba "Configurações" para evitar duplicação com "Gerenciamento"
    const tabGridClass = 'grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 h-auto';


    return (
        <Card>
            <CardContent className="p-4 md:p-6">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <TabsList className={tabGridClass}>
                            <TabsTrigger value="inventory"><ClipboardList className="w-4 h-4 mr-2" />Inventário</TabsTrigger>
                            <TabsTrigger value="loans"><Handshake className="w-4 h-4 mr-2" />Empréstimos</TabsTrigger>
                            <TabsTrigger value="disposal"><Trash2 className="w-4 h-4 mr-2" />Descarte</TabsTrigger>
                            <TabsTrigger value="audit"><History className="w-4 h-4 mr-2" />Log</TabsTrigger>
                            <TabsTrigger value="statistics"><BarChart2 className="w-4 h-4 mr-2" />Estatísticas</TabsTrigger>
                            <TabsTrigger value="management"><Wrench className="w-4 h-4 mr-2" />Gerenciamento</TabsTrigger>
                        </TabsList>


                    </div>

                    {activeTab === 'inventory' && (
                        <div className="mt-4 flex items-center justify-start">
                            <div className="flex items-center gap-2 bg-card p-3 rounded-lg border shadow-sm">
                                <span className="text-sm font-medium text-muted-foreground">Modo de Visualização:</span>
                                <div className="flex items-center gap-1">
                                    <Button 
                                        variant={viewMode === 'accordion' ? 'default' : 'outline'} 
                                        size="sm" 
                                        onClick={() => setViewMode('accordion')} 
                                        title="Visualização Agrupada"
                                        className="flex items-center gap-2"
                                    >
                                        <FolderKanban className="h-4 w-4" />
                                        <span>Agrupada</span>
                                    </Button>
                                    <Button 
                                        variant={viewMode === 'table' ? 'default' : 'outline'} 
                                        size="sm" 
                                        onClick={() => setViewMode('table')} 
                                        title="Visualização em Tabela"
                                        className="flex items-center gap-2"
                                    >
                                        <List className="h-4 w-4" />
                                        <span>Tabela</span>
                                    </Button>
                                    <Button 
                                        variant={viewMode === 'grid' ? 'default' : 'outline'} 
                                        size="sm" 
                                        onClick={() => setViewMode('grid')} 
                                        title="Visualização em Grade"
                                        className="flex items-center gap-2"
                                    >
                                        <LayoutGrid className="h-4 w-4" />
                                        <span>Grade</span>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <TabsContent value="inventory" className="mt-4">
                        {renderInventoryView()}
                    </TabsContent>
                    <TabsContent value="loans" className="mt-4">
                        <LoanTable loans={userVisibleLoans} onReturn={onReturnLoan} />
                    </TabsContent>
                    <TabsContent value="disposal" className="mt-4">
                        <DisposalView
                            items={disposalItems}
                            onDelete={onDelete}
                            onRestore={(id) => onStatusChange(id, 'funcionando')}
                        />
                    </TabsContent>
                    <TabsContent value="audit" className="mt-4">
                        <AuditLogTable auditLog={auditLog} onEdit={onEdit} />
                    </TabsContent>
                    <TabsContent value="statistics" className="mt-4">
                        <StatisticsView inventory={inventory} user={user} categories={categoryNames} sectors={sectors} campusList={campusList} />
                    </TabsContent>

                    <TabsContent value="management" className="mt-4">
                        <ManagementView
                            categories={categories}
                            sectors={sectors}
                            user={user}
                            onAddCategory={onAddCategory}
                            onDeleteCategory={onDeleteCategory}
                            onEditCategory={onEditCategory}
                            onAddSector={onAddSector}
                            onDeleteSector={onDeleteSector}
                            onEditSector={onEditSector}
                        />
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
});

export default InventoryTabs;
