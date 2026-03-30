import { supabase } from '@/integrations/supabase/client';

interface PricingFactors {
  qualificationScore: number;
  urgency: string;
  budget: number;
  location: string;
  seasonality: number;
  demand: number;
  competition: number;
  professionalCount: number;
  avgProfessionalRate: number;
  projectComplexity: number;
}

interface DynamicPrice {
  basePrice: number;
  finalPrice: number;
  adjustmentFactors: {
    qualification: number;
    urgency: number;
    location: number;
    seasonality: number;
    demand: number;
    competition: number;
  };
  confidence: number;
  priceRange: {
    min: number;
    max: number;
  };
  reasoning: string[];
}

interface MarketData {
  region: string;
  avgPrice: number;
    demandLevel: 'low' | 'medium' | 'high';
  competitionLevel: 'low' | 'medium' | 'high';
  seasonMultiplier: number;
}

export const dynamicPricingService = {
  /**
   * Calculer le prix dynamique pour un lead
   */
  async calculateDynamicPrice(leadId: string): Promise<DynamicPrice | null> {
    try {
      // Récupérer les données du lead
      const leadData = await this.getLeadPricingData(leadId);
      if (!leadData) {
        throw new Error('Lead non trouvé');
      }

      // Extraire les facteurs de pricing
      const factors = await this.extractPricingFactors(leadData);

      // Calculer le prix de base
      const basePrice = this.calculateBasePrice(factors);

      // Appliquer les ajustements dynamiques
      const adjustments = this.calculateAdjustments(factors);

      // Calculer le prix final
      const finalPrice = this.applyAdjustments(basePrice, adjustments);

      // Calculer la confiance
      const confidence = this.calculatePricingConfidence(factors);

      // Générer le raisonnement
      const reasoning = this.generatePricingReasoning(factors, adjustments);

      // Calculer la plage de prix
      const priceRange = this.calculatePriceRange(finalPrice, confidence);

      return {
        basePrice,
        finalPrice,
        adjustmentFactors: adjustments,
        confidence,
        priceRange,
        reasoning,
      };
    } catch (error) {
      console.error('Erreur calcul prix dynamique:', error);
      return null;
    }
  },

  /**
   * Obtenir les données de pricing d'un lead
   */
  async getLeadPricingData(leadId: string): Promise<any> {
    const { data: lead, error } = await (supabase as any)
      .from('leads')
      .select(`
        *,
        projects!inner(
          title,
          category,
          budget_max,
          city,
          postal_code,
          description,
          created_at
        )
      `)
      .eq('id', leadId)
      .single();

    if (error || !lead) {
      throw new Error('Lead non trouvé');
    }

    return lead;
  },

  /**
   * Extraire les facteurs de pricing
   */
  async extractPricingFactors(leadData: any): Promise<PricingFactors> {
    // Données de marché pour la localisation
    const marketData = await this.getMarketData(leadData.projects?.city || '');

    // Données de concurrence
    const competitionData = await this.getCompetitionData(leadData.projects?.category || '');

    // Saisonnalité
    const seasonality = this.getSeasonalityMultiplier(new Date());

    // Demande actuelle
    const demand = await this.getCurrentDemand(leadData.projects?.category || '');

    return {
      qualificationScore: leadData.qualification_score || 0,
      urgency: leadData.urgency || 'medium',
      budget: leadData.projects?.budget_max || 0,
      location: leadData.projects?.city || '',
      seasonality,
      demand,
      competition: competitionData.level,
      professionalCount: competitionData.count,
      avgProfessionalRate: competitionData.avgRate,
      projectComplexity: this.calculateProjectComplexity(leadData.projects?.description || ''),
    };
  },

  /**
   * Calculer le prix de base
   */
  calculateBasePrice(factors: PricingFactors): number {
    // Prix de base selon le score de qualification
    let basePrice = 20; // Prix minimum

    if (factors.qualificationScore >= 80) {
      basePrice = 150; // Lead très chaud
    } else if (factors.qualificationScore >= 60) {
      basePrice = 100; // Lead chaud
    } else if (factors.qualificationScore >= 40) {
      basePrice = 60; // Lead tiède
    } else if (factors.qualificationScore >= 20) {
      basePrice = 30; // Lead froid
    }

    // Ajustement selon le budget du projet
    if (factors.budget > 50000) basePrice *= 2;
    else if (factors.budget > 20000) basePrice *= 1.5;
    else if (factors.budget > 10000) basePrice *= 1.2;

    return Math.round(basePrice);
  },

  /**
   * Calculer les ajustements
   */
  calculateAdjustments(factors: PricingFactors): DynamicPrice['adjustmentFactors'] {
    return {
      // Qualification (30% du poids)
      qualification: this.getQualificationMultiplier(factors.qualificationScore),

      // Urgence (25% du poids)
      urgency: this.getUrgencyMultiplier(factors.urgency),

      // Localisation (20% du poids)
      location: this.getLocationMultiplier(factors.location),

      // Saisonnalité (10% du poids)
      seasonality: factors.seasonality,

      // Demande (10% du poids)
      demand: this.getDemandMultiplier(factors.demand),

      // Concurrence (5% du poids)
      competition: this.getCompetitionMultiplier(factors.competition),
    };
  },

  /**
   * Appliquer les ajustements au prix
   */
  applyAdjustments(basePrice: number, adjustments: DynamicPrice['adjustmentFactors']): number {
    let finalPrice = basePrice;

    // Appliquer chaque multiplicateur
    finalPrice *= adjustments.qualification;
    finalPrice *= adjustments.urgency;
    finalPrice *= adjustments.location;
    finalPrice *= adjustments.seasonality;
    finalPrice *= adjustments.demand;
    finalPrice *= adjustments.competition;

    return Math.round(finalPrice);
  },

  /**
   * Obtenir les données de marché
   */
  async getMarketData(location: string): Promise<MarketData> {
    // Simuler les données de marché - en production, utiliser une API réelle
    const marketData: Record<string, MarketData> = {
      'Paris': {
        region: 'Paris',
        avgPrice: 120,
        demandLevel: 'high',
        competitionLevel: 'high',
        seasonMultiplier: 1.2,
      },
      'Lyon': {
        region: 'Lyon',
        avgPrice: 80,
        demandLevel: 'medium',
        competitionLevel: 'medium',
        seasonMultiplier: 1.0,
      },
      'Marseille': {
        region: 'Marseille',
        avgPrice: 70,
        demandLevel: 'medium',
        competitionLevel: 'medium',
        seasonMultiplier: 1.1,
      },
      'Toulouse': {
        region: 'Toulouse',
        avgPrice: 60,
        demandLevel: 'low',
        competitionLevel: 'low',
        seasonMultiplier: 0.9,
      },
    };

    return marketData[location] || {
      region: location,
      avgPrice: 50,
      demandLevel: 'medium',
      competitionLevel: 'medium',
      seasonMultiplier: 1.0,
    };
  },

  /**
   * Obtenir les données de concurrence
   */
  async getCompetitionData(category: string): Promise<{ level: string; count: number; avgRate: number }> {
    // Simuler - en production, requêter la base de données
    const competitionData: Record<string, any> = {
      'plomberie': { level: 'high', count: 150, avgRate: 45 },
      'electricite': { level: 'high', count: 120, avgRate: 50 },
      'chauffage': { level: 'medium', count: 80, avgRate: 55 },
      'menuiserie': { level: 'medium', count: 90, avgRate: 40 },
      'maçonnerie': { level: 'low', count: 60, avgRate: 48 },
      'peinture': { level: 'high', count: 200, avgRate: 35 },
    };

    return competitionData[category] || { level: 'medium', count: 100, avgRate: 45 };
  },

  /**
   * Obtenir le multiplicateur de saisonnalité
   */
  getSeasonalityMultiplier(date: Date): number {
    const month = date.getMonth() + 1; // 1-12

    const seasonality: Record<number, number> = {
      1: 0.8,  // Janvier - Basse saison
      2: 0.9,  // Février
      3: 1.1,  // Mars - Début de saison
      4: 1.3,  // Avril - Haute saison
      5: 1.4,  // Mai
      6: 1.5,  // Juin - Pic saison
      7: 1.5,  // Juillet - Pic saison
      8: 1.4,  // Août
      9: 1.2,  // Septembre
      10: 1.0, // Octobre
      11: 0.9, // Novembre
      12: 0.8, // Décembre - Basse saison
    };

    return seasonality[month] || 1.0;
  },

  /**
   * Obtenir la demande actuelle
   */
  async getCurrentDemand(category: string): Promise<number> {
    // Simuler - en production, analyser les données en temps réel
    const demandLevels: Record<string, number> = {
      'plomberie': 0.8,
      'electricite': 0.9,
      'chauffage': 1.2, // Demande élevée en hiver
      'climatisation': 1.5, // Demande élevée en été
      'menuiserie': 0.7,
      'maçonnerie': 0.6,
      'peinture': 0.8,
    };

    return demandLevels[category] || 1.0;
  },

  /**
   * Calculer la complexité du projet
   */
  calculateProjectComplexity(description: string): number {
    const complexityKeywords = {
      high: ['rénovation complète', 'reconstruction', 'extension', 'surélévation', 'fondation'],
      medium: ['rénovation', 'aménagement', 'réfection', 'modernisation'],
      low: ['réparation', 'entretien', 'dépannage', 'remplacement'],
    };

    const descLower = description.toLowerCase();
    
    if (complexityKeywords.high.some(keyword => descLower.includes(keyword))) return 1.5;
    if (complexityKeywords.medium.some(keyword => descLower.includes(keyword))) return 1.2;
    if (complexityKeywords.low.some(keyword => descLower.includes(keyword))) return 1.0;
    
    return 1.1; // Par défaut
  },

  /**
   * Obtenir le multiplicateur de qualification
   */
  getQualificationMultiplier(score: number): number {
    if (score >= 80) return 2.0; // Très chaud
    if (score >= 60) return 1.5; // Chaud
    if (score >= 40) return 1.2; // Tiède
    if (score >= 20) return 1.0; // Froid
    return 0.8; // Très froid
  },

  /**
   * Obtenir le multiplicateur d'urgence
   */
  getUrgencyMultiplier(urgency: string): number {
    const urgencyMultipliers: Record<string, number> = {
      'urgent': 2.0,
      'high': 1.5,
      'medium': 1.0,
      'low': 0.8,
    };

    return urgencyMultipliers[urgency] || 1.0;
  },

  /**
   * Obtenir le multiplicateur de localisation
   */
  getLocationMultiplier(location: string): number {
    // Simuler - en production, utiliser les données de marché réelles
    const locationMultipliers: Record<string, number> = {
      'Paris': 1.5,
      'Lyon': 1.2,
      'Marseille': 1.1,
      'Toulouse': 1.0,
      'Nice': 1.1,
      'Nantes': 1.0,
      'Bordeaux': 1.1,
    };

    return locationMultipliers[location] || 1.0;
  },

  /**
   * Obtenir le multiplicateur de demande
   */
  getDemandMultiplier(demand: number): number {
    if (demand >= 1.3) return 1.3; // Très haute demande
    if (demand >= 1.1) return 1.1; // Haute demande
    if (demand >= 0.9) return 1.0; // Demande normale
    if (demand >= 0.7) return 0.9; // Basse demande
    return 0.8; // Très basse demande
  },

  /**
   * Obtenir le multiplicateur de concurrence
   */
  getCompetitionMultiplier(competition: string): number {
    const competitionMultipliers: Record<string, number> = {
      'high': 0.9,  // Forte concurrence = prix plus bas
      'medium': 1.0,
      'low': 1.2,   // Faible concurrence = prix plus haut
    };

    return competitionMultipliers[competition] || 1.0;
  },

  /**
   * Calculer la confiance du pricing
   */
  calculatePricingConfidence(factors: PricingFactors): number {
    let confidence = 0.5; // Base

    // Plus de données = plus de confiance
    if (factors.qualificationScore > 0) confidence += 0.1;
    if (factors.budget > 0) confidence += 0.1;
    if (factors.location) confidence += 0.1;
    if (factors.professionalCount > 0) confidence += 0.1;
    if (factors.avgProfessionalRate > 0) confidence += 0.1;

    return Math.min(1, confidence);
  },

  /**
   * Générer le raisonnement du pricing
   */
  generatePricingReasoning(
    factors: PricingFactors,
    adjustments: DynamicPrice['adjustmentFactors']
  ): string[] {
    const reasoning: string[] = [];

    // Qualification
    if (adjustments.qualification > 1.2) {
      reasoning.push(`Lead très qualifié (${factors.qualificationScore}/100) - Prix majoré`);
    } else if (adjustments.qualification < 0.9) {
      reasoning.push(`Lead faiblement qualifié - Prix réduit`);
    }

    // Urgence
    if (adjustments.urgency > 1.2) {
      reasoning.push(`Urgence ${factors.urgency} - Prix majoré`);
    }

    // Localisation
    if (adjustments.location > 1.1) {
      reasoning.push(`Zone à forte demande (${factors.location}) - Prix majoré`);
    } else if (adjustments.location < 0.9) {
      reasoning.push(`Zone à faible demande - Prix réduit`);
    }

    // Saisonnalité
    if (adjustments.seasonality > 1.1) {
      reasoning.push('Haute saison - Prix majoré');
    } else if (adjustments.seasonality < 0.9) {
      reasoning.push('Basse saison - Prix réduit');
    }

    // Concurrence
    if (adjustments.competition < 0.9) {
      reasoning.push('Forte concurrence - Prix réduit');
    } else if (adjustments.competition > 1.1) {
      reasoning.push('Faible concurrence - Prix majoré');
    }

    return reasoning;
  },

  /**
   * Calculer la plage de prix
   */
  calculatePriceRange(finalPrice: number, confidence: number): { min: number; max: number } {
    const variance = (1 - confidence) * 0.3; // 30% max de variance
    const range = finalPrice * variance;

    return {
      min: Math.round(finalPrice - range),
      max: Math.round(finalPrice + range),
    };
  },

  /**
   * Mettre à jour le prix en temps réel
   */
  async updateRealTimePrice(leadId: string): Promise<DynamicPrice | null> {
    try {
      // Vérifier si le prix a été mis à jour récemment
      const { data: lastUpdate } = await (supabase as any)
        .from('lead_pricing_history')
        .select('created_at')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      if (lastUpdate && new Date(lastUpdate.created_at) > oneHourAgo) {
        // Prix déjà mis à jour récemment
        return null;
      }

      // Calculer le nouveau prix
      const newPrice = await this.calculateDynamicPrice(leadId);
      
      if (newPrice) {
        // Sauvegarder l'historique des prix
        await (supabase as any)
          .from('lead_pricing_history')
          .insert({
            lead_id: leadId,
            price: newPrice.finalPrice,
            base_price: newPrice.basePrice,
            factors: newPrice.adjustmentFactors,
            confidence: newPrice.confidence,
            created_at: now.toISOString(),
          });
      }

      return newPrice;
    } catch (error) {
      console.error('Erreur mise à jour prix temps réel:', error);
      return null;
    }
  },

  /**
   * Obtenir les statistiques de pricing
   */
  async getPricingStats(): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('lead_pricing_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const totalPrices = data?.length || 0;
      const avgPrice = data?.reduce((acc, p) => acc + p.price, 0) / totalPrices || 0;
      const avgConfidence = data?.reduce((acc, p) => acc + p.confidence, 0) / totalPrices || 0;

      return {
        totalPrices,
        avgPrice: Math.round(avgPrice),
        avgConfidence: Math.round(avgConfidence * 100),
        priceRange: {
          min: data?.reduce((min, p) => Math.min(min, p.price), Infinity) || 0,
          max: data?.reduce((max, p) => Math.max(max, p.price), 0) || 0,
        },
        topAdjustments: this.getTopAdjustments(data || []),
      };
    } catch (error) {
      console.error('Erreur stats pricing:', error);
      return null;
    }
  },

  /**
   * Obtenir les ajustements les plus fréquents
   */
  getTopAdjustments(pricingHistory: any[]): any {
    // Analyser les facteurs les plus influents
    const adjustments = {
      qualification: 0,
      urgency: 0,
      location: 0,
      seasonality: 0,
      demand: 0,
      competition: 0,
    };

    pricingHistory.forEach(record => {
      Object.entries(record.factors).forEach(([key, value]) => {
        if (key in adjustments) {
          adjustments[key as keyof typeof adjustments] += Math.abs((value as number) - 1);
        }
      });
    });

    // Trier par impact
    return Object.entries(adjustments)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([factor, impact]) => ({ factor, impact: Math.round(impact * 100) }));
  },
};

export default dynamicPricingService;
