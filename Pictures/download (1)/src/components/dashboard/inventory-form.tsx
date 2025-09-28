"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Save, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { InventoryItem, User, Category, Sector, Campus } from '@/lib/types';
import { ItemStatus } from '@/lib/types';

const formSchema = z.object({
  campus: z.string().min(1, "O campus é obrigatório"),
  setor: z.string().min(1, "O setor é obrigatório"),
  sala: z.string().optional(),
  category: z.string().min(1, "A categoria é obrigatória"),
  brand: z.string().optional(),
  serial: z.string().min(3, "O número de série deve ter no mínimo 3 caracteres"),
  patrimony: z.string().optional(),
  status: z.enum(Object.keys(ItemStatus) as [keyof typeof ItemStatus, ...(keyof typeof ItemStatus)[]]),
  responsible: z.string().optional(),
  obs: z.string().optional(),
  isFixed: z.boolean().default(false),
});

type InventoryFormProps = {
  editingItem: InventoryItem | null;
  onSave: (item: Omit<InventoryItem, 'created' | 'updated'> & { id?: string | null }) => void;
  onClear: () => void;
  user: User;
  activeCampus: string;
  categories: Category[];
  sectors: Sector[];
  campusList: Campus[];
};

export default function InventoryForm({ editingItem, onSave, onClear, user, activeCampus, categories, sectors, campusList }: InventoryFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campus: '',
      setor: '',
      sala: '',
      category: '',
      brand: '',
      serial: '',
      patrimony: '',
      status: 'funcionando',
      responsible: '',
      obs: '',
      isFixed: false,
    },
  });

  React.useEffect(() => {
    if (editingItem) {
        console.log('Carregando item para edição:', editingItem);
        const defaultValues = {
            campus: editingItem.campus,
            setor: editingItem.setor,
            sala: editingItem.sala || '',
            category: editingItem.category,
            brand: editingItem.brand || '',
            serial: editingItem.serial,
            patrimony: editingItem.patrimony || '',
            status: editingItem.status,
            responsible: editingItem.responsible || '',
            obs: editingItem.obs || '',
            isFixed: editingItem.isFixed || false,
        };
        console.log('Valores padrão definidos:', defaultValues);
        
        // Reset completo do formulário com os valores do item
        form.reset(defaultValues);
        
        // Definir explicitamente cada campo para garantir que eles sejam atualizados
        Object.entries(defaultValues).forEach(([key, value]) => {
            form.setValue(key as any, value);
        });
    } else {
        // Para novos itens, determinar o campus baseado no perfil do usuário
        let defaultCampus = '';
        
        if (user.role === 'admin') {
            // Admin pode escolher, mas usa o campus ativo se não for 'all'
            defaultCampus = activeCampus !== 'all' ? activeCampus : '';
        } else {
            // Técnico sempre usa seu próprio campus
            defaultCampus = user.campus || '';
        }
        
        console.log('👤 Configurando formulário para novo item:');
        console.log('   - Usuário:', user.name, '(', user.role, ')');
        console.log('   - Campus do usuário:', user.campus);
        console.log('   - Campus ativo:', activeCampus);
        console.log('   - Campus padrão selecionado:', defaultCampus);
        
        const newItemValues = {
            campus: defaultCampus,
            setor: '',
            sala: '',
            category: '',
            brand: '',
            serial: '',
            patrimony: '',
            status: 'funcionando' as const,
            responsible: '',
            obs: '',
            isFixed: false,
        };
        
        form.reset(newItemValues);
        
        // Para técnicos, garantir que o campo campus seja preenchido e válido
        if (user.role === 'tecnico' && defaultCampus) {
            form.setValue('campus', defaultCampus);
            console.log('✅ Campus automaticamente definido para técnico:', defaultCampus);
        }
    }
  }, [editingItem, form, user, activeCampus]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log('📝 onSubmit - Dados do formulário:', values);
    console.log('👤 onSubmit - Usuário:', user.name, '(', user.role, ')');
    
    // Para técnicos, garantir que o campus seja sempre o do usuário
    if (user.role === 'tecnico') {
      values.campus = user.campus || '';
      console.log('✅ onSubmit - Campus forçado para técnico:', values.campus);
    }
    
    // Validação adicional para técnicos
    if (user.role === 'tecnico' && !values.campus) {
      console.error('❌ onSubmit - Campus não definido para técnico');
      form.setError('campus', { 
        message: 'Erro interno: Campus do técnico não foi definido. Contate o administrador.' 
      });
      return;
    }
    
    const itemData = {
      ...values,
      id: editingItem?.id,
    };
    
    console.log('💾 onSubmit - Enviando dados:', itemData);
    
    // Chamar diretamente sem timeout - o retry está implementado no handleSaveItem
    onSave(itemData as any);
  }
  
  const handleClear = () => {
    form.reset();
    onClear();
  }

  const selectsKey = `${categories.length}-${sectors.length}-${campusList.length}`;
  const sectorNames = React.useMemo(() => sectors.map(s => s.name), [sectors]);
  const categoryNames = React.useMemo(() => categories.map(c => c.name), [categories]);
  const campusNames = React.useMemo(() => campusList.map(c => c.name), [campusList]);

  return (
    <Card id="inventory-form">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-foreground">
          <PlusCircle className="h-6 w-6" />
          {editingItem ? 'Editar Equipamento' : 'Adicionar Equipamento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="campus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campus*</FormLabel>
                    {user.role === 'admin' ? (
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value} 
                        defaultValue={editingItem?.campus}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um campus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campusNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Input 
                            value={field.value || user.campus} 
                            disabled={true}
                            className="bg-muted text-muted-foreground"
                            placeholder={user.campus || "Campus do técnico"}
                          />
                          <span className="text-xs text-muted-foreground">
                            (Campus fixo do técnico)
                          </span>
                        </div>
                      </FormControl>
                    )}
                    <FormMessage />
                    {user.role === 'tecnico' && (
                      <FormDescription className="text-xs text-blue-600">
                        Como técnico, você só pode cadastrar equipamentos no seu campus: <strong>{user.campus}</strong>
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="setor" render={({ field }) => (
                <FormItem>
                  <FormLabel>Setor*</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} defaultValue={editingItem?.setor}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um setor" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sectorNames.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}/>
               <FormField control={form.control} name="sala" render={({ field }) => (
                <FormItem>
                  <FormLabel>Sala/Ambiente</FormLabel>
                  <FormControl><Input placeholder="Ex: Sala 101" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria*</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} defaultValue={editingItem?.category}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryNames.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="brand" render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca</FormLabel>
                  <FormControl><Input placeholder="Ex: Dell" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="serial" render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Série*</FormLabel>
                  <FormControl><Input placeholder="Ex: SN-ABC1234" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="patrimony" render={({ field }) => (
                <FormItem>
                  <FormLabel>Patrimônio</FormLabel>
                  <FormControl><Input placeholder="Ex: PAT-0001" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status*</FormLabel>
                   <Select onValueChange={field.onChange} value={field.value} defaultValue={editingItem?.status} disabled={!!editingItem && (editingItem.status === 'emprestado' || editingItem.status === 'emuso')}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(ItemStatus) as Array<keyof typeof ItemStatus>)
                          .filter(s => s !== 'emprestado' && s !== 'emuso')
                          .map(s => <SelectItem key={s} value={s}>{ItemStatus[s]}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  <FormMessage />
                </FormItem>
              )}/>
              
               <FormField control={form.control} name="responsible" render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsável</FormLabel>
                  <FormControl><Input placeholder="Ex: João da Silva" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
              <FormField
                control={form.control}
                name="isFixed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Equipamento Fixo?</FormLabel>
                      <FormDescription>
                        Marque se este item é instalado permanentemente em um local (ex: projetor, switch).
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField control={form.control} name="obs" render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Observações</FormLabel>
                  <FormControl><Textarea placeholder="Notas adicionais..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}/>
            </div>
            <div className="flex gap-2 pt-4">
                <Button type="submit">
                    <Save className="mr-2 h-4 w-4" /> {editingItem ? 'Atualizar' : 'Salvar'}
                </Button>
                <Button type="button" variant="outline" onClick={handleClear}>
                    <X className="mr-2 h-4 w-4" /> Limpar
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
