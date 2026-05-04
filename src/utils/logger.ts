/**
 * Système de logging structuré pour le BTP
 * Permet un suivi cohérent des événements et erreurs
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'auth' | 'payment' | 'messaging' | 'api' | 'db' | 'system' | 'quota' | 'ai';

interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private static instance: Logger;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatMessage(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext
  ): string {
    const timestamp = new Date().toISOString();
    const emoji = this.getEmoji(level);
    const categoryEmoji = this.getCategoryEmoji(category);
    
    let formatted = `${emoji} [${timestamp}] [${level.toUpperCase()}] ${categoryEmoji} [${category.toUpperCase()}] ${message}`;
    
    if (context && Object.keys(context).length > 0) {
      const contextStr = Object.entries(context)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' | ');
      formatted += ` | ${contextStr}`;
    }
    
    return formatted;
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case 'debug': return '🔍';
      case 'info': return 'ℹ️';
      case 'warn': return '⚠️';
      case 'error': return '❌';
      default: return '📝';
    }
  }

  private getCategoryEmoji(category: LogCategory): string {
    switch (category) {
      case 'auth': return '🔐';
      case 'payment': return '💳';
      case 'messaging': return '💬';
      case 'api': return '🔌';
      case 'db': return '🗄️';
      case 'system': return '⚙️';
      case 'quota': return '📊';
      case 'ai': return '🤖';
      default: return '📝';
    }
  }

  private log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    // En production, ne pas logger les debugs
    if (this.isProduction && level === 'debug') {
      return;
    }

    const formattedMessage = this.formatMessage(level, category, message, context);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'error':
        console.error(formattedMessage);
        if (error) {
          console.error('Stack trace:', error.stack);
        }
        break;
    }

    // En production, envoyer à un service de monitoring (Sentry, etc.)
    if (this.isProduction && level === 'error') {
      this.sendToMonitoring(level, category, message, context, error);
    }
  }

  private sendToMonitoring(
    level: LogLevel,
    category: LogCategory,
    message: string,
    context?: LogContext,
    error?: Error
  ): void {
    // TODO: Intégrer avec Sentry, LogRocket, ou autre service
    // Exemple:
    // Sentry.captureException(error, {
    //   level,
    //   tags: { category },
    //   extra: context,
    // });
  }

  // Méthodes publiques
  debug(category: LogCategory, message: string, context?: LogContext): void {
    this.log('debug', category, message, context);
  }

  info(category: LogCategory, message: string, context?: LogContext): void {
    this.log('info', category, message, context);
  }

  warn(category: LogCategory, message: string, context?: LogContext): void {
    this.log('warn', category, message, context);
  }

  error(category: LogCategory, message: string, error?: Error, context?: LogContext): void {
    this.log('error', category, message, context, error);
  }

  // Helpers spécifiques
  auth(message: string, userId?: string, error?: Error): void {
    this.log('info', 'auth', message, { userId }, error);
  }

  payment(message: string, amount?: number, userId?: string, error?: Error): void {
    this.log('info', 'payment', message, { amount, userId }, error);
  }

  quota(message: string, quotaType: string, current: number, limit: number, userId?: string): void {
    this.log('info', 'quota', message, { quotaType, current, limit, userId });
  }

  api(method: string, path: string, statusCode: number, durationMs: number, userId?: string): void {
    const level = statusCode >= 400 ? 'warn' : 'info';
    this.log(level, 'api', `${method} ${path} - ${statusCode}`, {
      statusCode,
      durationMs,
      userId,
    });
  }

  db(operation: string, table: string, success: boolean, error?: Error): void {
    const message = `${operation} on ${table} - ${success ? 'success' : 'failed'}`;
    this.log(success ? 'debug' : 'error', 'db', message, { table }, error);
  }

  ai(message: string, model?: string, tokensUsed?: number, userId?: string): void {
    this.log('info', 'ai', message, { model, tokensUsed, userId });
  }
}

// Export singleton
export const logger = Logger.getInstance();
export type { LogLevel, LogCategory, LogContext };
