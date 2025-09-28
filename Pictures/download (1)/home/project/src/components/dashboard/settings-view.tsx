"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Edit, Save, X, Download } from 'lucide-react';
import type { Category, Sector, User, Campus, Loan, InventoryItem, AuditLogEntry } from '@/lib/types';
import { readData } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';


// Componente de Gerenciamento de Listas (Categorias, Setores)
interface ListManagementProps {
    title: string;
    description: string;
    items: { id: string; name: string }[];
    onAdd: (name: string) => void;
    onDelete: (id: string) => void;
    onEdit: (id: string, newName: string) => void;
}

const ListManager: React.FC<ListManagementProps> = ({ title, description, items, onAdd, onDelete, onEdit }) => {
    const [newItemName, setNewItemName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const handleAdd = () => {
        const nameToAdd = newItemName.trim();
        if (!nameToAdd) return;
        onAdd(nameToAdd);
        setNewItemName('');
    };

    const handleDelete = (id: string) => {
        onDelete(id);
    };

    const handleEditClick = (item: { id: string; name: string }) => {
        setEditingId(item.id);
        setEditingName(item.name);
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditingName('');
    };

    const handleSaveEdit = () => {
        if (!editingId || !editingName.trim()) return;

        const originalItem = items.find(item => item.id === editingId);
        if (originalItem && originalItem.name === editingName.trim()) {
            handleCancelEdit();
            return;
        }
        onEdit(editingId, editingName.trim());
        handleCancelEdit();
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="Novo nome..."
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            disabled={!!editingId}
                        />
                        <Button onClick={handleAdd} disabled={!newItemName.trim() || !!editingId}>
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar
                        </Button>
                    </div>
                    <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                        {items.length > 0 ? items.map(item => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                {editingId === item.id ? (
                                    <div className="flex-grow flex items-center gap-2">
                                        <Input 
                                            value={editingName} 
                                            onChange={e => setEditingName(e.target.value)} 
                                            onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                            autoFocus
                                            className="h-8"
                                        />
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleSaveEdit}>
                                            <Save className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <span>{item.name}</span>
                                        <div className="flex items-center">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(item)} disabled={!!editingId}>
                                                 <Edit className="h-4 w-4 text-blue-600" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(item.id)} disabled={!!editingId}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center">Nenhum item na lista.</p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

// Componente para a funcionalidade de Backup
const BackupManager = () => {
    const { toast } = useToast();

    const handleExport = async () => {
        try {
            toast({ title: 'Gerando backup...', description: 'Aguarde enquanto compilamos todos os dados do sistema.'});

            const [inventory, auditLog, loans, categories, sectors, campus, users, requests] = await Promise.all([
                readData<InventoryItem>('inventory'),
                readData<AuditLogEntry>('auditLog'),
                readData<Loan>('loans'),
                readData<Category>('categories'),
                readData<Sector>('sectors'),
                readData<Campus>('campus'),
                readData<User>('users'),
                readData<any>('requests'), // Adjust type as needed
            ]);

            const allData = {
                inventory,
                auditLog,
                loans,
                categories,
                sectors,
                campus,
                users,
                requests,
                backupDate: new Date().toISOString(),
            };

            const jsonString = JSON.stringify(allData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            link.href = url;
            link.download = `backup-una-nsi-${date}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            toast({ title: 'Backup Concluído!', description: 'O arquivo JSON com todos os dados foi baixado.'});

        } catch (error) {
            console.error('Falha ao exportar dados:', error);
            toast({
                variant: 'destructive',
                title: 'Erro no Backup',
                description: 'Não foi possível gerar o arquivo de backup. Tente novamente.',
            });
        }
    };

    return (
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Backup e Exportação de Dados</CardTitle>
                <CardDescription>
                    Crie um backup completo de todos os dados do sistema. Isso inclui inventário, usuários, logs e todas as configurações.
                    O arquivo será salvo no formato JSON.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Todos os Dados
                </Button>
            </CardContent>
        </Card>
    )
}

// Componente principal da View de Configurações
interface SettingsViewProps {
    categories: Category[];
    sectors: Sector[];
    onAddCategory: (name: string) => void;
    onDeleteCategory: (id: string) => void;
    onEditCategory: (id: string, newName: string) => void;
    onAddSector: (name: string) => void;
    onDeleteSector: (id: string) => void;
    onEditSector: (id: string, newName: string) => void;
}


export default function SettingsView({ 
    categories, 
    sectors, 
    onAddCategory, 
    onDeleteCategory,
    onEditCategory,
    onAddSector, 
    onDeleteSector,
    onEditSector
}: SettingsViewProps) {
    return (
        <div className="grid gap-6 md:grid-cols-2">
             <ListManager
                title="Gerenciar Setores"
                description="Adicione, remova ou edite os setores dos campus."
                items={sectors}
                onAdd={onAddSector}
                onDelete={onDeleteSector}
                onEdit={onEditSector}
            />
            <ListManager
                title="Gerenciar Categorias"
                description="Adicione, remova ou edite as categorias de equipamentos."
                items={categories}
                onAdd={onAddCategory}
                onDelete={onDeleteCategory}
                onEdit={onEditCategory}
            />
             <BackupManager />
        </div>
    );
}
