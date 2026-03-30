/**
 * File d'attente pour les appels Supabase
 * Évite les locks et les requêtes simultanées
 */

interface QueuedRequest {
  id: string;
  type: string;
  execute: () => Promise<any>;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

class SupabaseQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private pendingRequests = new Map<string, Promise<any>>();

  // Ajouter une requête à la file d'attente
  async add<T>(
    type: string, 
    execute: () => Promise<T>, 
    deduplicationKey?: string
  ): Promise<T> {
    // Déduplication : si une requête identique est en cours, retourner la même promesse
    if (deduplicationKey && this.pendingRequests.has(deduplicationKey)) {
      console.log(`🔄 Déduplication Supabase: ${deduplicationKey}`);
      return this.pendingRequests.get(deduplicationKey) as Promise<T>;
    }

    const promise = new Promise<T>((resolve, reject) => {
      const request: QueuedRequest = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        execute,
        resolve,
        reject,
      };

      this.queue.push(request);
      
      if (deduplicationKey) {
        this.pendingRequests.set(deduplicationKey, promise);
      }
    });

    this.processQueue();
    return promise;
  }

  // Traiter la file d'attente
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🚀 Traitement file Supabase: ${this.queue.length} requêtes`);

    while (this.queue.length > 0) {
      const request = this.queue.shift()!;
      
      try {
        console.log(`⚡ Exécution requête: ${request.type} (${request.id})`);
        const result = await request.execute();
        request.resolve(result);
        
        // Nettoyer la déduplication après succès
        const deduplicationKey = this.getDeduplicationKey(request.type);
        if (deduplicationKey) {
          this.pendingRequests.delete(deduplicationKey);
        }
        
        // Petit délai entre les requêtes pour éviter les locks
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Erreur requête ${request.type}:`, error);
        request.reject(error);
        
        // Nettoyer la déduplication après erreur
        const deduplicationKey = this.getDeduplicationKey(request.type);
        if (deduplicationKey) {
          this.pendingRequests.delete(deduplicationKey);
        }
      }
    }

    this.isProcessing = false;
  }

  private getDeduplicationKey(type: string): string | undefined {
    const deduplicationMap: Record<string, string> = {
      'platform_settings': 'platform_settings',
      'auth_user': 'auth_user',
      'professional_profile': 'professional_profile',
      'user_projects': 'user_projects',
    };
    return deduplicationMap[type];
  }

  // Vider la file d'attente
  clear() {
    this.queue = [];
    this.pendingRequests.clear();
    console.log('🧹 File Supabase vidée');
  }
}

export const supabaseQueue = new SupabaseQueue();
