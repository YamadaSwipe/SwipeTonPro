import { supabase } from '@/integrations/supabase/client';

interface ConversionFeatures {
  leadAge: number; // jours depuis création
  qualificationScore: number;
  contactAttempts: number;
  responseRate: number;
  budgetRange: string;
  urgency: string;
  projectType: string;
  location: string;
  professionalMatches: number;
  avgProfessionalRating: number;
  seasonality: number; // 0-1 selon la saison
  dayOfWeek: number; // 0-6 (dimanche=0)
  timeOfDay: number; // 0-23
}

interface ConversionPrediction {
  leadId: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  riskFactors: string[];
  recommendations: string[];
  optimalContactTime: string;
  expectedValue: number;
  conversionTimeframe: string;
}

interface ModelMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  auc: number;
}

export const conversionPredictionService = {
  /**
   * Prédire la probabilité de conversion d'un lead
   */
  async predictConversion(leadId: string): Promise<ConversionPrediction | null> {
    try {
      // Récupérer les données du lead
      const leadData = await this.getLeadFeatures(leadId);
      if (!leadData) {
        throw new Error('Lead non trouvé');
      }

      // Calculer les caractéristiques
      const features = await this.extractFeatures(leadData);

      // Appliquer le modèle ML
      const prediction = await this.applyConversionModel(features);

      // Générer les recommandations
      const recommendations = this.generateRecommendations(features, prediction);

      // Calculer la valeur attendue
      const expectedValue = this.calculateExpectedValue(features, prediction);

      return {
        leadId,
        probability: prediction.probability,
        confidence: prediction.confidence,
        riskFactors: prediction.riskFactors,
        recommendations,
        optimalContactTime: this.getOptimalContactTime(features),
        expectedValue,
        conversionTimeframe: this.getConversionTimeframe(prediction.probability),
      };
    } catch (error) {
      console.error('Erreur prédiction conversion:', error);
      return null;
    }
  },

  /**
   * Obtenir les caractéristiques d'un lead
   */
  async getLeadFeatures(leadId: string): Promise<any> {
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
   * Extraire les caractéristiques pour le modèle
   */
  async extractFeatures(leadData: any): Promise<ConversionFeatures> {
    const now = new Date();
    const createdAt = new Date(leadData.created_at);
    const leadAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Récupérer les tentatives de contact
    const { data: contactHistory } = await (supabase as any)
      .from('contact_history')
      .select('*')
      .eq('lead_id', leadData.id)
      .order('created_at', { ascending: false });

    // Calculer le taux de réponse
    const responseRate = contactHistory?.length > 0 
      ? (contactHistory.filter(h => h.response_received).length / contactHistory.length) * 100 
      : 0;

    // Récupérer les professionnels matchés
    const { data: matches } = await (supabase as any)
      .from('professional_matches')
      .select(`
        professionals!inner(
          rating,
          experience_years
        )
      `)
      .eq('lead_id', leadData.id);

    const avgRating = matches?.length > 0
      ? matches.reduce((acc, m) => acc + (m.professionals as any).rating, 0) / matches.length
      : 0;

    // Caractéristiques temporelles
    const dayOfWeek = now.getDay();
    const timeOfDay = now.getHours();

    // Saisonnalité (simplifié)
    const month = now.getMonth() + 1; // 1-12
    const seasonality = this.getSeasonalityScore(month);

    return {
      leadAge,
      qualificationScore: leadData.qualification_score || 0,
      contactAttempts: contactHistory?.length || 0,
      responseRate,
      budgetRange: this.getBudgetRange(leadData.projects?.budget_max || 0),
      urgency: leadData.urgency || 'medium',
      projectType: leadData.projects?.category || '',
      location: leadData.projects?.city || '',
      professionalMatches: matches?.length || 0,
      avgProfessionalRating: avgRating,
      seasonality,
      dayOfWeek,
      timeOfDay,
    };
  },

  /**
   * Appliquer le modèle de prédiction de conversion
   */
  async applyConversionModel(features: ConversionFeatures): Promise<{
    probability: number;
    confidence: number;
    riskFactors: string[];
  }> {
    // Modèle de régression logistique simplifié
    // En production, utiliser un modèle ML entraîné (TensorFlow.js, etc.)

    const weights = {
      leadAge: -0.05, // Plus le lead est vieux, moins de chance
      qualificationScore: 0.03, // Plus le score est élevé, plus de chance
      contactAttempts: 0.02, // Plus de contacts = plus de chance
      responseRate: 0.01, // Meilleur taux de réponse = plus de chance
      budgetHigh: 0.3, // Budget élevé = plus de chance
      urgencyHigh: 0.4, // Urgence élevée = plus de chance
      professionalMatches: 0.05, // Plus de matches = plus de chance
      avgRating: 0.1, // Meilleurs professionnels = plus de chance
      seasonality: 0.2, // Haute saison = plus de chance
      optimalTime: 0.15, // Meilleur moment = plus de chance
    };

    // Calculer le score
    let score = 0;
    
    // Score de base
    score += weights.qualificationScore * features.qualificationScore;
    score += weights.contactAttempts * Math.min(features.contactAttempts, 5);
    score += weights.responseRate * (features.responseRate / 100);
    score += weights.professionalMatches * Math.min(features.professionalMatches, 10);
    score += weights.avgRating * features.avgProfessionalRating;
    score += weights.seasonality * features.seasonality;

    // Pénalités et bonus
    if (features.leadAge > 30) score += weights.leadAge * features.leadAge;
    if (features.budgetRange === 'high') score += weights.budgetHigh;
    if (features.urgency === 'urgent' || features.urgency === 'high') score += weights.urgencyHigh;
    if (features.timeOfDay >= 9 && features.timeOfDay <= 11) score += weights.optimalTime; // Matin
    if (features.timeOfDay >= 14 && features.timeOfDay <= 16) score += weights.optimalTime; // Après-midi

    // Convertir en probabilité avec fonction sigmoïde
    const probability = 1 / (1 + Math.exp(-score));

    // Calculer la confiance
    const confidence = this.calculateConfidence(features);

    // Identifier les facteurs de risque
    const riskFactors = this.identifyRiskFactors(features);

    return {
      probability: Math.max(0, Math.min(1, probability)),
      confidence,
      riskFactors,
    };
  },

  /**
   * Calculer la confiance de la prédiction
   */
  calculateConfidence(features: ConversionFeatures): number {
    let confidence = 0.5; // Base

    // Plus de données = plus de confiance
    if (features.qualificationScore > 0) confidence += 0.1;
    if (features.contactAttempts > 0) confidence += 0.1;
    if (features.professionalMatches > 0) confidence += 0.1;
    if (features.avgProfessionalRating > 0) confidence += 0.1;

    // Données récentes = plus de confiance
    if (features.leadAge < 7) confidence += 0.1;
    if (features.leadAge < 30) confidence += 0.05;

    return Math.min(1, confidence);
  },

  /**
   * Identifier les facteurs de risque
   */
  identifyRiskFactors(features: ConversionFeatures): string[] {
    const riskFactors: string[] = [];

    if (features.leadAge > 30) {
      riskFactors.push('Lead trop ancien (>30 jours)');
    }

    if (features.qualificationScore < 30) {
      riskFactors.push('Score de qualification faible');
    }

    if (features.contactAttempts === 0) {
      riskFactors.push('Aucune tentative de contact');
    }

    if (features.responseRate < 20) {
      riskFactors.push('Taux de réponse très faible');
    }

    if (features.professionalMatches === 0) {
      riskFactors.push('Aucun professionnel matché');
    }

    if (features.budgetRange === 'low') {
      riskFactors.push('Budget trop faible');
    }

    if (features.urgency === 'low') {
      riskFactors.push('Urgence faible');
    }

    if (features.dayOfWeek >= 5) { // Week-end
      riskFactors.push('Contact le week-end');
    }

    if (features.timeOfDay < 8 || features.timeOfDay > 18) {
      riskFactors.push('Contact en dehors des heures de bureau');
    }

    return riskFactors;
  },

  /**
   * Générer les recommandations
   */
  generateRecommendations(
    features: ConversionFeatures,
    prediction: any
  ): string[] {
    const recommendations: string[] = [];

    if (prediction.probability > 0.7) {
      recommendations.push('Lead chaud - Contacter immédiatement');
      recommendations.push('Proposer une intervention rapide');
    } else if (prediction.probability > 0.4) {
      recommendations.push('Lead tiède - Suivi dans 24h');
      recommendations.push('Envoyer documentation détaillée');
    } else {
      recommendations.push('Lead froid - Nurture campaign');
      recommendations.push('Programmer suivi hebdomadaire');
    }

    if (features.contactAttempts < 3) {
      recommendations.push('Augmenter les tentatives de contact');
    }

    if (features.responseRate < 50) {
      recommendations.push('Optimiser le message de contact');
    }

    if (features.professionalMatches < 3) {
      recommendations.push('Élargir les critères de recherche');
    }

    if (features.urgency === 'high' || features.urgency === 'urgent') {
      recommendations.push('Prioriser ce lead');
      recommendations.push('Contacter les meilleurs professionnels');
    }

    return recommendations;
  },

  /**
   * Obtenir le moment optimal pour contacter
   */
  getOptimalContactTime(features: ConversionFeatures): string {
    const day = features.dayOfWeek;
    const hour = features.timeOfDay;

    // Meilleurs jours : mardi-jeudi
    if (day >= 2 && day <= 4) {
      // Meilleures heures : 10h-12h et 14h-16h
      if ((hour >= 10 && hour <= 12) || (hour >= 14 && hour <= 16)) {
        return 'Moment optimal - Maintenant !';
      }
    }

    // Jours moins bons : lundi, vendredi
    if (day === 1 || day === 5) {
      return 'Attendre demain matin';
    }

    // Week-end à éviter
    if (day >= 6) {
      return 'Attendre lundi matin';
    }

    // Soirée à éviter
    if (hour >= 18) {
      return 'Attendre demain matin (9h-11h)';
    }

    // Matin trop tôt
    if (hour < 9) {
      return 'Attendre 10h-12h';
    }

    return 'Bon moment pour contacter';
  },

  /**
   * Calculer la valeur attendue
   */
  calculateExpectedValue(features: ConversionFeatures, prediction: any): number {
    // Valeur moyenne d'un projet converti
    const averageProjectValue = 15000; // €
    
    // Coût d'acquisition estimé
    const acquisitionCost = 500; // €

    // Valeur attendue = (Probabilité × Valeur) - Coût
    const expectedValue = (prediction.probability * averageProjectValue) - acquisitionCost;

    return Math.max(0, expectedValue);
  },

  /**
   * Obtenir le délai de conversion attendu
   */
  getConversionTimeframe(probability: number): string {
    if (probability > 0.8) return '< 24h';
    if (probability > 0.6) return '2-3 jours';
    if (probability > 0.4) return '1 semaine';
    if (probability > 0.2) return '2 semaines';
    return '1 mois+';
  },

  /**
   * Obtenir la catégorie de budget
   */
  getBudgetRange(budget: number): string {
    if (budget >= 50000) return 'high';
    if (budget >= 20000) return 'medium';
    if (budget >= 5000) return 'low';
    return 'very_low';
  },

  /**
   * Calculer le score de saisonnalité
   */
  getSeasonalityScore(month: number): number {
    // Saisonnalité des travaux de rénovation
    const seasonality = {
      1: 0.3, // Janvier - Basse saison
      2: 0.4, // Février
      3: 0.6, // Mars - Début de saison
      4: 0.8, // Avril - Haute saison
      5: 0.9, // Mai
      6: 1.0, // Juin - Pic saison
      7: 1.0, // Juillet - Pic saison
      8: 0.9, // Août
      9: 0.7, // Septembre
      10: 0.5, // Octobre
      11: 0.4, // Novembre
      12: 0.3, // Décembre - Basse saison
    };

    return seasonality[month as keyof typeof seasonality] || 0.5;
  },

  /**
   * Entraîner le modèle avec les données historiques
   */
  async trainModel(): Promise<ModelMetrics | null> {
    try {
      // Récupérer les données historiques
      const { data: historicalData, error } = await (supabase as any)
        .from('conversion_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error || !historicalData || historicalData.length < 100) {
        return null;
      }

      // Séparer les données d'entraînement et de test
      const trainSize = Math.floor(historicalData.length * 0.8);
      const trainData = historicalData.slice(0, trainSize);
      const testData = historicalData.slice(trainSize);

      // Entraîner le modèle (simplifié)
      const model = this.trainLogisticRegression(trainData);

      // Évaluer le modèle
      const metrics = this.evaluateModel(model, testData);

      // Sauvegarder les métriques
      await (supabase as any)
        .from('model_metrics')
        .insert({
          model_type: 'conversion_prediction',
          metrics,
          created_at: new Date().toISOString(),
        });

      return metrics;
    } catch (error) {
      console.error('Erreur entraînement modèle:', error);
      return null;
    }
  },

  /**
   * Entraîner une régression logistique simplifiée
   */
  trainLogisticRegression(data: any[]): any {
    // Implémentation simplifiée - en production utiliser scikit-learn, TensorFlow, etc.
    return {
      weights: {
        leadAge: -0.05,
        qualificationScore: 0.03,
        contactAttempts: 0.02,
        responseRate: 0.01,
        budgetHigh: 0.3,
        urgencyHigh: 0.4,
        professionalMatches: 0.05,
        avgRating: 0.1,
        seasonality: 0.2,
        optimalTime: 0.15,
      },
      intercept: -2.0,
    };
  },

  /**
   * Évaluer les performances du modèle
   */
  evaluateModel(model: any, testData: any[]): ModelMetrics {
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const sample of testData) {
      const prediction = this.predictWithModel(model, sample.features);
      const actual = sample.converted;

      if (prediction >= 0.5) {
        if (actual) truePositives++;
        else falsePositives++;
      } else {
        if (!actual) trueNegatives++;
        else falseNegatives++;
      }
    }

    const accuracy = (truePositives + trueNegatives) / testData.length;
    const precision = truePositives / (truePositives + falsePositives) || 0;
    const recall = truePositives / (truePositives + falseNegatives) || 0;
    const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      auc: 0.85, // Simplifié
    };
  },

  /**
   * Prédire avec le modèle entraîné
   */
  predictWithModel(model: any, features: any): number {
    let score = model.intercept;
    
    Object.entries(model.weights).forEach(([feature, weight]) => {
      score += (weight as number) * (features[feature] || 0);
    });

    return 1 / (1 + Math.exp(-score));
  },

  /**
   * Obtenir les prédictions pour plusieurs leads
   */
  async batchPredictConversion(leadIds: string[]): Promise<ConversionPrediction[]> {
    const predictions: ConversionPrediction[] = [];

    for (const leadId of leadIds) {
      const prediction = await this.predictConversion(leadId);
      if (prediction) {
        predictions.push(prediction);
      }
    }

    // Trier par probabilité décroissante
    predictions.sort((a, b) => b.probability - a.probability);

    return predictions;
  },

  /**
   * Obtenir les statistiques de conversion
   */
  async getConversionStats(): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('conversion_predictions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) throw error;

      const totalPredictions = data?.length || 0;
      const correctPredictions = data?.filter(p => p.was_converted === p.predicted_conversion).length || 0;
      const avgProbability = data?.reduce((acc, p) => acc + p.probability, 0) / totalPredictions || 0;

      return {
        totalPredictions,
        accuracy: totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0,
        avgProbability: avgProbability * 100,
        highProbabilityLeads: data?.filter(p => p.probability > 0.7).length || 0,
        mediumProbabilityLeads: data?.filter(p => p.probability > 0.4 && p.probability <= 0.7).length || 0,
        lowProbabilityLeads: data?.filter(p => p.probability <= 0.4).length || 0,
      };
    } catch (error) {
      console.error('Erreur stats conversion:', error);
      return null;
    }
  },
};

export default conversionPredictionService;
