'use server';

/**
 * @fileoverview This is the central export for the database adapter.
 * The application should import all database functions from this file.
 *
 * To switch the database implementation (e.g., from local files to PostgreSQL),
 * you only need to change which adapter is imported and used here.
 */

// --- CHOOSE THE ADAPTER ---
// To switch to a local file-based system, comment out the postgres-adapter and uncomment the local-adapter.
import * as db from './postgres-adapter';
// import * as db from './local-adapter';
// --------------------------

// Import secure query functions
import { 
  executeSecureQuery, 
  executeSecureMutation, 
  secureSelect,
  buildSecureWhereClause,
  secureInsert,
  secureUpdate,
  secureDelete
} from './secure-queries';

// Export secure query functions
export {
  executeSecureQuery,
  executeSecureMutation,
  secureSelect,
  buildSecureWhereClause,
  secureInsert,
  secureUpdate,
  secureDelete
};

// Export all getter functions from the chosen adapter - usando funções wrapper assíncronas
// para satisfazer a exigência de que arquivos com 'use server' só podem exportar funções assíncronas
export async function getInventory(...args: Parameters<typeof db.getInventory>) {
  return db.getInventory(...args);
}
export async function getAuditLog(...args: Parameters<typeof db.getAuditLog>) {
  return db.getAuditLog(...args);
}
export async function getCategories(...args: Parameters<typeof db.getCategories>) {
  return db.getCategories(...args);
}
export async function getSectors(...args: Parameters<typeof db.getSectors>) {
  return db.getSectors(...args);
}
export async function getLoans(...args: Parameters<typeof db.getLoans>) {
  return db.getLoans(...args);
}
export async function getUsers(...args: Parameters<typeof db.getUsers>) {
  return db.getUsers(...args);
}
export async function getCampusList(...args: Parameters<typeof db.getCampusList>) {
  return db.getCampusList(...args);
}
export async function getRequests(...args: Parameters<typeof db.getRequests>) {
  return db.getRequests(...args);
}

// Export all mutation functions from the chosen adapter - usando funções wrapper assíncronas
// para satisfazer a exigência de que arquivos com 'use server' só podem exportar funções assíncronas

export async function insertInventoryItem(...args: Parameters<typeof db.insertInventoryItem>) {
  return db.insertInventoryItem(...args);
}
export async function updateInventoryItem(...args: Parameters<typeof db.updateInventoryItem>) {
  return db.updateInventoryItem(...args);
}
export async function deleteInventoryItem(...args: Parameters<typeof db.deleteInventoryItem>) {
  return db.deleteInventoryItem(...args);
}
export async function insertLoan(...args: Parameters<typeof db.insertLoan>) {
  return db.insertLoan(...args);
}
export async function returnLoan(...args: Parameters<typeof db.returnLoan>) {
  return db.returnLoan(...args);
}
export async function insertAuditLogEntry(...args: Parameters<typeof db.insertAuditLogEntry>) {
  return db.insertAuditLogEntry(...args);
}
export async function insertCategory(...args: Parameters<typeof db.insertCategory>) {
  return db.insertCategory(...args);
}
export async function updateCategory(...args: Parameters<typeof db.updateCategory>) {
  return db.updateCategory(...args);
}
export async function deleteCategory(...args: Parameters<typeof db.deleteCategory>) {
  return db.deleteCategory(...args);
}
export async function insertSector(...args: Parameters<typeof db.insertSector>) {
  return db.insertSector(...args);
}
export async function updateSector(...args: Parameters<typeof db.updateSector>) {
  return db.updateSector(...args);
}
export async function deleteSector(...args: Parameters<typeof db.deleteSector>) {
  return db.deleteSector(...args);
}
export async function insertUser(...args: Parameters<typeof db.insertUser>) {
  return db.insertUser(...args);
}
export async function updateUser(...args: Parameters<typeof db.updateUser>) {
  return db.updateUser(...args);
}
export async function deleteUser(...args: Parameters<typeof db.deleteUser>) {
  return db.deleteUser(...args);
}
export async function insertCampus(...args: Parameters<typeof db.insertCampus>) {
  return db.insertCampus(...args);
}
export async function updateCampus(...args: Parameters<typeof db.updateCampus>) {
  return db.updateCampus(...args);
}
export async function deleteCampus(...args: Parameters<typeof db.deleteCampus>) {
  return db.deleteCampus(...args);
}
export async function updateInventoryForCampusRename(...args: Parameters<typeof db.updateInventoryForCampusRename>) {
  return db.updateInventoryForCampusRename(...args);
}
export async function updateRequestStatus(...args: Parameters<typeof db.updateRequestStatus>) {
  return db.updateRequestStatus(...args);
}
export async function updateInventoryStatus(...args: Parameters<typeof db.updateInventoryStatus>) {
  return db.updateInventoryStatus(...args);
}

// Temporary compatibility layer for legacy writeData calls used by client components
// Routes to the appropriate Postgres batch write function.
export async function writeData(key: string, _data: unknown): Promise<void> {
	// Legacy no-op shim: dashboard still calls writeData from the old local storage flow.
	// In the Postgres-backed app, those screens should call explicit server mutations instead.
	console.warn(`[db.writeData] Legacy call ignored for key="${key}". Use explicit adapter functions instead.`);
}
