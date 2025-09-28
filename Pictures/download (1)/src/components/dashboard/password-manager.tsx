"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PasswordVisibilityToggle } from '@/components/ui/password-visibility-toggle';
import { Eye, EyeOff, Shield, Users, Settings } from 'lucide-react';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface PasswordManagerProps {
  users: User[];
  currentUser: User;
  title?: string;
  description?: string;
  showCopyButtons?: boolean;
  allowEdit?: boolean;
}

export function PasswordManager({ 
  users, 
  currentUser, 
  title = "Gerenciador de Senhas",
  description = "Visualize e gerencie as senhas dos usuários do sistema",
  showCopyButtons = true,
  allowEdit = false
}: PasswordManagerProps) {
  const [globalVisible, setGlobalVisible] = useState(false);
  const [individualVisibility, setIndividualVisibility] = useState<{[key: string]: boolean}>({});

  const isSuperAdmin = currentUser?.username === 'full';
  const isAdmin = currentUser?.role === 'admin';

  // Filtrar usuários baseado nas permissões
  const filteredUsers = users.filter(user => {
    if (isSuperAdmin) return true; // Super admin vê todos
    if (isAdmin) return user.role === 'tecnico'; // Admin vê apenas técnicos
    return user.id === currentUser.id; // Usuários normais veem apenas a si mesmos
  });

  const toggleIndividualVisibility = (userId: string) => {
    setIndividualVisibility(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleGlobalVisibility = () => {
    const newGlobalState = !globalVisible;
    setGlobalVisible(newGlobalState);
    
    // Se está ocultando globalmente, limpar visibilidades individuais
    if (!newGlobalState) {
      setIndividualVisibility({});
    }
  };

  const isPasswordVisible = (userId: string) => {
    return globalVisible || individualVisibility[userId] || false;
  };

  const getRoleIcon = (role: string, username: string) => {
    if (username === 'full') return <Shield className="h-4 w-4 text-red-500" />;
    if (role === 'admin') return <Settings className="h-4 w-4 text-blue-500" />;
    return <Users className="h-4 w-4 text-green-500" />;
  };

  const getRoleBadge = (role: string, username: string) => {
    if (username === 'full') {
      return <Badge variant="destructive" className="flex items-center gap-1">
        <Shield className="h-3 w-3" />
        Super Admin
      </Badge>;
    }
    if (role === 'admin') {
      return <Badge variant="default" className="flex items-center gap-1">
        <Settings className="h-3 w-3" />
        Admin
      </Badge>;
    }
    return <Badge variant="secondary" className="flex items-center gap-1">
      <Users className="h-3 w-3" />
      Técnico
    </Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={toggleGlobalVisibility}
            className="flex items-center gap-2"
          >
            {globalVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {globalVisible ? 'Ocultar Todas' : 'Mostrar Todas'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <div className="border rounded-lg max-h-80 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10">
              <TableRow>
                <TableHead className="w-12"></TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Login</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead className="min-w-[200px]">Senha</TableHead>
                {allowEdit && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={allowEdit ? 7 : 6} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-gray-50">
                    <TableCell>
                      {getRoleIcon(user.role, user.username)}
                    </TableCell>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {user.username}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(user.role, user.username)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {user.campus || 'Global'}
                    </TableCell>
                    <TableCell>
                      <PasswordVisibilityToggle 
                        password={user.password || ''}
                        isVisible={isPasswordVisible(user.id.toString())}
                        onVisibilityToggle={(visible) => toggleIndividualVisibility(user.id.toString())}
                        showCopyButton={showCopyButtons && isPasswordVisible(user.id.toString())}
                        badgeVariant="secondary"
                      />
                    </TableCell>
                    {allowEdit && (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Editar
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredUsers.length > 0 && (
          <div className="flex justify-between items-center mt-3 text-sm text-muted-foreground">
            <span>
              {filteredUsers.length} usuário{filteredUsers.length !== 1 ? 's' : ''} encontrado{filteredUsers.length !== 1 ? 's' : ''}
            </span>
            <span>
              {Object.values(individualVisibility).filter(Boolean).length + (globalVisible ? filteredUsers.length : 0)} senha{Object.values(individualVisibility).filter(Boolean).length + (globalVisible ? filteredUsers.length : 0) !== 1 ? 's' : ''} visível{Object.values(individualVisibility).filter(Boolean).length + (globalVisible ? filteredUsers.length : 0) !== 1 ? 'is' : ''}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}