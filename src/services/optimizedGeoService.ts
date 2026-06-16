/**
 * Service de recherche géographique optimisé
 * Utilise PostGIS quand disponible, sinon fallback sur calcul Haversine
 */

import { getSupabaseClient } from '@/lib/database/core';

export interface GeoSearchOptions {
  radiusKm?: number;
  limit?: number;
  includeDistance?: boolean;
}

export interface ProfessionalWithDistance {
  id: string;
  user_id: string;
  company_name: string;
  specialties: string[];
  experience_years: number;
  rating_average: number;
  coverage_radius: number;
  distance_km: number;
  within_coverage: boolean;
  score?: number;
  profiles?: any;
}

export interface ProjectWithDistance {
  id: string;
  title: string;
  category: string;
  city: string;
  postal_code: string;
  distance_km: number;
  within_coverage?: boolean;
  estimated_budget_min?: number;
  estimated_budget_max?: number;
}

/**
 * Service de géolocalisation optimisé
 */
export class OptimizedGeoService {
  private static instance: OptimizedGeoService;
  private supabase = getSupabaseClient();

  static getInstance(): OptimizedGeoService {
    if (!OptimizedGeoService.instance) {
      OptimizedGeoService.instance = new OptimizedGeoService();
    }
    return OptimizedGeoService.instance;
  }

  /**
   * Rechercher les professionnels à proximité d'un projet
   */
  async findProfessionalsNearProject(
    projectId: string,
    options: GeoSearchOptions = {}
  ): Promise<{
    professionals: ProfessionalWithDistance[];
    error: Error | null;
  }> {
    const { radiusKm = 50, limit = 20 } = options;

    try {
      const { data, error } = await this.supabase.rpc(
        'find_nearby_professionals',
        {
          p_project_id: projectId,
          p_max_distance_km: radiusKm,
          p_limit: limit,
        }
      );

      if (error) {
        console.error('❌ Erreur find_nearby_professionals:', error);
        return { professionals: [], error };
      }

      return { professionals: data || [], error: null };
    } catch (err) {
      console.error('❌ Exception find_nearby_professionals:', err);
      return { professionals: [], error: err as Error };
    }
  }

  /**
   * Rechercher les projets à proximité d'un professionnel
   */
  async findProjectsNearProfessional(
    professionalId: string,
    options: GeoSearchOptions = {}
  ): Promise<{
    projects: ProjectWithDistance[];
    error: Error | null;
  }> {
    const { radiusKm = 50, limit = 20 } = options;

    try {
      const { data, error } = await this.supabase.rpc('find_nearby_projects', {
        p_professional_id: professionalId,
        p_max_distance_km: radiusKm,
        p_limit: limit,
      });

      if (error) {
        console.error('❌ Erreur find_nearby_projects:', error);
        return { projects: [], error };
      }

      return { projects: data || [], error: null };
    } catch (err) {
      console.error('❌ Exception find_nearby_projects:', err);
      return { projects: [], error: err as Error };
    }
  }

  /**
   * Rechercher par code postal
   */
  async searchByPostalCode(
    postalCode: string,
    type: 'professionals' | 'projects' = 'professionals',
    options: GeoSearchOptions = {}
  ): Promise<{
    results: any[];
    error: Error | null;
  }> {
    const { radiusKm = 30 } = options;

    try {
      const { data, error } = await this.supabase.rpc('search_by_postal_code', {
        p_postal_code: postalCode,
        p_radius_km: radiusKm,
        p_search_type: type,
      });

      if (error) {
        console.error('❌ Erreur search_by_postal_code:', error);
        return { results: [], error };
      }

      return { results: data || [], error: null };
    } catch (err) {
      console.error('❌ Exception search_by_postal_code:', err);
      return { results: [], error: err as Error };
    }
  }

  /**
   * Rechercher par coordonnées GPS
   */
  async searchByCoordinates(
    latitude: number,
    longitude: number,
    type: 'professionals' | 'projects' = 'professionals',
    options: GeoSearchOptions = {}
  ): Promise<{
    results: any[];
    error: Error | null;
  }> {
    const { radiusKm = 50, limit = 20 } = options;

    try {
      if (type === 'professionals') {
        const { data: professionals, error } = await this.supabase
          .from('professionals')
          .select(
            `
            id,
            user_id,
            company_name,
            specialties,
            experience_years,
            rating_average,
            coverage_radius,
            profiles!inner(
              id,
              full_name,
              city,
              postal_code,
              latitude,
              longitude
            )
          `
          )
          .eq('status', 'verified')
          .not('profiles.latitude', 'is', null)
          .not('profiles.longitude', 'is', null);

        if (error) {
          return { results: [], error };
        }

        // Calculer les distances
        const results = (professionals || [])
          .map((pro: any) => {
            const distance = this.calculateDistance(
              latitude,
              longitude,
              pro.profiles.latitude,
              pro.profiles.longitude
            );

            return {
              ...pro,
              distance_km: Math.round(distance * 10) / 10,
              within_coverage: distance <= (pro.coverage_radius || 50),
            };
          })
          .filter((pro: any) => pro.distance_km <= radiusKm)
          .sort((a: any, b: any) => a.distance_km - b.distance_km)
          .slice(0, limit);

        return { results, error: null };
      } else {
        const { data: projects, error } = await this.supabase
          .from('projects')
          .select(
            'id, title, category, city, postal_code, latitude, longitude, estimated_budget_min, estimated_budget_max'
          )
          .eq('status', 'published')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (error) {
          return { results: [], error };
        }

        // Calculer les distances
        const results = (projects || [])
          .map((proj: any) => {
            const distance = this.calculateDistance(
              latitude,
              longitude,
              proj.latitude,
              proj.longitude
            );

            return {
              ...proj,
              distance_km: Math.round(distance * 10) / 10,
            };
          })
          .filter((proj: any) => proj.distance_km <= radiusKm)
          .sort((a: any, b: any) => a.distance_km - b.distance_km)
          .slice(0, limit);

        return { results, error: null };
      }
    } catch (err) {
      console.error('❌ Exception searchByCoordinates:', err);
      return { results: [], error: err as Error };
    }
  }

