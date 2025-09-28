/**
 * @fileoverview This is the central export for the database adapter.
 * The application should import all database functions from this file.
 *
 * To switch the database implementation (e.g., from local files to PostgreSQL),
 * you only need to change which adapter is imported and used here.
 */

import * as localDb from './local-adapter';
// import * as postgresDb from './postgres-adapter'; // Future implementation

// --- CHOOSE THE ADAPTER ---
// By importing everything from a specific adapter, we can easily switch them.
const db = localDb;
// const db = postgresDb; // To switch, uncomment this and comment out the localDb import.
// --------------------------

// Export all functions from the chosen adapter
export const getInventory = db.getInventory;
export const writeInventory = db.writeInventory;

export const getAuditLog = db.getAuditLog;
export const writeAuditLog = db.writeAuditLog;

export const getCategories = db.getCategories;
export const writeCategories = db.writeCategories;

export const getSectors = db.getSectors;
export const writeSectors = db.writeSectors;

export const getLoans = db.getLoans;
export const writeLoans = db.writeLoans;

export const getUsers = db.getUsers;
export const writeUsers = db.writeUsers;

export const getCampusList = db.getCampusList;
export const writeCampusList = db.writeCampusList;

export const getRequests = db.getRequests;
export const writeRequests = db.writeRequests;


// A generic writeData function for convenience, pointing to the correct adapter.
// This is useful for components that might write to multiple data types.
export async function writeData<T>(type: 'inventory' | 'auditLog' | 'categories' | 'sectors' | 'loans' | 'users' | 'campus' | 'requests', data: T[]): Promise<void> {
    switch (type) {
        case 'inventory':
            return db.writeInventory(data as any);
        case 'auditLog':
            return db.writeAuditLog(data as any);
        case 'categories':
            return db.writeCategories(data as any);
        case 'sectors':
            return db.writeSectors(data as any);
        case 'loans':
            return db.writeLoans(data as any);
        case 'users':
            return db.writeUsers(data as any);
        case 'campus':
            return db.writeCampusList(data as any);
        case 'requests':
            return db.writeRequests(data as any);
        default:
            // This will never be hit if the type is correct
            const exhaustiveCheck: never = type;
            return Promise.reject(new Error(`Unknown data type: ${exhaustiveCheck}`));
    }
};

export async function readData<T>(type: 'inventory' | 'auditLog' | 'categories' | 'sectors' | 'loans' | 'users' | 'campus' | 'requests'): Promise<T[]> {
     switch (type) {
        case 'inventory':
            return db.getInventory() as Promise<T[]>;
        case 'auditLog':
            return db.getAuditLog() as Promise<T[]>;
        case 'categories':
            return db.getCategories() as Promise<T[]>;
        case 'sectors':
            return db.getSectors() as Promise<T[]>;
        case 'loans':
            return db.getLoans() as Promise<T[]>;
        case 'users':
            return db.getUsers() as Promise<T[]>;
        case 'campus':
            return db.getCampusList() as Promise<T[]>;
        case 'requests':
            return db.getRequests() as Promise<T[]>;
        default:
            const exhaustiveCheck: never = type;
            return Promise.reject(new Error(`Unknown data type: ${exhaustiveCheck}`));
    }
}
