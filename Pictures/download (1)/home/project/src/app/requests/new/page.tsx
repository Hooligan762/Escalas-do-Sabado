'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';

import { getCampusList, getSectors } from '@/lib/db';
import type { Campus, Sector, Request as SupportRequest } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Send, Loader2 } from 'lucide-react';
import Link from 'next/link';

const formSchema = z.object({
  requesterEmail: z.string().email('Por favor, insira um e-mail válido.'),
  campus: z.string().min(1, 'O campus é obrigatório.'),
  setor: z.string().min(1, 'O setor é obrigatório.'),
  sala: z.string().optional(),
  details: z.string().min(10, 'Por favor, forneça mais detalhes sobre sua solicitação (mínimo 10 caracteres).'),
});

type FormData = z.infer<typeof formSchema>;

export default function NewRequestPage() {
  const [campusList, setCampusList] = React.useState<Campus[]>([]);
  const [sectors, setSectors] = React.useState<Sector[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      requesterEmail: '',
      campus: '',
      setor: '',
      sala: '',
      details: '',
    },
  });

  React.useEffect(() => {
    async function fetchData() {
      try {
        const [campus, sectors] = await Promise.all([
          getCampusList(),
          getSectors(),
        ]);
        setCampusList(campus);
        setSectors(sectors);
      } catch (error) {
        console.error('Failed to fetch initial data', error);
        toast({
          variant: 'destructive',
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar a lista de campus e setores. Tente recarregar a página.',
        });
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  async function onSubmit(values: FormData) {
    setSubmitting(true);
    try {
      const now = new Date().toISOString();
      const newRequest: SupportRequest = {
        id: uuidv4(),
        ...values,
        status: 'aberto',
        createdAt: now,
        updatedAt: now,
      };
      
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        variant: 'destructive',
        title: 'Falha no Envio',
        description: 'Ocorreu um erro ao enviar sua solicitação. Por favor, tente novamente.',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Solicitação Enviada com Sucesso!</CardTitle>
                    <CardDescription>
                        Seu chamado foi registrado. Nossa equipe técnica entrará em contato em breve pelo e-mail fornecido.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Link href="/requests/new">
                        <Button className="w-full">
                           Fazer outra solicitação
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-muted/40">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-sky-600 bg-clip-text text-transparent">
            Portal de Solicitações NSI
          </CardTitle>
          <CardDescription>
            Precisa de ajuda? Preencha o formulário abaixo para abrir um chamado de suporte técnico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="requesterEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu E-mail*</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="seu.nome@una.br"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="campus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Campus*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o campus" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {campusList.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="setor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setor*</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o setor" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {sectors.map((s) => (
                            <SelectItem key={s.id} value={s.name}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sala"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sala/Ambiente</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 101, Auditório" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição da Solicitação*</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: O projetor da sala não está ligando. Já tentei trocar o cabo de energia mas não adiantou."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Enviar Solicitação
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
