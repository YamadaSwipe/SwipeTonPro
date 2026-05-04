/**
 * @fileoverview Lazy Loading System - Memory Optimization
 * @author Senior Architect
 * @version 1.0.0
 *
 * Dynamically imports modules to reduce initial memory footprint
 */

// Heavy components loaded on demand
export const lazyComponents = {
  // Admin components
  AdminDashboard: () => import('@/components/admin/AdminDashboard'),
  // Commented out - modules don't exist yet
  // AdminUsers: () => import('@/components/admin/AdminUsers'),
  // AdminRoles: () => import('@/components/admin/AdminRoles'),

  // Chat components
  ChatWindow: () => import('@/components/chat/ChatWindow'),
  ConversationList: () => import('@/components/chat/ConversationList'),

  // Professional components
  ProjectCard: () => import('@/components/professional/ProjectCard'),
  CreditBalance: () => import('@/components/professional/CreditBalance'),

  // Heavy UI components
  // Commented out - modules don't exist yet
  // DataTable: () => import('@/components/ui/data-table'),
  // RichTextEditor: () => import('@/components/ui/rich-text-editor'),
};

// Services loaded on demand
export const lazyServices = {
  // Heavy services
  analyticsService: () => import('@/services/analyticsService'),
  notificationService: () => import('@/services/notificationService'),
  chatService: () => import('@/services/chatService'),

  // Admin services
  adminService: () => import('@/services/adminService'),
  // crmService: () => import('@/services/crmService'), // Module doesn't exist
};

// Utils loaded on demand
export const lazyUtils = {
  // Heavy utilities
  // Commented out - modules don't exist yet
  // pdfGenerator: () => import('@/utils/pdfGenerator'),
  // excelExporter: () => import('@/utils/excelExporter'),
  // imageProcessor: () => import('@/utils/imageProcessor'),
  // Formatters
  // currencyFormatter: () => import('@/utils/formatters/currency'),
  // dateFormatter: () => import('@/utils/formatters/date'),
};

/**
 * Dynamic import wrapper with error handling
 */
export async function dynamicImport<T>(
  importFn: () => Promise<{ default: T }>,
  fallback?: T
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.warn('Failed to lazy import module:', error);
    if (fallback) return fallback;
    throw error;
  }
}

/**
 * Preload critical modules
 */
export function preloadCriticalModules() {
  // Preload only essential modules
  const critical = [
    () => import('@/lib/database/core'),
    () => import('@/services/databaseService-v2'),
    () => import('@/hooks/useAuth'),
  ];

  critical.forEach((importFn) => {
    importFn().catch(() => {
      // Ignore preload errors
    });
  });
}

/**
 * Memory monitor utility
 */
export class MemoryMonitor {
  private static instance: MemoryMonitor;
  private intervals: NodeJS.Timeout[] = [];

  static getInstance(): MemoryMonitor {
    if (!MemoryMonitor.instance) {
      MemoryMonitor.instance = new MemoryMonitor();
    }
    return MemoryMonitor.instance;
  }

  startMonitoring(intervalMs: number = 30000) {
    const interval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const used = Math.round(memUsage.heapUsed / 1024 / 1024);
      const total = Math.round(memUsage.heapTotal / 1024 / 1024);

      console.log(`🧠 Memory: ${used}MB / ${total}MB`);

      // Alert if memory usage is high
      if (used > 1024) {
        // 1GB
        console.warn('⚠️ High memory usage detected:', used, 'MB');
        this.cleanup();
      }
    }, intervalMs);

    this.intervals.push(interval);
  }

  stopMonitoring() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  private cleanup() {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('🧹 Forced garbage collection');
    }
  }
}

// Auto-start monitoring in development
if (process.env.NODE_ENV === 'development') {
  MemoryMonitor.getInstance().startMonitoring();
}
