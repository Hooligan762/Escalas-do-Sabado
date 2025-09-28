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
  const { register, setValue, unregister } = useForm();
  const [users, setUsers] = React.useState<User[]>([]);
  const [isUsernameReadOnly, setIsUsernameReadOnly] = React.useState(true);


  React.useEffect(() => {
    async function fetchUsers() {
      setUsers(await getUsers());
    }
    fetchUsers();
  }, []);

  const campusOptions = ["Administrador", ...campusList.map(c => c.name)];

  const handleCampusChange = (campusName: string) => {
    let username = '';
    if (campusName === 'Administrador') {
      const adminUser = users.find(u => u.username === 'admin');
      username = adminUser ? adminUser.username : 'admin';
      setIsUsernameReadOnly(false); // Desbloqueia para admin
    } else {
       const campusUser = users.find(u => u.campus === campusName);
       username = campusUser ? campusUser.username : '';
       setIsUsernameReadOnly(true); // Bloqueia para tecnicos
    }
    setValue('username', username);
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

      <div className="space-y-2">
        <Label htmlFor="campus">Campus</Label>
        <Select name="campus" onValueChange={handleCampusChange} required>
            <SelectTrigger>
                <SelectValue placeholder="Selecione o campus ou Admin" />
            </SelectTrigger>
            <SelectContent>
                {campusOptions.map(option => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
            </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="username">Usuário</Label>
        <Input
          id="username"
          type="text"
          placeholder="Selecione um campus para preencher"
          required
          readOnly={isUsernameReadOnly}
          className={isUsernameReadOnly ? "bg-muted" : ""}
          {...register('username')}
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

      <SubmitButton />
    </form>
  );
}
