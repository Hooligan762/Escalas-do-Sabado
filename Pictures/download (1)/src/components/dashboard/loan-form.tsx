"use client";

import * as React from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { CalendarIcon, Save } from "lucide-react";
import type { InventoryItem, Loan } from '@/lib/types';
import { cn } from "@/lib/utils";

const formSchema = z.object({
  borrowerName: z.string().min(3, "O nome do mutuário é obrigatório."),
  borrowerContact: z.string().min(5, "O contato é obrigatório (email ou telefone)."),
  expectedReturnDate: z.date({
    required_error: "A data de devolução prevista é obrigatória.",
  }),
  notes: z.string().optional(),
});

type LoanFormData = z.infer<typeof formSchema>;

type LoanFormProps = {
  items: InventoryItem[];
  onSave: (loanData: Omit<Loan, 'id' | 'itemId' | 'itemSerial' | 'itemCategory' | 'loanDate' | 'status' | 'campus' | 'actualReturnDate' | 'loaner'>, items: InventoryItem[]) => void;
  onClose: () => void;
};

export default function LoanForm({ items, onSave, onClose }: LoanFormProps) {
  const form = useForm<LoanFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      borrowerName: '',
      borrowerContact: '',
      expectedReturnDate: undefined,
      notes: '',
    },
  });
  
  const isMultiple = items.length > 1;
  const title = isMultiple ? `Emprestar ${items.length} Itens` : `Emprestar Item: ${items[0]?.category} (S/N: ${items[0]?.serial})`;
  const description = isMultiple ? "Preencha os detalhes abaixo. A informação será aplicada a todos os itens selecionados." : "Preencha os detalhes do empréstimo para este item.";


  function onSubmit(values: LoanFormData) {
    onSave(values, items);
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
           <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="borrowerName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Mutuário*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: João da Silva" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="borrowerContact"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contato (Email/Telefone)*</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: joao.silva@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expectedReturnDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data de Devolução Prevista*</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP", { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Ex: emprestado para o evento X" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" /> Confirmar Empréstimo
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
