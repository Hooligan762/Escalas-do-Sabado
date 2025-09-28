'use client';

import * as React from 'react';
import { getFullCurrentUser } from '@/lib/session';
import { 
  getCampusList, 
  getUsers, 
  getInventory, 
  deleteCampus as dbDeleteCampus, 
  deleteUser as dbDeleteUser,
  insertCampus,
  insertUser,
  updateCampus,
  updateUser,
  updateInventoryForCampusRename
} from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import type { User, Campus, InventoryItem } from '@/lib/types';
import { redirect } from 'next/navigation';

import Header from '@/components/dashboard/header';
import { PasswordManagementPage } from '@/components/dashboard/password-management-page';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, Shield } from 'lucide-react';
import ClientOnly from '@/components/client-only';
import { Loader2 } from 'lucide-react';

export default function AdminPasswordsPage() {
    const [user, setUser] = React.useState<User | null>(null);
    const [initialUsers, setInitialUsers] = React.useState<User[]>([]);
    const [initialCampusList, setInitialCampusList] = React.useState<Campus[]>([]);
    const [initialInventory, setInitialInventory] = React.useState<InventoryItem[]>([]);
    const [isLoading, setIsLoading] = React.useState(true);
    
    const { toast } = useToast();

    React.useEffect(() => {
        async function loadData() {
            try {
                const currentUser = await getFullCurrentUser();
                
                // Verificar permissões - apenas admins e super admins
                if (currentUser.role !== 'admin') {
                    redirect('/');
                }
                
                setUser(currentUser);

                const [users, campus, inv] = await Promise.all([
                    getUsers(),
                    getCampusList(),
                    getInventory(),
                ]);
                setInitialUsers(users);
                setInitialCampusList(campus);
                setInitialInventory(inv);
                
            } catch (e) {
                console.error("Failed to load password management data", e);
                redirect('/');
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const handleAddCampus = async (name: string) => {
        console.log('🏫 handleAddCampus - Iniciando adição de campus:', name);
        
        try {
            console.log('🏫 handleAddCampus - Obtendo lista atual de campus...');
            const currentCampusList = await getCampusList();
            console.log('🏫 handleAddCampus - Campus atuais:', currentCampusList.length);
            
            if (currentCampusList.some(c => c.name.toLowerCase() === name.toLowerCase())) {
                console.log('❌ handleAddCampus - Campus duplicado:', name);
                toast({ title: "Campus Duplicado", description: `O campus "${name}" já existe.`, variant: "destructive" });
                return;
            }
            
            console.log('🏫 handleAddCampus - Obtendo lista atual de usuários...');
            const currentUsers = await getUsers();
            console.log('🏫 handleAddCampus - Usuários atuais:', currentUsers.length);
            
            const newUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            console.log('🏫 handleAddCampus - Username gerado:', newUsername);
            
            if (currentUsers.some(u => u.username === newUsername)) {
                console.log('❌ handleAddCampus - Username duplicado:', newUsername);
                toast({ title: "Usuário Duplicado", description: `O nome de usuário "${newUsername}" gerado para este campus já existe.`, variant: "destructive"});
                return;
            }

            console.log('🏫 handleAddCampus - Iniciando inserção no banco de dados...');
            
            console.log('🏫 handleAddCampus - Inserindo campus...');
            const newCampus = await insertCampus({ name });
            console.log('✅ handleAddCampus - Campus inserido:', newCampus);
            
            console.log('🏫 handleAddCampus - Inserindo usuário técnico...');
            const newUser = await insertUser({
                username: newUsername,
                name: `Técnico ${name}`,
                role: 'tecnico',
                campus: name,
                password: 'password',
            });
            console.log('✅ handleAddCampus - Usuário inserido:', newUser);
            
            console.log('🏫 handleAddCampus - Atualizando estados locais...');
            const updatedCampusList = [...currentCampusList, newCampus].sort((a,b) => a.name.localeCompare(b.name));
            const updatedUsers = [...currentUsers, newUser];
            
            setInitialCampusList(updatedCampusList);
            setInitialUsers(updatedUsers);
            
            console.log('✅ handleAddCampus - Estados atualizados com sucesso');
            
            toast({ title: "Campus Adicionado", description: `O campus "${name}" e o usuário "${newUser.username}" foram criados.` });
            
            console.log('🎉 handleAddCampus - Processo completo finalizado com sucesso');
            
        } catch (error) {
            console.error('❌ handleAddCampus - Erro completo:', error);
            if (error instanceof Error) {
                console.error('❌ handleAddCampus - Stack trace:', error.stack);
            }
            toast({ 
                variant: 'destructive', 
                title: 'Erro', 
                description: `Ocorreu um erro ao adicionar o campus: ${error instanceof Error ? error.message : 'Erro desconhecido'}` 
            });
        }
    };

    const handleDeleteUser = async (userId: string | number) => {
        try {
            const currentUsers = await getUsers();
            const userToDelete = currentUsers.find(u => u.id === userId);
            
            if (!userToDelete) return;
            
            const isCurrentUserSuperAdmin = user?.username === 'full';
            
            if (userToDelete.role === 'admin' && !isCurrentUserSuperAdmin) {
                toast({
                    variant: 'destructive',
                    title: 'Permissão Negada',
                    description: 'Apenas o super administrador pode excluir usuários administradores.'
                });
                return;
            }
            
            if (userToDelete.username === 'full') {
                toast({
                    variant: 'destructive',
                    title: 'Operação Inválida',
                    description: 'O super administrador não pode ser excluído.'
                });
                return;
            }
            
            await dbDeleteUser(userId.toString());
            const updatedUsers = await getUsers();
            setInitialUsers(updatedUsers);
            
            toast({
                title: 'Usuário Excluído',
                description: `O usuário "${userToDelete.username}" foi removido com sucesso.`
            });
            
        } catch (error) {
            console.error('Erro ao excluir usuário:', error);
            toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Ocorreu um erro ao excluir o usuário.'
            });
        }
    };

    const handleDeleteCampus = async (id: string | number) => {
        const currentCampusList = await getCampusList();
        const currentUsers = await getUsers();
        
        const campusToDelete = currentCampusList.find(c => c.id === id);
        if (!campusToDelete) return;

        if (!window.confirm(`Tem certeza que deseja excluir o campus "${campusToDelete.name}" e seu usuário associado?`)) return;
        
        const userToDelete = currentUsers.find(u => u.campus === campusToDelete.name);
        
        try {
            const result = await dbDeleteCampus(id.toString());
            
            if (!result.success) {
                toast({ 
                    variant: 'destructive', 
                    title: 'Ação Bloqueada', 
                    description: result.error || 'Não é possível excluir o campus pois existem dependências associadas a ele.'
                });
                return;
            }
            
            if (userToDelete) {
                await dbDeleteUser(userToDelete.id.toString());
            }
            
            const updatedCampusList = currentCampusList.filter(c => c.id !== id);
            const updatedUsers = currentUsers.filter(u => u.campus !== campusToDelete.name);
            
            setInitialCampusList(updatedCampusList.sort((a,b) => a.name.localeCompare(b.name)));
            setInitialUsers(updatedUsers);

            toast({ title: 'Campus Excluído', description: `O campus "${campusToDelete.name}" e seu usuário foram removidos.` });
        } catch (error) {
            console.error('Erro ao excluir campus e usuário:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro', 
                description: 'Ocorreu um erro ao excluir o campus.' 
            });
        }
    };

    const handleEditCampusAndUser = async (campusId: string | number, newCampusName: string, newUsername: string, newPassword?: string) => {
        try {
            const currentCampusList = await getCampusList();
            const currentUsers = await getUsers();
            const currentInventory = await getInventory();
    
            const oldCampus = currentCampusList.find(c => c.id === campusId);
            if (!oldCampus) return;
    
            const oldCampusName = oldCampus.name;
            const oldUser = currentUsers.find(u => u.campus === oldCampusName);
            const isCampusNameChanging = oldCampusName.toLowerCase() !== newCampusName.toLowerCase();
            
            if (isCampusNameChanging && currentCampusList.some(c => c.id !== campusId && c.name.toLowerCase() === newCampusName.toLowerCase())) {
                toast({ variant: 'destructive', title: 'Nome de Campus Duplicado', description: 'Já existe um campus com este nome.' });
                return;
            }
            
            await updateCampus(campusId.toString(), newCampusName);
            
            if (oldUser) {
                await updateUser(oldUser.id.toString(), {
                    campus: newCampusName,
                    username: newUsername,
                    name: `Técnico ${newCampusName}`,
                    password: newPassword
                });
            } else {
                await insertUser({
                    username: newUsername,
                    name: `Técnico ${newCampusName}`,
                    role: 'tecnico',
                    campus: newCampusName,
                    password: newPassword || 'password',
                });
            }
            
            if (isCampusNameChanging) {
                await updateInventoryForCampusRename(oldCampusName, newCampusName);
            }
            
            const [updatedCampusList, updatedUsers, updatedInventory] = await Promise.all([
                getCampusList(),
                getUsers(),
                getInventory()
            ]);
            
            setInitialCampusList(updatedCampusList.sort((a,b) => a.name.localeCompare(b.name)));
            setInitialUsers(updatedUsers);
            setInitialInventory(updatedInventory);
    
            toast({ title: 'Campus Atualizado', description: `Campus "${newCampusName}" atualizado com sucesso.` });
        } catch (error) {
            console.error('Erro ao editar campus e usuário:', error);
            toast({ 
                variant: 'destructive', 
                title: 'Erro', 
                description: 'Ocorreu um erro ao atualizar o campus.' 
            });
        }
    };

    if (isLoading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-muted/40" suppressHydrationWarning>
                <div className="flex flex-col items-center gap-4 text-lg" suppressHydrationWarning>
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span>Carregando gerenciamento de senhas...</span>
                </div>
            </div>
        );
    }
    
    return (
        <ClientOnly>
            <div className="min-h-screen bg-gray-50" suppressHydrationWarning>
                <Header user={user} campusList={initialCampusList} inventory={initialInventory} activeCampus="all" onCampusChange={() => {}} />
                
                <main className="container mx-auto p-4 md:p-6 lg:p-8 mt-5">
                    <div className="flex items-center gap-4 mb-6">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/">
                                <ArrowLeft />
                            </Link>
                        </Button>
                        <div className="flex items-center gap-2">
                            <Shield className="h-6 w-6 text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-900">
                                Gerenciamento Completo
                            </h1>
                        </div>
                    </div>

                    <PasswordManagementPage 
                        users={initialUsers}
                        currentUser={user}
                        campusList={initialCampusList}
                        onAddCampus={handleAddCampus}
                        onDeleteCampus={handleDeleteCampus}
                        onDeleteUser={handleDeleteUser}
                        onEditCampusAndUser={handleEditCampusAndUser}
                    />
                </main>
            </div>
        </ClientOnly>
    );
}