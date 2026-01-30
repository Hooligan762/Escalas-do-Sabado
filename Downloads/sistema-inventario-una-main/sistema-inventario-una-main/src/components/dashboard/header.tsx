"use client";

import * as React from 'react';
import Link from 'next/link';
import { logout } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { LogOut, University, Settings, Users, Building2 } from 'lucide-react';
import { CampusIconComponent, getCampusIconByName } from '@/lib/campus-icons';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { User, Campus, InventoryItem } from '@/lib/types';
import GlobalSearch from './global-search';

type HeaderProps = {
  user: User;
  campusList: Campus[];
  inventory: InventoryItem[];
  activeCampus: string;
  onCampusChange: (campus: string) => void;
  onNavigateToItem?: (itemId: string) => void;
};

export default function Header({ user, campusList, inventory, activeCampus, onCampusChange, onNavigateToItem }: HeaderProps) {
  // user.campus pode ser string ou objeto { id, name }
  const userCampusName = typeof user.campus === 'object' ? user.campus?.name : user.campus;
  
  const title = user.role === 'admin'
    ? 'NSI - Administração Central'
    : `NSI - Campus ${userCampusName || 'Não Definido'}`;

  return (
    <header className="sticky top-0 z-40 w-full rounded-none md:rounded-xl border border-white/20 bg-white/80 shadow-lg backdrop-blur-lg">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4">
            <div>
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-sky-600 bg-clip-text text-transparent">
                    {title}
                </h1>
                <p className="text-xs text-muted-foreground hidden md:block">
                  Controle completo de equipamentos com múltiplos campus
                </p>
            </div>
        </div>

        <div className="hidden md:flex items-center gap-4 flex-grow max-w-xl">
           <GlobalSearch inventory={inventory} onNavigateToItem={onNavigateToItem} />
        </div>

        <div className="flex items-center gap-2 md:gap-4">
            {user.role === 'admin' && (
              <div className="flex items-center gap-1 md:gap-2">
                <University className="hidden sm:block h-5 w-5 text-muted-foreground" />
                <Select
                  value={activeCampus}
                  onValueChange={onCampusChange}
                  disabled={user.role !== 'admin'}
                >
                  <SelectTrigger className="w-[120px] sm:w-[180px] bg-white/50 text-xs sm:text-sm">
                    <SelectValue placeholder="Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <University className="h-4 w-4" />
                        Todos os Campus
                      </div>
                    </SelectItem>
                    {campusList.map(campus => (
                      <SelectItem key={campus.id} value={campus.name}>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-blue-600" />
                          {campus.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium flex items-center gap-3 p-2 hover:bg-gray-50 transition-colors">
                  <div className="relative">
                    {(() => {
                      const campusIcon = getCampusIconByName(userCampusName || '');
                      const IconComponent = campusIcon?.icon;
                      const gradientClass = campusIcon?.avatarGradient || 'from-blue-500 to-blue-600';
                      
                      return (
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-lg border-2 border-white/20 ring-2 ring-white/10`}>
                          {IconComponent && <IconComponent className="text-white w-5 h-5" />}
                        </div>
                      );
                    })()}
                  </div>
                  <span className="hidden md:block font-medium text-gray-700">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-3">
                      {(() => {
                        const campusIcon = getCampusIconByName(userCampusName || '');
                        const IconComponent = campusIcon?.icon;
                        const gradientClass = campusIcon?.avatarGradient || 'from-blue-500 to-blue-600';
                        
                        return (
                          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradientClass} flex items-center justify-center shadow-md`}>
                            {IconComponent && <IconComponent className="text-white w-4 h-4" />}
                          </div>
                        );
                      })()}
                      <div>
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground mt-1">
                          {user.username}
                        </p>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground border-t pt-2 flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {userCampusName || 'Não Definido'}
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {user.role === 'admin' && (
                  <>
                  <DropdownMenuGroup>
                     <DropdownMenuLabel>Administração</DropdownMenuLabel>
                     <Link href="/admin/users" passHref>
                        <DropdownMenuItem className="cursor-pointer">
                          <Users className="mr-2 h-4 w-4" />
                          <span>Gerenciar Usuários</span>
                        </DropdownMenuItem>
                      </Link>
                   </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  </>
                )}
                <form action={logout}>
                    <button type="submit" className="w-full">
                        <DropdownMenuItem className="cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Sair</span>
                        </DropdownMenuItem>
                    </button>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      
      {/* Busca global mobile - aparece apenas em telas pequenas */}
      <div className="md:hidden px-4 pb-4">
        <GlobalSearch inventory={inventory} onNavigateToItem={onNavigateToItem} />
      </div>
    </header>
  );
}