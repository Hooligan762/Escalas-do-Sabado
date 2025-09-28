import { z } from 'zod';

export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'tecnico';
  campus: string; // Para admin, isso será 'all'
}

export interface Campus {
    id: string;
    name: string;
}

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
    id: string;
    campus: string;
    setor: string;
    sala: string;
    category: string;
    brand: string;
    serial: string;
    patrimony: string;
    status: keyof typeof ItemStatus;
    responsible: string;
    obs: string;
    created: string;
    updated: string;
    isFixed: boolean; // Novo campo
};

export type AuditLogEntry = {
    id: string;
    action: 'create' | 'update' | 'delete' | 'loan' | 'return';
    user: string;
    campus: string;
    timestamp: string;
    item: InventoryItem | null; // Item can be null for delete operations after it's gone
    details: string;
};

export type Loan = {
  id: string;
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

export const DetectInventoryAnomaliesInputSchema = z.object({
  inventoryData: z.string().describe('Uma string JSON contendo os dados atuais do inventário.'),
  campus: z.string().describe('O campus a ser verificado em busca de anomalias.'),
});
export type DetectInventoryAnomaliesInput = z.infer<typeof DetectInventoryAnomaliesInputSchema>;


export type Category = {
    id: string;
    name: string;
}

export type Sector = {
    id: string;
    name: string;
}
