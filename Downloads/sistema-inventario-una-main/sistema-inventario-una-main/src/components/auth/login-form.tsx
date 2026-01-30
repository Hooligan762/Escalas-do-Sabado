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
import { AlertTriangle, Loader2, Building2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Campus, User } from "@/lib/types";
import { getUsers } from "@/lib/db";

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
        console.log("🔍 Iniciando busca de usuários...");
        const usersList = await getUsers();
        setUsers(usersList);
        console.log("✅ Usuários carregados:", usersList.length);
        console.log("📋 Usuários mapeados:", usersList.map(u => ({ username: u.username, campus: u.campus, role: u.role })));
        console.log("👑 Usuários admin:", usersList.filter(u => u.role === 'admin'));
      } catch (error) {
        console.error("❌ Erro ao buscar usuários:", error);
        // Mostrar erro na interface se necessário
      }
    }
    fetchUsers();
  }, []);

  // Detectar usuários especiais (full, admin, etc) que DEVEM usar campus Admin
  React.useEffect(() => {
    const specialUsers = ['full', 'admin'];
    const isSpecial = specialUsers.includes(loginValue.toLowerCase());
    setIsSpecialUser(isSpecial);

    // Se for usuário especial, OBRIGATORIAMENTE selecionar "Administrador"
    if (isSpecial) {
      if (selectedCampus !== 'Administrador') {
        setSelectedCampus('Administrador');
        setValue('campus', 'Administrador');
        console.log(`✅ Usuário especial "${loginValue}" detectado - FORÇANDO campus para "Administrador"`);
      }
    }
  }, [loginValue, selectedCampus, setValue]);

  // Sort campus list alphabetically and ensure proper display
  const campusOptions = campusList.map(c => c.name).sort();
  const uniqueCampusOptions = [...new Set(campusOptions)];
  
  // Debug logs
  console.log("Campus list received:", campusList);
  console.log("Campus options:", uniqueCampusOptions);
  console.log("Administrador campus exists:", uniqueCampusOptions.includes('Administrador'));

  const handleCampusChange = (campusName: string) => {
    setSelectedCampus(campusName);
    let username = '';

    // Lógica especial para campus Administrador
    if (campusName === 'Administrador') {
      username = 'admin';
      console.log(`Campus: "${campusName}" -> Login administrativo: "${username}"`);
    } else {
      // Buscar o usuário técnico do campus selecionado (comparando COM normalização)
      const normalizeForComparison = (str: string) => {
        if (!str) return '';
        // Normalizar: remover acentos, lowercase, trim
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
      };

      const campusUser = users.find(u => {
        if (u.role !== 'tecnico') return false;
        const userCampusName = typeof u.campus === 'object' ? u.campus?.name : u.campus;
        if (!userCampusName) return false;
        // Comparar normalizando ambos (sem acentos, case-insensitive)
        return normalizeForComparison(userCampusName) === normalizeForComparison(campusName);
      });

      // Se encontrarmos o usuário técnico, usamos o login dele
      username = campusUser ? campusUser.username : '';

      // Log para debug
      console.log(`Campus: "${campusName}" -> Login correto do técnico: "${username}"`);
      if (campusUser) {
        console.log(`✅ Técnico encontrado:`, { username: campusUser.username, campus: campusUser.campus });
      } else {
        console.log(`⚠️ Nenhum técnico encontrado para o campus "${campusName}"`);
      }
    }

    // Atualiza o campo de login, mas mantém editável após isso
    setTimeout(() => {
      setLoginValue(username);
      setValue('username', username);
      // Sincroniza o valor do campus no FormData do react-hook-form
      setValue('campus', campusName);

      // Foca o campo de login após definir o valor para facilitar a edição
      const loginInput = document.getElementById('username') as HTMLInputElement;
      if (loginInput) {
        loginInput.focus();
        loginInput.setSelectionRange(0, username.length);
      }
    }, 0);
  };

  // Force Administrador campus quando há erro e usuário é especial
  React.useEffect(() => {
    if (state?.error && isSpecialUser && selectedCampus !== 'Administrador') {
      console.log('🚨 Erro detectado para usuário especial - forçando campus Administrador');
      setSelectedCampus('Administrador');
      setValue('campus', 'Administrador');
    }
  }, [state?.error, isSpecialUser, selectedCampus, setValue]);

  return (
    <form action={action} className="space-y-4">
      {/* Campo hidden para garantir que o campus selecionado seja enviado no submit */}
      <input type="hidden" name="campus" value={selectedCampus} />
      {state?.error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Falha ao entrar</AlertTitle>
          <AlertDescription>
            {state.error}
            {isSpecialUser && !selectedCampus && (
              <div className="mt-2 text-sm">
                <strong>Dica:</strong> Usuários admin devem usar o campus "Administrador".
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Campus primeiro */}
      <div className="space-y-2">
        <Label htmlFor="campus">
          Campus {isSpecialUser ? "(obrigatório: Administrador)" : ""}
        </Label>
        <Select
          name="campus"
          value={selectedCampus}
          onValueChange={handleCampusChange}
          required={true}
          disabled={isSpecialUser}
        >
          <SelectTrigger className={isSpecialUser ? 'bg-blue-50 border-blue-300' : ''}>
            <SelectValue placeholder={isSpecialUser ? "Campus Administrador (automático)" : "Selecione o campus"} />
          </SelectTrigger>
          <SelectContent>
            {uniqueCampusOptions.map(option => (
              <SelectItem key={option} value={option}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  {option}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Campo de Login depois */}
      <div className="space-y-2">
        <Label htmlFor="username">
          Login {isSpecialUser && <span className="text-blue-600 text-sm">(Super Usuário Detectado)</span>}
        </Label>
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
          className={`border focus:border-blue-500 ${isSpecialUser ? 'border-blue-300 bg-blue-50' : ''}`}
        />
        {isSpecialUser && (
          <div className="bg-blue-50 border border-blue-200 rounded p-3">
            <p className="text-sm text-blue-800 font-medium">
              👑 Usuário Administrativo Detectado
            </p>
            <p className="text-xs text-blue-600 mt-1">
              ✅ Campus definido automaticamente: <strong>Administrador</strong>
            </p>
          </div>
        )}
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

      <SubmitButton />
    </form>
  );
}
