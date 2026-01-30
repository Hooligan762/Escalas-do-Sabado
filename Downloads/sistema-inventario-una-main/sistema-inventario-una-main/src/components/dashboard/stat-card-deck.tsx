import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Warehouse, CheckCircle2, AlertTriangle, Wrench, Archive, Trash2, Handshake, PlayCircle } from 'lucide-react';
import type { InventoryItem } from '@/lib/types';

type StatCardDeckProps = {
  inventory: InventoryItem[];
};

const StatCard = ({ title, value, icon: Icon, colorClass, description }: { title: string; value: number; icon: React.ElementType; colorClass: string; description: string; }) => (
    <Card className={`relative overflow-hidden transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl border-l-4 ${colorClass.replace('text-', 'border-')}`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
            <div className={`p-2 rounded-full ${colorClass.replace('text-', 'bg-')} bg-opacity-10`}>
                <Icon className={`h-5 w-5 ${colorClass}`} />
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-extrabold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
);

export default function StatCardDeck({ inventory }: StatCardDeckProps) {
  const stats = React.useMemo(() => {
    const total = inventory.length;
    const funcionando = inventory.filter(item => item.status === 'funcionando').length;
    const manutencao = inventory.filter(item => item.status === 'manutencao').length;
    const defeito = inventory.filter(item => item.status === 'defeito').length;
    const backup = inventory.filter(item => item.status === 'backup').length;
    const descarte = inventory.filter(item => item.status === 'descarte').length;
    const emprestado = inventory.filter(item => item.status === 'emprestado').length;
    const emuso = inventory.filter(item => item.status === 'emuso').length;
    
    const toPercent = (val: number) => total > 0 ? ((val / total) * 100).toFixed(0) + '%' : '0%';
    const available = funcionando + backup;
    const unavailable = manutencao + defeito + descarte + emprestado + emuso;

    return {
      total,
      funcionando,
      manutencao,
      defeito,
      backup,
      descarte,
      emprestado,
      emuso,
      percentages: {
        funcionando: toPercent(funcionando),
        manutencao: toPercent(manutencao),
        defeito: toPercent(defeito),
        backup: toPercent(backup),
        descarte: toPercent(descarte),
        emprestado: toPercent(emprestado),
        emuso: toPercent(emuso),
      },
      available,
      unavailable,
    };
  }, [inventory]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard 
            title="Itens Totais" 
            value={stats.total} 
            icon={Warehouse} 
            colorClass="text-primary" 
            description={`${stats.available} disponíveis / ${stats.unavailable} indisponíveis`} 
        />
        <StatCard 
            title="Funcionando" 
            value={stats.funcionando} 
            icon={CheckCircle2} 
            colorClass="text-green-500" 
            description={`${stats.percentages.funcionando} do total`} 
        />
        <StatCard 
            title="Em Manutenção" 
            value={stats.manutencao} 
            icon={Wrench} 
            colorClass="text-orange-500" 
            description={`${stats.percentages.manutencao} do total`}
        />
        <StatCard 
            title="Defeito" 
            value={stats.defeito} 
            icon={AlertTriangle} 
            colorClass="text-red-500" 
            description={`${stats.percentages.defeito} do total`} 
        />
         <StatCard 
            title="Emprestado" 
            value={stats.emprestado} 
            icon={Handshake} 
            colorClass="text-purple-500" 
            description={`${stats.percentages.emprestado} do total`}
        />
        <StatCard 
            title="Em Uso" 
            value={stats.emuso} 
            icon={PlayCircle} 
            colorClass="text-yellow-500" 
            description={`${stats.percentages.emuso} do total`}
        />
        <StatCard 
            title="Backup" 
            value={stats.backup} 
            icon={Archive} 
            colorClass="text-blue-500" 
            description={`${stats.percentages.backup} do total`}
        />
        <StatCard 
            title="Descarte" 
            value={stats.descarte} 
            icon={Trash2} 
            colorClass="text-gray-500" 
            description={`${stats.percentages.descarte} do total`} 
        />
    </div>
  );
}
