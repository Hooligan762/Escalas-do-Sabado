"use client";

import * as React from "react";
import { v4 as uuidv4 } from "uuid";
import Header from "@/components/dashboard/header";
import StatCardDeck from "@/components/dashboard/stat-card-deck";
import InventoryForm from "@/components/dashboard/inventory-form";
import DashboardCharts from "@/components/dashboard/dashboard-charts";
import InventoryTabs, { InventoryTabsHandle } from "@/components/dashboard/inventory-tabs";
import LoanForm from "@/components/dashboard/loan-form";
import SmartAlerts from "@/components/dashboard/smart-alerts";
import { useToast } from "@/hooks/use-toast";
import type { User, InventoryItem, AuditLogEntry, Loan, Category, Sector, Campus } from "@/lib/types";
import { ItemStatus } from "@/lib/types";
import { 
  writeData, 
  insertLoan as insertLoanServer, 
  returnLoan as returnLoanServer, 
  updateInventoryStatus as updateInventoryStatusServer, 
  insertAuditLogEntry as insertAuditLogServer,
  insertInventoryItem,
  updateInventoryItem,
  insertCategory,
  updateCategory,
  deleteCategory,
  insertAuditLogEntry,
  insertSector,
  updateSector,
  deleteSector,
  deleteInventoryItem
} from '@/lib/db';

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
  
  // Debug do usuário
  React.useEffect(() => {
    console.log('🔍 Dashboard - Dados do usuário logado:');
    console.log('   - ID:', currentUser.id);
    console.log('   - Nome:', currentUser.name);
    console.log('   - Username:', currentUser.username);
    console.log('   - Role:', currentUser.role);
    console.log('   - Campus:', currentUser.campus);
    console.log('   - Password definida:', !!currentUser.password);
  }, [currentUser]);

  const [inventory, setInventory] = React.useState<InventoryItem[]>(initialInventory);
  const [auditLog, setAuditLog] = React.useState<AuditLogEntry[]>(initialAuditLog);
  const [loans, setLoans] = React.useState<Loan[]>(initialLoans);
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [sectors, setSectors] = React.useState<Sector[]>(initialSectors);

  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [lendingItems, setLendingItems] = React.useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const tabsRef = React.useRef<InventoryTabsHandle | null>(null);
  
  const [activeCampus, setActiveCampus] = React.useState<string>(
    user.role === 'admin' ? 'all' : user.campus
  );
  
  // As funções individuais agora usam diretamente as APIs do PostgreSQL

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
    console.log('Calculating userVisibleLoans with', loans.length, 'total loans, activeCampus:', activeCampus);
    const sortedLoans = [...loans].sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
    
    if (activeCampus === 'all') {
      console.log('Returning all loans (sorted):', sortedLoans.length);
      return sortedLoans;
    }
    
    const filteredLoans = sortedLoans.filter(loan => loan.campus === activeCampus);
    console.log('Filtered loans by campus:', filteredLoans.length);
    return filteredLoans;
  }, [loans, activeCampus]);

  const addAuditLogEntry = (action: AuditLogEntry['action'], item: InventoryItem | null, details: string) => {
    const campus = item ? item.campus : (user.campus !== 'all' ? user.campus : 'Sistema');
    const newLog: AuditLogEntry = {
        id: uuidv4(),
        action,
        user: user.name,
        campus: campus,
        timestamp: new Date().toISOString(),
        item: JSON.parse(JSON.stringify(item)), // Deep copy to preserve state at time of logging
        details,
    };
    setAuditLog(prev => [newLog, ...prev]);
  };

  const handleSaveItem = async (itemData: Omit<InventoryItem, 'created' | 'updated' | 'id'> & { id?: string | number | null }) => {
    console.log('💾 handleSaveItem - Iniciando salvamento:', itemData);
    
    let savedItem: InventoryItem | null = null;
    
    try {
      setIsLoading(true);
      const isEditing = !!itemData.id;

      console.log('💾 handleSaveItem - Modo de operação:', isEditing ? 'Editando' : 'Criando novo');

      if (isEditing && itemData.id) {
          console.log('✏️ handleSaveItem - Atualizando item existente:', itemData.id);
          
          // Verificar se o item existe
          const existingItem = inventory.find(i => i.id === itemData.id);
          if (!existingItem) {
            console.error('❌ handleSaveItem - Item não encontrado:', itemData.id);
            toast({
              variant: 'destructive',
              title: 'Erro',
              description: 'Item não encontrado para edição.',
            });
            return;
          }
          
          // Atualizar usando a função do PostgreSQL com retry
          const itemId = String(itemData.id);
          const itemDataForUpdate: Partial<InventoryItem> = {
            campus: itemData.campus,
            setor: itemData.setor,
            sala: itemData.sala,
            category: itemData.category,
            brand: itemData.brand,
            serial: itemData.serial,
            patrimony: itemData.patrimony,
            status: itemData.status,
            responsible: itemData.responsible,
            obs: itemData.obs,
            isFixed: itemData.isFixed
          };
          
          // Implementar retry manual para server actions
          let attempt = 0;
          const maxAttempts = 3;
          
          while (attempt < maxAttempts) {
            attempt++;
            try {
              console.log(`🔄 handleSaveItem - Tentativa ${attempt}/${maxAttempts} de atualização`);
              savedItem = await updateInventoryItem(itemId, itemDataForUpdate);
              console.log('✅ handleSaveItem - Item atualizado com sucesso:', savedItem);
              break;
            } catch (error) {
              console.warn(`⚠️ handleSaveItem - Tentativa ${attempt} falhou:`, error);
              
              if (attempt === maxAttempts) {
                throw error; // Re-throw no última tentativa
              }
              
              // Aguardar antes da próxima tentativa (especialmente útil para erros de extensão)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
          
          // Verificar se savedItem foi atribuído
          if (!savedItem) {
            throw new Error('Falha ao salvar o item - savedItem é nulo');
          }
          
          // Atualizar o estado local
          setInventory(prev => prev.map(i => i.id === itemData.id ? savedItem! : i));
          
          // Adicionar entrada de auditoria com retry
          attempt = 0;
          while (attempt < maxAttempts) {
            attempt++;
            try {
              console.log(`🔄 handleSaveItem - Tentativa ${attempt}/${maxAttempts} de auditoria`);
              await insertAuditLogEntry({
                action: 'update',
                user: user.name,
                campus: savedItem!.campus,
                details: `Atualizou ${savedItem!.category} S/N: ${savedItem!.serial}`,
                item: savedItem!
              });
              console.log('✅ handleSaveItem - Auditoria registrada com sucesso');
              break;
            } catch (error) {
              console.warn(`⚠️ handleSaveItem - Tentativa ${attempt} de auditoria falhou:`, error);
              if (attempt === maxAttempts) {
                console.error('❌ handleSaveItem - Falha na auditoria, mas item foi salvo');
                // Não quebrar o fluxo se apenas a auditoria falhar
              } else {
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
              }
            }
          }
          
          toast({
            title: 'Equipamento Atualizado',
            description: `${savedItem!.category} (S/N: ${savedItem!.serial}) foi atualizado com sucesso.`,
          });
      } else {
          console.log('➕ handleSaveItem - Criando novo item:', itemData);
          
          // Verificar se já existe um item com o mesmo número de série
          const existingItems = inventory.filter(item => item.serial.toLowerCase() === itemData.serial.toLowerCase());
          if (existingItems.length > 0) {
            const existingItem = existingItems[0];
            console.log('❌ handleSaveItem - Item duplicado encontrado:', existingItem);
            toast({
              variant: 'destructive',
              title: 'Item Duplicado',
              description: `Já existe um item com o número de série "${itemData.serial}". O item está no setor ${existingItem.setor} do campus ${existingItem.campus}.`,
            });
            return;
          }
          
          // Adicionar usando a função do PostgreSQL com retry
          let attempt = 0;
          const maxAttempts = 3;
          
          while (attempt < maxAttempts) {
            attempt++;
            try {
              console.log(`🔄 handleSaveItem - Tentativa ${attempt}/${maxAttempts} de criação`);
              savedItem = await insertInventoryItem(itemData);
              console.log('✅ handleSaveItem - Item criado com sucesso:', savedItem);
              break;
            } catch (error) {
              console.warn(`⚠️ handleSaveItem - Tentativa ${attempt} de criação falhou:`, error);
              
              if (attempt === maxAttempts) {
                throw error; // Re-throw na última tentativa
              }
              
              // Aguardar antes da próxima tentativa
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
          
          // Verificar se savedItem foi atribuído
          if (!savedItem) {
            throw new Error('Falha ao criar o item - savedItem é nulo');
          }
          
          // Atualizar o estado local
          setInventory(prev => [savedItem!, ...prev]);
          
          // Adicionar entrada de auditoria com retry
          attempt = 0;
          while (attempt < maxAttempts) {
            attempt++;
            try {
              console.log(`🔄 handleSaveItem - Tentativa ${attempt}/${maxAttempts} de auditoria (criação)`);
              await insertAuditLogEntry({
                action: 'create',
                user: user.name,
                campus: savedItem!.campus,
                details: `Criou ${savedItem!.category} S/N: ${savedItem!.serial}`,
                item: savedItem!
              });
              console.log('✅ handleSaveItem - Auditoria de criação registrada com sucesso');
              break;
            } catch (error) {
              console.warn(`⚠️ handleSaveItem - Tentativa ${attempt} de auditoria (criação) falhou:`, error);
              if (attempt === maxAttempts) {
                console.error('❌ handleSaveItem - Falha na auditoria, mas item foi criado');
                // Não quebrar o fluxo se apenas a auditoria falhar
              } else {
                await new Promise(resolve => setTimeout(resolve, 500 * attempt));
              }
            }
          }
          
          toast({
            title: 'Equipamento Salvo',
            description: `${savedItem!.category} (S/N: ${savedItem!.serial}) foi adicionado com sucesso.`,
          });
      }
      
      console.log('✅ handleSaveItem - Salvamento concluído com sucesso');
      handleClearForm();
    } catch (error) {
      console.error('❌ handleSaveItem - Erro final ao salvar item:', error);
      
      // Verificar se é um erro de extensão para dar uma mensagem mais amigável
      const isExtensionError = error instanceof Error && (
        error.message.includes('Failed to fetch') ||
        error.message.includes('chrome-extension') ||
        error.stack?.includes('chrome-extension')
      );
      
      let errorMessage = 'Ocorreu um erro desconhecido.';
      if (isExtensionError) {
        errorMessage = 'Erro causado por extensão do browser. Tente novamente ou desative extensões temporariamente.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (itemId: string | number, newStatus: keyof typeof ItemStatus) => {
    try {
      setIsLoading(true);
      
      const itemToUpdate = inventory.find(i => i.id === itemId);
      if (!itemToUpdate || itemToUpdate.status === newStatus) return;
      
      if ((itemToUpdate.status === 'emprestado' || itemToUpdate.status === 'emuso') && newStatus !== 'funcionando') {
         toast({ variant: 'destructive', title: 'Ação Inválida', description: 'Primeiro registre a devolução do item antes de alterar para outro status.' });
         return;
      }
      if (newStatus === 'emprestado' || newStatus === 'emuso') {
          toast({ variant: 'destructive', title: 'Ação Inválida', description: `Para marcar um item como "${ItemStatus[newStatus]}", use a ação apropriada no menu de itens.` });
          return;
      }

      // Usar a função do PostgreSQL para atualizar o status
      await updateInventoryStatusServer(String(itemId), newStatus);
      
      const updatedItem = { ...itemToUpdate, status: newStatus, updated: new Date().toISOString() };
      
      // Atualizar o estado local
      setInventory(prev => prev.map(i => i.id === itemId ? updatedItem : i));
      
      // Registrar no log de auditoria
      await insertAuditLogEntry({
        action: 'update',
        user: user.name,
        campus: itemToUpdate.campus,
        details: `Alterou status de "${ItemStatus[itemToUpdate.status]}" para "${ItemStatus[newStatus]}" para o item S/N: ${updatedItem.serial}`,
        item: updatedItem
      });
      
      toast({ title: "Status Atualizado", description: `O status do item ${updatedItem.serial} foi alterado para "${ItemStatus[newStatus]}".` });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Atualizar Status', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (id: string | number, isPermanent: boolean = false) => {
    try {
      const itemToDelete = inventory.find((i) => i.id === id);
      if (!itemToDelete) return;
      
      if (isPermanent) {
        if (!window.confirm(`Tem certeza que deseja excluir PERMANENTEMENTE o item ${itemToDelete.serial}? Esta ação não pode ser desfeita e remove o item do banco de dados.`)) return;
        
        setIsLoading(true);
        
        // Usar a função do PostgreSQL para excluir o item
        await deleteInventoryItem(String(id));
        
        // Atualizar o estado local
        setInventory(prev => prev.filter((i) => i.id !== id));
        
        // Adicionar entrada de auditoria
        await insertAuditLogEntry({
          action: 'delete',
          user: user.name,
          campus: itemToDelete.campus,
          details: `Excluiu permanentemente ${itemToDelete.category} S/N: ${itemToDelete.serial}`,
          item: null
        });
        
        toast({ title: "Equipamento Excluído Permanentemente", description: `${itemToDelete.category} (S/N: ${itemToDelete.serial}) foi removido do sistema.`, variant: "destructive" });
      } else {
        await handleStatusChange(id, 'descarte');
      }
    } catch (error) {
      console.error('Erro ao excluir item:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Excluir Item', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      if (isPermanent) setIsLoading(false);
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
    const expectedReturnISO = (loanDetails as any)?.expectedReturnDate instanceof Date
      ? ((loanDetails as any).expectedReturnDate as Date).toISOString()
      : (loanDetails as any)?.expectedReturnDate
        ? String((loanDetails as any).expectedReturnDate)
        : '';

    // Create a single function to handle all loans in sequence
    const handleLoanCreation = async () => {
      console.log('Starting loan creation process for', loanedItems.length, 'items');
      const createdLoans: Loan[] = [];
      
      for (const item of loanedItems) {
        const loanToInsert: Omit<Loan, 'id'> = {
          ...loanDetails,
          itemId: String(item.id),
          itemSerial: item.serial,
          itemCategory: item.category,
          loanDate: now,
          expectedReturnDate: expectedReturnISO,
          status: 'loaned',  // LoanTable está esperando este valor exato ('loaned'), não 'emprestado'
          campus: item.campus,
          actualReturnDate: null,
          loaner: user.name,
          notes: (loanDetails as any)?.notes || ''
        } as any;
        
        console.log('Creating loan with data:', loanToInsert);
        
        try {
          console.log('Calling insertLoanServer...');
          const created = await insertLoanServer(loanToInsert);
          console.log('insertLoanServer returned:', created);
          
          if (created) {
            console.log('Adding loan to created list with ID:', created.id);
            createdLoans.push({ ...created });
            
            await updateInventoryStatusServer(String(item.id), 'emprestado');
            await insertAuditLogServer({ 
              action: 'loan', 
              user: user.name, 
              campus: item.campus, 
              item: { ...item, status: 'emprestado' }, 
              details: `Emprestou ${item.category} S/N: ${item.serial} para ${loanToInsert.borrowerName}` 
            });
            
            // Update the inventory state immediately for UI feedback
            const updatedItem = { ...item, status: 'emprestado' as const, updated: now };
            setInventory(prev => prev.map(i => i.id === item.id ? updatedItem : i));
            addAuditLogEntry('loan', updatedItem, `Emprestou ${item.category} S/N: ${item.serial} para ${loanToInsert.borrowerName}`);
          } else {
            console.error('insertLoanServer returned null or undefined');
          }
        } catch (e) {
          console.error('Falha ao persistir empréstimo no servidor:', e);
        }
      }
      
      // Update the loans state once at the end with all created loans
      if (createdLoans.length > 0) {
        console.log('Adding all created loans to state:', createdLoans.length);
        setLoans(prev => {
          const updated = [...createdLoans, ...prev];
          console.log('New loans state has', updated.length, 'items');
          return updated;
        });
      }
      
      toast({ title: `Item(s) Emprestado(s)`, description: `${loanedItems.length} item(ns) foram emprestados para ${loanDetails.borrowerName}.` });
      
      // Ensure campus filter matches the loaned items so they appear immediately
      if (loanedItems.length > 0) {
        setActiveCampus(loanedItems[0].campus);
      }
      
      // Switch to Loans tab after successful save
      tabsRef.current?.setTab('loans');
      
      // Clear the lending items state at the end
      setLendingItems([]);
    };
    
    // Start the loan creation process
    handleLoanCreation();
  };

  const handleReturnLoan = (loanId: string | number) => {
    const loanToReturn = loans.find(l => l.id === loanId);
    if (!loanToReturn) return;

    const now = new Date().toISOString();
    const updatedLoan = { ...loanToReturn, status: 'returned' as const, actualReturnDate: now };
    setLoans(prev => prev.map(l => l.id === loanId ? updatedLoan : l));
    (async () => {
      try {
        await returnLoanServer(String(loanId), now);
      } catch (e) {
        console.error('Falha ao persistir devolução no servidor:', e);
      }
    })();

    let itemToUpdate = inventory.find(i => i.id === loanToReturn.itemId);
    if (itemToUpdate) {
        const updatedItem = { ...itemToUpdate, status: 'funcionando' as const, updated: now };
        setInventory(prev => prev.map(i => i.id === itemToUpdate!.id ? updatedItem : i));
        addAuditLogEntry('return', updatedItem, `Devolvido ${updatedItem.category} S/N: ${updatedItem.serial} por ${loanToReturn.borrowerName}`);
        (async () => {
          try {
            await updateInventoryStatusServer(String(itemToUpdate.id), 'funcionando');
            await insertAuditLogServer({ action: 'return', user: user.name, campus: updatedItem.campus, item: updatedItem, details: `Devolvido ${updatedItem.category} S/N: ${updatedItem.serial} por ${loanToReturn.borrowerName}` });
          } catch (e) {
            console.error('Falha ao persistir atualização/devolução no servidor:', e);
          }
        })();
    } else {
        addAuditLogEntry('return', null, `Devolvido item (S/N: ${loanToReturn.itemSerial}) que não está mais no inventário.`);
    }

    toast({ title: "Equipamento Devolvido", description: `O item ${loanToReturn.itemSerial} foi registrado como devolvido.` });
  };

  const handleRegisterUse = async (item: InventoryItem) => {
    try {
      setIsLoading(true);
      
      if (item.status !== 'funcionando' && item.status !== 'backup') {
        toast({ variant: 'destructive', title: 'Ação Inválida', description: 'Apenas itens "Funcionando" ou "Backup" podem ser marcados como em uso.' });
        return;
      };
      if (item.isFixed) {
        toast({ variant: 'destructive', title: 'Ação Inválida', description: 'Equipamentos fixos não podem ser marcados como "Em Uso".' });
        return;
      }

      // Usar a função do PostgreSQL para atualizar o status
      await updateInventoryStatusServer(String(item.id), 'emuso');
      
      const updatedItem = { ...item, status: 'emuso' as const, updated: new Date().toISOString() };
      
      // Atualizar o estado local
      setInventory(prev => prev.map(i => (i.id === item.id ? updatedItem : i)));
      
      // Registrar no log de auditoria
      await insertAuditLogEntry({
        action: 'update',
        user: user.name,
        campus: item.campus,
        details: `Registrou uso local do item S/N: ${updatedItem.serial}`,
        item: updatedItem
      });
      
      toast({ title: 'Uso Registrado', description: `O item ${updatedItem.serial} foi marcado como "Em Uso".` });
    } catch (error) {
      console.error('Erro ao registrar uso:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Registrar Uso', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReturnFromUse = async (itemId: string | number) => {
    try {
      setIsLoading(true);
      
      const item = inventory.find(i => i.id === itemId);
      if (!item) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Item não encontrado.' });
        return;
      }

      // Usar a função do PostgreSQL para atualizar o status
      await updateInventoryStatusServer(String(itemId), 'funcionando');
      
      const updatedItem = { ...item, status: 'funcionando' as const, updated: new Date().toISOString() };
      
      // Atualizar o estado local
      setInventory(prev => prev.map(i => (i.id === itemId ? updatedItem : i)));
      
      // Registrar no log de auditoria
      await insertAuditLogEntry({
        action: 'update',
        user: user.name,
        campus: item.campus,
        details: `Registrou devolução de uso local do item S/N: ${item.serial}`,
        item: updatedItem
      });
      
      toast({ title: 'Item Devolvido', description: `O item ${item.serial} foi registrado como devolvido.` });
    } catch (error) {
      console.error('Erro ao registrar devolução:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Registrar Devolução', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async (name: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Iniciando adição de categoria:', name);
      
      if (categories.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: "Categoria Duplicada", description: `A categoria "${name}" já existe.`, variant: "destructive" });
        return;
      }
      
      console.log('🔄 Chamando insertCategory...');
      // Usar a função do PostgreSQL para inserir categoria
      const newCategory = await insertCategory({ name });
      console.log('✅ Categoria inserida:', newCategory);
      
      // Atualizar o estado local
      setCategories(prev => {
        const updated = [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name));
        console.log('📋 Estado de categorias atualizado:', updated);
        return updated;
      });
      
      toast({ title: "Categoria Adicionada", description: `A categoria "${name}" foi criada.` });
    } catch (error) {
      console.error('❌ Erro ao adicionar categoria:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Adicionar Categoria', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeleteCategory = async (id: string | number) => {
    try {
      setIsLoading(true);
      
      const categoryToDelete = categories.find(c => c.id === id);
      if (!categoryToDelete) return;
      
      if (inventory.some(item => item.category === categoryToDelete.name)) {
        toast({ title: "Ação Bloqueada", description: `Você não pode excluir a categoria "${categoryToDelete.name}" porque ela está sendo usada por itens no inventário.`, variant: "destructive"});
        return;
      }
      
      // Usar a função do PostgreSQL para excluir categoria
      await deleteCategory(String(id));
      
      // Atualizar o estado local
      setCategories(prev => prev.filter(c => c.id !== id));
      
      toast({ title: "Categoria Excluída", description: `A categoria "${categoryToDelete.name}" foi removida.` });
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Excluir Categoria', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async (id: string | number, newName: string) => {
    try {
      setIsLoading(true);
      
      const oldCategory = categories.find(c => c.id === id);
      if (!oldCategory) return;
      const oldName = oldCategory.name;

      if (categories.some(c => c.name.toLowerCase() === newName.toLowerCase() && c.id !== id)) {
          toast({ title: "Categoria Duplicada", description: `A categoria "${newName}" já existe.`, variant: "destructive" });
          return;
      }

      // Usar a função do PostgreSQL para atualizar categoria
      const updatedCategory = await updateCategory(String(id), { name: newName });
      
      // Atualizar o estado local
      setCategories(prev => {
        return prev.map(c => c.id === id ? updatedCategory : c)
                   .sort((a, b) => a.name.localeCompare(b.name));
      });
      
      // Atualizar todos os itens que usam essa categoria
      setInventory(prev => {
        const newInventory = prev.map(item => item.category === oldName ? { ...item, category: newName } : item);
        return newInventory;
      });
      
      toast({ title: "Categoria Atualizada", description: `A categoria "${oldName}" foi renomeada para "${newName}".` });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Atualizar Categoria', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSector = async (name: string) => {
    try {
      setIsLoading(true);
      console.log('🔄 Iniciando adição de setor:', name);
      
      if (sectors.some(s => s.name.toLowerCase() === name.toLowerCase())) {
        toast({ title: "Setor Duplicado", description: `O setor "${name}" já existe.`, variant: "destructive" });
        return;
      }
      
      console.log('🔄 Chamando insertSector...');
      // Usar a função do PostgreSQL para inserir setor
      const newSector = await insertSector({ name });
      console.log('✅ Setor inserido:', newSector);
      
      // Atualizar o estado local
      setSectors(prev => {
        const updated = [...prev, newSector].sort((a, b) => a.name.localeCompare(b.name));
        console.log('📋 Estado de setores atualizado:', updated);
        return updated;
      });
      
      toast({ title: "Setor Adicionado", description: `O setor "${name}" foi criado.` });
    } catch (error) {
      console.error('❌ Erro ao adicionar setor:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Adicionar Setor', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSector = async (id: string | number) => {
    try {
      setIsLoading(true);
      
      const sectorToDelete = sectors.find(s => s.id === id);
      if (!sectorToDelete) return;
      
      if (inventory.some(item => item.setor === sectorToDelete.name)) {
        toast({ title: "Ação Bloqueada", description: `Você não pode excluir o setor "${sectorToDelete.name}" porque ele está sendo usado por itens no inventário.`, variant: "destructive"});
        return;
      }
      
      // Usar a função do PostgreSQL para excluir setor
      await deleteSector(String(id));
      
      // Atualizar o estado local
      setSectors(prev => prev.filter(s => s.id !== id));
      
      toast({ title: "Setor Excluído", description: `O setor "${sectorToDelete.name}" foi removido.` });
    } catch (error) {
      console.error('Erro ao excluir setor:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Excluir Setor', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleEditSector = async (id: string | number, newName: string) => {
    try {
      setIsLoading(true);
      
      const oldSector = sectors.find(s => s.id === id);
      if (!oldSector) return;
      const oldName = oldSector.name;

      if (sectors.some(s => s.name.toLowerCase() === newName.toLowerCase() && s.id !== id)) {
        toast({ title: "Setor Duplicado", description: `O setor "${newName}" já existe.`, variant: "destructive" });
        return;
      }
      
      // Usar a função do PostgreSQL para atualizar setor
      const updatedSector = await updateSector(String(id), { name: newName });
      
      // Atualizar o estado local dos setores
      setSectors(prev => {
        return prev.map(s => s.id === id ? updatedSector : s)
                  .sort((a, b) => a.name.localeCompare(b.name));
      });
      
      // Atualizar todos os itens que usam esse setor
      setInventory(prev => {
        const newInventory = prev.map(item => item.setor === oldName ? { ...item, setor: newName } : item);
        return newInventory;
      });
      
      toast({ title: "Setor Atualizado", description: `"${oldName}" foi renomeado para "${newName}".` });
    } catch (error) {
      console.error('Erro ao atualizar setor:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Erro ao Atualizar Setor', 
        description: error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearForm = () => {
    setEditingItem(null);
  };

  return (
    <div className="min-h-screen pb-8">
      <Header 
        user={user} 
        campusList={initialCampusList} 
        inventory={inventory}
        activeCampus={activeCampus} 
        onCampusChange={setActiveCampus} 
      />
      <main className="container mx-auto p-0 md:p-6 lg:p-8 mt-5 pb-20">
        <div className="flex justify-between items-center mb-4 px-4 md:px-0">
          <h2 className="text-2xl font-bold text-foreground">Painel de Controle</h2>
        </div>

        <SmartAlerts inventory={userVisibleInventory} />

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
              ref={tabsRef}
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