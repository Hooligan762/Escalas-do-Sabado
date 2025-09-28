"use client";

import * as React from 'react';
import Link from 'next/link';
import { logout } from '@/lib/session';
import { Button } from '@/components/ui/button';
import { LogOut, University, Settings, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
};

export default function Header({ user, campusList, inventory, activeCampus, onCampusChange }: HeaderProps) {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0].substring(0, 2);
  };
  
  const title = user.role === 'admin'
    ? 'NSI - Administração Central'
    : `NSI - Campus ${user.campus}`;

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

        <div className="flex items-center gap-4 flex-grow max-w-xl">
           <GlobalSearch inventory={inventory} />
        </div>

        <div className="flex items-center gap-4">
            {user.role === 'admin' && (
              <div className="flex items-center gap-2">
                <University className="h-5 w-5 text-muted-foreground" />
                <Select
                  value={activeCampus}
                  onValueChange={onCampusChange}
                  disabled={user.role !== 'admin'}
                >
                  <SelectTrigger className="w-full sm:w-[180px] bg-white/50">
                    <SelectValue placeholder="Selecione um Campus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Campus</SelectItem>
                    {campusList.map(campus => (
                      <SelectItem key={campus.id} value={campus.name}>{campus.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar>
                    <AvatarImage src={`https://i.pravatar.cc/150?u=${user.username}`} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.username}
                    </p>
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
    </header>
  );
}