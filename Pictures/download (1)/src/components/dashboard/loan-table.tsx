"use client";

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Undo2 } from 'lucide-react';
import type { Loan } from '@/lib/types';
import { format, isPast, parseISO } from 'date-fns';

type LoanTableProps = {
    loans: Loan[];
    onReturn: (loanId: string | number) => void;
};

export default function LoanTable({ loans = [], onReturn }: LoanTableProps) {
    const [filter, setFilter] = React.useState('');
    // Change default to 'all' to show all loans
    const [statusFilter, setStatusFilter] = React.useState<'all' | 'loaned' | 'returned'>('all');
    const [sortConfig, setSortConfig] = React.useState<{ key: keyof Loan, direction: 'asc' | 'desc' }>({ key: 'loanDate', direction: 'desc' });
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;
    
    console.log('LoanTable rendered with', loans.length, 'loans');
    console.log('First 3 loans (sample):', loans.slice(0, 3));
    
    const requestSort = (key: keyof Loan) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
        console.log('Sorting loans by', key, 'in', direction, 'order');
    };

    const sortedAndFilteredLoans = React.useMemo(() => {
        console.log('Filtering and sorting', loans.length, 'loans with filter:', filter, 'statusFilter:', statusFilter);
        
        if (loans.length === 0) {
            console.log('No loans to filter');
            return [];
        }
        
        console.log('Sample loan status values:', loans.slice(0, 3).map(loan => loan.status));
        
        let filtered = loans.filter(loan => {
            // Text filter
            const textMatch = (
                ((loan.borrowerName?.toLowerCase() ?? '').includes(filter.toLowerCase())) || 
                ((loan.itemSerial?.toLowerCase() ?? '').includes(filter.toLowerCase())) ||
                ((loan.itemCategory?.toLowerCase() ?? '').includes(filter.toLowerCase()))
            );
            
            // Status filter - verificar 'loaned'/'emprestado' e 'returned'/'devolvido' para garantir compatibilidade
            const loanStatus = loan.status?.toLowerCase() || '';
            const statusMatch = (
                statusFilter === 'all' || 
                (statusFilter === 'loaned' && (loanStatus === 'loaned' || loanStatus === 'emprestado')) ||
                (statusFilter === 'returned' && (loanStatus === 'returned' || loanStatus === 'devolvido'))
            );
            
            console.log(`Loan ${loan.id} status:`, loanStatus, 'statusFilter:', statusFilter, 'match:', statusMatch);
            
            const result = textMatch && statusMatch;
            if (!result) {
                console.log(`Loan ${loan.id} filtered out: textMatch=${textMatch}, statusMatch=${statusMatch}, status=${loan.status}`);
            }
            
            return result;
        });

        console.log('After filtering:', filtered.length, 'loans remain');
        
        if (sortConfig !== null) {
            filtered.sort((a, b) => {
                const aValue = a[sortConfig.key] as any;
                const bValue = b[sortConfig.key] as any;
                if (aValue < bValue) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        
        return filtered;
    }, [loans, filter, statusFilter, sortConfig]);

    const totalPages = Math.ceil(sortedAndFilteredLoans.length / itemsPerPage);
    const paginatedLoans = sortedAndFilteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const isOverdue = (loan: Loan) => {
        return loan.status === 'loaned' && isPast(typeof loan.expectedReturnDate === 'string' ? parseISO(loan.expectedReturnDate) : new Date(loan.expectedReturnDate));
    }

    return (
        <div className="space-y-4">
             <div className="flex flex-col sm:flex-row gap-2">
                <Input 
                    placeholder="Filtrar por item, S/N, mutuário..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="flex-grow"
                />
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Filtrar Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="loaned">Emprestados</SelectItem>
                        <SelectItem value="returned">Devolvidos</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('itemSerial')}>Item (S/N) <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('borrowerName')}>Mutuário <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('loanDate')}>Data Empréstimo <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead><button className="flex items-center gap-1" onClick={() => requestSort('expectedReturnDate')}>Devolução Prevista <ArrowUpDown className="h-3 w-3" /></button></TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead><span className="sr-only">Ações</span></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedLoans.length > 0 ? paginatedLoans.map(loan => (
                            <TableRow key={loan.id} className={isOverdue(loan) ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                                <TableCell>
                                    <div className="font-medium">{loan.itemCategory}</div>
                                    <div className="text-sm text-muted-foreground">{loan.itemSerial}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{loan.borrowerName}</div>
                                    <div className="text-sm text-muted-foreground">{loan.borrowerContact}</div>
                                </TableCell>
                                <TableCell>{format(typeof loan.loanDate === 'string' ? parseISO(loan.loanDate) : new Date(loan.loanDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell className={isOverdue(loan) ? 'font-bold text-red-600' : ''}>{format(typeof loan.expectedReturnDate === 'string' ? parseISO(loan.expectedReturnDate) : new Date(loan.expectedReturnDate), 'dd/MM/yyyy')}</TableCell>
                                <TableCell>
                                    {loan.status === 'loaned' ? (
                                        <Badge variant="secondary" className={isOverdue(loan) ? 'bg-red-200 text-red-900' : 'bg-purple-100 text-purple-800'}>
                                            {isOverdue(loan) ? 'Atrasado' : 'Emprestado'}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline">Devolvido em {loan.actualReturnDate ? format(typeof loan.actualReturnDate === 'string' ? parseISO(loan.actualReturnDate) : new Date(loan.actualReturnDate), 'dd/MM/yyyy') : 'N/A'}</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {loan.status === 'loaned' && (
                                        <Button variant="outline" size="sm" onClick={() => onReturn(loan.id)}>
                                            <Undo2 className="h-4 w-4 mr-2" /> Registrar Devolução
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-24 text-center">Nenhum empréstimo encontrado.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-between">
                 <div className="text-sm text-muted-foreground">
                    Exibindo {paginatedLoans.length} de {sortedAndFilteredLoans.length} empréstimos.
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>Anterior</Button>
                    <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages}>Próximo</Button>
                </div>
            </div>
        </div>
    );
}