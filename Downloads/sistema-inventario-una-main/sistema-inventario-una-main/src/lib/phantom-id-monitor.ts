/**
 * 🔍 PHANTOM ID MONITOR
 * Sistema de monitoramento e logs para IDs fantasma
 */

interface PhantomIdAttempt {
  id: string;
  operation: string;
  timestamp: string;
  blocked: boolean;
  stackTrace?: string;
  userAgent?: string;
  ip?: string;
}

class PhantomIdMonitor {
  private static instance: PhantomIdMonitor;
  private attempts: PhantomIdAttempt[] = [];
  private maxLogs = 100;

  static getInstance(): PhantomIdMonitor {
    if (!PhantomIdMonitor.instance) {
      PhantomIdMonitor.instance = new PhantomIdMonitor();
    }
    return PhantomIdMonitor.instance;
  }

  logAttempt(attempt: PhantomIdAttempt): void {
    this.attempts.unshift(attempt);
    
    // Manter apenas os últimos logs
    if (this.attempts.length > this.maxLogs) {
      this.attempts = this.attempts.slice(0, this.maxLogs);
    }

    // Log detalhado no console
    if (attempt.blocked) {
      console.error('🚨 PHANTOM ID BLOCKED:', attempt);
    } else {
      console.warn('⚠️ PHANTOM ID DETECTED (not blocked):', attempt);
    }

    // Em produção, poderia enviar para sistema de monitoramento
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      this.sendToMonitoring(attempt);
    }
  }

  getRecentAttempts(limit = 20): PhantomIdAttempt[] {
    return this.attempts.slice(0, limit);
  }

  getStats(): {
    totalAttempts: number;
    blockedAttempts: number;
    recentAttempts: number;
    phantomIds: string[];
    mostFrequentOperation: string;
  } {
    const blocked = this.attempts.filter(a => a.blocked);
    const recent = this.attempts.filter(a => 
      Date.now() - new Date(a.timestamp).getTime() < 24 * 60 * 60 * 1000 // últimas 24h
    );
    
    const operations = this.attempts.reduce((acc, a) => {
      acc[a.operation] = (acc[a.operation] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const mostFrequentOperation = Object.entries(operations)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

    const phantomIds = [...new Set(this.attempts.map(a => a.id))];

    return {
      totalAttempts: this.attempts.length,
      blockedAttempts: blocked.length,
      recentAttempts: recent.length,
      phantomIds,
      mostFrequentOperation
    };
  }

  private sendToMonitoring(attempt: PhantomIdAttempt): void {
    // Em um ambiente real, enviaria para um serviço de monitoramento
    // como DataDog, New Relic, etc.
    try {
      fetch('/api/phantom-blocker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attempt)
      }).catch(err => console.warn('Falha ao enviar log de monitoramento:', err));
    } catch (error) {
      console.warn('Erro no monitoramento de phantom ID:', error);
    }
  }

  exportLogs(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      attempts: this.attempts
    }, null, 2);
  }
}

export const phantomIdMonitor = PhantomIdMonitor.getInstance();

// Função utilitária para criar logs padronizados
export function logPhantomIdAttempt(
  id: string,
  operation: string,
  blocked: boolean,
  error?: Error
): void {
  phantomIdMonitor.logAttempt({
    id,
    operation,
    timestamp: new Date().toISOString(),
    blocked,
    stackTrace: error?.stack,
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    ip: 'unknown' // Em um ambiente real, obteria do request
  });
}