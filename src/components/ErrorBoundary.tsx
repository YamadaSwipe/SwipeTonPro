import React, { Component, ErrorInfo, ReactNode } from 'react';
import { SEO } from './SEO';
import { Button } from './ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });

    // Optional: Send error to logging service
    if (process.env.NODE_ENV === 'production') {
      // Log to your error tracking service (Sentry, etc.)
      // Example: Sentry.captureException(error, { extra: errorInfo });
    }
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <>
          <SEO
            title="Erreur - SwipeTonPro"
            description="Une erreur est survenue. Veuillez réessayer."
            noindex
          />
          <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
              {/* Error Icon */}
              <div className="mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-10 h-10 text-red-600" />
                </div>
              </div>

              {/* Title */}
              <h1 className="text-2xl font-bold text-text-primary mb-4">
                Oups ! Une erreur est survenue
              </h1>

              {/* Description */}
              <p className="text-text-secondary mb-6">
                Nous sommes désolés, quelque chose s&apos;est mal passé. 
                Notre équipe a été notifiée et travaille sur la résolution du problème.
              </p>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-red-50 rounded-lg text-left overflow-auto max-h-48">
                  <p className="text-red-800 font-mono text-sm">
                    <strong>Error:</strong> {this.state.error.message}
                  </p>
                  {this.state.errorInfo && (
                    <pre className="text-red-700 text-xs mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleReload}
                  variant="outline"
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Réessayer
                </Button>

                <Link href="/" passHref>
                  <Button className="gap-2 gradient-accent text-white">
                    <Home className="w-4 h-4" />
                    Retour à l&apos;accueil
                  </Button>
                </Link>
              </div>

              {/* Support Link */}
              <p className="mt-8 text-sm text-text-tertiary">
                Besoin d&apos;aide ?{' '}
                <Link href="/contact" className="text-accent hover:underline">
                  Contactez notre support
                </Link>
              </p>
            </div>
          </div>
        </>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
