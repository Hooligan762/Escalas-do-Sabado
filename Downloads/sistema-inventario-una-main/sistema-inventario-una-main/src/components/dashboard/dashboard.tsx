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
import { insertCategory, insertSector, updateInventoryItem, insertInventoryItem, deleteInventoryItem, insertAuditLogEntry, deleteCategory, updateCategory, deleteSector, updateSector } from '@/lib/db';
import { useRobustServerAction } from '@/hooks/use-robust-server-action';
import { CampusInfoCard } from '@/components/dashboard/campus-info-card';

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
  const campusList = initialCampusList;
  const [user] = React.useState<User>(currentUser);
  const { toast } = useToast();

  // Estado React normal (sincronizado com banco, NÃO localStorage)
  const [inventory, setInventory] = React.useState<InventoryItem[]>(initialInventory);
  const [auditLog, setAuditLog] = React.useState<AuditLogEntry[]>(initialAuditLog);
  const [loans, setLoans] = React.useState<Loan[]>(initialLoans);
  const [categories, setCategories] = React.useState<Category[]>(initialCategories);
  const [sectors, setSectors] = React.useState<Sector[]>(initialSectors);

  const [editingItem, setEditingItem] = React.useState<InventoryItem | null>(null);
  const [lendingItems, setLendingItems] = React.useState<InventoryItem[]>([]);
  const [highlightedItemId, setHighlightedItemId] = React.useState<string | null>(null);

  // Extrair nome do campus se for objeto
  const userCampusName = typeof user.campus === 'object' ? user.campus?.name : user.campus;

  const [activeCampus, setActiveCampus] = React.useState<string>(
    user.role === 'admin' ? 'all' : (userCampusName || '')
  );
  
  // Ref para o componente de tabs
  const tabsRef = React.useRef<any>(null);

  // Função para recarregar dados do banco SEM perder a aba ativa
  const reloadDataFromServer = React.useCallback(async () => {
    try {
      console.log('🔄 Recarregando dados do servidor...');
      
      // ✅ Recarregar dados via API sem perder aba ativa
      const response = await fetch('/api/dashboard-data');
      
      if (response.ok) {
        const freshData = await response.json();
        console.log('✅ Dados frescos recebidos:', freshData);
        
        // Atualizar estados com dados frescos do PostgreSQL
        if (freshData.inventory) setInventory(freshData.inventory);
        if (freshData.categories) setCategories(freshData.categories);
        if (freshData.sectors) setSectors(freshData.sectors);
        if (freshData.loans) setLoans(freshData.loans);
        if (freshData.auditLogs) setAuditLogs(freshData.auditLogs);
        
        console.log('✅ Estados atualizados com dados do PostgreSQL');
      } else {
        console.warn('⚠️ API não disponível, fazendo reload completo...');
        window.location.reload();
      }
    } catch (error) {
      console.error('❌ Erro ao recarregar dados, fazendo reload completo:', error);
      window.location.reload();
    }
  }, []);


  const userVisibleInventory = React.useMemo(() => {
    if (activeCampus === "all") {
      return [...inventory].sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    }
    return inventory.filter((item) => item.campus === activeCampus)
                    .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
  }, [inventory, activeCampus]);
  
   const userVisibleAuditLog = React.useMemo(() => {
    console.log('🔍 [userVisibleAuditLog] Filtrando logs de auditoria...');
    console.log(`📊 [userVisibleAuditLog] Total de logs recebidos: ${auditLog.length}`);
    console.log(`🏢 [userVisibleAuditLog] Campus ativo: ${activeCampus}`);
    console.log(`👤 [userVisibleAuditLog] Usuário: ${user.name} (${user.role})`);
    
    if (auditLog.length > 0) {
      console.log('📝 [userVisibleAuditLog] Primeiros 3 logs:', auditLog.slice(0, 3).map(log => ({
        id: log.id,
        action: log.action,
        user: log.user,
        campus: log.campus,
        timestamp: log.timestamp
      })));
    }
    
    const sortedLog = [...auditLog].sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    // Para ADMIN: sempre mostrar TODOS os logs, independente do campus ativo
    if (user.role === 'admin') {
      console.log(`👑 [userVisibleAuditLog] ADMIN: Retornando TODOS os logs: ${sortedLog.length}`);
      return sortedLog;
    }
    
    // Para usuários normais: filtrar por campus
    if (activeCampus === 'all') {
      console.log(`✅ [userVisibleAuditLog] Retornando TODOS os logs: ${sortedLog.length}`);
      return sortedLog;
    }
    
    const filteredLog = sortedLog.filter(log => log.campus === activeCampus);
    console.log(`🔍 [userVisibleAuditLog] Logs filtrados para campus "${activeCampus}": ${filteredLog.length}`);
    
    return filteredLog;
  }, [auditLog, activeCampus, user]);

   const userVisibleLoans = React.useMemo(() => {
    const sortedLoans = [...loans].sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
    if (activeCampus === 'all') {
      return sortedLoans;
    }
    return sortedLoans.filter(loan => loan.campus === activeCampus);
  }, [loans, activeCampus]);

  // Hooks para salvar no banco
  const { execute: saveAuditLog } = useRobustServerAction(insertAuditLogEntry, {
    onError: (error, attempt) => {
      console.error(`Erro ao salvar auditoria (tentativa ${attempt}):`, error);
    },
    onSuccess: () => {
      console.log('✅ Auditoria salva no banco com sucesso');
    }
  });

  const { execute: saveNewItem } = useRobustServerAction(insertInventoryItem, {
    onError: (error, attempt) => {
      console.error(`Erro ao inserir item (tentativa ${attempt}):`, error);
    },
    onSuccess: () => {
      console.log('✅ Item inserido no banco com sucesso');
    }
  });

  const { execute: updateItem } = useRobustServerAction(updateInventoryItem, {
    onError: (error, attempt) => {
      console.error(`Erro ao atualizar item (tentativa ${attempt}):`, error);
    },
    onSuccess: () => {
      console.log('✅ Item atualizado no banco com sucesso');
    }
  });

  const { execute: removeItem } = useRobustServerAction(deleteInventoryItem, {
    onError: (error, attempt) => {
      console.error(`Erro ao deletar item (tentativa ${attempt}):`, error);
    },
    onSuccess: () => {
      console.log('✅ Item deletado do banco com sucesso');
    }
  });

  const addAuditLogEntry = async (action: AuditLogEntry['action'], item: InventoryItem | null, details: string) => {
    const campus = item ? item.campus : (user.campus !== 'all' ? userCampusName : 'Sistema');
    const newLog: AuditLogEntry = {
        id: uuidv4(),
        action,
        user: user.name,
        campus: campus,
        timestamp: new Date().toISOString(),
        item,
        details,
    };
    
    // Atualizar estado local
    setAuditLog(prev => [newLog, ...prev]);
    
    // Salvar no banco de dados
    try {
      await saveAuditLog({
        action,
        user: user.name,
        campus: campus,
        details,
        item
      });
    } catch (error) {
      console.error('Erro ao salvar auditoria no banco:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar auditoria',
        description: 'A alteração foi salva, mas houve problema ao registrar no log.'
      });
    }
  };

  const handleSaveItem = async (itemData: Omit<InventoryItem, 'created' | 'updated' | 'id'> & { id?: string | null }) => {
    const now = new Date().toISOString();
    const isEditing = !!itemData.id;
    let savedItem: InventoryItem;

    if (isEditing) {
        let originalItem = inventory.find(i => i.id === itemData.id);
        if (!originalItem) {
          console.error('Item original não encontrado para edição:', itemData.id);
          toast({
            variant: 'destructive',
            title: 'Erro de edição',
            description: 'Item não encontrado para edição.'
          });
          return;
        }
        
        // Garantir que temos um ID válido
        if (!itemData.id || itemData.id === null) {
          console.error('ID do item é inválido:', itemData.id);
          toast({
            variant: 'destructive',
            title: 'Erro de ID',
            description: 'ID do item é inválido para atualização.'
          });
          return;
        }
        
        savedItem = { ...originalItem, ...itemData, updated: now } as InventoryItem;
        
        // Atualizar estado local
        setInventory(prev => prev.map(i => i.id === itemData.id ? savedItem : i));
        
        // Salvar no banco
        try {
          console.log('🔧 Atualizando item no banco:', { id: itemData.id, data: itemData });
          console.log('🔧 Tentando atualizar item - ID:', itemData.id, 'Dados:', itemData);
          await updateItem(String(itemData.id), itemData);
          await addAuditLogEntry('update', savedItem, `Atualizou ${savedItem.category} S/N: ${savedItem.serial}`);
          
          // Estado já atualizado localmente
        } catch (error) {
          console.error('Erro ao atualizar item no banco:', error);
          // Reverter estado local em caso de erro
          setInventory(prev => prev.map(i => i.id === itemData.id ? originalItem : i));
          toast({
            variant: 'destructive',
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar as alterações no banco de dados.'
          });
          return;
        }
    } else {
        const existingItem = inventory.find(item => item.serial && itemData.serial && item.serial.toLowerCase() === itemData.serial.toLowerCase());
        if (existingItem) {
            toast({
                variant: 'destructive',
                title: 'Item Duplicado',
                description: `Já existe um item com o número de série "${itemData.serial}". O item está no setor ${existingItem.setor} do campus ${existingItem.campus}.`,
            });
            return;
        }

        savedItem = { ...itemData, id: uuidv4(), created: now, updated: now } as InventoryItem;
        
        // Atualizar estado local
        setInventory(prev => [savedItem, ...prev]);
        
        // Salvar no banco
        try {
          await saveNewItem(itemData);
          await addAuditLogEntry('create', savedItem, `Criou ${savedItem.category} S/N: ${savedItem.serial}`);
          
          // Estado já atualizado localmente
        } catch (error) {
          console.error('Erro ao inserir item no banco:', error);
          // Reverter estado local em caso de erro
          setInventory(prev => prev.filter(i => i.id !== savedItem.id));
          toast({
            variant: 'destructive',
            title: 'Erro ao salvar',
            description: 'Não foi possível salvar o item no banco de dados.'
          });
          return;
        }
    }
    
    toast({
        title: `Equipamento ${isEditing ? "Atualizado" : "Salvo"}`,
        description: `${savedItem.category} (S/N: ${savedItem.serial}) foi ${isEditing ? "atualizado" : "adicionado"} com sucesso.`,
    });
    handleClearForm();
  };

  const handleStatusChange = async (itemId: string | number, newStatus: keyof typeof ItemStatus) => {
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
    
    // Atualizar estado local
    setInventory(prev => prev.map(i => i.id === itemId ? updatedItem : i));
    
    // Salvar no banco
    try {
      console.log('🔧 Atualizando status do item:', { id: itemId, status: newStatus });
      await updateItem(String(itemId), { status: newStatus });
      await addAuditLogEntry('update', updatedItem, `Alterou status de "${ItemStatus[itemToUpdate.status]}" para "${ItemStatus[newStatus]}" para o item S/N: ${updatedItem.serial}`);
      
      // Estado já atualizado localmente
    } catch (error) {
      console.error('Erro ao atualizar status no banco:', error);
      // Reverter estado local em caso de erro
      setInventory(prev => prev.map(i => i.id === itemId ? itemToUpdate : i));
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar status',
        description: 'Não foi possível salvar a alteração no banco de dados.'
      });
      return;
    }
    
    toast({ title: "Status Atualizado", description: `O status do item ${updatedItem.serial} foi alterado para "${ItemStatus[newStatus]}".` });
  };

  const handleFixedChange = async (itemId: string | number, newValue: boolean) => {
    console.log('🔧 [Dashboard] handleFixedChange chamado para ID:', itemId, 'Novo valor:', newValue);
    
    const itemToUpdate = inventory.find(i => i.id === itemId);
    if (!itemToUpdate) {
      console.error('❌ [Dashboard] Item não encontrado no estado local:', itemId);
      toast({
        variant: 'destructive',
        title: 'Item não encontrado',
        description: 'O item não foi localizado na lista atual.'
      });
      return;
    }
    
    console.log('📝 [Dashboard] Item encontrado:', {
      id: itemToUpdate.id,
      serial: itemToUpdate.serial,
      isFixedAtual: itemToUpdate.isFixed,
      novoValor: newValue
    });
    
    const updatedItem = { ...itemToUpdate, isFixed: newValue, updated: new Date().toISOString() };
    
    // Atualizar estado local IMEDIATAMENTE para feedback visual
    setInventory(prev => prev.map(i => i.id === itemId ? updatedItem : i));
    
    // � SALVAMENTO HÍBRIDO - Funciona com ou sem campo is_fixed
    try {
      console.log('💾 [Dashboard] Salvando no banco (versão híbrida)...');
      console.log('🔍 [Dashboard] Dados do item:', {
        itemId: itemId,
        itemSerial: itemToUpdate.serial,
        isFixedAntigo: itemToUpdate.isFixed,
        isFixedNovo: newValue
      });
      
      // 🎯 TENTAR SALVAR NO BANCO - Agora funciona mesmo sem campo is_fixed
      await updateItem(String(itemId), { isFixed: newValue });
      console.log('✅ [Dashboard] Salvo no banco com sucesso!');
      
      // Log de auditoria
      console.log('📝 [Dashboard] Criando log de auditoria...');
      await addAuditLogEntry('update', updatedItem, `Alterou campo "Fixo" para ${newValue ? 'Sim' : 'Não'} para o item S/N: ${updatedItem.serial}`);
      console.log('✅ [Dashboard] Log de auditoria criado!');
      
      // Toast de sucesso padrão
      toast({ 
        title: "Campo Fixo Atualizado", 
        description: `O item ${updatedItem.serial} foi marcado como ${newValue ? 'fixo' : 'não fixo'}.`
      });
      
      // Estado já atualizado localmente
      
    } catch (error) {
      console.error('❌ [Dashboard] Erro ao atualizar campo fixo no banco:', error);
      console.error('🔍 [Dashboard] Detalhes do erro:', {
        itemId,
        newValue,
        error: (error as Error)?.message || 'Erro desconhecido'
      });
      
      // Reverter estado local em caso de erro
      setInventory(prev => prev.map(i => i.id === itemId ? itemToUpdate : i));
      
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar campo',
        description: 'Não foi possível salvar a alteração no banco de dados.'
      });
      return;
    }
  };

  // Função para navegar para um item específico a partir da busca
  const handleNavigateToItem = (itemId: string) => {
    console.log('🎯 Navegando para item:', itemId);
    
    // Destacar o item
    setHighlightedItemId(itemId);
    console.log('✨ Item destacado:', itemId);
    
    // Mudar para a aba de inventário se necessário
    if (tabsRef.current) {
      tabsRef.current.setActiveTab('inventory');
      console.log('📋 Mudando para aba inventário');
    }
    
    // Remover o destaque após 5 segundos
    setTimeout(() => {
      setHighlightedItemId(null);
      console.log('🔄 Removendo destaque do item:', itemId);
    }, 5000);
  };

  const handleDeleteItem = async (id: string | number, isDisposal: boolean = false) => {
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
        try {
          // Salvar audit log ANTES de remover o item
          await addAuditLogEntry('delete', { ...itemToDelete }, `Excluiu permanentemente ${itemToDelete.category} S/N: ${itemToDelete.serial}`);
          
          // ✅ DELETAR DO POSTGRESQL!
          await deleteInventoryItem(String(id));
          
          // Atualizar estado local - sem reload da página
          setInventory(prev => prev.filter((i) => i.id !== id));
          
          toast({ title: "Equipamento Excluído Permanentemente", description: `${itemToDelete.category} (S/N: ${itemToDelete.serial}) foi removido do sistema.`, variant: "destructive" });
        } catch (error: any) {
          console.error('❌ Erro ao deletar item:', error);
          toast({ 
            title: "Erro ao deletar", 
            description: error?.message || "Falha ao deletar equipamento.", 
            variant: "destructive" 
          });
        }
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
            itemId: String(item.id),
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

  const handleReturnLoan = (loanId: string | number) => {
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

  const handleReturnFromUse = (itemId: string | number) => {
    const item = inventory.find(i => i.id === itemId);
    if (!item) return;

    const updatedItem = { ...item, status: 'funcionando' as const, updated: new Date().toISOString() };
    setInventory(prev => prev.map(i => (i.id === itemId ? updatedItem : i)));
    addAuditLogEntry('update', updatedItem, `Registrou devolução de uso local do item S/N: ${item.serial}`);
    toast({ title: 'Item Devolvido', description: `O item ${item.serial} foi registrado como devolvido.` });
  };

  const handleAddCategory = async (name: string) => {
    // Determinar o campus alvo (ou o que o usuário está gerenciando)
    const targetCampus = currentUser?.role === 'admin' ? 'Administrador' : currentUser?.campus;
    // Extrair nome do campus se for objeto
    const targetCampusName = typeof targetCampus === 'object' ? targetCampus?.name : targetCampus;
    
    // 1. Verificar se já existe no MESMO campus
    const duplicateInSameCampus = categories.find(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      (c as any).campus?.name === targetCampusName
    );
    
    // 2. Verificar se existe em OUTROS campus
    const existsInOtherCampus = categories.filter(c => 
      c.name.toLowerCase() === name.toLowerCase() && 
      (c as any).campus?.name !== targetCampusName
    );
    
    console.log('🔍 Verificação de categoria:', {
      name,
      targetCampus,
      targetCampusName,
      duplicateInSameCampus: !!duplicateInSameCampus,
      existsInOtherCampus: existsInOtherCampus.length,
      otherCampusList: existsInOtherCampus.map(c => (c as any).campus?.name)
    });
    
    if (duplicateInSameCampus) {
        toast({ 
          title: "❌ Categoria Já Existe", 
          description: `A categoria "${name}" já existe no campus ${targetCampusName}. Não é possível criar duplicatas no mesmo campus.`, 
          variant: "destructive" 
        });
        return;
    }
    
    // Informar se existe em outros campus (mas permitir criar)
    if (existsInOtherCampus.length > 0) {
        const otherCampusNames = existsInOtherCampus.map(c => (c as any).campus?.name).join(', ');
        console.log(`ℹ️ Categoria "${name}" existe em outros campus: ${otherCampusNames}`);
        toast({ 
          title: "ℹ️ Informação", 
          description: `A categoria "${name}" já existe em: ${otherCampusNames}. Você pode criar aqui também!`, 
          variant: "default" 
        });
    }
    
    try {
      // SEMPRE incluir o campusId - para admin buscar ID do campus Administrador, para outros usar o campus do usuário
      let campusId: string;
      if (currentUser?.role === 'admin') {
        // Admin cria no campus Administrador - buscar o ID real
        const adminCampus = campusList.find((c: Campus) => c.name === 'Administrador');
        if (!adminCampus?.id) {
          throw new Error('Campus Administrador não encontrado');
        }
        campusId = adminCampus.id.toString();
      } else {
        const userCampus = campusList.find((c: Campus) => c.name === currentUser?.campus);
        if (!userCampus?.id) {
          throw new Error('Campus do usuário não encontrado');
        }
        campusId = userCampus.id.toString();
      }
      
      console.log('📝 Criando categoria:', { name, campusId, targetCampus, targetCampusName });
      
      const newCategory = await insertCategory({ name, campusId });
      
      console.log('✅ Categoria retornada do banco:', {
        newCategory,
        hasId: !!newCategory.id,
        hasName: !!newCategory.name,
        hasCampus: !!newCategory.campus,
        campusName: newCategory.campus?.name
      });
      
      // Atualizar estado com a nova categoria
      setCategories(prev => {
        const updated = [...prev, newCategory].sort((a, b) => a.name.localeCompare(b.name));
        console.log('📊 Estado de categorias atualizado:', {
          antes: prev.length,
          depois: updated.length,
          novaCategoria: newCategory.name,
          todasCategorias: updated.map(c => ({ name: c.name, campus: (c as any).campus?.name }))
        });
        return updated;
      });
      
      // Adicionar entrada de auditoria
      addAuditLogEntry('create', null, `Criou categoria "${name}"`);
      
      // Mensagem de sucesso com contexto
      if (existsInOtherCampus.length > 0) {
        toast({ 
          title: "✅ Categoria Criada!", 
          description: `"${name}" foi criada no campus ${targetCampusName}. Agora existe em ${existsInOtherCampus.length + 1} campus diferentes.` 
        });
      } else {
        toast({ 
          title: "✅ Categoria Criada!", 
          description: `"${name}" foi criada no campus ${targetCampusName}. Esta é a primeira vez que esta categoria é usada!` 
        });
      }
      
      // Estado já atualizado localmente nas funções
    } catch (error: any) {
      console.error('❌ Erro ao criar categoria:', {
        error: error?.message,
        name,
        targetCampus,
        userCampus: currentUser?.campus,
        userRole: currentUser?.role
      });
      toast({ 
        title: "❌ Erro ao criar categoria", 
        description: error?.message || "Falha ao criar categoria no banco de dados.", 
        variant: "destructive" 
      });
    }
  };
  
  const handleDeleteCategory = async (id: string | number) => {
    const categoryToDelete = categories.find(c => c.id === id);
    if (!categoryToDelete) return;
    
    // Verificar se há itens usando esta categoria NESTE CAMPUS
    const itemsUsingCategory = inventory.filter(item => 
      item.category === categoryToDelete.name && 
      item.campus === categoryToDelete.campus?.name
    );
    
    if (itemsUsingCategory.length > 0) {
        toast({ 
          title: "Ação Bloqueada", 
          description: `Você não pode excluir a categoria "${categoryToDelete.name}" porque ela está sendo usada por ${itemsUsingCategory.length} itens neste campus.`, 
          variant: "destructive"
        });
        return;
    }
    
    try {
      // Deletar do banco PostgreSQL
      await deleteCategory(String(id));
      
      // Atualizar estado local
      setCategories(prev => prev.filter(c => c.id !== id));
      
      // Adicionar entrada de auditoria
      addAuditLogEntry('delete', null, `Excluiu categoria "${categoryToDelete.name}"`);
      
      toast({ title: "Categoria Excluída", description: `A categoria "${categoryToDelete.name}" foi removida.` });
      
      // Estado já atualizado localmente
    } catch (error: any) {
      console.error('❌ Erro ao deletar categoria:', error);
      toast({ 
        title: "Erro ao deletar", 
        description: error?.message || "Falha ao deletar categoria.", 
        variant: "destructive" 
      });
    }
  };

  const handleEditCategory = async (id: string | number, newName: string) => {
    const oldName = categories.find(c => c.id === id)?.name;
    if (categories.some(c => c.name && newName && c.name.toLowerCase() === newName.toLowerCase() && c.id !== id)) {
        toast({ title: "Categoria Duplicada", description: `A categoria "${newName}" já existe.`, variant: "destructive" });
        return;
    }
    
    try {
      // Atualizar no banco PostgreSQL
      await updateCategory(String(id), { name: newName });
      
      // Atualizar estado local
      setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newName } : c).sort((a, b) => a.name.localeCompare(b.name)));
      setInventory(prev => prev.map(item => item.category === oldName ? { ...item, category: newName } : item));
      
      // Adicionar entrada de auditoria
      addAuditLogEntry('update', null, `Renomeou categoria "${oldName}" para "${newName}"`);
      
      toast({ title: "Categoria Atualizada", description: `"${oldName}" foi renomeado para "${newName}".` });
      
      // Estado já atualizado localmente
    } catch (error: any) {
      console.error('❌ Erro ao editar categoria:', error);
      toast({ 
        title: "Erro ao editar", 
        description: error?.message || "Falha ao editar categoria.", 
        variant: "destructive" 
      });
    }
  };

  const handleAddSector = async (name: string) => {
    // Determinar o campus alvo (ou o que o usuário está gerenciando)
    const targetCampus = currentUser?.role === 'admin' ? 'Administrador' : currentUser?.campus;
    // Extrair nome do campus se for objeto
    const targetCampusName = typeof targetCampus === 'object' ? targetCampus?.name : targetCampus;
    
    // 1. Verificar se já existe no MESMO campus
    const duplicateInSameCampus = sectors.find(s => 
      s.name.toLowerCase() === name.toLowerCase() && 
      (s as any).campus?.name === targetCampusName
    );
    
    // 2. Verificar se existe em OUTROS campus
    const existsInOtherCampus = sectors.filter(s => 
      s.name.toLowerCase() === name.toLowerCase() && 
      (s as any).campus?.name !== targetCampusName
    );
    
    console.log('🔍 Verificação de setor:', {
      name,
      targetCampus,
      targetCampusName,
      duplicateInSameCampus: !!duplicateInSameCampus,
      existsInOtherCampus: existsInOtherCampus.length,
      otherCampusList: existsInOtherCampus.map(s => (s as any).campus?.name)
    });
    
    if (duplicateInSameCampus) {
        toast({ 
          title: "❌ Setor Já Existe", 
          description: `O setor "${name}" já existe no campus ${targetCampusName}. Não é possível criar duplicatas no mesmo campus.`, 
          variant: "destructive" 
        });
        return;
    }
    
    // Informar se existe em outros campus (mas permitir criar)
    if (existsInOtherCampus.length > 0) {
        const otherCampusNames = existsInOtherCampus.map(s => (s as any).campus?.name).join(', ');
        console.log(`ℹ️ Setor "${name}" existe em outros campus: ${otherCampusNames}`);
        toast({ 
          title: "ℹ️ Informação", 
          description: `O setor "${name}" já existe em: ${otherCampusNames}. Você pode criar aqui também!`, 
          variant: "default" 
        });
    }
    
    try {
      // SEMPRE incluir o campusId - para admin buscar ID do campus Administrador, para outros usar o campus do usuário
      let campusId: string;
      if (currentUser?.role === 'admin') {
        // Admin cria no campus Administrador - buscar o ID real
        const adminCampus = campusList.find((c: Campus) => c.name === 'Administrador');
        if (!adminCampus?.id) {
          throw new Error('Campus Administrador não encontrado');
        }
        campusId = adminCampus.id.toString();
      } else {
        const userCampus = campusList.find((c: Campus) => c.name === currentUser?.campus);
        if (!userCampus?.id) {
          throw new Error('Campus do usuário não encontrado');
        }
        campusId = userCampus.id.toString();
      }
      
      console.log('📝 Criando setor:', { name, campusId, targetCampus, targetCampusName });
      
      const newSector = await insertSector({ name, campusId });
      
      console.log('✅ Setor retornado do banco:', {
        newSector,
        hasId: !!newSector.id,
        hasName: !!newSector.name,
        hasCampus: !!newSector.campus,
        campusName: newSector.campus?.name
      });
      
      // Atualizar estado com o novo setor
      setSectors(prev => {
        const updated = [...prev, newSector].sort((a, b) => a.name.localeCompare(b.name));
        console.log('📊 Estado de setores atualizado:', {
          antes: prev.length,
          depois: updated.length,
          novoSetor: newSector.name,
          todosSetores: updated.map(s => ({ name: s.name, campus: (s as any).campus?.name }))
        });
        return updated;
      });
      
      // Adicionar entrada de auditoria
      addAuditLogEntry('create', null, `Criou setor "${name}"`);
      
      // Mensagem de sucesso com contexto
      if (existsInOtherCampus.length > 0) {
        toast({ 
          title: "✅ Setor Criado!", 
          description: `"${name}" foi criado no campus ${targetCampusName}. Agora existe em ${existsInOtherCampus.length + 1} campus diferentes.` 
        });
      } else {
        toast({ 
          title: "✅ Setor Criado!", 
          description: `"${name}" foi criado no campus ${targetCampusName}. Este é o primeiro campus a usar este setor!` 
        });
      }
      
      // Estado já atualizado localmente
    } catch (error: any) {
      console.error('❌ Erro ao criar setor:', {
        error: error?.message,
        name,
        targetCampus,
        userCampus: currentUser?.campus,
        userRole: currentUser?.role
      });
      toast({ 
        title: "❌ Erro ao criar setor", 
        description: error?.message || "Falha ao criar setor no banco de dados.", 
        variant: "destructive" 
      });
    }
  };

  const handleDeleteSector = async (id: string | number) => {
    const sectorToDelete = sectors.find(s => s.id === id);
    if (!sectorToDelete) return;
    
    console.log('🗑️ [handleDeleteSector] Tentando excluir setor:', {
      id,
      name: sectorToDelete.name,
      campus: sectorToDelete.campus?.name,
      totalInventoryItems: inventory.length
    });
    
    // Verificar quais itens estão usando este setor NESTE CAMPUS
    const itemsUsingSector = inventory.filter(item => 
      item.setor === sectorToDelete.name && 
      item.campus === sectorToDelete.campus?.name
    );
    console.log('📋 [handleDeleteSector] Itens usando este setor NESTE CAMPUS:', {
      sectorName: sectorToDelete.name,
      campusName: sectorToDelete.campus?.name,
      count: itemsUsingSector.length,
      items: itemsUsingSector.map(item => ({
        id: item.id,
        serial: item.serial,
        category: item.category,
        campus: item.campus
      }))
    });
    
     if (itemsUsingSector.length > 0) {
        toast({ 
          title: "Ação Bloqueada", 
          description: `Você não pode excluir o setor "${sectorToDelete.name}" porque ele está sendo usado por ${itemsUsingSector.length} itens neste campus.`, 
          variant: "destructive"
        });
        return;
    }
    
    try {
      console.log('✅ [handleDeleteSector] Nenhum item usando o setor, prosseguindo com exclusão');
      
      // Deletar do banco PostgreSQL
      await deleteSector(String(id));
      
      // Atualizar estado local
      setSectors(prev => prev.filter(s => s.id !== id));
      
      // Adicionar entrada de auditoria
      addAuditLogEntry('delete', null, `Excluiu setor "${sectorToDelete.name}"`);
      
      toast({ title: "Setor Excluído", description: `O setor "${sectorToDelete.name}" foi removido.` });
      
      // Estado já atualizado localmente
    } catch (error: any) {
      console.error('❌ Erro ao deletar setor:', error);
      toast({ 
        title: "Erro ao deletar", 
        description: error?.message || "Falha ao deletar setor.", 
        variant: "destructive" 
      });
    }
  };
  
  const handleEditSector = async (id: string | number, newName: string) => {
    const oldName = sectors.find(s => s.id === id)?.name;
    if (sectors.some(s => s.name && newName && s.name.toLowerCase() === newName.toLowerCase() && s.id !== id)) {
        toast({ title: "Setor Duplicado", description: `O setor "${newName}" já existe.`, variant: "destructive" });
        return;
    }
    
    try {
      // Atualizar no banco PostgreSQL
      await updateSector(String(id), { name: newName });
      
      // Atualizar estado local
      setSectors(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s).sort((a, b) => a.name.localeCompare(b.name)));
      setInventory(prev => prev.map(item => item.setor === oldName ? { ...item, setor: newName } : item));
      
      // Adicionar entrada de auditoria
      addAuditLogEntry('update', null, `Renomeou setor "${oldName}" para "${newName}"`);
      
      toast({ title: "Setor Atualizado", description: `"${oldName}" foi renomeado para "${newName}".` });
      
      // Estado já atualizado localmente
    } catch (error: any) {
      console.error('❌ Erro ao editar setor:', error);
      toast({ 
        title: "Erro ao editar", 
        description: error?.message || "Falha ao editar setor.", 
        variant: "destructive" 
      });
    }
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
        onNavigateToItem={handleNavigateToItem}
      />
      <main className="container mx-auto p-0 md:p-6 lg:p-8 mt-5">
        <div className="flex justify-between items-center mb-4 px-4 md:px-0">
          <h2 className="text-2xl font-bold text-white">Painel de Controle</h2>
        </div>

        {/* Campus Info Card */}
        <div className="mb-6 px-4 md:px-0">
          <CampusInfoCard user={user} />
        </div>

        <SmartAlerts inventory={inventory} />

        <div className="my-6 px-4 md:px-0">
          <StatCardDeck inventory={userVisibleInventory} />
        </div>

        <div className="mt-6 sm:mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 items-start px-2 sm:px-4 md:px-0">
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
              onFixedChange={handleFixedChange}
              user={user}
              ref={tabsRef}
              highlightedItemId={highlightedItemId}
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
