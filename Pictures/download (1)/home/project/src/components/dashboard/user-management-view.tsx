"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, Save, X } from 'lucide-react';
import type { Campus, User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';

interface UserManagementViewProps {
    campusList: Campus[];
    users: User[];
    onAddCampus: (name: string) => void;
    onDeleteCampus: (id: string | number) => void;
    onEditCampusAndUser: (campusId: string | number, newCampusName: string, newUsername: string, newPassword?: string) => void;
}

export default function UserManagementView({ campusList, users, onAddCampus, onDeleteCampus, onEditCampusAndUser }: UserManagementViewProps) {
    const [newCampusName, setNewCampusName] = useState('');
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editingCampusName, setEditingCampusName] = useState('');
    const [editingUsername, setEditingUsername] = useState('');

    const handleAdd = () => {
        const nameToAdd = newCampusName.trim();
        if (!nameToAdd) return;
        onAddCampus(nameToAdd);
        setNewCampusName('');
    };

    const handleEditClick = (campus: Campus) => {
        const user = users.find(u => u.campus === campus.name);
        setEditingId(campus.id);
        setEditingCampusName(campus.name);
        setEditingUsername(user?.username || '');
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingCampusName('');
        setEditingUsername('');
    };
    
    const handleDelete = (id: string | number) => {
        onDeleteCampus(id);
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingCampusName.trim() || !editingUsername.trim()) return;
        onEditCampusAndUser(editingId, editingCampusName.trim(), editingUsername.trim());
        handleCancelEdit();
    };
    
    // Exclude the 'Full' superuser and admins from being managed in the UI
    const campusWithUsers = campusList.map(campus => {
        const user = users.find(u => u.campus === campus.name && u.role === 'tecnico');
        return { ...campus, user };
    }).filter(c => c.user); // Only show campuses that have a manageable user

    const defaultPasswords = [
      { role: "Técnico de Campus", username: "(nome do campus em minúsculo)", password: "password" },
      { role: "Administrador", username: "admin", password: "password" },
    ];


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Adicionar Novo Campus</CardTitle>
                    <CardDescription>Ao adicionar um novo campus, um usuário técnico padrão será criado automaticamente.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="flex gap-2">
                        <Input
                            placeholder="Nome do novo campus..."
                            value={newCampusName}
                            onChange={(e) => setNewCampusName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                        />
                        <Button onClick={handleAdd} disabled={!newCampusName.trim()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Campus
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Gerenciar Campus e Técnicos</CardTitle>
                    <CardDescription>Edite o nome do campus e o nome de usuário do técnico, ou remova um campus existente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campus</TableHead>
                                    <TableHead>Usuário do Técnico</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {campusWithUsers.map(({ id, name, user }) => (
                                    <TableRow key={id}>
                                    {editingId === id ? (
                                        <>
                                            <TableCell>
                                                <Input 
                                                    value={editingCampusName} 
                                                    onChange={e => setEditingCampusName(e.target.value)}
                                                    className="h-8"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input 
                                                    value={editingUsername} 
                                                    onChange={e => setEditingUsername(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
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
                                        <>
                                            <TableCell className="font-medium">{name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user?.username || 'N/A'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick({id, name})} disabled={!!editingId}>
                                                    <Edit className="h-4 w-4 text-blue-600" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(id)} disabled={!!editingId}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
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

            <Card>
              <CardHeader>
                <CardTitle>Senhas Padrão</CardTitle>
                <CardDescription>
                  Estas são as senhas padrão para os tipos de usuário. A senha do superusuário não é exibida.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tipo de Usuário</TableHead>
                      <TableHead>Nome de Usuário</TableHead>
                      <TableHead>Senha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {defaultPasswords.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.role}</TableCell>
                        <TableCell><Badge variant="secondary">{item.username}</Badge></TableCell>
                        <TableCell><Badge variant="outline">{item.password}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
        </>
    );
}
