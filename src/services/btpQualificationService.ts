import { supabase } from '@/integrations/supabase/client';

// Prix du marché 2026 en €/m² ou €/unité (HT)
const MARKET_PRICES_2026 = {
  // Plomberie
  'installation_salle_de_bain': { min: 2500, max: 6000, unit: 'forfait' },
  'remplacement_radiateurs': { min: 150, max: 300, unit: 'par_radiateur' },
  'installation_chauffe_eau': { min: 1200, max: 2500, unit: 'forfait' },
  'creation_wc': { min: 800, max: 2000, unit: 'forfait' },
  
  // Électricité
  'tableau_electrique': { min: 800, max: 2000, unit: 'forfait' },
  'installation_prises': { min: 50, max: 150, unit: 'par_prise' },
  'reseau_electrique_neuf': { min: 80, max: 150, unit: 'par_m2' },
  'mise_aux_normes': { min: 60, max: 120, unit: 'par_m2' },
  
  // Menuiserie
  'pose_fenetre_pvc': { min: 400, max: 800, unit: 'par_fenetre' },
  'pose_fenetre_bois': { min: 600, max: 1200, unit: 'par_fenetre' },
  'pose_porte_interieure': { min: 300, max: 600, unit: 'par_porte' },
  'armoire_cle_en_main': { min: 1500, max: 4000, unit: 'forfait' },
  
  // Plâtrerie
  'cloison_placo': { min: 40, max: 80, unit: 'par_m2' },
  'plafond_placo': { min: 45, max: 90, unit: 'par_m2' },
  'isolation_mur': { min: 30, max: 60, unit: 'par_m2' },
  'doublage_placo': { min: 35, max: 70, unit: 'par_m2' },
  
  // Peinture
  'peinture_mur': { min: 20, max: 40, unit: 'par_m2' },
  'peinture_plafond': { min: 25, max: 50, unit: 'par_m2' },
  'preparation_support': { min: 10, max: 25, unit: 'par_m2' },
  
  // Carrelage
  'pose_carrelage_sol': { min: 35, max: 70, unit: 'par_m2' },
  'pose_carrelage_mur': { min: 45, max: 90, unit: 'par_m2' },
  'ragreage_sol': { min: 15, max: 35, unit: 'par_m2' },
  
  // Toiture
  'toiture_zinc': { min: 120, max: 200, unit: 'par_m2' },
  'toiture_ardoise': { min: 150, max: 250, unit: 'par_m2' },
  'toiture_tuile': { min: 80, max: 150, unit: 'par_m2' },
  'isolation_combles': { min: 30, max: 60, unit: 'par_m2' },
  
  // Maçonnerie
  'creation_mur': { min: 150, max: 300, unit: 'par_m2' },
  'ouverture_mur': { min: 400, max: 800, unit: 'par_ouverture' },
  'fondations': { min: 250, max: 500, unit: 'par_m3' },
  'dallage_sol': { min: 80, max: 150, unit: 'par_m2' },
  
  // Cuisine
  'amenagement_cuisine': { min: 5000, max: 15000, unit: 'forfait' },
  'pose_electromenager': { min: 500, max: 1500, unit: 'forfait' },
  'hotte_et_evacuation': { min: 800, max: 2000, unit: 'forfait' },
  
  // Salle de bain
  'renovation_sdb_complete': { min: 6000, max: 15000, unit: 'forfait' },
  'pose_baignoire': { min: 800, max: 2000, unit: 'forfait' },
  'pose_shower': { min: 1000, max: 3000, unit: 'forfait' },
  
  // Extérieur
  'terrasse_bois': { min: 120, max: 250, unit: 'par_m2' },
  'terrasse_beton': { min: 80, max: 150, unit: 'par_m2' },
  'cloture_pvc': { min: 80, max: 150, unit: 'par_m2' },
  'portail_automatique': { min: 2000, max: 5000, unit: 'forfait' },
  
  // CVC
  'installation_pompe_chaleur': { min: 8000, max: 15000, unit: 'forfait' },
  'installation_climatisation': { min: 5000, max: 12000, unit: 'forfait' },
  'vmc_double_flux': { min: 3000, max: 7000, unit: 'forfait' },
  'radiateur_electrique': { min: 150, max: 400, unit: 'par_radiateur' }
};