  /**
   * Mettre à jour les coordonnées d'un profil à partir du code postal
   */
  async updateProfileCoordinates(
    profileId: string,
    postalCode: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      // Utiliser un service de géocodage (API externe ou base de données locale)
      const coords = await this.geocodePostalCode(postalCode);

      if (!coords) {
        return {
          success: false,
          error: new Error('Impossible de géocoder le code postal'),
        };
      }

      const { error } = await this.supabase
        .from('profiles')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        .eq('id', profileId);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  }

  /**
   * Mettre à jour les coordonnées d'un projet à partir du code postal
   */
  async updateProjectCoordinates(
    projectId: string,
    postalCode: string
  ): Promise<{ success: boolean; error: Error | null }> {
    try {
      const coords = await this.geocodePostalCode(postalCode);

      if (!coords) {
        return {
          success: false,
          error: new Error('Impossible de géocoder le code postal'),
        };
      }

      const { error } = await this.supabase
        .from('projects')
        .update({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
        .eq('id', projectId);

      if (error) {
        return { success: false, error };
      }

      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  }

  /**
   * Géocodage de code postal (base de données locale simplifiée)
   * Pour une solution production, utiliser une API comme api-adresse.data.gouv.fr
   */
  private async geocodePostalCode(
    postalCode: string
  ): Promise<{ latitude: number; longitude: number } | null> {
    // Base de données simplifiée des codes postaux français
    const postalCodeCoords: { [key: string]: { lat: number; lng: number } } = {
      // Paris
      '75001': { lat: 48.86, lng: 2.34 },
      '75002': { lat: 48.87, lng: 2.34 },
      '75003': { lat: 48.86, lng: 2.36 },
      '75004': { lat: 48.85, lng: 2.36 },
      '75005': { lat: 48.84, lng: 2.35 },
      '75006': { lat: 48.85, lng: 2.33 },
      '75007': { lat: 48.86, lng: 2.32 },
      '75008': { lat: 48.87, lng: 2.32 },
      '75009': { lat: 48.88, lng: 2.34 },
      '75010': { lat: 48.87, lng: 2.36 },
      '75011': { lat: 48.86, lng: 2.38 },
      '75012': { lat: 48.84, lng: 2.37 },
      '75013': { lat: 48.83, lng: 2.36 },
      '75014': { lat: 48.84, lng: 2.32 },
      '75015': { lat: 48.84, lng: 2.3 },
      '75016': { lat: 48.85, lng: 2.28 },
      '75017': { lat: 48.88, lng: 2.3 },
      '75018': { lat: 48.89, lng: 2.34 },
      '75019': { lat: 48.89, lng: 2.38 },
      '75020': { lat: 48.86, lng: 2.39 },
      // Lyon
      '69001': { lat: 45.76, lng: 4.84 },
      '69002': { lat: 45.76, lng: 4.85 },
      '69003': { lat: 45.75, lng: 4.86 },
      '69004': { lat: 45.78, lng: 4.83 },
      '69005': { lat: 45.76, lng: 4.81 },
      '69006': { lat: 45.77, lng: 4.85 },
      '69007': { lat: 45.73, lng: 4.84 },
      '69008': { lat: 45.74, lng: 4.87 },
      '69009': { lat: 45.78, lng: 4.8 },
      // Marseille
      '13001': { lat: 43.3, lng: 5.38 },
      '13002': { lat: 43.3, lng: 5.39 },
      '13003': { lat: 43.31, lng: 5.38 },
      '13004': { lat: 43.3, lng: 5.4 },
      '13005': { lat: 43.29, lng: 5.4 },
      '13006': { lat: 43.29, lng: 5.38 },
      // Bordeaux
      '33000': { lat: 44.84, lng: -0.58 },
      '33100': { lat: 44.85, lng: -0.56 },
      '33200': { lat: 44.85, lng: -0.6 },
      '33300': { lat: 44.86, lng: -0.57 },
      // Toulouse
      '31000': { lat: 43.6, lng: 1.44 },
      '31100': { lat: 43.61, lng: 1.45 },
      '31200': { lat: 43.62, lng: 1.44 },
      '31300': { lat: 43.59, lng: 1.42 },
      // Nice
      '06000': { lat: 43.7, lng: 7.27 },
      '06100': { lat: 43.73, lng: 7.26 },
      '06200': { lat: 43.68, lng: 7.22 },
      '06300': { lat: 43.7, lng: 7.28 },
    };

    // Recherche exacte
    const coords = postalCodeCoords[postalCode];
    if (coords) {
      return { latitude: coords.lat, longitude: coords.lng };
    }

    // Fallback: utiliser le département (2 premiers chiffres)
    const dept = postalCode.slice(0, 2);
    const deptCoords = postalCodeCoords[dept + '001'];
    if (deptCoords) {
      return { latitude: deptCoords.lat, longitude: deptCoords.lng };
    }

    // TODO: Intégrer une vraie API de géocodage pour les codes postaux non répertoriés
    // Exemple: https://api-adresse.data.gouv.fr/search/?q=${postalCode}&type=municipality

    return null;
  }

  /**
   * Calcul de distance avec formule de Haversine
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

// Export singleton
export const optimizedGeoService = OptimizedGeoService.getInstance();
export default optimizedGeoService;
