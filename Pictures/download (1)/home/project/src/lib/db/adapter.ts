/**
 * @fileoverview Defines the interface for the database adapter.
 * This contract ensures that any database implementation (local files, PostgreSQL, etc.)
 * exposes a consistent API to the rest of the application.
 * 
 * THIS FILE IS NO LONGER STRICTLY NECESSARY FOR THE LOCAL ADAPTER
 * but serves as a contract definition for future adapters like PostgreSQL.
 */

import type { InventoryItem, AuditLogEntry, Category, Sector, Loan, User, Campus, Request as SupportRequest } from '@/lib/types';

export interface DbAdapter {
  getInventory: () => Promise<InventoryItem[]>;
  writeInventory: (data: InventoryItem[]) => Promise<void>;

  getAuditLog: () => Promise<AuditLogEntry[]>;
  writeAuditLog: (data: AuditLogEntry[]) => Promise<void>;

  getCategories: () => Promise<Category[]>;
  writeCategories: (data: Category[]) => Promise<void>;

  getSectors: () => Promise<Sector[]>;
  writeSectors: (data: Sector[]) => Promise<void>;

  getLoans: () => Promise<Loan[]>;
  writeLoans: (data: Loan[]) => Promise<void>;

  getUsers: () => Promise<User[]>;
  writeUsers: (data: User[]) => Promise<void>;

  getCampusList: () => Promise<Campus[]>;
  writeCampusList: (data: Campus[]) => Promise<void>;

  getRequests: () => Promise<SupportRequest[]>;
  writeRequests: (data: SupportRequest[]) => Promise<void>;
}
