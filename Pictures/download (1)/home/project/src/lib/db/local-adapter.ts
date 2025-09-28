'use server';

import fs from 'fs/promises';
import path from 'path';
import type { InventoryItem, AuditLogEntry, Category, Sector, Loan, User, Campus, Request as SupportRequest } from '@/lib/types';

const dataPath = path.join(process.cwd(), 'src', 'lib', 'data');

const filePaths = {
    inventory: path.join(dataPath, 'inventory.json'),
    auditLog: path.join(dataPath, 'audit-log.json'),
    categories: path.join(dataPath, 'categories.json'),
    sectors: path.join(dataPath, 'sectors.json'),
    loans: path.join(dataPath, 'loans.json'),
    users: path.join(dataPath, 'users.json'),
    campus: path.join(dataPath, 'campus.json'),
    requests: path.join(dataPath, 'requests.json'),
};

type DataType = keyof typeof filePaths;

async function ensureFile<T>(filePath: string, defaultData: T[] = []): Promise<void> {
    try {
        await fs.access(filePath);
    } catch (error) {
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    }
}

async function readFile<T>(type: DataType): Promise<T[]> {
    const filePath = filePaths[type];
    await ensureFile(filePath, []);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    try {
        if (fileContent.trim() === '') {
            return [];
        }
        return JSON.parse(fileContent) as T[];
    } catch (e) {
        console.error(`Error parsing JSON from ${filePath}, returning empty array. Content: "${fileContent}"`, e);
        return [];
    }
}

async function writeFile<T>(type: DataType, data: T[]): Promise<void> {
    const filePath = filePaths[type];
    await ensureFile(filePath, []);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}


// --- Exported Functions ---

export async function getInventory(): Promise<InventoryItem[]> {
    const data = await readFile<InventoryItem>('inventory');
    return data.sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
}
export async function writeInventory(data: InventoryItem[]): Promise<void> {
    return writeFile('inventory', data);
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
    const data = await readFile<AuditLogEntry>('auditLog');
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
export async function writeAuditLog(data: AuditLogEntry[]): Promise<void> {
    return writeFile('auditLog', data);
}

export async function getCategories(): Promise<Category[]> {
    const data = await readFile<Category>('categories');
    return data.sort((a, b) => a.name.localeCompare(b.name));
}
export async function writeCategories(data: Category[]): Promise<void> {
    return writeFile('categories', data);
}

export async function getSectors(): Promise<Sector[]> {
    const data = await readFile<Sector>('sectors');
    return data.sort((a, b) => a.name.localeCompare(b.name));
}
export async function writeSectors(data: Sector[]): Promise<void> {
    return writeFile('sectors', data);
}

export async function getLoans(): Promise<Loan[]> {
    const data = await readFile<Loan>('loans');
    return data.sort((a, b) => new Date(b.loanDate).getTime() - new Date(a.loanDate).getTime());
}
export async function writeLoans(data: Loan[]): Promise<void> {
    return writeFile('loans', data);
}

export async function getUsers(): Promise<User[]> {
    const data = await readFile<User>('users');
    return data.sort((a, b) => a.name.localeCompare(b.name));
}
export async function writeUsers(data: User[]): Promise<void> {
    return writeFile('users', data);
}

export async function getCampusList(): Promise<Campus[]> {
    const data = await readFile<Campus>('campus');
    return data.sort((a, b) => a.name.localeCompare(b.name));
}
export async function writeCampusList(data: Campus[]): Promise<void> {
    return writeFile('campus', data);
}

export async function getRequests(): Promise<SupportRequest[]> {
    const data = await readFile<SupportRequest>('requests');
    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
export async function writeRequests(data: SupportRequest[]): Promise<void> {
    return writeFile('requests', data);
}
