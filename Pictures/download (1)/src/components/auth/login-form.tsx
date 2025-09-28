"use client";

import * as React from "react";
import { useFormStatus } from "react-dom";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { login } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campus, User } from "@/lib/types";
import { getUsers } from "@/lib/db";
import { CsrfToken } from "@/components/security/csrf-token";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Entrar no Sistema
    </Button>
  );
}

interface LoginFormProps {
  campusList: Campus[];
}

export default function LoginForm({ campusList }: LoginFormProps) {
  const [state, action] = useActionState(login, undefined);
  const { register, setValue, watch } = useForm();
  const [users, setUsers] = React.useState<User[]>([]);
  const [loginValue, setLoginValue] = React.useState('');
  const [selectedCampus, setSelectedCampus] = React.useState('');
  const [isEditingLogin, setIsEditingLogin] = React.useState(false);
  const [isSpecialUser, setIsSpecialUser] = React.useState(false);

  React.useEffect(() => {
    async function fetchUsers() {
      try {
        const usersList = await getUsers();
        setUsers(usersList);
        console.log("Fetched users:", usersList.map(u => ({username: u.username, campus: u.campus})));
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    }
    fetchUsers();
  }, []);

  // Detectar usuários especiais (full, admin, etc) que não precisam de campus
  React.useEffect(() => {
    const specialUsers = ['full', 'admin'];
    const isSpecial = specialUsers.includes(loginValue.toLowerCase());
    setIsSpecialUser(isSpecial);
    
    if (isSpecial && selectedCampus === '') {
      setSelectedCampus('Administrador');
    }
  }, [loginValue, selectedCampus]);

  // Sort campus list alphabetically and ensure proper display
  const campusOptions = ["Administrador", ...campusList.map(c => c.name).sort()];

  const handleCampusChange = (campusName: string) => {
    setSelectedCampus(campusName);
    let username = '';
    
    if (campusName === 'Administrador') {
      // Para administrador, simplesmente definimos como 'admin'
      username = 'admin';
      setLoginValue(username);
      setValue('username', username);
    } else {
      // Buscar o usuário técnico do campus selecionado para ver o login correto
      const campusUser = users.find(u => u.campus === campusName && u.role === 'tecnico');
      
      // Se encontrarmos o usuário técnico, usamos o login dele, senão usamos o nome do campus
      username = campusUser ? campusUser.username : campusName.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      // Log para debug
      console.log(`Campus: "${campusName}" -> Login correto do técnico: "${username}"`);
      
      // Atualiza o campo de login, mas mantém editável após isso
      setTimeout(() => {
        setLoginValue(username);
        setValue('username', username);
        
        // Foca o campo de login após definir o valor para facilitar a edição
        const loginInput = document.getElementById('username') as HTMLInputElement;
        if (loginInput) {
          loginInput.focus();
          loginInput.setSelectionRange(0, username.length);
        }
      }, 0);
    }
  };

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Falha ao entrar</AlertTitle>
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Campus primeiro */}
      <div className="space-y-2">
        <Label htmlFor="campus">
          Campus {isSpecialUser ? "(opcional para admin)" : ""}
        </Label>
        <Select 
          name="campus" 
          value={selectedCampus} 
          onValueChange={handleCampusChange} 
          required={!isSpecialUser}
        >
            <SelectTrigger>
                <SelectValue placeholder={isSpecialUser ? "Selecione o campus (opcional)" : "Selecione o campus ou Admin"} />
            </SelectTrigger>
            <SelectContent>
                {campusOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      {/* Campo de Login depois */}
      <div className="space-y-2">
        <Label htmlFor="username">Login</Label>
        <Input
          id="username"
          name="username"
          type="text"
          autoComplete="off"
          value={loginValue}
          onChange={(e) => {
            setLoginValue(e.target.value);
            setValue('username', e.target.value);
            console.log("Login editado para:", e.target.value);
          }}
          placeholder="Digite seu nome de usuário"
          required
          className="border focus:border-blue-500"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Digite sua senha"
          required
        />
      </div>

      {/* Adicionar proteção CSRF */}
      <CsrfToken />
      
      <SubmitButton />
    </form>
  );
}
