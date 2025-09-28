import { z } from 'zod';

export type User = {
  id: string | number; // Changed to allow for numeric IDs from Postgres
  username: string;
  name: string;
  role: 'admin' | 'tecnico';
  campus: string; // Para admin, isso será 'all'
  password?: string; // Adicionado para gerenciar senhas
};

export interface Campus {
    id: string | number; // Changed to allow for numeric IDs from Postgres
    name: string;
}

// ItemStatus não é uma função server action, então não causa o erro de 'use server'
export const ItemStatus = {
    funcionando: 'Funcionando',
    defeito: 'Defeito',
    manutencao: 'Em Manutenção',
    backup: 'Backup',
    descarte: 'Descarte',
    emprestado: 'Emprestado',
    emuso: 'Em Uso'
};

export type InventoryItem = {
    id: string | number; // Changed to allow for numeric IDs from Postgres
    campus: string;
    setor: string;
    sala: string;
    category: string;
    brand: string;
    serial: string;
    patrimony: string;
    status: keyof typeof ItemStatus;
    responsible: string;
    responsible_name?: string;
    obs: string;
    created: string;
    updated: string;
    isFixed: boolean;
};

export type AuditLogEntry = {
    id: string | number; // Changed to allow for numeric IDs from Postgres
    action: 'create' | 'update' | 'delete' | 'loan' | 'return';
    user: string;
    campus: string;
    timestamp: string;
    item: InventoryItem | null; // Item can be null for delete operations after it's gone
    details: string;
};

export type Loan = {
  id: string | number; // Changed to allow for numeric IDs from Postgres
  itemId: string;
  itemSerial: string;
  itemCategory: string;
  borrowerName: string;
  borrowerContact: string;
  loanDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  status: 'loaned' | 'returned';
  notes: string;
  campus: string;
  loaner: string; // User who made the loan
};

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  )
};

// Schema Zod não é uma função server action
export const DetectInventoryAnomaliesInputSchema = z.object({
  inventoryData: z.string().describe('Uma string JSON contendo os dados atuais do inventário.'),
  campus: z.string().describe('O campus a ser verificado em busca de anomalias.'),
});
export type DetectInventoryAnomaliesInput = z.infer<typeof DetectInventoryAnomaliesInputSchema>;


export type Category = {
    id: string | number; // Changed to allow for numeric IDs from Postgres
    name: string;
}

export type Sector = {
    id: string | number; // Changed to allow for numeric IDs from Postgres
    name: string;
}

// RequestStatus não é uma função server action
export const RequestStatus = {
    aberto: 'Aberto',
    'em-andamento': 'Em Andamento',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
};

export type Request = {
    id: string | number; // Changed to allow for numeric IDs from Postgres
    requesterEmail: string;
    campus: string;
    setor: string;
    sala?: string;
    details: string;
    status: keyof typeof RequestStatus;
    createdAt: string;
    updatedAt: string;
};