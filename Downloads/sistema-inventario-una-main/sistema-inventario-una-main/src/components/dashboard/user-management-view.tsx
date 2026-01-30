"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, Save, X, Eye, EyeOff, ExternalLink } from 'lucide-react';
import type { Campus, User } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from '../ui/badge';

interface UserManagementViewProps {
    campusList: Campus[];
    users: User[];
    currentUser: User; // Usuário atual para controle de permissões
    onAddCampus: (name: string) => void;
    onDeleteCampus: (id: string | number) => void;
    onDeleteUser: (userId: string | number) => void; // Nova função para excluir usuário diretamente
    onEditCampusAndUser: (campusId: string | number, newCampusName: string, newUsername: string, newPassword?: string) => void;
}

export default function UserManagementView({ campusList, users, currentUser, onAddCampus, onDeleteCampus, onDeleteUser, onEditCampusAndUser }: UserManagementViewProps) {
    // Extract campus name for rendering
    const currentUserCampusName = typeof currentUser.campus === 'object' ? currentUser.campus?.name : currentUser.campus;

    const [newCampusName, setNewCampusName] = useState('');
    const [editingId, setEditingId] = useState<string | number | null>(null);
    const [editingCampusName, setEditingCampusName] = useState('');
    const [editingUsername, setEditingUsername] = useState('');
    const [editingPassword, setEditingPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [individualPasswordVisibility, setIndividualPasswordVisibility] = useState<{ [key: string]: boolean }>({});

    // Verificar se o usuário atual é o super usuário
    const isSuperAdmin = currentUser?.username === 'full';
    const isAdmin = currentUser?.role === 'admin';

    // Função para alternar visibilidade individual de senha
    const toggleIndividualPasswordVisibility = (userId: string | number) => {
        setIndividualPasswordVisibility(prev => ({
            ...prev,
            [userId.toString()]: !prev[userId.toString()]
        }));
    };

    const handleAdd = () => {
        const nameToAdd = newCampusName.trim();
        if (!nameToAdd) return;
        onAddCampus(nameToAdd);
        setNewCampusName('');
    };

    // Função para deletar um campus
    const handleDeleteCampus = (id: string | number) => {
        console.log('Tentando deletar campus com ID:', id);
        onDeleteCampus(id);
    };

    // Função para deletar um usuário diretamente
    const handleDeleteUser = (userId: string | number, username: string) => {
        // Impedir que o super usuário seja excluído
        if (username === 'full') {
            alert('O super usuário não pode ser excluído.');
            return;
        }

        // Impedir que o usuário admin seja excluído por alguém que não seja o super usuário
        if (username === 'admin' && !isSuperAdmin) {
            alert('Apenas o super usuário pode excluir o administrador padrão.');
            return;
        }

        if (window.confirm(`Tem certeza que deseja excluir o usuário ${username}?`)) {
            console.log('Tentando deletar usuário com ID:', userId);
            onDeleteUser(userId);
        }
    };

    const handleEditClick = (campus: Campus) => {
        const user = users.find(u => u.campus === campus.name);
        setEditingId(campus.id);
        setEditingCampusName(campus.name);

        // Se encontrar o usuário, use o nome de usuário atual
        // caso contrário, gere com base no nome do campus
        if (user && user.username) {
            setEditingUsername(user.username);
        } else {
            const campusBasedUsername = campus.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            setEditingUsername(campusBasedUsername);
        }
        console.log('Nome de usuário definido para edição:', user?.username || 'Gerado automaticamente');

        setEditingPassword(''); // Limpar o campo de senha por segurança
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingCampusName('');
        setEditingUsername('');
        setEditingPassword('');
    };

    const handleSaveEdit = () => {
        // Validação básica do campo de edição
        if (!editingId || !editingCampusName.trim()) {
            alert('Preencha o campo Nome do Campus');
            return;
        }

        if (!editingUsername.trim()) {
            alert('O campo de Login não pode estar vazio');
            return;
        }

        // Determinar se é necessária uma senha (novo usuário ou alteração de senha)
        const campus = campusList.find(c => c.id === editingId);
        const existingUser = users.find(u => u.campus === campus?.name);

        // Validar a senha se foi fornecida
        if (editingPassword.trim() !== '') {
            console.log('Senha fornecida, validando...');
            // Senha não é obrigatória ter símbolos, mas é permitido qualquer combinação
            // de letras, números e símbolos para maior segurança
        }

        // Se for um novo usuário e não foi fornecida senha, usar 'password'
        // Se for usuário existente e o campo está vazio, manter a senha atual (undefined)
        // Se foi digitada uma nova senha, usar essa senha
        const newPassword = !existingUser && editingPassword.trim() === ''
            ? 'password'
            : (editingPassword.trim() === '' ? undefined : editingPassword.trim());

        console.log('Salvando senha:', existingUser ? (editingPassword.trim() === '' ? 'manter atual' : 'nova senha') : 'senha padrão');

        // Se não há usuário associado a este campus, mostrar uma mensagem
        if (!existingUser) {
            console.log('Criando novo usuário técnico para o campus:', editingCampusName);
        }

        // Usar o nome de usuário editado pelo usuário
        onEditCampusAndUser(editingId, editingCampusName.trim(), editingUsername.trim(), newPassword);
        handleCancelEdit();
    };

    // Listar todos os campus e seus usuários técnicos correspondentes
    console.log('Campus disponíveis:', campusList);
    console.log('Usuários disponíveis:', users);

    const campusWithUsers = campusList.map(campus => {
        // Encontrar o usuário técnico associado ao campus ou criar um objeto temporário para exibição
        const user = users.find(u => u.campus === campus.name);
        console.log(`Campus: ${campus.name}, Usuário encontrado:`, user);
        return { ...campus, user };
    });

    // Não filtra mais por user, exibe todos os campus
    console.log('Campus com usuários:', campusWithUsers);


    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Adicionar Novo Campus</CardTitle>
                    <CardDescription>Ao adicionar um novo campus, um usuário técnico será criado automaticamente com login baseado no nome do campus e senha "password".</CardDescription>
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
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Gerenciar Campus</CardTitle>
                            <CardDescription>
                                Edite o nome do campus, o login e senha do técnico, ou remova um campus existente.
                                As alterações são salvas no banco de dados e serão necessárias para o login.
                                As senhas podem incluir letras, números e símbolos especiais para maior segurança.
                            </CardDescription>
                        </div>

                        {/* Link para gerenciamento avançado de senhas */}
                        {(isAdmin || isSuperAdmin) && (
                            <a
                                href="/admin/passwords"
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Acesse o gerenciamento avançado de senhas"
                            >
                                <Eye className="h-4 w-4" />
                                Gerenciador Avançado
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-end mb-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-xs flex items-center gap-2"
                        >
                            {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                            {showPassword ? 'Ocultar Todas as Senhas' : 'Mostrar Todas as Senhas'}
                        </Button>
                    </div>
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Campus</TableHead>
                                    <TableHead>Login do Técnico</TableHead>
                                    <TableHead>Senha</TableHead>
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
                                                        onChange={e => setEditingUsername(e.target.value)}
                                                        title="Digite o nome de usuário desejado para o técnico deste campus"
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={editingPassword}
                                                        onChange={e => setEditingPassword(e.target.value)}
                                                        placeholder="Deixe em branco para manter a atual"
                                                        type={showPassword ? "text" : "password"}
                                                        className="h-8"
                                                        title="Pode conter letras, números e símbolos para maior segurança"
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
                                                    {user ?
                                                        <Badge variant="outline">{user.username || 'N/A'}</Badge> :
                                                        <Badge variant="destructive">Sem usuário</Badge>
                                                    }
                                                </TableCell>
                                                <TableCell>
                                                    {user ? (
                                                        <div className="flex items-center gap-2">
                                                            {(showPassword || individualPasswordVisibility[user.id.toString()]) ?
                                                                <Badge variant="secondary" className="font-mono">{user.password}</Badge> :
                                                                <Badge variant="secondary">••••••••</Badge>
                                                            }
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => toggleIndividualPasswordVisibility(user.id)}
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                {(showPassword || individualPasswordVisibility[user.id.toString()]) ?
                                                                    <EyeOff className="h-3 w-3" /> :
                                                                    <Eye className="h-3 w-3" />
                                                                }
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Badge variant="destructive">Sem senha</Badge>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick({ id, name })} disabled={!!editingId}>
                                                        <Edit className="h-4 w-4 text-blue-600" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteCampus(id)} disabled={!!editingId}>
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

            {/* Seção para gerenciamento de todos os usuários (visível apenas para super admin) */}
            {isSuperAdmin && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle className="text-amber-600">Super Admin: Gerenciar Todos Usuários</CardTitle>
                        <CardDescription>
                            Como super administrador, você tem permissão para visualizar, editar e excluir qualquer usuário
                            do sistema, incluindo administradores. Esta área é acessível apenas para o super usuário.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-end mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs flex items-center gap-2"
                            >
                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                {showPassword ? 'Ocultar Todas as Senhas' : 'Mostrar Todas as Senhas'}
                            </Button>
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Login</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Campus</TableHead>
                                        <TableHead>Senha</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.username}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.role === 'admin' ?
                                                    user.username === 'full' ?
                                                        <Badge variant="destructive">Super Admin</Badge> :
                                                        <Badge variant="default">Admin</Badge> :
                                                    <Badge variant="secondary">Técnico</Badge>
                                                }
                                            </TableCell>
                                            <TableCell>{typeof user.campus === 'object' ? user.campus?.name : user.campus || 'Global'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {(showPassword || individualPasswordVisibility[user.id.toString()]) ?
                                                        <Badge className="font-mono">{user.password}</Badge> :
                                                        <Badge variant="outline">••••••••</Badge>
                                                    }
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleIndividualPasswordVisibility(user.id)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        {(showPassword || individualPasswordVisibility[user.id.toString()]) ?
                                                            <EyeOff className="h-3 w-3" /> :
                                                            <Eye className="h-3 w-3" />
                                                        }
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {/* Não permitir excluir o próprio super usuário */}
                                                {user.username !== 'full' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleDeleteUser(user.id, user.username)}
                                                        disabled={!!editingId}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Seção para admins normais verem todos os usuários de campus mas sem poder excluir admins */}
            {!isSuperAdmin && currentUser?.role === 'admin' && (
                <Card className="mt-6">
                    <CardHeader>
                        <CardTitle>Gerenciar Todos Usuários</CardTitle>
                        <CardDescription>
                            Como administrador, você pode visualizar todos os técnicos de campus e suas credenciais.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-end mb-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs flex items-center gap-2"
                            >
                                {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                {showPassword ? 'Ocultar Todas as Senhas' : 'Mostrar Todas as Senhas'}
                            </Button>
                        </div>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Login</TableHead>
                                        <TableHead>Campus</TableHead>
                                        <TableHead>Senha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.filter(u => u.role === 'tecnico').map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>{user.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{user.username}</Badge>
                                            </TableCell>
                                            <TableCell>{typeof user.campus === 'object' ? user.campus?.name : user.campus || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {(showPassword || individualPasswordVisibility[user.id.toString()]) ?
                                                        <Badge className="font-mono">{user.password}</Badge> :
                                                        <Badge variant="outline">••••••••</Badge>
                                                    }
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => toggleIndividualPasswordVisibility(user.id)}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        {(showPassword || individualPasswordVisibility[user.id.toString()]) ?
                                                            <EyeOff className="h-3 w-3" /> :
                                                            <Eye className="h-3 w-3" />
                                                        }
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}
        </>
    );
}
