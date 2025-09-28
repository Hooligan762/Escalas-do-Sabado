"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { User } from '@/lib/types';

// Função para alterar a senha do administrador padrão
async function changeAdminPassword(password: string): Promise<{success: boolean, message: string}> {
  try {
    const response = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return { success: false, message: 'Erro ao comunicar com o servidor' };
  }
}

interface AdminPasswordManagerProps {
  currentUser: User;
}

export default function AdminPasswordManager({ currentUser }: AdminPasswordManagerProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const { toast } = useToast();

  // Verificar se o usuário atual é o super usuário (username: 'full')
  const isSuperAdmin = currentUser.username === 'full';

  // Verificar se as senhas digitadas são iguais
  useEffect(() => {
    if (confirmPassword) {
      setPasswordMatch(newPassword === confirmPassword);
    } else {
      setPasswordMatch(true);
    }
  }, [newPassword, confirmPassword]);

  const handleSavePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Campos incompletos',
        description: 'Preencha ambos os campos de senha.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Senhas não conferem',
        description: 'A confirmação de senha não corresponde à nova senha.',
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await changeAdminPassword(newPassword);
      
      if (result.success) {
        toast({
          title: 'Senha alterada',
          description: 'A senha do administrador foi alterada com sucesso.',
        });
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: result.message || 'Não foi possível alterar a senha.',
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao tentar alterar a senha.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Se não for super administrador, não exibir o componente
  if (!isSuperAdmin) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-amber-500" />
          Alterar Senha do Administrador Padrão
        </CardTitle>
        <CardDescription>
          Como super administrador, você tem poder exclusivo para alterar a senha do administrador padrão (usuário 'admin').
          Esta é uma operação restrita que só pode ser realizada pelo super usuário, pois você tem o controle total do sistema.
          O administrador padrão não pode alterar sua própria senha, apenas você como super usuário pode fazer isso.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              Nova senha para o administrador
            </label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Digite a nova senha"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirme a nova senha
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirme a nova senha"
              className={!passwordMatch ? 'border-red-500' : ''}
            />
            {!passwordMatch && (
              <p className="text-sm text-red-500">As senhas não conferem</p>
            )}
          </div>
          <Button 
            onClick={handleSavePassword} 
            disabled={isProcessing || !newPassword || !confirmPassword || !passwordMatch}
            className="w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {isProcessing ? 'Salvando...' : 'Salvar nova senha'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}