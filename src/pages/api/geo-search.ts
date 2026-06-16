/**
 * API de recherche géographique optimisée
 * Permet de rechercher des artisans ou projets par distance
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSupabaseClient } from '@/lib/database/core';

interface GeoSearchRequest {
  type: 'professionals' | 'projects';
  latitude?: number;
  longitude?: number;
  postalCode?: string;
  radiusKm?: number;
  limit?: number;
  projectId?: string;
  professionalId?: string;
}

interface GeoSearchResponse {
  success: boolean;
  data?: any[];
  error?: string;
  count?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GeoSearchResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Méthode non autorisée',
    });
  }

  try {
    const {
      type,
      latitude,
      longitude,
      postalCode,
      radiusKm = 50,
      limit = 20,
      projectId,
      professionalId,
    } = req.body as GeoSearchRequest;

    const supabase = getSupabaseClient();

    // Cas 1: Rechercher les professionnels à proximité d'un projet
    if (type === 'professionals' && projectId) {
      const { data, error } = await supabase.rpc('get_matching_professionals', {
        p_project_id: projectId,
        p_limit: limit,
      });

      if (error) {
        console.error('❌ Erreur get_matching_professionals:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la recherche des professionnels',
        });
      }

      return res.status(200).json({
        success: true,
        data: data || [],
        count: data?.length || 0,
      });
    }

    // Cas 2: Rechercher les projets à proximité d'un professionnel
    if (type === 'projects' && professionalId) {
      const { data, error } = await supabase.rpc('get_matching_projects', {
        p_professional_id: professionalId,
        p_limit: limit,
      });

      if (error) {
        console.error('❌ Erreur get_matching_projects:', error);
        return res.status(500).json({
          success: false,
          error: 'Erreur lors de la recherche des projets',
        });
      }

      return res.status(200).json({
        success: true,
        data: data || [],
        count: data?.length || 0,
      });
    }

    // Cas 4: Recherche par coordonnées GPS directes
    if (latitude && longitude) {
      // Créer un projet temporaire pour utiliser la fonction existante
      // ou faire une requête directe avec calcul de distance
      
      if (type === 'professionals') {
        const { data: professionals, error } = await supabase
          .from('professionals')
          .select(`
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
              email,
              city,
              postal_code,
              latitude,
              longitude
            )
          `)
          .eq('status', 'verified')
          .not('profiles.latitude', 'is', null)
          .not('profiles.longitude', 'is', null);

        if (error) {
          console.error('❌ Erreur recherche professionnels:', error);
          return res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche',
          });
        }

        // Calculer les distances côté serveur
        const professionalsWithDistance = (professionals || [])
          .map((pro: any) => {
            const distance = calculateDistance(
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

        return res.status(200).json({
          success: true,
          data: professionalsWithDistance,
          count: professionalsWithDistance.length,
        });
      } else {
        // Recherche de projets
        const { data: projects, error } = await supabase
          .from('projects')
          .select('id, title, category, city, postal_code, latitude, longitude, estimated_budget_min, estimated_budget_max')
          .eq('status', 'published')
          .not('latitude', 'is', null)
          .not('longitude', 'is', null);

        if (error) {
          console.error('❌ Erreur recherche projets:', error);
          return res.status(500).json({
            success: false,
            error: 'Erreur lors de la recherche',
          });
        }

        // Calculer les distances côté serveur
        const projectsWithDistance = (projects || [])
          .map((proj: any) => {
            const distance = calculateDistance(
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

        return res.status(200).json({
          success: true,
          data: projectsWithDistance,
          count: projectsWithDistance.length,
        });
      }
    }

    return res.status(400).json({
      success: false,
      error: 'Paramètres de recherche invalides. Fournissez projectId, professionalId, postalCode ou latitude/longitude.',
    });
  } catch (error) {
    console.error('❌ Erreur API geo-search:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur serveur lors de la recherche géographique',
    });
  }
}

/**
 * Calcul de distance avec formule de Haversine
 */
function calculateDistance(
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
