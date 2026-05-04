import { supabase } from '@/integrations/supabase/client';

interface MatchingCriteria {
  projectType: string;
  location: string;
  budget: number;
  urgency: string;
  timeline: string;
  skills: string[];
  experience: number;
  rating: number;
  availability: string;
  distance: number;
}

interface ProfessionalProfile {
  id: string;
  user_id: string;
  company_name: string;
  specialities: string[];
  experience_years: number;
  rating: number;
  review_count: number;
  location: string;
  service_area: string[];
  availability: string;
  hourly_rate?: number;
  verified: boolean;
  response_rate: number;
  response_time: number;
  completed_projects: number;
}

interface ProjectData {
  id: string;
  title: string;
  category: string;
  description: string;
  city: string;
  postal_code: string;
  budget_min: number;
  budget_max: number;
  timeline: string;
  urgency: string;
  work_types: string[];
  required_skills: string[];
}

interface MatchingScore {
  professional_id: string;
  score: number;
  breakdown: {
    skills_match: number;
    location_match: number;
    budget_match: number;
    availability_match: number;
    experience_match: number;
    rating_match: number;
    response_time_match: number;
  };
  confidence: number;
  recommendation:
    | 'highly_recommended'
    | 'recommended'
    | 'consider'
    | 'not_recommended';
}

