'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowUpDown, Eye } from 'lucide-react';
import type { Request as SupportRequest } from '@/lib/types';
import { RequestStatus } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type RequestsTableProps = {
  requests: SupportRequest[];
};

const getStatusBadgeClass = (status: keyof typeof RequestStatus) => {
  switch (status) {
    case 'aberto':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'em-andamento':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'concluido':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelado':
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export default function RequestsTable({ requests }: RequestsTableProps) {
  const [filter, setFilter] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [sortConfig, setSortConfig] = React.useState<{
    key: keyof SupportRequest;
    direction: 'asc' | 'desc';
  }>({ key: 'createdAt', direction: 'desc' });
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const requestSort = (key: keyof SupportRequest) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedAndFilteredRequests = React.useMemo(() => {
    let filtered = requests.filter(
      (req) =>
        ((req.requesterEmail && req.requesterEmail.toLowerCase().includes(filter.toLowerCase())) ||
          (req.details && req.details.toLowerCase().includes(filter.toLowerCase())) ||
          (req.campus && req.campus.toLowerCase().includes(filter.toLowerCase())) ||
          (req.setor && req.setor.toLowerCase().includes(filter.toLowerCase()))) &&
        (statusFilter === 'all' || req.status === statusFilter)
    );

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
  }, [requests, filter, statusFilter, sortConfig]);

  const totalPages = Math.ceil(sortedAndFilteredRequests.length / itemsPerPage);
  const paginatedRequests = sortedAndFilteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          placeholder="Filtrar por e-mail, campus, setor, detalhes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="flex-grow"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filtrar Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {(Object.keys(RequestStatus) as Array<keyof typeof RequestStatus>).map((s) => (
              <SelectItem key={s} value={s}>
                {RequestStatus[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  className="flex items-center gap-1"
                  onClick={() => requestSort('createdAt')}
                >
                  Data <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRequests.length > 0 ? (
              paginatedRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    {format(typeof req.createdAt === 'string' ? parseISO(req.createdAt) : new Date(req.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </TableCell>
                  <TableCell className="font-medium">
                    {req.requesterEmail}
                  </TableCell>
                  <TableCell>
                    {req.campus} / {req.setor} {req.sala && `/ ${req.sala}`}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeClass(req.status)}>
                      {RequestStatus[req.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Detalhes
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Nenhuma solicitação encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Exibindo {paginatedRequests.length} de {sortedAndFilteredRequests.length} solicitações.
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p - 1)}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= totalPages}
          >
            Próximo
          </Button>
        </div>
      </div>
    </div>
  );
}
