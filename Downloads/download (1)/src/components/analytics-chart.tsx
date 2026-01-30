'use client';

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltipContent,
  ChartTooltip,
} from '@/components/ui/chart';
import type { Schedule, Technician } from '@/lib/types';

type AnalyticsChartProps = {
  schedule: Schedule;
  technicians: Technician[];
};

const chartConfig = {
  shifts: {
    label: 'Turnos',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function AnalyticsChart({ schedule, technicians }: AnalyticsChartProps) {
  const analyticsData = useMemo(() => {
    const counts: Record<string, number> = Object.fromEntries(
      technicians.map((t) => [t, 0])
    );
    for (const tech of Object.values(schedule)) {
      if (tech && tech in counts) {
        counts[tech]++;
      }
    }
    return technicians.map((name) => ({ name, shifts: counts[name] }));
  }, [schedule, technicians]);

  return (
    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
      <BarChart accessibilityLayer data={analyticsData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
        />
        <YAxis allowDecimals={false} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="shifts" fill="var(--color-shifts)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