export const aiMatchingService = {
  /**
   * Analyser un projet et extraire les critères de matching
   */
  async analyzeProject(projectId: string): Promise<MatchingCriteria | null> {
    try {
      const { data: project, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error || !project) {
        throw new Error('Projet non trouvé');
      }

      // Extraire les compétences requises avec NLP basique
      const requiredSkills = this.extractSkillsFromText(
        project.description + ' ' + project.title
      );

      const criteria: MatchingCriteria = {
        projectType: project.category,
        location: `${project.city} ${project.postal_code}`,
        budget: project.budget_max || project.budget_min || 0,
        urgency: project.urgency || 'medium',
        timeline: (project as any).timeline || '',
        skills: requiredSkills,
        experience: this.getRequiredExperience(
          project.category,
          project.budget_max
        ),
        rating: this.getMinimumRating(project.budget_max),
        availability: this.getRequiredAvailability(project.urgency),
        distance: this.getMaxDistance(project.urgency),
      };

      return criteria;
    } catch (error) {
      console.error('Erreur analyse projet:', error);
      return null;
    }
  },

  /**
   * Trouver les meilleurs professionnels pour un projet
   */
  async findBestMatches(
    projectId: string,
    limit: number = 10
  ): Promise<MatchingScore[]> {
    try {
      const criteria = await this.analyzeProject(projectId);
      if (!criteria) {
        throw new Error("Impossible d'analyser le projet");
      }

      // Récupérer les professionnels disponibles
      const { data: professionals, error } = await (supabase as any)
        .from('professionals')
        .select(
          `
          *,
          profiles!inner(
            full_name,
            email,
            phone,
            avatar_url
          )
        `
        )
        .eq('verified', true)
        .eq('status', 'active');

      if (error) throw error;

      // Calculer le score de matching pour chaque professionnel
      const scores: MatchingScore[] = [];

      for (const professional of professionals || []) {
        const score = await this.calculateMatchingScore(criteria, professional);
        if (score.score > 20) {
          // Filtrer les scores trop bas
          scores.push(score);
        }
      }

      // Trier par score décroissant
      scores.sort((a, b) => b.score - a.score);

      return scores.slice(0, limit);
    } catch (error) {
      console.error('Erreur recherche matches:', error);
      return [];
    }
  },

  /**
   * Calculer le score de matching entre un projet et un professionnel
   */
  async calculateMatchingScore(
    criteria: MatchingCriteria,
    professional: ProfessionalProfile
  ): Promise<MatchingScore> {
    // Skills matching (30%)
    const skillsMatch = this.calculateSkillsMatch(
      criteria.skills,
      professional.specialities
    );

    // Location matching (25%)
    const locationMatch = this.calculateLocationMatch(
      criteria.location,
      professional
    );

    // Budget matching (15%)
    const budgetMatch = this.calculateBudgetMatch(
      criteria.budget,
      professional
    );

    // Availability matching (15%)
    const availabilityMatch = this.calculateAvailabilityMatch(
      criteria.availability,
      professional
    );

    // Experience matching (10%)
    const experienceMatch = this.calculateExperienceMatch(
      criteria.experience,
      professional.experience_years
    );

    // Rating matching (5%)
    const ratingMatch = this.calculateRatingMatch(
      criteria.rating,
      professional.rating
    );

    // Response time matching (5%)
    const responseTimeMatch = this.calculateResponseTimeMatch(
      professional.response_time
    );

    const breakdown = {
      skills_match: skillsMatch,
      location_match: locationMatch,
      budget_match: budgetMatch,
      availability_match: availabilityMatch,
      experience_match: experienceMatch,
      rating_match: ratingMatch,
      response_time_match: responseTimeMatch,
    };

    // Score pondéré
    const totalScore =
      skillsMatch * 0.3 +
      locationMatch * 0.25 +
      budgetMatch * 0.15 +
      availabilityMatch * 0.15 +
      experienceMatch * 0.1 +
      ratingMatch * 0.05 +
      responseTimeMatch * 0.05;

    // Niveau de confiance basé sur la complétude des données
    const confidence = this.calculateConfidence(professional, breakdown);

    // Recommandation
    const recommendation = this.getRecommendation(totalScore, confidence);

    return {
      professional_id: professional.id,
      score: Math.round(totalScore),
      breakdown,
      confidence,
      recommendation,
    };
  },

  /**
   * Extraire les compétences d'un texte (NLP basique)
   */
  extractSkillsFromText(text: string): string[] {
    const skillKeywords = {
      plomberie: [
        'plomberie',
        'robinet',
        'fuite',
        'canalisation',
        'chauffe-eau',
        'wc',
        'douche',
        'baignoire',
      ],
      electricite: [
        'électricité',
        'électricien',
        'prise',
        'disjoncteur',
        'tableau',
        'câblage',
        'eclairage',
        'lampe',
      ],
      chauffage: [
        'chauffage',
        'chaudière',
        'radiateur',
        'climatisation',
        'pompe à chaleur',
        'thermostat',
      ],
      menuiserie: [
        'menuiserie',
        'porte',
        'fenêtre',
        'volet',
        'placard',
        'armoire',
        'bois',
        'agencement',
      ],
      maçonnerie: [
        'maçonnerie',
        'mur',
        'cloison',
        'placo',
        'plâtre',
        'dalle',
        'fondation',
        'béton',
      ],
      peinture: [
        'peinture',
        'peintre',
        'couleur',
        'enduit',
        'satiné',
        'mat',
        'brillant',
        'préparation',
      ],
      couverture: [
        'couverture',
        'toit',
        'tuile',
        'ardoise',
        'gouttière',
        'zinc',
        'étanchéité',
      ],
      carrelage: [
        'carrelage',
        'carreau',
        'faïence',
        'salle de bain',
        'cuisine',
        'sol',
        'pose',
      ],
      jardin: [
        'jardin',
        'paysagiste',
        'pelouse',
        'terrasse',
        'clôture',
        'plantation',
        'entretien',
      ],
    };

    const textLower = text.toLowerCase();
    const foundSkills: string[] = [];

    Object.entries(skillKeywords).forEach(([skill, keywords]) => {
      if (keywords.some((keyword) => textLower.includes(keyword))) {
        foundSkills.push(skill);
      }
    });

    return [...new Set(foundSkills)]; // Dédoublonner
  },

  /**
   * Calculer le matching des compétences
   */
  calculateSkillsMatch(
    requiredSkills: string[],
    professionalSkills: string[]
  ): number {
    if (requiredSkills.length === 0) return 50; // Neutre si pas de compétences requises

    const matches = requiredSkills.filter((skill) =>
      professionalSkills.some(
        (proSkill) =>
          proSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(proSkill.toLowerCase())
      )
    );

    return (matches.length / requiredSkills.length) * 100;
  },

  /**
   * Calculer le matching de localisation
   */
  calculateLocationMatch(
    projectLocation: string,
    professional: ProfessionalProfile
  ): number {
    // Vérifier si le professionnel couvre la zone
    const projectCity = projectLocation.split(' ')[0].toLowerCase();

    if (
      professional.service_area.some(
        (area) =>
          area.toLowerCase().includes(projectCity) ||
          projectCity.includes(area.toLowerCase())
      )
    ) {
      return 100; // Zone couverte
    }

    // Calculer la distance approximative (simplifié)
    const professionalCity = professional.location.toLowerCase();
    if (professionalCity === projectCity) {
      return 90; // Même ville
    }

    // Même département (code postal)
    const projectPostal = projectLocation.match(/\d{5}/)?.[0];
    const professionalPostal = professional.location.match(/\d{5}/)?.[0];

    if (
      projectPostal &&
      professionalPostal &&
      projectPostal.slice(0, 2) === professionalPostal.slice(0, 2)
    ) {
      return 70; // Même département
    }

    return 30; // Différent
  },

  /**
   * Calculer le matching de budget
   */
  calculateBudgetMatch(
    projectBudget: number,
    professional: ProfessionalProfile
  ): number {
    if (!professional.hourly_rate || projectBudget === 0) return 50;

    // Estimer le coût total (simplifié)
    const estimatedCost = professional.hourly_rate * 40; // 40h moyenne

    if (estimatedCost <= projectBudget * 0.8) return 100; // Très bon rapport
    if (estimatedCost <= projectBudget) return 80; // Bon rapport
    if (estimatedCost <= projectBudget * 1.2) return 60; // Acceptable
    if (estimatedCost <= projectBudget * 1.5) return 40; // Cher mais possible

    return 20; // Trop cher
  },

  /**
   * Calculer le matching de disponibilité
   */
  calculateAvailabilityMatch(
    requiredAvailability: string,
    professional: ProfessionalProfile
  ): number {
    const availabilityLevels = {
      urgent: 90,
      high: 70,
      medium: 50,
      low: 30,
    };

    const requiredLevel =
      availabilityLevels[
        requiredAvailability as keyof typeof availabilityLevels
      ] || 50;
    const professionalLevel =
      availabilityLevels[
        professional.availability as keyof typeof availabilityLevels
      ] || 50;

    if (professionalLevel >= requiredLevel) return 100;
    return Math.max(20, professionalLevel);
  },

  /**
   * Calculer le matching d'expérience
   */
  calculateExperienceMatch(required: number, actual: number): number {
    if (actual >= required) return 100;
    if (actual >= required * 0.8) return 80;
    if (actual >= required * 0.6) return 60;
    if (actual >= required * 0.4) return 40;
    return 20;
  },

  /**
   * Calculer le matching de rating
   */
  calculateRatingMatch(required: number, actual: number): number {
    if (actual >= required) return 100;
    if (actual >= required - 0.5) return 80;
    if (actual >= required - 1) return 60;
    return 40;
  },

  /**
   * Calculer le matching du temps de réponse
   */
  calculateResponseTimeMatch(responseTime: number): number {
    if (responseTime <= 1) return 100; // 1h ou moins
    if (responseTime <= 2) return 80; // 2h
    if (responseTime <= 4) return 60; // 4h
    if (responseTime <= 8) return 40; // 8h
    return 20; // Plus de 8h
  },

  /**
   * Calculer le niveau de confiance
   */
  calculateConfidence(
    professional: ProfessionalProfile,
    breakdown: any
  ): number {
    let confidence = 50; // Base

    // Plus de données = plus de confiance
    if (professional.review_count > 10) confidence += 20;
    if (professional.completed_projects > 5) confidence += 15;
    if (professional.response_rate > 80) confidence += 10;
    if (professional.verified) confidence += 5;

    // Cohérence des scores
    const scores = Object.values(breakdown);
    const avgScore =
      (scores as any[]).reduce((a: number, b: number) => a + b, 0) /
      scores.length;
    const variance =
      (scores as any[]).reduce(
        (acc: number, score: number) => acc + Math.pow(score - avgScore, 2),
        0
      ) / scores.length;

    if (variance < 500) confidence += 10; // Scores cohérents

    return Math.min(100, confidence);
  },

  /**
   * Obtenir la recommandation
   */
  getRecommendation(
    score: number,
    confidence: number
  ): MatchingScore['recommendation'] {
    const adjustedScore = score * (confidence / 100);

    if (adjustedScore >= 80) return 'highly_recommended';
    if (adjustedScore >= 60) return 'recommended';
    if (adjustedScore >= 40) return 'consider';
    return 'not_recommended';
  },

  /**
   * Obtenir l'expérience requise selon le type de projet
   */
  getRequiredExperience(category: string, budget: number): number {
    const baseExperience = {
      plomberie: 3,
      electricite: 5,
      chauffage: 4,
      menuiserie: 3,
      maçonnerie: 5,
      peinture: 2,
      couverture: 6,
      carrelage: 3,
    };

    const base = baseExperience[category as keyof typeof baseExperience] || 3;

    // Projets plus chers = plus d'expérience requise
    if (budget > 50000) return base + 3;
    if (budget > 20000) return base + 2;
    if (budget > 10000) return base + 1;

    return base;
  },

  /**
   * Obtenir le rating minimum selon le budget
   */
  getMinimumRating(budget: number): number {
    if (budget > 50000) return 4.5;
    if (budget > 20000) return 4.0;
    if (budget > 10000) return 3.5;
    return 3.0;
  },

  /**
   * Obtenir la disponibilité requise selon l'urgence
   */
  getRequiredAvailability(urgency: string): string {
    const urgencyMap = {
      urgent: 'urgent',
      high: 'high',
      medium: 'medium',
      low: 'low',
    };

    return urgencyMap[urgency as keyof typeof urgencyMap] || 'medium';
  },

  /**
   * Obtenir la distance maximale selon l'urgence
   */
  getMaxDistance(urgency: string): number {
    const urgencyDistance = {
      urgent: 20, // 20km
      high: 50, // 50km
      medium: 100, // 100km
      low: 200, // 200km
    };

    return urgencyDistance[urgency as keyof typeof urgencyDistance] || 100;
  },

  /**
   * Entraîner le modèle avec les feedbacks
   */
  async trainWithFeedback(
    matchId: string,
    feedback: 'positive' | 'negative'
  ): Promise<void> {
    try {
      // Sauvegarder le feedback pour l'entraînement futur
      await (supabase as any).from('matching_feedback').insert({
        match_id: matchId,
        feedback,
        created_at: new Date().toISOString(),
      });

      console.log("Feedback enregistré pour l'entraînement");
    } catch (error) {
      console.error('Erreur enregistrement feedback:', error);
    }
  },

  /**
   * Obtenir les statistiques de matching
   */
  async getMatchingStats(): Promise<any> {
    try {
      const { data, error } = await (supabase as any)
        .from('matching_stats')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      return {
        totalMatches: data?.length || 0,
        averageScore:
          data?.reduce((acc, stat) => acc + stat.score, 0) /
            (data?.length || 1) || 0,
        highlyRecommended:
          data?.filter((stat) => stat.recommendation === 'highly_recommended')
            .length || 0,
        recommended:
          data?.filter((stat) => stat.recommendation === 'recommended')
            .length || 0,
        successRate:
          (data?.filter((stat) => stat.feedback === 'positive').length /
            (data?.length || 1)) *
            100 || 0,
      };
    } catch (error) {
      console.error('Erreur stats matching:', error);
      return null;
    }
  },
};

export default aiMatchingService;
