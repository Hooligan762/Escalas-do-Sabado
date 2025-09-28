"use client";

import React, { useState } from 'react';
import { Button } from './button';
import { Badge } from './badge';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordVisibilityToggleProps {
  password: string;
  isVisible?: boolean;
  className?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  showCopyButton?: boolean;
  onVisibilityToggle?: (visible: boolean) => void;
}

export function PasswordVisibilityToggle({ 
  password, 
  isVisible = false, 
  className,
  badgeVariant = "secondary",
  showCopyButton = false,
  onVisibilityToggle 
}: PasswordVisibilityToggleProps) {
  const [internalVisible, setInternalVisible] = useState(isVisible);
  const [copied, setCopied] = useState(false);
  
  const visible = onVisibilityToggle ? isVisible : internalVisible;
  
  const handleToggle = () => {
    const newVisibility = !visible;
    if (onVisibilityToggle) {
      onVisibilityToggle(newVisibility);
    } else {
      setInternalVisible(newVisibility);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar senha:', err);
    }
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {visible ? 
        <Badge variant={badgeVariant} className="font-mono select-all">
          {password}
        </Badge> :
        <Badge variant="outline" className="select-none">
          {"•".repeat(Math.min(password.length, 8))}
        </Badge>
      }
      
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleToggle}
        className="h-6 w-6 p-0 hover:bg-gray-100"
        title={visible ? "Ocultar senha" : "Mostrar senha"}
      >
        {visible ? 
          <EyeOff className="h-3 w-3" /> : 
          <Eye className="h-3 w-3" />
        }
      </Button>

      {showCopyButton && visible && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleCopy}
          className="h-6 w-6 p-0 hover:bg-gray-100"
          title="Copiar senha"
        >
          {copied ? 
            <Check className="h-3 w-3 text-green-600" /> : 
            <Copy className="h-3 w-3" />
          }
        </Button>
      )}
    </div>
  );
}