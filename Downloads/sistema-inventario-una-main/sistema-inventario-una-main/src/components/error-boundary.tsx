"use client";

import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    console.error('🚨 Error Boundary capturou erro:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Error Boundary - Detalhes do erro:', error, errorInfo);
    
    // Log detalhado para Railway
    console.error('🔍 Stack trace:', error.stack);
    console.error('🔍 Component stack:', errorInfo.componentStack);
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }

      return (
        <div className="flex items-center justify-center min-h-screen bg-red-50">
          <div className="max-w-md p-6 bg-white rounded-lg shadow-lg border border-red-200">
            <div className="text-center">
              <div className="text-red-500 text-4xl mb-4">⚠️</div>
              <h2 className="text-xl font-bold text-red-800 mb-2">
                Algo deu errado
              </h2>
              <p className="text-red-600 mb-4">
                Ocorreu um erro inesperado. Por favor, tente novamente.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="text-left text-xs text-red-700 bg-red-100 p-2 rounded mb-4">
                  <summary className="cursor-pointer font-semibold">Detalhes do erro (dev)</summary>
                  <pre className="mt-2 whitespace-pre-wrap">{this.state.error.message}</pre>
                  <pre className="mt-1 text-xs">{this.state.error.stack}</pre>
                </details>
              )}
              <button
                onClick={this.resetError}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;