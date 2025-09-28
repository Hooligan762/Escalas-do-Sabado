"use client";

import React, { useState } from 'react';
import { PasswordManager } from '@/components/dashboard/password-manager';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, Save, X, Eye, EyeOff, ExternalLink, Users, Settings, Shield } from 'lucide-react';
import type { User, Campus } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { PasswordVisibilityToggle } from '@/components/ui/password-visibility-toggle';
import { useHydrationWarningSupression } from '@/components/hydration-boundary';

interface PasswordManagementPageProps {
  users: User[];
  currentUser: User;
  campusList?: Campus[];
  onAddCampus?: (name: string) => void;
  onDeleteCampus?: (id: string | number) => void;
  onDeleteUser?: (userId: string | number) => void;
  onEditCampusAndUser?: (campusId: string | number, newCampusName: string, newUsername: string, newPassword?: string) => void;
}

export function PasswordManagementPage({ 
  users, 
  currentUser, 
  campusList = [],
  onAddCampus,
  onDeleteCampus,
  onDeleteUser,
  onEditCampusAndUser
}: PasswordManagementPageProps) {
  // Suprimir avisos de hidratação causados por extensões do navegador
  useHydrationWarningSupression();
  
  const [globalVisible, setGlobalVisible] = useState(false);
  const [individualVisibility, setIndividualVisibility] = useState<{[key: string]: boolean}>({});
  const [newCampusName, setNewCampusName] = useState('');
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editingCampusName, setEditingCampusName] = useState('');
  const [editingUsername, setEditingUsername] = useState('');
  const [editingPassword, setEditingPassword] = useState('');

  const isSuperAdmin = currentUser?.username === 'full';
  const isAdmin = currentUser?.role === 'admin';

  // Controles de visibilidade de senha
  const toggleIndividualVisibility = (userId: string) => {
    setIndividualVisibility(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const toggleGlobalVisibility = () => {
    const newGlobalState = !globalVisible;
    setGlobalVisible(newGlobalState);
    if (!newGlobalState) {
      setIndividualVisibility({});
    }
  };

  const isPasswordVisible = (userId: string) => {
    return globalVisible || individualVisibility[userId] || false;
  };

  // Funções de gerenciamento de campus
  const handleAddCampus = () => {
    const nameToAdd = newCampusName.trim();
    if (!nameToAdd) return;
    if (onAddCampus) {
      onAddCampus(nameToAdd);
      setNewCampusName('');
    }
  };

  const handleEditClick = (item: {id: string | number, name: string}, isUser: boolean = true) => {
    setEditingId(item.id);
    
    if (isUser) {
      // Editando um usuário existente
      const user = users.find(u => u.id === item.id);
      if (user) {
        setEditingCampusName(user.name); // Nome do usuário
        setEditingUsername(user.username);
        setEditingPassword(''); // Deixar vazio para não alterar
      }
    } else {
      // Editando um campus (criando técnico)
      setEditingCampusName(item.name);
      const campusBasedUsername = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      setEditingUsername(campusBasedUsername);
      setEditingPassword(''); // Nova senha será obrigatória
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingCampusName('');
    setEditingUsername('');
    setEditingPassword('');
  };

  const handleSaveEdit = () => {
    if (!editingId || !editingUsername.trim()) {
      return;
    }

    // Verificar se estamos editando um usuário existente
    const existingUser = users.find(u => u.id === editingId);
    
    if (existingUser) {
      // Editando usuário existente - usar função de edição de usuário
      const newPassword = editingPassword.trim() === '' ? undefined : editingPassword.trim();
      
      // Para usuários existentes, podemos usar uma nova função ou adaptar a atual
      if (onEditCampusAndUser && existingUser.campus) {
        const campus = campusList.find(c => c.name === existingUser.campus);
        if (campus) {
          onEditCampusAndUser(campus.id, existingUser.campus, editingUsername.trim(), newPassword);
        }
      }
    } else {
      // Criando novo técnico para campus
      const newPassword = editingPassword.trim() === '' ? 'password' : editingPassword.trim();
      if (onEditCampusAndUser) {
        onEditCampusAndUser(editingId, editingCampusName.trim(), editingUsername.trim(), newPassword);
      }
    }
    
    handleCancelEdit();
  };

  const campusWithUsers = campusList.map(campus => {
    const user = users.find(u => u.campus === campus.name);
    return { ...campus, user };
  });

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">
            Você não tem permissão para acessar o gerenciamento de senhas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" suppressHydrationWarning>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white" suppressHydrationWarning>
        <h1 className="text-3xl font-bold mb-2">
          🔐 Central de Gerenciamento de Senhas
        </h1>
        <p className="text-blue-100">
          {isSuperAdmin 
            ? "Como Super Administrador, você tem acesso total a todas as credenciais do sistema e pode gerenciar campus."
            : "Como Administrador, você pode visualizar as credenciais dos técnicos de campus e gerenciar campus."
          }
        </p>
      </div>

      {/* Seção de Adição de Campus */}
      {onAddCampus && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar Novo Campus</CardTitle>
            <CardDescription>
              Ao adicionar um novo campus, um usuário técnico será criado automaticamente com senha padrão.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Nome do novo campus..."
                value={newCampusName}
                onChange={(e) => setNewCampusName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCampus()}
              />
              <Button onClick={handleAddCampus} disabled={!newCampusName.trim()}>
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Campus
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção Unificada de Gerenciamento Completo */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {isSuperAdmin ? "Gerenciamento Completo do Sistema" : "Gerenciamento de Campus e Técnicos"}
              </CardTitle>
              <CardDescription>
                {isSuperAdmin 
                  ? "Visualize, edite, exclua e gerencie todos os usuários, campus e credenciais do sistema"
                  : "Visualize e gerencie campus, técnicos e suas credenciais"
                }
              </CardDescription>
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
          <div className="border rounded-lg max-h-96 overflow-y-auto" suppressHydrationWarning>
            <Table suppressHydrationWarning>
              <TableHeader className="sticky top-0 bg-white z-10" suppressHydrationWarning>
                <TableRow suppressHydrationWarning>
                  <TableHead>Nome/Campus</TableHead>
                  <TableHead>Login</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Campus</TableHead>
                  <TableHead className="min-w-[200px]">Senha</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* Renderizar todos os usuários filtrados por permissão */}
                {(isSuperAdmin ? users : users.filter(u => u.role === 'tecnico')).map((user) => (
                  <TableRow key={`user-${user.id}`} className="hover:bg-gray-50">
                    {editingId === user.id ? (
                      // Modo de edição para usuário
                      <>
                        <TableCell>
                          <span className="font-medium text-gray-600">{user.name}</span>
                          <div className="text-xs text-gray-400">(Nome não editável)</div>
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editingUsername} 
                            onChange={e => setEditingUsername(e.target.value)}
                            className="h-8"
                            placeholder="Novo login"
                          />
                        </TableCell>
                        <TableCell>
                          {user.username === 'full' ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <Shield className="h-3 w-3" />
                              Super Admin
                            </Badge>
                          ) : user.role === 'admin' ? (
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                              <Settings className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Users className="h-3 w-3" />
                              Técnico
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.campus || 'Global'}
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editingPassword} 
                            onChange={e => setEditingPassword(e.target.value)}
                            placeholder="Nova senha (deixe vazio para manter)"
                            type="password"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSaveEdit}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      // Modo de visualização para usuário
                      <>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {user.username}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.username === 'full' ? (
                            <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                              <Shield className="h-3 w-3" />
                              Super Admin
                            </Badge>
                          ) : user.role === 'admin' ? (
                            <Badge variant="default" className="flex items-center gap-1 w-fit">
                              <Settings className="h-3 w-3" />
                              Admin
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                              <Users className="h-3 w-3" />
                              Técnico
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.campus || 'Global'}
                        </TableCell>
                        <TableCell>
                          <PasswordVisibilityToggle 
                            password={user.password || 'Senha não definida'}
                            isVisible={isPasswordVisible(user.id.toString())}
                            onVisibilityToggle={(visible) => toggleIndividualVisibility(user.id.toString())}
                            showCopyButton={true}
                            badgeVariant="secondary"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => handleEditClick({id: user.id, name: user.name}, true)} 
                            disabled={!!editingId}
                            title="Editar usuário"
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          {onDeleteUser && user.role === 'tecnico' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              onClick={() => onDeleteUser(user.id)} 
                              disabled={!!editingId}
                              title="Excluir usuário"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
                
                {/* Separador visual entre usuários e campus */}
                {campusWithUsers.some(c => !c.user) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground bg-muted/30 font-medium py-2">
                      Campus sem Técnico Associado
                    </TableCell>
                  </TableRow>
                )}
                
                {/* Renderizar campus sem usuários */}
                {campusWithUsers.filter(c => !c.user).map(({ id, name }) => (
                  <TableRow key={`campus-${id}`} className="hover:bg-orange-50">
                    {editingId === id ? (
                      <>
                        <TableCell>
                          <Input 
                            value={editingCampusName} 
                            onChange={e => setEditingCampusName(e.target.value)}
                            className="h-8"
                            placeholder="Nome do campus"
                          />
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editingUsername} 
                            onChange={e => setEditingUsername(e.target.value)}
                            className="h-8"
                            placeholder="Login do técnico"
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Técnico</Badge>
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={editingPassword} 
                            onChange={e => setEditingPassword(e.target.value)}
                            placeholder="Senha do técnico"
                            type="password"
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell>—</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSaveEdit}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="font-medium text-orange-700">{name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Sem técnico</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">Campus</Badge>
                        </TableCell>
                        <TableCell className="text-orange-600">{name}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">Sem senha</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8" 
                            onClick={() => handleEditClick({id, name}, false)} 
                            disabled={!!editingId}
                            title="Criar técnico para este campus"
                          >
                            <Plus className="h-4 w-4 text-green-600" />
                          </Button>
                          {onDeleteCampus && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              onClick={() => onDeleteCampus(id)} 
                              disabled={!!editingId}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-700">Total de Usuários</h3>
          <p className="text-2xl font-bold text-blue-600">
            {isSuperAdmin ? users.length : users.filter(u => u.role === 'tecnico').length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-700">Campus</h3>
          <p className="text-2xl font-bold text-green-600">
            {campusList.length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-700">Técnicos</h3>
          <p className="text-2xl font-bold text-orange-600">
            {users.filter(u => u.role === 'tecnico').length}
          </p>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <h3 className="font-semibold text-gray-700">Senhas Visíveis</h3>
          <p className="text-2xl font-bold text-purple-600">
            {Object.values(individualVisibility).filter(Boolean).length + (globalVisible ? users.length : 0)}
          </p>
        </div>
      </div>

      {/* Dicas de Segurança */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Dicas de Segurança</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Use senhas com pelo menos 8 caracteres, incluindo letras, números e símbolos</li>
          <li>• Altere senhas padrão imediatamente após a criação de novos usuários</li>
          <li>• Não compartilhe credenciais por meios não seguros (email, chat, etc.)</li>
          <li>• Monitore regularmente o acesso aos sistemas</li>
          <li>• Use o botão de copiar para transferir senhas com segurança</li>
        </ul>
      </div>
    </div>
  );
}