import React from "react";
import { getFullCurrentUser } from "@/lib/session";
import { getInventory, getAuditLog, getCategories, getSectors, getLoans, getUsers, getCampusList } from "@/lib/db";
import Dashboard from "@/components/dashboard/dashboard";
import ClientOnly from "@/components/client-only";
import { Loader2 } from "lucide-react";

export default async function DashboardPage() {
  const user = await getFullCurrentUser();

  const [
    initialInventory, 
    initialAuditLog, 
    initialCategories, 
    initialSectors, 
    initialLoans, 
    initialUsers,
    initialCampusList
  ] = await Promise.all([
    getInventory(),
    getAuditLog(),
    getCategories(),
    getSectors(),
    getLoans(),
    getUsers(),
    getCampusList(),
  ]);

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
