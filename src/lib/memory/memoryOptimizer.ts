/**
 * @fileoverview Memory Optimization Utilities
 * @author Senior Architect
 * @version 1.0.0
 * 
 * Advanced memory management for Next.js applications
 */

/**
 * Memory optimization configuration
 */
export const MEMORY_CONFIG = {
  // Garbage collection intervals
  GC_INTERVAL: 60000, // 1 minute
  
  // Memory thresholds (MB)
  WARNING_THRESHOLD: 512, // 512MB
  CRITICAL_THRESHOLD: 1024, // 1GB
  
  // Cache limits
  MAX_CACHE_SIZE: 100, // items
  CACHE_TTL: 300000, // 5 minutes
  
  // Component cleanup
  COMPONENT_CLEANUP_DELAY: 5000, // 5 seconds
};

/**
 * Simple LRU Cache implementation
 */
class LRUCache<K, V> {
  private cache = new Map<K, { value: V; timestamp: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = MEMORY_CONFIG.MAX_CACHE_SIZE, ttl: number = MEMORY_CONFIG.CACHE_TTL) {
    this.maxSize = maxSize;
    this.ttl = ttl;
    
    // Auto-cleanup expired items
    setInterval(() => this.cleanup(), this.ttl / 2);
  }

  set(key: K, value: V): void {
    // Remove oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    
    if (!item) return undefined;
    
    // Check if expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return undefined;
    }
    
    // Move to end (LRU)
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return item.value;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

/**
 * Memory Manager Class
 */
export class MemoryManager {
  private static instance: MemoryManager;
  private caches: Map<string, LRUCache<any, any>> = new Map();
  private intervals: NodeJS.Timeout[] = [];
  private observers: MutationObserver[] = [];

  static getInstance(): MemoryManager {
    if (!MemoryManager.instance) {
      MemoryManager.instance = new MemoryManager();
    }
    return MemoryManager.instance;
  }

  constructor() {
    this.startMemoryMonitoring();
    this.setupGarbageCollection();
  }

  /**
   * Get or create a cache instance
   */
  getCache<T>(name: string, maxSize?: number, ttl?: number): LRUCache<string, T> {
    if (!this.caches.has(name)) {
      this.caches.set(name, new LRUCache<string, T>(maxSize, ttl));
    }
    return this.caches.get(name)!;
  }

  /**
   * Monitor memory usage
   */
  private startMemoryMonitoring() {
    const interval = setInterval(() => {
      const memUsage = process.memoryUsage();
      const heapUsed = Math.round(memUsage.heapUsed / 1024 / 1024);
      const heapTotal = Math.round(memUsage.heapTotal / 1024 / 1024);
      const external = Math.round(memUsage.external / 1024 / 1024);

      console.log(`🧠 Memory Stats:`);
      console.log(`   Heap Used: ${heapUsed}MB`);
      console.log(`   Heap Total: ${heapTotal}MB`);
      console.log(`   External: ${external}MB`);
      console.log(`   Cache Items: ${this.getTotalCacheSize()}`);

      // Handle high memory usage
      if (heapUsed > MEMORY_CONFIG.CRITICAL_THRESHOLD) {
        console.warn('🚨 CRITICAL memory usage detected!');
        this.emergencyCleanup();
      } else if (heapUsed > MEMORY_CONFIG.WARNING_THRESHOLD) {
        console.warn('⚠️ High memory usage detected');
        this.softCleanup();
      }
    }, MEMORY_CONFIG.GC_INTERVAL);

    this.intervals.push(interval);
  }

  /**
   * Setup automatic garbage collection
   */
  private setupGarbageCollection() {
    // Force GC periodically in development
    if (process.env.NODE_ENV === 'development' && global.gc) {
      const interval = setInterval(() => {
        global.gc();
        console.log('🧹 Scheduled garbage collection');
      }, MEMORY_CONFIG.GC_INTERVAL * 2);
      
      this.intervals.push(interval);
    }
  }

  /**
   * Soft cleanup - clear caches and suggest GC
   */
  private softCleanup() {
    console.log('🧹 Performing soft cleanup...');
    
    // Clear caches older than TTL
    this.caches.forEach(cache => cache.clear());
    
    // Suggest garbage collection
    if (global.gc) {
      global.gc();
    }
  }

  /**
   * Emergency cleanup - aggressive memory freeing
   */
  private emergencyCleanup() {
    console.log('🚨 Performing emergency cleanup...');
    
    // Clear all caches
    this.caches.forEach(cache => cache.clear());
    this.caches.clear();
    
    // Force garbage collection multiple times
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
      }
    }
    
    // Clear all intervals
    this.intervals.forEach(clearInterval);
    this.intervals = [];
    
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }

  /**
   * Get total cache size across all caches
   */
  private getTotalCacheSize(): number {
    let total = 0;
    this.caches.forEach(cache => {
      total += cache.size;
    });
    return total;
  }

  /**
   * Setup DOM observers for component cleanup
   */
  setupComponentCleanup() {
    if (typeof window === 'undefined') return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // Clean up React components
            if (element.hasAttribute('data-react-component')) {
              setTimeout(() => {
                // Force cleanup of removed components
                this.cleanupComponent(element);
              }, MEMORY_CONFIG.COMPONENT_CLEANUP_DELAY);
            }
          }
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.observers.push(observer);
  }

  /**
   * Clean up component references
   */
  private cleanupComponent(element: Element) {
    // Remove event listeners
    const cloned = element.cloneNode(true);
    element.parentNode?.replaceChild(cloned, element);
  }

  /**
   * Cleanup method for graceful shutdown
   */
  destroy() {
    this.emergencyCleanup();
  }
}

// Export singleton instance
export const memoryManager = MemoryManager.getInstance();

// Auto-initialize in browser
if (typeof window !== 'undefined') {
  memoryManager.setupComponentCleanup();
}

// Export for server-side usage
export default memoryManager;
