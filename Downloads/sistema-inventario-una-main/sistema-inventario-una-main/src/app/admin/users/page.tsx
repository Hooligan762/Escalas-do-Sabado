
'use client';
import * as React from 'react';
import { redirect } from 'next/navigation';

export default function AdminUsersPage() {
    React.useEffect(() => {
        // Redirecionar diretamente para a página de gerenciamento de senhas
        redirect('/admin/passwords');
    }, []);

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/40">
            <div className="flex flex-col items-center gap-4 text-lg">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span>Redirecionando para gerenciamento de senhas...</span>
            </div>
        </div>
    );
}
