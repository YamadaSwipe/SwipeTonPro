import { supabase } from '@/integrations/supabase/client';

export interface Tarif {
  id: string;
  min_estimation: number;
  max_estimation: number;
  frais: number;
  description: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export class TarifService {
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  private static cache: Map<string, { data: any; timestamp: number }> = new Map();

  /**
   * Calcule les frais de mise en relation selon l'estimation
   */
  static async calculerFrais(estimation: number): Promise<number> {
    const cacheKey = `frais_${estimation}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const { data, error } = await (supabase as any)
      .from('tarifs_mise_en_relation')
      .select('frais')
      .eq('actif', true)
      .lte('min_estimation', estimation)
      .gte('max_estimation', estimation)
      .single();

    if (error) {
      console.error('Erreur calcul frais:', error);
      throw new Error('Impossible de calculer les frais pour cette estimation');
    }

    this.cache.set(cacheKey, { data: data.frais, timestamp: Date.now() });
    return data.frais;
  }

  /**
   * Récupère tous les tarifs actifs
   */
  static async getAllTarifs(): Promise<Tarif[]> {
    const cacheKey = 'all_tarifs';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    const { data, error } = await (supabase as any)
      .from('tarifs_mise_en_relation')
      .select('*')
      .eq('actif', true)
      .order('min_estimation', { ascending: true });

    if (error) {
      console.error('Erreur récupération tarifs:', error);
      throw new Error('Impossible de récupérer les tarifs');
    }

    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    return data || [];
  }

  /**
   * Récupère un tarif par son ID
   */
  static async getTarifById(id: string): Promise<Tarif | null> {
    const { data, error } = await (supabase as any)
      .from('tarifs_mise_en_relation')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erreur récupération tarif:', error);
      return null;
    }

    return data;
  }

  /**
   * Crée ou met à jour un tarif
   */
  static async saveTarif(tarif: Omit<Tarif, 'id' | 'created_at' | 'updated_at'>, id?: string): Promise<Tarif> {
    const tarifData = {
      ...tarif,
      updated_at: new Date().toISOString()
    };

    if (id) {
      // Mise à jour
      const { data, error } = await (supabase as any)
        .from('tarifs_mise_en_relation')
        .update(tarifData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Erreur mise à jour tarif:', error);
        throw new Error('Impossible de mettre à jour le tarif');
      }

      this.invalidateCache();
      return data;
    } else {
      // Création
      const { data, error } = await (supabase as any)
        .from('tarifs_mise_en_relation')
        .insert(tarifData)
        .select()
        .single();

      if (error) {
        console.error('Erreur création tarif:', error);
        throw new Error('Impossible de créer le tarif');
      }

      this.invalidateCache();
      return data;
    }
  }

  /**
   * Supprime un tarif
   */
  static async deleteTarif(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from('tarifs_mise_en_relation')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erreur suppression tarif:', error);
      throw new Error('Impossible de supprimer le tarif');
    }

    this.invalidateCache();
  }

  /**
   * Active/désactive un tarif
   */
  static async toggleTarif(id: string, actif: boolean): Promise<void> {
    const { error } = await (supabase as any)
      .from('tarifs_mise_en_relation')
      .update({ 
        actif, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);

    if (error) {
      console.error('Erreur activation tarif:', error);
      throw new Error('Impossible de modifier le statut du tarif');
    }

    this.invalidateCache();
  }

  /**
   * Invalide le cache
   */
  private static invalidateCache(): void {
    this.cache.clear();
  }

  /**
   * Formate un montant en euros
   */
  static formatMontant(montant: number): string {
    return montant.toLocaleString('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    });
  }

  /**
   * Formate une plage d'estimation
   */
  static formatEstimation(min: number, max: number): string {
    if (max >= 999999999) {
      return `> ${this.formatMontant(min)}`;
    }
    if (min === 0) {
      return `< ${this.formatMontant(max)}`;
    }
    return `${this.formatMontant(min)} - ${this.formatMontant(max)}`;
  }
}
