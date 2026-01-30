"use client";

import Header from "@/components/dashboard/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import FixUsername from "@/components/dashboard/fix-username";
import ClientOnly from "@/components/client-only";
import { useEffect, useState } from "react";
import { getFullCurrentUser } from "@/lib/session";
import { getCampusList, getInventory } from "@/lib/db";
import { User, Campus, InventoryItem } from "@/lib/types";
import { redirect } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function FixUsernameAdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const currentUser = await getFullCurrentUser();
        if (currentUser.role !== "admin") {
          redirect("/");
        }
        setUser(currentUser);

        const [campus, inv] = await Promise.all([
          getCampusList(),
          getInventory(),
        ]);
        setCampusList(campus);
        setInventory(inv);
      } catch (e) {
        console.error("Failed to load admin data", e);
        redirect("/");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

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
        <Header
          user={user}
          campusList={campusList}
          inventory={inventory}
          activeCampus="all"
          onCampusChange={() => { }}
        />
        <main className="container mx-auto p-4 md:p-6 lg:p-8 mt-5">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/users">
                <ArrowLeft />
              </Link>
            </Button>
            <h2 className="text-2xl font-bold text-foreground">
              Corrigir Nome de Usuário
            </h2>
          </div>

          <div className="grid gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-xl font-semibold mb-4">Problema de Nome de Usuário</h3>
              <p className="mb-4">
                Esta ferramenta corrige o problema onde o login do campus Aimorés aparece como "aimors" em vez de "aimores".
              </p>

              <FixUsername />
            </div>
          </div>
        </main>
      </div>
    </ClientOnly>
  );
}
