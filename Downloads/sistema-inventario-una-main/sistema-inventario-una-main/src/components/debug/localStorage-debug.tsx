"use client";

import { useEffect, useState } from 'react';

interface LocalStorageDebugProps {
  campusKey: string;
}

export default function LocalStorageDebug({ campusKey }: LocalStorageDebugProps) {
  const [storageInfo, setStorageInfo] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage);
      const relevantKeys = keys.filter(key => 
        key.includes('inventory') || 
        key.includes('categories') || 
        key.includes('sectors') ||
        key.includes('auditLog') ||
        key.includes('loans')
      );
      setStorageInfo(relevantKeys);
    }
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Não mostrar em produção
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
      <div className="font-bold mb-2">🔍 Debug LocalStorage</div>
      <div className="mb-2">Campus Key: <span className="text-blue-300">{campusKey}</span></div>
      <div className="mb-2">Chaves ativas:</div>
      {storageInfo.length === 0 ? (
        <div className="text-gray-400">Nenhuma chave encontrada</div>
      ) : (
        <ul className="space-y-1">
          {storageInfo.map(key => (
            <li key={key} className={key.includes(campusKey) ? 'text-green-300' : 'text-red-300'}>
              {key.includes(campusKey) ? '✅' : '❌'} {key}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-2 text-xs text-gray-400">
        Verde = campus específico | Vermelho = genérico (problema!)
      </div>
    </div>
  );
}