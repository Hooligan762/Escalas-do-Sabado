"use client"

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, Pie, PieChart, Cell } from 'recharts';
import type { InventoryItem, User, ChartConfig, Sector, Campus } from '@/lib/types';
import { ItemStatus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import StockControlView from './stock-control-view';


const chartConfigCampus = {
    funcionando: { label: 'Funcionando', color: 'hsl(var(--chart-2))' },
    defeito: { label: 'Defeito', color: 'hsl(var(--destructive))' },
    manutencao: { label: 'Manutenção', color: 'hsl(var(--chart-3))' },
    backup: { label: 'Backup', color: 'hsl(var(--chart-1))' },
    descarte: { label: 'Descarte', color: 'hsl(var(--muted-foreground))' },
};


export default function StatisticsView({ inventory, user, categories, sectors, campusList }: { inventory: InventoryItem[], user: User, categories: string[], sectors: Sector[], campusList: Campus[] }) {
    
    const campusNames = React.useMemo(() => campusList.map(c => c.name), [campusList]);

    const categoryData = React.useMemo(() => {
        const counts = inventory.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts)
            .map(([category, count]) => ({ category, count }))
            .sort((a,b) => b.count - a.count);
    }, [inventory]);

    const chartConfigCategory: ChartConfig = React.useMemo(() => {
        const config: ChartConfig = {};
        categoryData.forEach((item, index) => {
            config[item.category] = {
                label: item.category,
                color: `hsl(var(--chart-${(index % 5) + 1}))`
            }
        });
        return config;
    }, [categoryData]);

    const campusStatusData = React.useMemo(() => {
        const allItems = inventory;
        const data = campusNames.map(campus => {
            const campusItems = allItems.filter(item => item.campus === campus);
            const statusCounts = campusItems.reduce((acc, item) => {
                acc[item.status] = (acc[item.status] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            return {
                name: campus,
                funcionando: statusCounts.funcionando || 0,
                defeito: statusCounts.defeito || 0,
                manutencao: statusCounts.manutencao || 0,
                backup: statusCounts.backup || 0,
                descarte: statusCounts.descarte || 0,
            }
        })
        return data;
    }, [inventory, campusNames]);

     const detailedStats = React.useMemo(() => {
        const statsByCampus: Record<string, { total: number, funcionando: number, manutencao: number, defeito: number, backup: number, descarte: number, emuso: number, emprestado: number }> = {};
        
        const allItems = inventory; 

        allItems.forEach(item => {
            if (!statsByCampus[item.campus]) {
                statsByCampus[item.campus] = { total: 0, funcionando: 0, manutencao: 0, defeito: 0, backup: 0, descarte: 0, emuso: 0, emprestado: 0 };
            }
            statsByCampus[item.campus].total++;
            statsByCampus[item.campus][item.status]++;
        });

        return Object.entries(statsByCampus).map(([campus, stats]) => {
            const operational = stats.total > 0 ? (((stats.funcionando + stats.backup) / stats.total) * 100).toFixed(1) + '%' : '0.0%';
            return { campus, ...stats, operational };
        });
    }, [inventory]);

    const statsByLocation = React.useMemo(() => {
        const locationMap: Record<string, Record<string, number>> = {};
        
        // Filtra o inventário para o campus do usuário atual, ou mostra tudo para o admin
        const inventoryToProcess = user.role === 'admin' ? inventory : inventory.filter(i => i.campus === user.campus);

        inventoryToProcess.forEach(item => {
            const locationKey = item.sala ? `${item.setor} / ${item.sala}` : item.setor;

            if (!locationMap[locationKey]) {
                locationMap[locationKey] = {};
            }
            if (!locationMap[locationKey][item.category]) {
                locationMap[locationKey][item.category] = 0;
            }
            locationMap[locationKey][item.category]++;
        });

        return Object.entries(locationMap).map(([locationName, categories]) => ({
            locationName,
            items: Object.entries(categories).map(([categoryName, count]) => ({
                categoryName,
                count
            })).sort((a,b) => b.count - a.count)
        })).sort((a,b) => a.locationName.localeCompare(b.locationName));

    }, [inventory, user]);

    // Dados para o gráfico de distribuição do campus do usuário
    const userCampusInventory = React.useMemo(() => {
        return inventory.filter(item => item.campus === user.campus);
    }, [inventory, user.campus]);
    
    const userCampusCategoryData = React.useMemo(() => {
        if (user.role === 'admin') return []; // Admin já vê o geral
        const counts = userCampusInventory.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(counts)
            .map(([category, count]) => ({ category, count }))
            .sort((a,b) => b.count - a.count);
    }, [userCampusInventory, user.role]);


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Inventário por Localização</CardTitle>
                    <CardDescription>Veja o que cada setor/sala do seu campus possui. Clique para expandir.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {statsByLocation.length > 0 ? statsByLocation.map(({ locationName, items }) => (
                            <AccordionItem value={locationName} key={locationName}>
                                <AccordionTrigger>{locationName}</AccordionTrigger>
                                <AccordionContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Equipamento</TableHead>
                                                <TableHead className="text-right">Quantidade</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map(({ categoryName, count }) => (
                                                <TableRow key={categoryName}>
                                                    <TableCell className="font-medium">{categoryName}</TableCell>
                                                    <TableCell className="text-right">{count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </AccordionContent>
                            </AccordionItem>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Não há itens no inventário para exibir as estatísticas por localização.
                            </p>
                        )}
                    </Accordion>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Controle de Estoque para Empréstimo</CardTitle>
                    <CardDescription>Níveis de equipamentos disponíveis para empréstimo ou uso no seu campus.</CardDescription>
                </CardHeader>
                <CardContent>
                    <StockControlView inventory={user.role === 'admin' ? inventory : userCampusInventory} categories={categories} />
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Distribuição por Categoria (Geral)</CardTitle>
                     <CardDescription>Visão geral de todos os equipamentos em todos os campus.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfigCategory} className="h-[250px] w-full">
                        <ResponsiveContainer>
                            <BarChart accessibilityLayer data={categoryData}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="category" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={(value) => value.length > 5 ? value.slice(0, 3) + '...' : value} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="count" radius={4}>
                                     {categoryData.map((entry) => (
                                        <Cell key={entry.category} fill={chartConfigCategory[entry.category]?.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Visão Geral de Status por Campus</CardTitle>
                    <CardDescription>Compare a distribuição de status entre todos os campus.</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={chartConfigCampus} className="h-[300px] w-full">
                         <ResponsiveContainer>
                             <BarChart accessibilityLayer data={campusStatusData} layout="vertical" stackOffset="expand">
                                <CartesianGrid horizontal={false} />
                                <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} width={120} />
                                <XAxis type="number" hide={true} />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <ChartLegend content={<ChartLegendContent />} />
                                <Bar dataKey="funcionando" stackId="a" fill="var(--color-funcionando)" radius={4} />
                                <Bar dataKey="backup" stackId="a" fill="var(--color-backup)" radius={4} />
                                <Bar dataKey="manutencao" stackId="a" fill="var(--color-manutencao)" radius={4} />
                                <Bar dataKey="defeito" stackId="a" fill="var(--color-defeito)" radius={4} />
                                <Bar dataKey="descarte" stackId="a" fill="var(--color-descarte)" radius={4} />
                             </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
            
            <Card>
                <CardHeader>
                    <CardTitle>Estatísticas Detalhadas por Campus</CardTitle>
                    <CardDescription>Uma análise numérica da saúde e operacionalidade de cada campus.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campus</TableHead>
                                    <TableHead>Total</TableHead>
                                    <TableHead>Funcionando</TableHead>
                                    <TableHead>Manutenção</TableHead>
                                    <TableHead>Defeito</TableHead>
                                    <TableHead>Emprestado</TableHead>
                                    <TableHead>Em Uso</TableHead>
                                    <TableHead>Backup</TableHead>
                                    <TableHead>Descarte</TableHead>
                                    <TableHead>Operacional</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {detailedStats.map(stat => (
                                    <TableRow key={stat.campus}>
                                        <TableCell className="font-medium">{stat.campus}</TableCell>
                                        <TableCell>{stat.total}</TableCell>
                                        <TableCell className="text-green-600">{stat.funcionando}</TableCell>
                                        <TableCell className="text-orange-600">{stat.manutencao}</TableCell>
                                        <TableCell className="text-red-600">{stat.defeito}</TableCell>
                                        <TableCell className="text-purple-600">{stat.emprestado}</TableCell>
                                        <TableCell className="text-yellow-600">{stat.emuso}</TableCell>
                                        <TableCell className="text-blue-600">{stat.backup}</TableCell>
                                        <TableCell className="text-gray-500">{stat.descarte}</TableCell>
                                        <TableCell className="font-bold">{stat.operational}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