// Corps de métier par type de travaux
const TRADES_BY_WORK_TYPE: Record<string, string[]> = {
  'Rénovation complète': ['Maçon', 'Électricien', 'Plombier', 'Plaquiste', 'Peintre', 'Menuisier'],
  'Rénovation partielle': ['Plaquiste', 'Électricien', 'Plombier', 'Peintre'],
  'Construction neuve': ['Maçon', 'Couvreur', 'Électricien', 'Plombier', 'Menuisier', 'Peintre'],
  'Extension': ['Maçon', 'Couvreur', 'Électricien', 'Plombier', 'Menuisier', 'Peintre'],
  'Électricité': ['Électricien'],
  'Plomberie': ['Plombier'],
  'Menuiserie': ['Menuisier'],
  'Peinture': ['Peintre'],
  'Cuisine': ['Plombier', 'Électricien', 'Menuisier', 'Plaquiste'],
  'Salle de bain': ['Plombier', 'Électricien', 'Plaquiste', 'Menuisier'],
  'Toiture': ['Couvreur', 'Zingueur', 'Charpentier'],
  'Isolation': ['Isolateur', 'Maçon', 'Plaquiste'],
  'Carrelage/Sols': ['Carreleur', 'Raboteur'],
  'CVC/Chauffage': ['Frigoriste', 'Chauffagiste', 'Électricien'],
  'Aménagement': ['Plaquiste', 'Électricien', 'Peintre', 'Menuisier'],
  'Jardin/Paysage': ['Paysagiste', 'Maçon'],
  'Piscine': ['Piscinier', 'Maçon', 'Électricien'],
  'Terrasse/Balcon': ['Maçon', 'Menuisier'],
  'Clôture/Portail': ['Ferronnier', 'Maçon', 'Automatiste'],
  'Surélévation': ['Maçon', 'Couvreur', 'Charpentier', 'Électricien', 'Plombier'],
  'Décoration': ['Peintre', 'Décorateur'],
  'Rénovation énergétique': ['Isolateur', 'Menuisier', 'Chauffagiste', 'Électricien'],
  'Démolition/Gros œuvre': ['Maçon', 'Démolisseur'],
  'Autre': ['Général BTP']
};

interface ProjectData {
  title: string;
  description: string;
  category: string;
  city: string;
  surface?: number;
  budgetMin: number;
  budgetMax: number;
  project_type: 'estimation' | 'firm_project';
  photos?: File[];
}

interface QualificationResult {
  statut: 'Prêt pour admin' | 'Infos manquantes';
  estimation: { min: number; max: number };
  corps_de_metier: string[];
  points_de_vigilance: string;
  recap_client: string;
  stripe_argumentaire?: string;
}

