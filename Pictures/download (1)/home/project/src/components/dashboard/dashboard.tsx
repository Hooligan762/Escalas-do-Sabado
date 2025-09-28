"use client";

import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "@/components/dashboard/header";
import StatCardDeck from "@/components/dashboard/stat-card-deck";
import InventoryForm from "@/components/dashboard/inventory-form";
import DashboardCharts from "@/components/dashboard/dashboard-charts";
import InventoryTabs from "@/components/dashboard/inventory-tabs";
import LoanForm from "@/components/dashboard/loan-form";
import SmartAlerts from "@/components/dashboard/smart-alerts";
import { useToast } from "@/hooks/use-toast";
import type { User, InventoryItem, AuditLogEntry, Loan, Category, Sector, Campus } from "@/lib/types";
import { ItemStatus } from "@/lib/types";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { writeData } from '@/lib/db';

type DashboardProps = {
  currentUser: User;
  initialInventory: InventoryItem[];
  initialAuditLog: AuditLogEntry[];
  initialCategories: Category[];
  initialSectors: Sector[];
  initialLoans: Loan[];
  initialUsers: User[];
  initialCampusList: Campus[];
};

export default function Dashboard({
  currentUser,
  initialInventory,
  initialAuditLog,
  initialCategories,
  initialSectors,
  initialLoans,
  initialUsers,
  initialCampusList,
}: DashboardProps) {
  const [user] = React.useState<User>(currentUser);
  const { toast } = useToast();

  const [inventory, setInventory] = useLocalStorage<InventoryItem[]>("inventory", initialInventory);
  const [auditLog, setAuditLog] = useLocalStorage<AuditLogEntry[]>("auditLog", initialAuditLog);
  const [loans, setLoans] = useLocalStorage<Loan[]>("loans", initialLoans);
  const [categories, setCategories] = useLocalStorage<Category[]>("categories", initialCategories);
  const [sectors, setSectors] = useLocalStorage<Sector[]>("sectors", initialSectors);

  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [lendingItems, setLendingItems] = React.useState<InventoryItem[]>([]);
  
  const [activeCampus, setActiveCampus] = React.useState<string>(
    user.role === 'admin' ? 'all' : user.campus
  );
  
  // Persist changes to server file
  const isMounted = React.useRef(false);
  React.useEffect(() => {
    if (isMounted.current) {
        writeData('inventory', inventory);
        writeData('auditLog', auditLog);
        writeData('loans', loans);
        writeData('categories', categories);
        writeData('sectors', sectors);
    } else {
        isMounted.current = true;
    }
  }, [inventory, auditLog, loans, categories, sectors]);


  const userVisibleInventory = React.useMemo(() => {
    if (activeCampus === "all") {
      return [...inventory].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }
    return inventory.filter((item) => item.campus === activeCampus)
                    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }, [inventory, activeCampus]);
  
   const userVisibleAuditLog = React.useMemo(() => {
    const sortedLog = [...auditLog].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (activeCampus === 'all') {
      return sortedLog;
    }
    return sortedLog.filter(log => log.campus === activeCampus);
  }, [auditLog, activeCampus]);

   const userVisibleLoans = React.useMemo(() => {
    const sortedLoans = [...loans].sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
    if (activeCampus === 'all') {
      return sortedLoans;
    }
    return sortedLoans.filter(loan => loan.campus === activeCampus);
  }, [loans, activeCampus]);

  const addAuditLogEntry = (action: AuditLogEntry['action'], item: InventoryItem | null, details: string) => {
    const campus = item ? item.campus : (user.campus !== 'all' ? user.campus : 'Sistema');
    const newLog: AuditLogEntry = {
        id: uuidv4(),
        action,
        user: user.name,
        campus: campus,
        timestamp: new Date().toISOString(),
        item,
        details,
    };
    setAuditLog(prev => [newLog, ...prev]);
  };

  const handleSaveItem = (itemData: Omit<InventoryItem, 'created' | 'updated' | 'id'> & { id?: string | null }) => {
    const now = new Date().toISOString();
    const isEditing = !!itemData.id;
    let savedItem: InventoryItem;

    if (isEditing) {
        let originalItem = inventory.find(i => i.id === itemData.id);
        if (!originalItem) return;
        savedItem = { ...originalItem, ...itemData, updated: now } as InventoryItem;
        setInventory(prev => prev.map(i => i.id === itemData.id ? savedItem : i));
        addAuditLogEntry('update', savedItem, `Atualizou ${savedItem.category} S/N: ${savedItem.serial}`);
    } else {
        const existingItem = inventory.find(item => item.serial.toLowerCase() === itemData.serial.toLowerCase());
        if (existingItem) {
            toast({
                variant: 'destructive',
                title: 'Item Duplicado',
                description: `Já existe um item com o número de série "${itemData.serial}". O item está no setor ${existingItem.setor} do campus ${existingItem.campus}.`,
            });
            return;
        }

        savedItem = { ...itemData, id: uuidv4(), created: now, updated: now } as InventoryItem;
        setInventory(prev => [savedItem, ...prev]);
        addAuditLogEntry('create', savedItem, `Criou ${savedItem.category} S/N: ${savedItem.serial}`);
    }
    
    toast({
        title: `Equipamento ${isEditing ? "Atualizado" : "Salvo"}`,
        description: `${savedItem.category} (S/N: ${savedItem.serial}) foi ${isEditing ? "atualizado" : "adicionado"} com sucesso.`,
    });
    handleClearForm();
  };

  const handleStatusChange = (itemId: string, newStatus: keyof typeof ItemStatus) => {
    const itemToUpdate = inventory.find(i => i.id === itemId);
    if (!itemToUpdate || itemToUpdate.status === newStatus) return;
    
    if (itemToUpdate.status === 'emprestado' || itemToUpdate.status === 'emuso') {
       if (newStatus !== 'funcionando') {
            toast({ variant: 'destructive', title: 'Ação Inválida', description: 'Primeiro registre a devolução do item antes de alterar para outro status.' });
            return;
       }
    }
    if (newStatus === 'emprestado') {
        toast({ variant: 'destructive', title: 'Ação Inválida', description: 'Para emprestar um item, use a opção "Emprestar" no menu de ações do item.' });
        return;
    }


    const updatedItem = { ...itemToUpdate, status: newStatus, updated: new Date().toISOString() };
    setInventory(prev => prev.map(i => i.id === itemId ? updatedItem : i));
    addAuditLogEntry('update', updatedItem, `Alterou status de "${ItemStatus[itemToUpdate.status]}" para "${ItemStatus[newStatus]}" para o item S/N: ${updatedItem.serial}`);
    toast({ title: "Status Atualizado", description: `O status do item ${updatedItem.serial} foi alterado para "${ItemStatus[newStatus]}".` });
  };

  const handleDeleteItem = (id: string, isDisposal: boolean = false) => {
    const itemToDelete = inventory.find((i) => i.id === id);
    if (!itemToDelete) return;
    
    if (!isDisposal && (itemToDelete.status === 'emprestado' || itemToDelete.status === 'emuso')) {
      toast({ variant: "destructive", title: "Ação bloqueada", description: "Você não pode excluir um item que está atualmente emprestado ou em uso." });
      return;
    }

    const confirmMessage = isDisposal 
      ? `Tem certeza que deseja excluir PERMANENTEMENTE o item ${itemToDelete.serial}? Esta ação não pode ser desfeita e remove o item do banco de dados.`
      : `Item será movido para o descarte. Para excluir permanentemente, use a aba 'Descarte'. Deseja continuar?`;

    if (!window.confirm(confirmMessage)) return;

    if (isDisposal) {
        setInventory(prev => prev.filter((i) => i.id !== id));
        addAuditLogEntry('delete', { ...itemToDelete }, `Excluiu permanentemente ${itemToDelete.category} S/N: ${itemToDelete.serial}`);
        toast({ title: "Equipamento Excluído Permanentemente", description: `${itemToDelete.category} (S/N: ${itemToDelete.serial}) foi removido do sistema.`, variant: "destructive" });
    } else {
        handleStatusChange(id, 'descarte');
    }
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    document.getElementById("inventory-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleLoanItems = (items: InventoryItem[]) => {
    const invalidItems = items.filter(item => (item.status !== 'funcionando' && item.status !== 'backup') || item.isFixed);
    if (invalidItems.length > 0) {
      toast({ variant: 'destructive', title: 'Não é possível emprestar', description: `O(s) item(ns) S/N ${invalidItems.map(i => i.serial).join(', ')} não está(ão) com status "Funcionando" ou "Backup" ou são equipamentos fixos.` });
      return;
    }
    setLendingItems(items);
  };

  const handleSaveLoan = (loanDetails: Omit<Loan, 'id' | 'itemId' | 'itemSerial' | 'itemCategory' | 'loanDate' | 'status' | 'campus' | 'actualReturnDate' | 'loaner'>, loanedItems: InventoryItem[]) => {
    const now = new Date().toISOString();
    const newLoans: Loan[] = [];
    const updatedItemIds = loanedItems.map(item => item.id);

    for (const item of loanedItems) {
        const newLoan: Loan = {
            ...loanDetails,
            id: uuidv4(),
            itemId: item.id,
            itemSerial: item.serial,
            itemCategory: item.category,
            loanDate: now,
            status: 'loaned',
            campus: item.campus,
            actualReturnDate: null,
            loaner: user.name,
        };
        newLoans.push(newLoan);
        addAuditLogEntry('loan', { ...item, status: 'emprestado' }, `Emprestou ${item.category} S/N: ${item.serial} para ${newLoan.borrowerName}`);
    }
    
    setLoans(prev => [...newLoans, ...prev]);
    setInventory(prev => prev.map(item => updatedItemIds.includes(item.id) ? { ...item, status: 'emprestado', updated: now } : item));
    
    toast({ title: `Item(s) Emprestado(s)`, description: `${loanedItems.length} item(ns) foram emprestados para ${loanDetails.borrowerName}.` });
    setLendingItems([]);
  };

  const handleReturnLoan = (loanId: string) => {
    const loanToReturn = loans.find(l => l.id === loanId);
    if (!loanToReturn) return;

    const now = new Date().toISOString();
    const updatedLoan = { ...loanToReturn, status: 'returned' as const, actualReturnDate: now };
    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));

    let itemToUpdate = inventory.find(i => i.id === loanToReturn.itemId);
    if (itemToUpdate) {
        const updatedItem = { ...itemToUpdate, status: 'funcionando' as const, updated: now };
        setInventory(prev => prev.map(i => i.id === itemToUpdate!.id ? updatedItem : i));
        addAuditLogEntry('return', updatedItem, `Devolvido ${updatedItem.category} S/N: ${updatedItem.serial} por ${loanToReturn.borrowerName}`);
    } else {
        addAuditLogEntry('return', null, `Devolvido item (S/N: ${loanToReturn.itemSerial}) que não está mais no inventário.`);
    }

    toast({ title: "Equipamento Devolvido", description: `O item ${loanToReturn.itemSerial} foi registrado como devolvido.` });
  };

  const handleRegisterUse = (item: InventoryItem) => {
     if (item.status !== 'funcionando' && item.status !== 'backup') {
        toast({ variant: 'destructive', title: 'Ação Inválida', description: 'Apenas itens "Funcionando" ou "Backup" podem ser marcados como em uso.' });
        return;
     };
     if (item.isFixed) {
        toast({ variant: 'destructive', title: 'Ação Inválida', description: 'Equipamentos fixos não podem ser marcados como "Em Uso". Use o sistema de reservas.' });
        return;
     }

     const updatedItem = { ...item, status: 'emuso' as const, updated: new Date().toISOString() };
     setInventory(prev => prev.map(i => (i.id === item.id ? updatedItem : i)));
     addAuditLogEntry('update', updatedItem, `Registrou uso local do item S/N: ${updatedItem.serial}`);
     toast({ title: 'Uso Registrado', description: `O item ${updatedItem.serial} foi marcado como "Em Uso".` });
  };

  const handleReturnFromUse = (itemId: string) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const updatedItem = { ...item, status: 'funcionando' as const, updated: new Date().toISOString() };
    setInventory(prev => prev.map(i => (i.id === itemId ? updatedItem : i)));
    addAuditLogEntry('update', updatedItem, `Registrou devolução de uso local do item S/N: ${item.serial}`);
    toast({ title: 'Item Devolvido', description: `O item ${item.serial} foi registrado como devolvido.` });
  };

  const handleAddCategory = (name: string) => {
    if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: "Categoria Duplicada", description: `A categoria "${name}" já existe.`, variant: "destructive" });
        return;
    }
    const newCategory: Category = { id: uuidv4(), name };
    setCategories(prev => [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: "Categoria Adicionada", description: `A categoria "${name}" foi criada.` });
  };
  
  const handleDeleteCategory = (id: string) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;
    if (inventory.some(item => item.category === categoryToDelete.name)) {
        toast({ title: "Ação Bloqueada", description: `Você não pode excluir a categoria "${categoryToDelete.name}" porque ela está sendo usada por itens no inventário.`, variant: "destructive"});
        return;
    }
    setCategories(prev => prev.filter(c => c.id !== id));
    toast({ title: "Categoria Excluída", description: `A categoria "${categoryToDelete.name}" foi removida.` });
  };

  const handleEditCategory = (id: string, newName: string) => {
    const oldName = categories.find(c => c.id === id)?.name;
    if (categories.some(c => c.name.toLowerCase() === newName.toLowerCase() && c.id !== id)) {
        toast({ title: "Categoria Duplicada", description: `A categoria "${newName}" já existe.`, variant: "destructive" });
        return;
    }
    setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c).sort((a, b) => a.name.localeCompare(b.name)));
    setInventory(prev => prev.map(item => item.category === oldName ? { ...item, category: newName } : item));
    toast({ title: "Categoria Atualizada", description: `"${oldName}" foi renomeado para "${newName}".` });
  };

  const handleAddSector = (name: string) => {
     if (sectors.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: "Setor Duplicado", description: `O setor "${name}" já existe.`, variant: "destructive" });
        return;
    }
    const newSector: Sector = { id: uuidv4(), name };
    setSectors(prev => [...prev, newSector].sort((a, b) => a.name.localeCompare(b.name)));
    toast({ title: "Setor Adicionado", description: `O setor "${name}" foi criado.` });
  };

  const handleDeleteSector = (id: string) => {
    const sectorToDelete = sectors.find(s => s.id === id);
    if (!sectorToDelete) return;
     if (inventory.some(item => item.setor === sectorToDelete.name)) {
        toast({ title: "Ação Bloqueada", description: `Você não pode excluir o setor "${sectorToDelete.name}" porque ele está sendo usado por itens no inventário.`, variant: "destructive"});
        return;
    }
    setSectors(prev => prev.filter(s => s.id !== id));
    toast({ title: "Setor Excluído", description: `O setor "${sectorToDelete.name}" foi removido.` });
  };
  
  const handleEditSector = (id: string, newName: string) => {
    const oldName = sectors.find(s => s.id === id)?.name;
    if (sectors.some(s => s.name.toLowerCase() === newName.toLowerCase() && s.id !== id)) {
        toast({ title: "Setor Duplicado", description: `O setor "${newName}" já existe.`, variant: "destructive" });
        return;
    }
    setSectors(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s).sort((a, b) => a.name.localeCompare(b.name)));
    setInventory(prev => prev.map(item => item.setor === oldName ? { ...item, setor: newName } : item));
    toast({ title: "Setor Atualizado", description: `"${oldName}" foi renomeado para "${newName}".` });
  };

  const handleClearForm = () => {
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen">
      <Header 
        user={user} 
        campusList={initialCampusList} 
        inventory={inventory}
        activeCampus={activeCampus} 
        onCampusChange={setActiveCampus} 
      />
      <main className="container mx-auto p-0 md:p-6 lg:p-8 mt-5">
        <div className="flex justify-between items-center mb-4 px-4 md:px-0">
          <h2 className="text-2xl font-bold text-foreground">Painel de Controle</h2>
        </div>

        <SmartAlerts inventory={inventory} />

        <div className="my-6 px-4 md:px-0">
          <StatCardDeck inventory={userVisibleInventory} />
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start px-4 md:px-0">
          <div className="lg:col-span-1 flex flex-col gap-6">
            <InventoryForm
              key={editingItem ? `edit-${editingItem.id}` : `new-${categories.length}-${sectors.length}`}
              editingItem={editingItem}
              onSave={handleSaveItem}
              onClear={handleClearForm}
              user={user}
              activeCampus={activeCampus}
              categories={categories}
              sectors={sectors}
              campusList={initialCampusList}
            />
            <DashboardCharts inventory={userVisibleInventory} />
          </div>
          <div className="lg:col-span-2">
            <InventoryTabs
              inventory={inventory} // Passa o inventário completo para as estatísticas
              userVisibleInventory={userVisibleInventory} // Passa o inventário filtrado para as visualizações
              auditLog={userVisibleAuditLog}
              userVisibleLoans={userVisibleLoans}
              categories={categories}
              sectors={sectors}
              campusList={initialCampusList}
              users={initialUsers}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              onStatusChange={handleStatusChange}
              onLoan={handleLoanItems}
              onReturnLoan={handleReturnLoan}
              onRegisterUse={handleRegisterUse}
              onReturnFromUse={handleReturnFromUse}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
              onEditCategory={handleEditCategory}
              onAddSector={handleAddSector}
              onDeleteSector={handleDeleteSector}
              onEditSector={handleEditSector}
              user={user}
            />
          </div>
        </div>
      </main>

       {lendingItems.length > 0 && (
        <LoanForm
          items={lendingItems}
          onSave={handleSaveLoan}
          onClose={() => setLendingItems([])}
        />
      )}
    </div>
  );
}
