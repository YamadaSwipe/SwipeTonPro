/**
 * @fileoverview Geolocation-based Matching Service
 * @author Senior Architect
 * @version 1.0.0
 *
 * Advanced matching service with real geolocation calculations
 */

import { databaseService } from './databaseService-v2';
import { getSupabaseClient } from '@/lib/database/core';

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
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

/**
 * Geolocation-based matching service
 */
export class GeoMatchingService {
  private static instance: GeoMatchingService;
  private client = getSupabaseClient();

  static getInstance(): GeoMatchingService {
    if (!GeoMatchingService.instance) {
      GeoMatchingService.instance = new GeoMatchingService();
    }
    return GeoMatchingService.instance;
  }

  /**
   * Find professionals near a project location
   */
  async findNearbyProfessionals(
    projectId: string,
    maxDistanceKm: number = 50,
    limit: number = 20
  ): Promise<{ professionals: any[]; error: Error | null }> {
    try {
      // Get project details with coordinates
      const { data: project, error: projectError } = await this.client
        .from('projects')
        .select(
          'id, title, category, city, postal_code, latitude, longitude, estimated_budget_min, estimated_budget_max'
        )
        .eq('id', projectId)
        .single();

      if (projectError || !project) {
        return {
          professionals: [],
          error: projectError || new Error('Projet non trouvé'),
        };
      }

      // If project has no coordinates, use geocoding (simplified)
      const projectCoords = await this._getProjectCoordinates(project);

      if (!projectCoords) {
        return {
          professionals: [],
          error: new Error('Coordonnées du projet non disponibles'),
        };
      }

      // Get all active professionals with their coordinates
      const { data: professionals, error: prosError } = await this.client
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
            email,
            phone,
            avatar_url,
            city,
            postal_code,
            latitude,
            longitude
          )
        `
        )
        .eq('status', 'verified');

      if (prosError) {
        console.error('❌ Supabase error fetching professionals:', prosError);
        return { professionals: [], error: prosError };
      }

      if (!professionals || professionals.length === 0) {
        console.log('ℹ️ No professionals found in database');
        return { professionals: [], error: null };
      }

      console.log(`✅ Found ${professionals.length} professionals in database`);

      // Calculate distances and filter
      const nearbyProfessionals = (professionals || [])
        .map((pro) => {
          const proCoords = {
            latitude: pro.profiles.latitude,
            longitude: pro.profiles.longitude,
          };

          if (!proCoords.latitude || !proCoords.longitude) {
            return { ...pro, distance: null, score: 0 };
          }

          const distance = calculateDistance(
            projectCoords.latitude,
            projectCoords.longitude,
            proCoords.latitude,
            proCoords.longitude
          );

          // Calculate matching score based on distance and other factors
          const score = this._calculateMatchingScore(project, pro, distance);

          return {
            ...pro,
            distance: Math.round(distance * 10) / 10, // Round to 1 decimal
            score,
            withinCoverage: distance <= (pro.coverage_radius || 30), // Fallback to 30km
            rating: pro.rating_average || 0, // Fallback for rating
            experience_years: pro.experience_years || 0, // Fallback for experience
            specialties: pro.specialties || [], // Fallback for specialties
          };
        })
        .filter(
          (pro) =>
            pro.distance !== null &&
            pro.distance <= maxDistanceKm &&
            pro.score > 20 // Minimum score threshold
        )
        .sort((a, b) => b.score - a.score) // Sort by score (highest first)
        .slice(0, limit);

      return { professionals: nearbyProfessionals, error: null };
    } catch (err) {
      console.error('Error finding nearby professionals:', err);
      return { professionals: [], error: err as Error };
    }
  }

  /**
   * Get project coordinates (with fallback geocoding)
   */
  async _getProjectCoordinates(
    project: any
  ): Promise<{ latitude: number; longitude: number } | null> {
    // If coordinates exist, use them
    if (project.latitude && project.longitude) {
      return {
        latitude: parseFloat(project.latitude),
        longitude: parseFloat(project.longitude),
      };
    }

    // Fallback: use postal code geocoding (simplified)
    if (project.postal_code) {
      const coords = this._geocodePostalCode(project.postal_code);
      if (coords) {
        return coords;
      }
    }

    // Fallback: use city with default coordinates
    if (project.city) {
      console.log(`📍 Using city fallback for: ${project.city}`);
      // Return default Paris coordinates as fallback
      return { latitude: 48.8566, longitude: 2.352 };
    }

    // Final fallback: return default coordinates
    console.warn('⚠️ No location data found, using default coordinates');
    return { latitude: 48.8566, longitude: 2.352 }; // Paris
  }

  /**
   * Simple postal code geocoding (fallback)
   */
  private _geocodePostalCode(
    postalCode: string
  ): { latitude: number; longitude: number } | null {
    // Simplified French postal code coordinates
    const postalCodeCoords: { [key: string]: { lat: number; lng: number } } = {
      '75001': { lat: 48.86, lng: 2.34 }, // Paris
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
      // Add more as needed
      '69001': { lat: 45.76, lng: 4.84 }, // Lyon
      '69002': { lat: 45.76, lng: 4.85 },
      // Marseille
      '13001': { lat: 43.3, lng: 5.38 },
      '13002': { lat: 43.3, lng: 5.39 },
      // Bordeaux
      '33000': { lat: 44.84, lng: -0.58 },
      // Toulouse
      '31000': { lat: 43.6, lng: 1.44 },
      // Nice
      '06000': { lat: 43.7, lng: 7.27 },
    };

    const dept = postalCode.slice(0, 2);
    const coords =
      postalCodeCoords[postalCode] || postalCodeCoords[dept + '001'];

    if (coords) {
      return { latitude: coords.lat, longitude: coords.lng };
    }

    return null;
  }

  /**
   * Calculate comprehensive matching score
   */
  private _calculateMatchingScore(
    project: any,
    professional: any,
    distance: number
  ): number {
    let score = 0;

    // Distance score (40% weight)
    const distanceScore = Math.max(0, 100 - distance * 2); // 2 points per km
    score += distanceScore * 0.4;

    // Coverage radius bonus (10% weight)
    if (distance <= (professional.coverage_radius || 50)) {
      score += 100 * 0.1;
    }

    // Specialities matching (25% weight)
    if (
      professional.specialities &&
      professional.specialities.includes(project.category)
    ) {
      score += 100 * 0.25;
    } else if (
      professional.specialities &&
      professional.specialities.some(
        (spec: string) =>
          spec.toLowerCase().includes(project.category.toLowerCase()) ||
          project.category.toLowerCase().includes(spec.toLowerCase())
      )
    ) {
      score += 70 * 0.25;
    }

    // Experience score (15% weight)
    const experienceScore = Math.min(100, professional.experience_years * 10);
    score += experienceScore * 0.15;

    // Rating score (10% weight)
    const ratingScore = (professional.rating_average || 0) * 20; // 5 stars = 100 points
    score += ratingScore * 0.1;

    return Math.round(score);
  }

  /**
   * Notify nearby professionals about new project
   */
  async notifyNearbyProfessionals(
    projectId: string,
    maxDistanceKm: number = 30
  ): Promise<{ notified: number; error: Error | null }> {
    try {
      console.log(
        '🔔 notifyNearbyProfessionals called for project:',
        projectId
      );

      const { professionals, error } = await this.findNearbyProfessionals(
        projectId,
        maxDistanceKm,
        10
      );

      if (error) {
        console.error('❌ Error in findNearbyProfessionals:', error);
        return { notified: 0, error };
      }

      if (!professionals || professionals.length === 0) {
        console.log('ℹ️ No professionals found to notify');
        return { notified: 0, error: null };
      }

      console.log(`📧 Found ${professionals.length} professionals to evaluate`);

      let notifiedCount = 0;

      for (const professional of professionals) {
        if (professional.withinCoverage && professional.score > 50) {
          // Create notification for professional
          await this._createProjectNotification(
            professional.user_id,
            projectId
          );
          notifiedCount++;
        }
      }

      return { notified: notifiedCount, error: null };
    } catch (err) {
      console.error('Error notifying nearby professionals:', err);
      return { notified: 0, error: err as Error };
    }
  }

  /**
   * Create project notification for professional
   */
  async _createProjectNotification(
    userId: string,
    projectId: string
  ): Promise<void> {
    try {
      // Get project details
      const { data: project } = await this.client
        .from('projects')
        .select('title, category, city')
        .eq('id', projectId)
        .single();

      const notificationData = {
        user_id: userId,
        title: 'Nouveau projet près de chez vous',
        message: `Un nouveau projet "${project?.title}" (${project?.category}) est disponible à ${project?.city}`,
        type: 'new_project_nearby',
        data: {
          project_id: projectId,
          category: project?.category,
          city: project?.city,
        },
      };

      await databaseService.createNotification(notificationData);
    } catch (err) {
      console.warn('Error creating project notification:', err);
      // Don't throw - notification failure is not critical
    }
  }

  /**
   * Get professional's service area statistics
   */
  async getServiceAreaStats(professionalId: string): Promise<{
    totalProjects: number;
    nearbyProjects: number;
    averageDistance: number;
    coverageRate: number;
  } | null> {
    try {
      // Get professional coordinates and coverage radius
      const { data: professional, error: proError } = await this.client
        .from('professionals')
        .select(
          `
          coverage_radius,
          profiles!inner(latitude, longitude)
        `
        )
        .eq('id', professionalId)
        .single();

      if (proError || !professional) return null;

      // Get all projects in the same category
      const { data: projects } = await this.client
        .from('projects')
        .select('id, latitude, longitude, category, status')
        .eq('status', 'published');

      if (
        !projects ||
        !professional.profiles.latitude ||
        !professional.profiles.longitude
      ) {
        return null;
      }

      const proCoords = {
        latitude: professional.profiles.latitude,
        longitude: professional.profiles.longitude,
      };

      const coverageRadius = professional.coverage_radius || 50;

      let nearbyCount = 0;
      let totalDistance = 0;
      let validDistanceCount = 0;

      projects.forEach((project) => {
        if (project.latitude && project.longitude) {
          const distance = calculateDistance(
            Number(proCoords.latitude),
            Number(proCoords.longitude),
            parseFloat(project.latitude as any),
            parseFloat(project.longitude as any)
          );

          if (distance <= coverageRadius) {
            nearbyCount++;
          }

          totalDistance += distance;
          validDistanceCount++;
        }
      });

      return {
        totalProjects: projects.length,
        nearbyProjects: nearbyCount,
        averageDistance:
          validDistanceCount > 0
            ? Math.round((totalDistance / validDistanceCount) * 10) / 10
            : 0,
        coverageRate:
          projects.length > 0
            ? Math.round((nearbyCount / projects.length) * 100)
            : 0,
      };
    } catch (err) {
      console.error('Error getting service area stats:', err);
      return null;
    }
  }
}

// Export singleton instance
export const geoMatchingService = GeoMatchingService.getInstance();

// Export default for easier imports
export default geoMatchingService;
