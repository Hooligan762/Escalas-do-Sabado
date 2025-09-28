
'use client';
import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getFullCurrentUser } from '@/lib/session';
import { getCampusList, getUsers, getInventory, writeData } from '@/lib/db';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import type { User, Campus, InventoryItem } from '@/lib/types';
import { redirect } from 'next/navigation';

import Header from '@/components/dashboard/header';
import UserManagementView from '@/components/dashboard/user-management-view';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import ClientOnly from '@/components/client-only';
import { Loader2 } from 'lucide-react';

export default function AdminUsersPage() {
    const [user, setUser] = React.useState<User | null>(null);
    const [initialCampusList, setInitialCampusList] = React.useState<Campus[]>([]);
    const [initialUsers, setInitialUsers] = React.useState<User[]>([]);
    const [initialInventory, setInitialInventory] = React.useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const { toast } = useToast();

    React.useEffect(() => {
        async function loadData() {
            try {
                // Middleware should handle this, but as a backup:
                const currentUser = await getFullCurrentUser();
                if (currentUser.role !== 'admin') {
                    redirect('/');
                }
                setUser(currentUser);

                const [campus, users, inv] = await Promise.all([
                    getCampusList(),
                    getUsers(),
                    getInventory(),
                ]);
                setInitialCampusList(campus);
                setInitialUsers(users);
                setInitialInventory(inv);
            } catch (e) {
                console.error("Failed to load admin data", e);
                // If getFullCurrentUser fails, it redirects, but we catch here just in case.
                redirect('/');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const [campusList, setCampusList] = useLocalStorage<Campus[]>("campus", initialCampusList);
    const [users, setUsers] = useLocalStorage<User[]>("users", initialUsers);
    const [inventory, setInventory] = useLocalStorage<InventoryItem[]>("inventory", initialInventory);

    // Sync localStorage with fetched data once loaded
    React.useEffect(() => {
        if (!isLoading) {
            setCampusList(initialCampusList);
            setUsers(initialUsers);
            setInventory(initialInventory);
        }
    }, [isLoading, initialCampusList, initialUsers, initialInventory, setCampusList, setUsers, setInventory]);

    // Persist state changes back to the server files
    const isMounted = React.useRef(false);
    React.useEffect(() => {
        // We only want to write back to the file after the initial sync from localStorage is done.
        if (isMounted.current && !isLoading) {
            writeData('campus', campusList);
            writeData('users', users);
            writeData('inventory', inventory);
        } else if (!isLoading) {
            isMounted.current = true;
        }
    }, [campusList, users, inventory, isLoading]);


    const handleAddCampus = (name: string) => {
        if (campusList.some(c => c.name.toLowerCase() === name.toLowerCase())) {
            toast({ title: "Campus Duplicado", description: `O campus "${name}" já existe.`, variant: "destructive" });
            return;
        }
        const newCampus: Campus = { id: uuidv4(), name };
        const newUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (users.some(u => u.username === newUsername)) {
            toast({ title: "Usuário Duplicado", description: `O nome de usuário "${newUsername}" gerado para este campus já existe. Por favor, escolha um nome de campus diferente.`, variant: "destructive"});
            return;
        }
        
        const newUser: User = {
            id: uuidv4(),
            username: newUsername,
            name: `Técnico ${name}`,
            role: 'tecnico',
            campus: name,
            password: 'password', // Default password for new users
        };
        setCampusList(prev => [...prev, newCampus].sort((a, b) => a.name.localeCompare(b.name)));
        setUsers(prev => [...prev, newUser]);
        toast({ title: "Campus Adicionado", description: `O campus "${name}" e o usuário "${newUser.username}" foram criados.` });
    };

    const handleDeleteCampus = (id: string) => {
        const campusToDelete = campusList.find(c => c.id === id);
        if (!campusToDelete) return;
        if (inventory.some(item => item.campus === campusToDelete.name)) {
            toast({ variant: 'destructive', title: 'Ação Bloqueada', description: `Não é possível excluir o campus "${campusToDelete.name}" pois existem itens de inventário associados a ele.` });
            return;
        }
        if (!window.confirm(`Tem certeza que deseja excluir o campus "${campusToDelete.name}" e seu usuário associado? Esta ação não pode ser desfeita.`)) return;
        
        setCampusList(prev => prev.filter(c => c.id !== id));
        setUsers(prev => prev.filter(u => u.campus !== campusToDelete.name));
        toast({ title: 'Campus Excluído', description: `O campus "${campusToDelete.name}" e seu usuário foram removidos.` });
    };

    const handleEditCampusAndUser = (campusId: string, newCampusName: string, newUsername: string, newPassword?: string) => {
        const oldCampus = campusList.find(c => c.id === campusId);
        if (!oldCampus) return;

        const oldCampusName = oldCampus.name;
        const oldUser = users.find(u => u.campus === oldCampusName);
        const isCampusNameChanging = oldCampusName.toLowerCase() !== newCampusName.toLowerCase();
        const isUsernameChanging = oldUser?.username.toLowerCase() !== newUsername.toLowerCase();

        if (isCampusNameChanging && campusList.some(c => c.id !== campusId && c.name.toLowerCase() === newCampusName.toLowerCase())) {
            toast({ variant: 'destructive', title: 'Nome de Campus Duplicado', description: 'Já existe um campus com este nome.' });
            return;
        }
        if (isUsernameChanging && users.some(u => u.id !== oldUser?.id && u.username.toLowerCase() === newUsername.toLowerCase())) {
            toast({ variant: 'destructive', title: 'Nome de Usuário Duplicado', description: 'Já existe outro usuário com este nome de usuário.' });
            return;
        }
        
        setCampusList(prev => prev.map(c => c.id === campusId ? { ...c, name: newCampusName } : c).sort((a,b) => a.name.localeCompare(b.name)));
        
        setUsers(prev => prev.map(u => {
            if (u.campus === oldCampusName) {
                const updatedUser: User = { 
                    ...u, 
                    campus: newCampusName, 
                    username: newUsername, 
                    name: `Técnico ${newCampusName}` 
                };
                if (newPassword) {
                    updatedUser.password = newPassword;
                }
                return updatedUser;
            }
            return u;
        }));
        
        if (isCampusNameChanging) {
            setInventory(prev => prev.map(item => item.campus === oldCampusName ? { ...item, campus: newCampusName } : item));
        }
        toast({ title: 'Campus Atualizado', description: `Campus, usuário e senha atualizados para "${newCampusName}".` });
    };

    if (isLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40">
                <div className="flex flex-col items-center gap-4 text-lg">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span>Carregando...</span>
                </div>
            </div>
        );
    }
    
    return (
        <ClientOnly>
            <div className="min-h-screen">
                <Header user={user} campusList={initialCampusList} inventory={inventory} activeCampus="all" onCampusChange={() => {}} />
                <main className="container mx-auto p-4 md:p-6 lg:p-8 mt-5">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/">
                                <ArrowLeft />
                            </Link>
                        </Button>
                        <h2 className="text-2xl font-bold text-foreground">Gerenciar Campus</h2>
                    </div>

                    <div className="grid gap-6">
                        <UserManagementView
                            campusList={campusList}
                            users={users}
                            onAddCampus={handleAddCampus}
                            onDeleteCampus={handleDeleteCampus}
                            onEditCampusAndUser={handleEditCampusAndUser}
                        />
                    </div>
                </main>
            </div>
        </ClientOnly>
    );
}
