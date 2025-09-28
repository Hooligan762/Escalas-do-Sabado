'use server';

import fs from 'fs/promises';
import path from 'path';
import type { InventoryItem, AuditLogEntry, Category, Sector, Loan } from './types';

// Define the path to the data directory
const dataPath = path.join(process.cwd(), 'src', 'lib', 'data');

// Define the file paths for each data type
const filePaths = {
    inventory: path.join(dataPath, 'inventory.json'),
    auditLog: path.join(dataPath, 'audit-log.json'),
    categories: path.join(dataPath, 'categories.json'),
    sectors: path.join(dataPath, 'sectors.json'),
    loans: path.join(dataPath, 'loans.json'),
};

type DataType = keyof typeof filePaths;

// Helper function to ensure the data directory and files exist
async function ensureFile<T>(filePath: string, defaultData: T[] = []): Promise<void> {
    try {
        await fs.access(filePath);
    } catch (error) {
        // File doesn't exist, create it with default empty array
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
}


// Generic function to read data from a JSON file
export async function readData<T>(type: DataType): Promise<T[]> {
    const filePath = filePaths[type];
    await ensureFile(filePath); // Ensure file exists before reading
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent) as T[];
}

// Generic function to write data to a JSON file
export async function writeData<T>(type: DataType, data: T[]): Promise<void> {
    const filePath = filePaths[type];
    await ensureFile(filePath); // Ensure directory exists
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// Specific getter functions for each data type
export async function getInventory(): Promise<InventoryItem[]> {
    const data = await readData<InventoryItem>('inventory');
    // Sort by most recently created
    return data.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
    const data = await readData<AuditLogEntry>('auditLog');
    // Sort by most recent timestamp
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getCategories(): Promise<Category[]> {
    const data = await readData<Category>('categories');
    // Sort by name
    return data.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSectors(): Promise<Sector[]> {
    const data = await readData<Sector>('sectors');
    // Sort by name
    return data.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getLoans(): Promise<Loan[]> {
    const data = await readData<Loan>('loans');
    // Sort by most recent loan date
    return data.sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
}

// Funções adicionais requeridas por outras partes da aplicação
export async function getCampusList() {
    return [];
}

export async function getRequests() {
    return [];
}
