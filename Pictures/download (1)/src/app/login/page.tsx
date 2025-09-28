"use client";

import { useState, useEffect } from 'react';
import LoginForm from '@/components/auth/login-form';
import { getCampusList } from '@/lib/db';
import type { Campus } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import Head from 'next/head';

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
      <div className="w-full max-w-md rounded-xl border border-white/20 bg-white/90 p-6 shadow-2xl backdrop-blur-lg md:p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center items-center mb-4 bg-[#E20613] py-4 px-6 rounded-md">
            <div className="text-white mr-3 flex items-center">
              <div className="text-4xl font-light una-logo-text" style={{transform: "scaleX(0.7) translateY(-2px)"}}>&gt;</div>
            </div>
            <div>
              <div className="text-white text-5xl font-bold tracking-wide una-logo-text">una</div>
              <div className="text-white text-xs font-medium text-left leading-tight una-subtitle-text">
                Cidade<br />
                Universitária
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[#E20613] mt-4">
            Sistema de Inventário
          </h1>
          <p className="text-muted-foreground mt-2">
            Núcleo de Suporte à Informática - NSI
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
