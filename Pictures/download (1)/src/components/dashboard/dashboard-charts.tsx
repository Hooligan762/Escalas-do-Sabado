"use client"

import * as React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Group, PieChart as PieChartIcon } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { InventoryItem } from '@/lib/types';
import { ItemStatus } from '@/lib/types';

const COLORS_STATUS: { [key: string]: string } = {
    funcionando: 'hsl(var(--chart-2))',
    defeito: 'hsl(var(--destructive))',
    manutencao: 'hsl(var(--chart-3))',
    backup: 'hsl(var(--chart-1))',
    descarte: 'hsl(var(--muted))',
};

export default function DashboardCharts({ inventory }: { inventory: InventoryItem[] }) {
    const totalItems = inventory.length;

    const statusData = React.useMemo(() => {
        const counts = inventory.reduce((acc, item) => {
            acc[item.status] = (acc[item.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return Object.entries(counts).map(([name, value]) => ({
            name: ItemStatus[name as keyof typeof ItemStatus],
            value,
            fill: COLORS_STATUS[name] || 'hsl(var(--foreground))',
        }));
    }, [inventory]);

    const sectorData = React.useMemo(() => {
        const counts = inventory.reduce((acc, item) => {
            acc[item.setor] = (acc[item.setor] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const sectorColors = [
            'hsl(var(--chart-1))', 
            'hsl(var(--chart-2))', 
            'hsl(var(--chart-3))', 
            'hsl(var(--chart-4))', 
            'hsl(var(--chart-5))',
            'hsl(20, 80%, 55%)',
            'hsl(260, 70%, 65%)',
            'hsl(320, 75%, 60%)'
        ];
        
        return Object.entries(counts).map(([name, value], index) => ({
            name,
            value,
            fill: sectorColors[index % sectorColors.length]
        }));
    }, [inventory]);

    return (
        <div className="grid grid-cols-1 gap-6">
            <Card>
                <CardHeader className="items-center pb-0">
                    <CardTitle className="flex items-center gap-2 font-headline text-foreground">Visão Geral por Status</CardTitle>
                    <CardDescription>Distribuição dos equipamentos</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <ChartContainer config={{}} className="mx-auto aspect-square h-[250px]">
                         <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie 
                                    data={statusData} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    innerRadius={60} 
                                    outerRadius={90} 
                                    strokeWidth={5}
                                >
                                    {statusData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <text
                                    x="50%"
                                    y="50%"
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    className="fill-foreground text-3xl font-bold"
                                >
                                    {totalItems}
                                </text>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="items-center pb-0">
                    <CardTitle className="flex items-center gap-2 font-headline text-foreground">Equipamento por Setor</CardTitle>
                    <CardDescription>Onde os itens estão alocados</CardDescription>
                </CardHeader>
                <CardContent>
                     <ChartContainer config={{}} className="mx-auto aspect-square h-[250px]">
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Tooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel />}
                                />
                                <Pie data={sectorData} dataKey="value" nameKey="name" outerRadius={90}>
                                    {sectorData.map((entry) => (
                                        <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    )
}
