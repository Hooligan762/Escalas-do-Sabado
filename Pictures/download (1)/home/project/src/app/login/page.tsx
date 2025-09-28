"use client";

import { useState, useEffect } from 'react';
import LoginForm from '@/components/auth/login-form';
import { getCampusList } from '@/lib/db';
import type { Campus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

export default function LoginPage() {
  const [campusList, setCampusList] = useState<Campus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampus() {
      try {
        const list = await getCampusList();
        setCampusList(list);
      } catch (error) {
        console.error("Failed to fetch campus list", error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampus();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-white/80 p-6 shadow-2xl backdrop-blur-lg md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-sky-600 bg-clip-text text-transparent">
            Inventario UNA - NSI
          </h1>
          <p className="text-muted-foreground">
            Plataforma de Gestão de Ativos de TI
          </p>
        </div>
        {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full mt-4" />
            </div>
        ) : (
          <LoginForm campusList={campusList} />
        )}
      </div>
    </div>
  );
}
