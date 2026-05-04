import { rateLimitingService } from '@/services/rateLimitingService';

type UserType = 'professional' | 'client';
type LimitType = 'daily_estimates' | 'project_responses' | 'weekly_requests';

interface ModerationMessage {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  action_suggestion?: string;
  reset_time?: string;
  alternative_solutions?: string[];
}

interface FluxCheckResult {
  canProceed: boolean;
  message: ModerationMessage;
  remainingCount?: number;
  resetTime?: string;
}

export const fluxModerationService = {
  /**
   * Vérifie et modère les flux pour un professionnel
   */
  async checkProfessionalFlux(professionalId: string): Promise<FluxCheckResult> {
    const limitCheck = await rateLimitingService.checkProfessionalDailyLimit(professionalId);
    
    if (!limitCheck.canSendEstimate) {
      return {
        canProceed: false,
        message: this.generateProfessionalLimitMessage(limitCheck),
        remainingCount: 0,
        resetTime: limitCheck.resetTime
      };
    }

    return {
      canProceed: true,
      message: this.generateProfessionalAvailableMessage(limitCheck),
      remainingCount: limitCheck.remainingCount,
      resetTime: limitCheck.resetTime
    };
  },

  /**
   * Vérifie et modère les flux pour un projet
   */
  async checkProjectFlux(projectId: string): Promise<FluxCheckResult> {
    const limitCheck = await rateLimitingService.checkProjectEstimationLimit(projectId);
    
    if (!limitCheck.canReceiveEstimate) {
      return {
        canProceed: false,
        message: this.generateProjectLimitMessage(limitCheck),
        remainingCount: 0
      };
    }

    return {
      canProceed: true,
      message: this.generateProjectAvailableMessage(limitCheck),
      remainingCount: limitCheck.remainingCount
    };
  },

  /**
   * Vérifie et modère les flux pour un client
   */
  async checkClientFlux(clientId: string): Promise<FluxCheckResult> {
    const limitCheck = await rateLimitingService.checkClientWeeklyLimit(clientId);
    
    if (!limitCheck.canCreateEstimate) {
      return {
        canProceed: false,
        message: this.generateClientLimitMessage(limitCheck),
        remainingCount: 0,
        resetTime: limitCheck.resetTime
      };
    }

    return {
      canProceed: true,
      message: this.generateClientAvailableMessage(limitCheck),
      remainingCount: limitCheck.remainingCount,
      resetTime: limitCheck.resetTime
    };
  },

  /**
   * Génère le message pour professionnel limite atteinte
   */
  generateProfessionalLimitMessage(limitCheck: any): ModerationMessage {
    const resetDate = new Date(limitCheck.resetTime);
    const resetHour = resetDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return {
      title: '⏰ Pause quotidienne atteinte',
      message: `Vous avez envoyé 5 estimations aujourd'hui. Pour garantir la qualité de vos réponses et laisser une chance à chacun, reprenez demain ou concentrez-vous sur vos chantiers en cours !`,
      type: 'info',
      action_suggestion: `Reprise possible à ${resetHour}`,
      alternative_solutions: [
        'Finaliser vos devis en cours',
        'Suivre l\'avancement de vos chantiers',
        'Préparer vos plannings pour demain',
        'Mettre à jour votre profil professionnel'
      ],
      reset_time: limitCheck.resetTime
    };
  },

  /**
   * Génère le message pour projet limite atteinte
   */
  generateProjectLimitMessage(limitCheck: any): ModerationMessage {
    return {
      title: '📋 Estimations complètes',
      message: `Vous avez déjà 3 estimations pour ce besoin. C'est le moment idéal pour analyser ces propositions ! Si aucune ne vous convient, vous pourrez débloquer de nouvelles places après avoir archivé les actuelles.`,
      type: 'warning',
      action_suggestion: 'Analysez vos devis actuels',
      alternative_solutions: [
        'Comparer les 3 propositions reçues',
        'Contacter les professionnels pour poser vos questions',
        'Choisir le professionnel qui vous convient le mieux',
        'Archiver les devis non retenus pour en recevoir de nouveaux'
      ]
    };
  },

  /**
   * Génère le message pour client limite atteinte
   */
  generateClientLimitMessage(limitCheck: any): ModerationMessage {
    const resetDate = new Date(limitCheck.resetTime);
    const resetDay = resetDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'numeric' });
    
    return {
      title: '📊 Quota hebdomadaire atteint',
      message: `Nous limitons les demandes d'estimation pour assurer que nos artisans partenaires restent disponibles pour de vrais projets. Transformez l'une de vos estimations en 'Projet Ferme' pour continuer.`,
      type: 'warning',
      action_suggestion: `Nouvelles demandes possibles ${resetDay}`,
      alternative_solutions: [
        'Transformer une estimation en "Projet Ferme"',
        'Analyser les devis déjà reçus',
        'Contacter directement les professionnels intéressés',
        'Mettre à jour vos projets existants'
      ],
      reset_time: limitCheck.resetTime
    };
  },

  /**
   * Génère le message pour professionnel disponible
   */
  generateProfessionalAvailableMessage(limitCheck: any): ModerationMessage {
    const resetHour = new Date(limitCheck.resetTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    
    return {
      title: '🚀 Prêt à estimer',
      message: `Vous pouvez encore envoyer ${limitCheck.remainingCount} estimation${limitCheck.remainingCount > 1 ? 's' : ''} aujourd'hui. Continuez à développer votre activité !`,
      type: 'success',
      action_suggestion: `${limitCheck.remainingCount} place${limitCheck.remainingCount > 1 ? 's' : ''} disponible${limitCheck.remainingCount > 1 ? 's' : ''}`,
      reset_time: limitCheck.resetTime
    };
  },

  /**
   * Génère le message pour projet disponible
   */
  generateProjectAvailableMessage(limitCheck: any): ModerationMessage {
    return {
      title: '📝 Ouvert aux propositions',
      message: `Votre projet peut encore recevoir ${limitCheck.remainingCount} estimation${limitCheck.remainingCount > 1 ? 's' : ''}. Les professionnels intéressés peuvent vous contacter !`,
      type: 'success',
      action_suggestion: `${limitCheck.remainingCount} place${limitCheck.remainingCount > 1 ? 's' : ''} disponible${limitCheck.remainingCount > 1 ? 's' : ''}`
    };
  },

  /**
   * Génère le message pour client disponible
   */
  generateClientAvailableMessage(limitCheck: any): ModerationMessage {
    const resetDay = new Date(limitCheck.resetTime).toLocaleDateString('fr-FR', { weekday: 'long' });
    
    return {
      title: '✨ Demandes disponibles',
      message: `Vous pouvez encore créer ${limitCheck.remainingCount} demande${limitCheck.remainingCount > 1 ? 's' : ''} d'estimation cette semaine. Continuez à explorer vos projets !`,
      type: 'success',
      action_suggestion: `${limitCheck.remainingCount} demande${limitCheck.remainingCount > 1 ? 's' : ''} disponible${limitCheck.remainingCount > 1 ? 's' : ''}`,
      reset_time: limitCheck.resetTime
    };
  },

  /**
   * Formate le temps de reset de manière conviviale
   */
  formatResetTime(resetTime: string): string {
    const now = new Date();
    const reset = new Date(resetTime);
    const diffMs = reset.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours < 1) {
      return `dans ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `dans ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
  },

  /**
   * Génère des suggestions alternatives personnalisées
   */
  generateAlternativeSolutions(userType: UserType, limitType: LimitType): string[] {
    const baseSolutions = {
      professional: {
        daily_estimates: [
          'Optimiser vos devis existants',
          'Suivre l\'avancement de vos chantiers',
          'Mettre à jour votre portfolio',
          'Former votre équipe sur de nouvelles techniques'
        ]
      },
      client: {
        weekly_requests: [
          'Transformer une estimation en projet concret',
          'Analyser en détail les devis reçus',
          'Préparer les plans pour vos futurs travaux',
          'Contacter les professionnels pour affiner vos besoins'
        ],
        project_responses: [
          'Comparer les 3 propositions en détail',
          'Demander des précisions aux professionnels',
          'Vérifier les références et avis',
          'Planifier les visites de chantier'
        ]
      }
    };

    return baseSolutions[userType]?.[limitType] || [];
  },

  /**
   * Message d'encouragement personnalisé
   */
  generateEncouragement(userType: UserType, context: string): string {
    const encouragements = {
      professional: {
        success: 'Votre expertise est très appréciée ! Continuez comme ça.',
        limit: 'La qualité prime sur la quantité. Vos clients vous remercient !',
        waiting: 'C\'est le moment parfait pour perfectionner vos prochains devis.'
      },
      client: {
        success: 'Votre projet prend forme ! Les professionnels sont intéressés.',
        limit: 'Prenez le temps de choisir le bon partenaire pour vos travaux.',
        waiting: 'Utilisez ce temps pour préparer en détail votre prochain projet.'
      }
    };

    return encouragements[userType]?.[context] || 'Continuez votre excellent travail !';
  }
};

export type { ModerationMessage, FluxCheckResult, UserType, LimitType };
