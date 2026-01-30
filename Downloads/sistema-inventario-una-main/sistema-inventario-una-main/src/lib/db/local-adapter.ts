/**
 * @fileoverview PostgreSQL database adapter.
 * This file implements the DbAdapter interface for a PostgreSQL database.
 */
'use server';

import { Pool } from 'pg';
import type { InventoryItem, AuditLogEntry, Category, Sector, Loan, User, Campus, Request as SupportRequest } from '@/lib/types';
import { ItemStatus, RequestStatus } from '@/lib/types';

// Connection pool for PostgreSQL. Reads connection details from environment variables.
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DATABASE,
  password: process.env.POSTGRES_PASSWORD,
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
});

// --- GETTERS (Reading from DB) ---

export async function getInventory(): Promise<InventoryItem[]> {
  const res = await pool.query('SELECT * FROM inventory ORDER BY created DESC');
  return res.rows;
}

export async function getCategories(): Promise<Category[]> {
    const res = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    return res.rows;
}

export async function getSectors(): Promise<Sector[]> {
    const res = await pool.query('SELECT * FROM sectors ORDER BY name ASC');
    return res.rows;
}

export async function getCampusList(): Promise<Campus[]> {
    const res = await pool.query('SELECT * FROM campus ORDER BY name ASC');
    return res.rows;
}

export async function getUsers(): Promise<User[]> {
    const res = await pool.query(`
        SELECT u.id, u.username, u.name, u.role, c.name as campus, u.password 
        FROM users u 
        LEFT JOIN campus c ON u.campus_id = c.id 
        ORDER BY u.name ASC
    `);
    return res.rows;
}

export async function getAuditLog(): Promise<AuditLogEntry[]> {
  const res = await pool.query('SELECT * FROM audit_log ORDER BY timestamp DESC');
  return res.rows;
}

export async function getLoans(): Promise<Loan[]> {
  const res = await pool.query('SELECT * FROM loans ORDER BY loan_date DESC');
  return res.rows;
}

export async function getRequests(): Promise<SupportRequest[]> {
    const res = await pool.query('SELECT * FROM requests ORDER BY "createdAt" DESC');
    return res.rows;
}


// --- MUTATIONS (Writing to DB) ---

export async function insertInventoryItem(item: Omit<InventoryItem, 'id' | 'created' | 'updated'>): Promise<InventoryItem> {
    const now = new Date();
    const res = await pool.query(
        `INSERT INTO inventory (campus, setor, sala, category, brand, serial, patrimony, status, responsible, obs, "isFixed", created, updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [item.campus, item.setor, item.sala, item.category, item.brand, item.serial, item.patrimony, item.status, item.responsible, item.obs, item.isFixed, now, now]
    );
    return res.rows[0];
}

export async function updateInventoryItem(item: Omit<InventoryItem, 'created' | 'updated'> & {id: string | number}): Promise<InventoryItem> {
    const now = new Date();
    const res = await pool.query(
        `UPDATE inventory
         SET campus = $1, setor = $2, sala = $3, category = $4, brand = $5, serial = $6, patrimony = $7, status = $8, responsible = $9, obs = $10, "isFixed" = $11, updated = $12
         WHERE id = $13
         RETURNING *`,
        [item.campus, item.setor, item.sala, item.category, item.brand, item.serial, item.patrimony, item.status, item.responsible, item.obs, item.isFixed, now, item.id]
    );
    return res.rows[0];
}

export async function updateItemStatus(id: string | number, status: keyof typeof ItemStatus): Promise<void> {
    await pool.query('UPDATE inventory SET status = $1, updated = NOW() WHERE id = $2', [status, id]);
}

export async function deleteInventoryItem(id: string | number): Promise<void> {
    await pool.query('DELETE FROM inventory WHERE id = $1', [id]);
}

export async function insertLoan(loan: Omit<Loan, 'id'>): Promise<void> {
    await pool.query(
        `INSERT INTO loans ("itemId", "itemSerial", "itemCategory", "borrowerName", "borrowerContact", "loanDate", "expectedReturnDate", "actualReturnDate", status, notes, campus, loaner)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [loan.itemId, loan.itemSerial, loan.itemCategory, loan.borrowerName, loan.borrowerContact, loan.loanDate, loan.expectedReturnDate, loan.actualReturnDate, loan.status, loan.notes, loan.campus, loan.loaner]
    );
}

export async function returnLoan(loanId: string | number): Promise<void> {
    await pool.query('UPDATE loans SET status = $1, actual_return_date = NOW() WHERE id = $2', ['returned', loanId]);
}


export async function insertAuditLogEntry(log: Omit<AuditLogEntry, 'id'>): Promise<void> {
    await pool.query(
        'INSERT INTO audit_log (action, "user", campus, timestamp, item, details) VALUES ($1, $2, $3, $4, $5, $6)',
        [log.action, log.user, log.campus, log.timestamp, log.item, log.details]
    );
}

// --- CATEGORY & SECTOR MUTATIONS ---
export async function insertCategory(name: string): Promise<Category> {
    const res = await pool.query('INSERT INTO categories (name) VALUES ($1) RETURNING *', [name]);
    return res.rows[0];
}
export async function updateCategory(id: string | number, name: string): Promise<void> {
    await pool.query('UPDATE categories SET name = $1 WHERE id = $2', [name, id]);
}
export async function deleteCategory(id: string | number): Promise<void> {
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
}

export async function insertSector(name: string): Promise<Sector> {
    const res = await pool.query('INSERT INTO sectors (name) VALUES ($1) RETURNING *', [name]);
    return res.rows[0];
}
export async function updateSector(id: string | number, name: string): Promise<void> {
    await pool.query('UPDATE sectors SET name = $1 WHERE id = $2', [name, id]);
}
export async function deleteSector(id: string | number): Promise<void> {
    await pool.query('DELETE FROM sectors WHERE id = $1', [id]);
}


// --- USER & CAMPUS MUTATIONS ---
export async function insertUser(user: Omit<User, 'id'>): Promise<User> {
    const res = await pool.query(
        'INSERT INTO users (username, name, role, campus, password) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, name, role, campus',
        [user.username, user.name, user.role, user.campus, user.password]
    );
    return { ...res.rows[0], password: 'password' };
}

export async function updateUser(user: User): Promise<User> {
    const res = await pool.query(
        'UPDATE users SET username = $1, name = $2, role = $3, campus = $4, password = $5 WHERE id = $6 RETURNING id, username, name, role, campus',
        [user.username, user.name, user.role, user.campus, user.password, user.id]
    );
    return { ...res.rows[0], password: 'password' };
}

export async function deleteUser(id: string | number): Promise<void> {
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
}

export async function insertCampus(campus: Omit<Campus, 'id'>): Promise<Campus> {
    const res = await pool.query('INSERT INTO campus (name) VALUES ($1) RETURNING *', [campus.name]);
    return res.rows[0];
}

export async function updateCampus(id: string | number, name: string): Promise<void> {
    await pool.query('UPDATE campus SET name = $1 WHERE id = $2', [name, id]);
}

export async function deleteCampus(id: string | number): Promise<void> {
    await pool.query('DELETE FROM campus WHERE id = $1', [id]);
}

export async function updateInventoryForCampusRename(oldName: string, newName: string): Promise<void> {
    await pool.query('UPDATE inventory SET campus = $1 WHERE campus = $2', [newName, oldName]);
}


export async function updateRequestStatus(id: string | number, status: keyof typeof RequestStatus): Promise<void> {
    await pool.query('UPDATE requests SET status = $1, "updatedAt" = NOW() WHERE id = $2', [status, id]);
}
