import React from "react";
import { getFullCurrentUser } from "@/lib/session";
import { getInventory, getAuditLog, getCategories, getSectors, getLoans, getUsers, getCampusList } from "@/lib/db";
import Dashboard from "@/components/dashboard/dashboard";
import ClientOnly from "@/components/client-only";
import { Loader2 } from "lucide-react";

export default async function DashboardPage() {
  const user = await getFullCurrentUser();

  // Para admins, não filtra por campus (passa undefined)
  // Para usuários de campus, busca o campusId baseado no nome do campus
  let userCampusId: string | undefined;
  if (user && user.role !== 'admin') {
    const campusList = await getCampusList();
    // user.campus pode ser string ou objeto { id, name }
    const userCampusName = typeof user.campus === 'object' ? user.campus?.name : user.campus;
    const userCampus = campusList.find(c => c.name === userCampusName);
    userCampusId = userCampus?.id?.toString();
    
    console.log('🔍 [page.tsx] Buscando dados para técnico:', {
      userName: user.username,
      userRole: user.role,
      userCampusOriginal: user.campus,
      userCampusName,
      userCampus,
      userCampusId,
      campusList: campusList.map(c => ({ id: c.id, name: c.name }))
    });
  } else {
    console.log('👑 [page.tsx] Buscando dados para admin (sem filtro)');
  }

  const [
    initialInventory,
    initialAuditLog,
    initialCategories,
    initialSectors,
    initialLoans,
    initialUsers,
    initialCampusList
  ] = await Promise.all([
    getInventory(userCampusId),  // 🔒 Admin = undefined (todos), Usuário = campusId específico
    getAuditLog(userCampusId),   // 🔒 Admin = undefined (todos), Usuário = campusId específico
    getCategories(userCampusId), // 🔒 Admin = undefined (todos), Usuário = campusId específico
    getSectors(userCampusId),    // 🔒 Admin = undefined (todos), Usuário = campusId específico  
    getLoans(userCampusId),      // 🔒 Admin = undefined (todos), Usuário = campusId específico
    getUsers(),
    getCampusList(),
  ]);
  
  console.log('📊 [page.tsx] Dados carregados:', {
    userCampusId,
    initialInventory: initialInventory.length,
    initialCategories: initialCategories.length,
    initialSectors: initialSectors.length,
    primeirosSetores: initialSectors.slice(0, 3).map(s => ({ 
      name: s.name, 
      campus: (s as any).campus 
    }))
  });

  return (
    <div suppressHydrationWarning>
      <ClientOnly
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-transparent" suppressHydrationWarning>
            <div className="flex flex-col items-center gap-4 text-lg text-white" suppressHydrationWarning>
              <Loader2 className="h-8 w-8 animate-spin" />
              Carregando Sistema...
            </div>
          </div>
        }
      >
        <Dashboard
          currentUser={user}
          initialInventory={initialInventory}
          initialAuditLog={initialAuditLog}
          initialCategories={initialCategories}
          initialSectors={initialSectors}
          initialLoans={initialLoans}
          initialUsers={initialUsers}
          initialCampusList={initialCampusList}
        />
      </ClientOnly>
    </div>
  );
}
