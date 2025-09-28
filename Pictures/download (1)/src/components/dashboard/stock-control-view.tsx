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
import type { InventoryItem } from '@/lib/types';

type StockControlProps = {
    inventory: InventoryItem[];
    categories: string[];
};

type StockInfo = {
    category: string;
    total: number;
    available: number;
    loanedOrInUse: number;
    level: 'Baixo' | 'Médio' | 'Alto';
};

const getLevelBadgeClass = (level: StockInfo['level']) => {
    switch (level) {
        case 'Baixo': return 'bg-red-100 text-red-800 border-red-200';
        case 'Médio': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'Alto': return 'bg-green-100 text-green-800 border-green-200';
    }
}

export default function StockControlView({ inventory, categories }: StockControlProps) {
    const stockData = React.useMemo(() => {
        const stockByCategory = categories.map(category => {
            const itemsInCategory = inventory.filter(item => item.category === category);
            const total = itemsInCategory.length;
            const available = itemsInCategory.filter(item => item.status === 'funcionando' || item.status === 'backup').length;
            const loanedOrInUse = itemsInCategory.filter(item => item.status === 'emprestado' || item.status === 'emuso').length;

            let level: StockInfo['level'];
            if (available <= 2) {
                level = 'Baixo';
            } else if (available <= 5) {
                level = 'Médio';
            } else {
                level = 'Alto';
            }
            
            return { category, total, available, loanedOrInUse, level };
        });

        // Retorna apenas as categorias que existem no inventário
        return stockByCategory.filter(stock => stock.total > 0).sort((a, b) => a.available - b.available);

    }, [inventory, categories]);

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Categoria</TableHead>
                        <TableHead className="text-center">Disponível</TableHead>
                        <TableHead className="text-center">Em Uso/Emprestado</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-right">Nível do Estoque</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {stockData.length > 0 ? stockData.map(stock => (
                        <TableRow key={stock.category}>
                            <TableCell className="font-medium">{stock.category}</TableCell>
                            <TableCell className="text-center font-bold text-green-600">{stock.available}</TableCell>
                            <TableCell className="text-center">{stock.loanedOrInUse}</TableCell>
                            <TableCell className="text-center">{stock.total}</TableCell>
                            <TableCell className="text-right">
                                <Badge className={getLevelBadgeClass(stock.level)}>{stock.level}</Badge>
                            </TableCell>
                        </TableRow>
                    )) : (
                         <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Nenhum item no inventário para exibir o controle de estoque.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
