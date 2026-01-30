"use client";

import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import type { InventoryItem } from '@/lib/types';
import { ItemStatus } from '@/lib/types';
import { Search, Monitor, Laptop, Projector, Server, HardDrive } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GlobalSearchProps {
  inventory: InventoryItem[];
  onNavigateToItem?: (itemId: string) => void;
}

const getStatusBadgeClass = (status: keyof typeof ItemStatus) => {
    switch (status) {
        case 'funcionando': return 'bg-green-100 text-green-800 border-green-200';
        case 'manutencao': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'defeito': return 'bg-red-100 text-red-800 border-red-200';
        case 'backup': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'descarte': return 'bg-gray-100 text-gray-800 border-gray-200';
        case 'emprestado': return 'bg-purple-100 text-purple-800 border-purple-200';
        case 'emuso': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const categoryIcons: Record<string, React.ElementType> = {
    'Notebook': Laptop,
    'Desktop': Monitor,
    'Monitor': Monitor,
    'Projetor': Projector,
    'Servidor': Server,
    'HD Externo': HardDrive,
};


const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


export default function GlobalSearch({ inventory, onNavigateToItem }: GlobalSearchProps) {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [results, setResults] = React.useState<InventoryItem[]>([]);
    const [open, setOpen] = React.useState(false);
    
    const debouncedSearchTerm = useDebounce(searchTerm, 300);

    React.useEffect(() => {
        if (debouncedSearchTerm.length > 2) {
            const lowerCaseTerm = debouncedSearchTerm.toLowerCase();
            const filtered = inventory.filter(item => 
                (item.patrimony && item.patrimony.toLowerCase().includes(lowerCaseTerm)) ||
                (item.serial && item.serial.toLowerCase().includes(lowerCaseTerm)) ||
                (item.category && item.category.toLowerCase().includes(lowerCaseTerm)) ||
                (item.brand && item.brand.toLowerCase().includes(lowerCaseTerm)) ||
                (item.responsible && item.responsible.toLowerCase().includes(lowerCaseTerm))
            );
            setResults(filtered);
            if (!open) setOpen(true);
        } else {
            setResults([]);
            if (open) setOpen(false);
        }
    }, [debouncedSearchTerm, inventory, open]);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
    }
    
    const handleSelectResult = (item: InventoryItem) => {
        console.log('🔍 Item selecionado na busca:', item);
        setOpen(false);
        setSearchTerm('');
        
        // Navegar para o item no inventário
        if (onNavigateToItem) {
            console.log('📍 Chamando navegação para item:', item.id);
            onNavigateToItem(String(item.id));
        }
    }


    return (
        <div className="w-full">
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild className="w-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar por Patrimônio, Série, Categoria, Marca..."
                            className="w-full pl-9 bg-white/70"
                            value={searchTerm}
                            onChange={handleInputChange}
                        />
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                   <Command>
                        <CommandList>
                            {results.length === 0 && searchTerm.length > 2 ? (
                                 <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
                            ): (
                                <CommandGroup heading={`${results.length} equipamento(s) encontrado(s)`}>
                                {results.map(item => {
                                     const Icon = categoryIcons[item.category] || HardDrive;
                                     return(
                                        <CommandItem key={item.id} onSelect={() => handleSelectResult(item)} value={String(item.id)}>
                                           <div className="flex items-center gap-4 w-full">
                                                <Icon className="h-5 w-5 text-muted-foreground" />
                                                <div className="flex-grow">
                                                    <div className="font-medium">{item.category} {item.brand}</div>
                                                    <div className="text-xs text-muted-foreground">S/N: {item.serial} | Patrimônio: {item.patrimony || 'N/A'}</div>
                                                    <div className="text-xs text-muted-foreground">{item.campus} {'>'} {item.setor}</div>
                                                </div>
                                                <Badge className={getStatusBadgeClass(item.status)}>{ItemStatus[item.status]}</Badge>
                                           </div>
                                        </CommandItem>
                                     )
                                 })}
                                </CommandGroup>
                            )}
                        </CommandList>
                   </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