export const btpQualificationService = {
  /**
   * Analyse et qualifie un projet BTP
   */
  async qualifyProject(projectData: ProjectData): Promise<QualificationResult> {
    console.log('🔍 Début qualification BTP:', {
      category: projectData.category,
      surface: projectData.surface,
      budget: `${projectData.budgetMin}-${projectData.budgetMax}€`,
      type: projectData.project_type
    });

    // 1. Analyse technique - déterminer les corps de métier
    const corpsDeMetier = this.determineTrades(projectData.category);
    
    // 2. Estimation de marché
    const marketEstimation = this.calculateMarketEstimation(projectData);
    
    // 3. Alerte cohérence
    const coherenceAlert = this.checkBudgetCoherence(projectData, marketEstimation);
    
    // 4. Badge Stripe argumentaire
    const stripeArgumentaire = projectData.project_type === 'firm_project' 
      ? this.generateStripeArgumentaire(projectData)
      : undefined;
    
    // 5. Récap client
    const recapClient = this.generateClientRecap(projectData, marketEstimation, corpsDeMetier);
    
    // 6. Statut de qualification
    const statut = this.determineStatus(projectData, coherenceAlert);

    return {
      statut,
      estimation: marketEstimation,
      corps_de_metier: corpsDeMetier,
      points_de_vigilance: coherenceAlert,
      recap_client: recapClient,
      stripe_argumentaire: stripeArgumentaire
    };
  },

  /**
   * Détermine les corps de métier nécessaires
   */
  determineTrades(category: string): string[] {
    return TRADES_BY_WORK_TYPE[category] || ['Général BTP'];
  },

  /**
   * Calcule l'estimation de marché
   */
  calculateMarketEstimation(projectData: ProjectData): { min: number; max: number } {
    const category = projectData.category;
    const surface = projectData.surface || 1;
    
    // Rechercher les prix correspondants
    const matchingPrices = Object.entries(MARKET_PRICES_2026).filter(([key]) => 
      key.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(key.toLowerCase())
    );

    if (matchingPrices.length === 0) {
      // Estimation par défaut si pas de correspondance
      return {
        min: Math.max(1000, surface * 150),
        max: Math.max(2000, surface * 350)
      };
    }

    let totalMin = 0;
    let totalMax = 0;
    let count = 0;

    matchingPrices.forEach(([, price]) => {
      if (price.unit === 'forfait') {
        totalMin += price.min;
        totalMax += price.max;
        count++;
      } else if (price.unit.includes('m2') || price.unit.includes('m²')) {
        totalMin += price.min * surface;
        totalMax += price.max * surface;
        count++;
      }
    });

    if (count === 0) {
      return {
        min: Math.max(1000, surface * 150),
        max: Math.max(2000, surface * 350)
      };
    }

    // Ajouter 20% de marge pour imprévus
    const avgMin = (totalMin / count) * 1.2;
    const avgMax = (totalMax / count) * 1.2;

    return {
      min: Math.round(avgMin),
      max: Math.round(avgMax)
    };
  },

  /**
   * Vérifie la cohérence du budget
   */
  checkBudgetCoherence(projectData: ProjectData, marketEstimation: { min: number; max: number }): string {
    const clientBudget = projectData.budgetMax;
    const marketMin = marketEstimation.min;
    const marketMax = marketEstimation.max;

    // Budget très en dessous du marché
    if (clientBudget < marketMin * 0.5) {
      return `⚠️ BUDGET IRRÉALISTE: Le client propose ${clientBudget.toLocaleString()}€ pour un travail estimé entre ${marketMin.toLocaleString()}€ et ${marketMax.toLocaleString()}€. Risque élevé d'abandon ou de litige.`;
    }

    // Budget en dessous mais acceptable
    if (clientBudget < marketMin * 0.8) {
      return `📉 BUDGET FAIBLE: Le budget client (${clientBudget.toLocaleString()}€) est inférieur à l'estimation marché (${marketMin.toLocaleString()}€-${marketMax.toLocaleString()}€). Négociation et optimisation nécessaires.`;
    }

    // Budget dans la norme
    if (clientBudget >= marketMin * 0.8 && clientBudget <= marketMax * 1.2) {
      return `✅ BUDGET COHÉRENT: Le budget client (${clientBudget.toLocaleString()}€) correspond à l'estimation marché (${marketMin.toLocaleString()}€-${marketMax.toLocaleString()}€).`;
    }

    // Budget très élevé
    if (clientBudget > marketMax * 1.5) {
      return `💰 BUDGET ÉLEVÉ: Le client propose ${clientBudget.toLocaleString()}€ pour une estimation marché de ${marketMin.toLocaleString()}€-${marketMax.toLocaleString()}€. Vérifier s'il y a des prestations supplémentaires.`;
    }

    return `📊 BUDGET ACCEPTABLE: Le budget client (${clientBudget.toLocaleString()}€) est dans une fourchette raisonnable par rapport au marché (${marketMin.toLocaleString()}€-${marketMax.toLocaleString()}€).`;
  },

  /**
   * Génère l'argumentaire Stripe pour les projets fermes
   */
  generateStripeArgumentaire(projectData: ProjectData): string {
    const budget = projectData.budgetMax;
    const trades = this.determineTrades(projectData.category);
    
    return `🛡️ SÉQUESTRE STRIPE - SÉCURITÉ POUR LE PROFESSIONNEL

💰 Montant à sécuriser: ${budget.toLocaleString()}€
🔒 Libération automatique après validation des travaux
📋 Pas d'avance de trésorerie requise

✅ AVANTAGES POUR VOUS:
• Garantie de paiement: Le client a déjà provisionné les fonds
• Zéro risque d'impayé: Stripe libère les fonds après votre validation
• Relation sereine: Client engagé financièrement dans le projet
• Processus simplifié: Pas de négociation sur les termes de paiement

🔄 PROCESSUS:
1. Client valide le devis → Fonds séquestrés sur Stripe
2. Vous réalisez les travaux selon les termes convenus
3. Vous déclarez les travaux terminés
4. Client confirme la bonne exécution → Fonds libérés immédiatement

📞 SUPPORT: Notre équipe vous accompagne à chaque étape

Le séquestre Stripe protège votre entreprise et rassure le client sur le sérieux de votre engagement.`;
  },

  /**
   * Génère le récapitulatif pour le client
   */
  generateClientRecap(
    projectData: ProjectData, 
    marketEstimation: { min: number; max: number },
    trades: string[]
  ): string {
    const isEstimation = projectData.project_type === 'estimation';
    
    return `📋 RÉCAPITULATIF DE VOTRE PROJET

🏠 TYPE DE PROJET: ${projectData.project_type === 'firm_project' ? 'Projet Ferme' : 'Demande d\'estimation'}
📍 LIEU: ${projectData.city}
🔧 TRAVAUX: ${projectData.category}
${projectData.surface ? `📐 SURFACE: ${projectData.surface}m²` : ''}

💰 BUDGET CLIENT: ${projectData.budgetMin.toLocaleString()}€ - ${projectData.budgetMax.toLocaleString()}€
📊 ESTIMATION MARCHÉ: ${marketEstimation.min.toLocaleString()}€ - ${marketEstimation.max.toLocaleString()}€

👷 CORPS DE MÉTIER NÉCESSAIRES:
${trades.map(trade => `• ${trade}`).join('\n')}

${isEstimation ? `
🎯 PROCHAINE ÉTAPE:
• Vous recevrez jusqu'à 3 estimations de professionnels qualifiés
• Comparez les devis et choisissez le professionnel qui vous convient
• Aucun engagement de travaux à ce stade
` : `
🎯 PROCHAINE ÉTAPE:
• Paiement sécurisé via Stripe (séquestre)
• Mise en relation immédiate avec le professionnel
• Début des travaux selon planning convenu
• Fonds libérés après validation des travaux
`}

✅ VALIDATION ADMIN:
Votre projet est en cours de validation par notre équipe. Vous recevrez un email dès qu'il sera actif.

📞 QUESTIONS? Contactez-nous à support@swipetonpro.fr`;
  },

  /**
   * Détermine le statut de qualification
   */
  determineStatus(projectData: ProjectData, coherenceAlert: string): 'Prêt pour admin' | 'Infos manquantes' {
    // Vérifications minimales requises
    if (!projectData.description || projectData.description.length < 20) {
      return 'Infos manquantes';
    }

    if (!projectData.category) {
      return 'Infos manquantes';
    }

    if (!projectData.city) {
      return 'Infos manquantes';
    }

    if (projectData.budgetMin <= 0 || projectData.budgetMax <= 0) {
      return 'Infos manquantes';
    }

    if (projectData.budgetMin >= projectData.budgetMax) {
      return 'Infos manquantes';
    }

    // Si le budget est très irréaliste, demander plus d'infos
    if (coherenceAlert.includes('IRRÉALISTE')) {
      return 'Infos manquantes';
    }

    return 'Prêt pour admin';
  }
};

export type { ProjectData, QualificationResult };
