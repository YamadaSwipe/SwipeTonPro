/**
 * @fileoverview Memory Initialization Script
 * @author Senior Architect
 * @version 1.0.0
 * 
 * Initialize memory optimization system
 */

import { memoryManager } from '@/lib/memory/memoryOptimizer';
import { preloadCriticalModules } from '@/lib/lazy/lazyImports';

// Initialize memory management
if (typeof window !== 'undefined') {
  // Client-side initialization
  console.log('🧠 Initializing memory optimization...');
  
  // Preload critical modules
  preloadCriticalModules();
  
  // Setup memory monitoring
  memoryManager.setupComponentCleanup();
  
  // Handle page visibility changes
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Page is hidden - perform cleanup
      console.log('🧹 Performing background cleanup...');
      memoryManager.getCache('temp')?.clear();
      
      // Suggest garbage collection
      if (global.gc) {
        global.gc();
      }
    }
  });
  
  // Handle page unload
  window.addEventListener('beforeunload', () => {
    console.log('🧹 Performing final cleanup...');
    memoryManager.destroy();
  });
  
  console.log('✅ Memory optimization initialized');
}

export {};
