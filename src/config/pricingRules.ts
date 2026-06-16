/**
 * Configuration des barèmes de prix pour l'estimation IA
 * Basé sur les prix du marché BTP français 2024-2026
 */

export interface PricingRule {
  category: string;
  pricePerM2Min: number;
  pricePerM2Max: number;
  basePrice?: number; // Prix de base pour les petits projets
  maxTotalPrice?: number; // Plafond absolu
  regionalMultipliers?: Record<string, number>;
  materialMultipliers?: Record<string, number>;
}

export interface RegionalCoefficient {
  region: string;
  departments: string[];
  coefficient: number;
  description: string;
}

/**
 * Coefficients régionaux basés sur les coûts de main d'œuvre et matériaux
 */
export const REGIONAL_COEFFICIENTS: RegionalCoefficient[] = [
  {
    region: 'Île-de-France',
    departments: ['75', '77', '78', '91', '92', '93', '94', '95'],
    coefficient: 1.25,
    description: 'Paris et région parisienne - coûts élevés',
  },
  {
    region: 'Provence-Alpes-Côte d\'Azur',
    departments: ['04', '05', '06', '13', '83', '84'],
    coefficient: 1.15,
    description: 'PACA - coûts supérieurs à la moyenne',
  },
  {
    region: 'Auvergne-Rhône-Alpes',
    departments: ['01', '03', '07', '15', '26', '38', '42', '43', '63', '69', '73', '74'],
    coefficient: 1.10,
    description: 'Lyon et grandes villes - coûts modérément élevés',
  },
  {
    region: 'Occitanie',
    departments: ['09', '11', '12', '30', '31', '32', '34', '46', '48', '65', '66', '81', '82'],
    coefficient: 1.05,
    description: 'Sud-Ouest - coûts légèrement supérieurs',
  },
  {
    region: 'Nouvelle-Aquitaine',
    departments: ['16', '17', '19', '23', '24', '33', '40', '47', '64', '79', '86', '87'],
    coefficient: 1.00,
    description: 'Sud-Ouest - coûts moyens',
  },
  {
    region: 'Bretagne',
    departments: ['22', '29', '35', '56'],
    coefficient: 0.95,
    description: 'Bretagne - coûts légèrement inférieurs',
  },
  {
    region: 'Pays de la Loire',
    departments: ['44', '49', '53', '72', '85'],
    coefficient: 0.98,
    description: 'Ouest - coûts proches de la moyenne',
  },
  {
    region: 'Centre-Val de Loire',
    departments: ['18', '28', '36', '37', '41', '45'],
    coefficient: 0.92,
    description: 'Centre - coûts inférieurs à la moyenne',
  },
  {
    region: 'Grand Est',
    departments: ['08', '10', '51', '52', '54', '55', '57', '67', '68', '88'],
    coefficient: 0.95,
    description: 'Est - coûts modérés',
  },
  {
    region: 'Hauts-de-France',
    departments: ['02', '59', '60', '62', '80'],
    coefficient: 0.93,
    description: 'Nord - coûts inférieurs à la moyenne',
  },
  {
    region: 'Normandie',
    departments: ['14', '27', '50', '61', '76'],
    coefficient: 0.94,
    description: 'Normandie - coûts modérés',
  },
  {
    region: 'Bourgogne-Franche-Comté',
    departments: ['21', '25', '39', '58', '70', '71', '89', '90'],
    coefficient: 0.90,
    description: 'Bourgogne - coûts les plus bas',
  },
  {
    region: 'Corse',
    departments: ['2A', '2B'],
    coefficient: 1.20,
    description: 'Corse - coûts élevés (insularité)',
  },
];

/**
 * Barèmes de prix détaillés par type de travaux
 */
export const PRICING_RULES: PricingRule[] = [
  {
    category: 'Rénovation complète',
    pricePerM2Min: 800,
    pricePerM2Max: 2000,
    basePrice: 15000,
    maxTotalPrice: 500000,
    materialMultipliers: {
      'standard': 1.0,
      'moyen de gamme': 1.3,
      'haut de gamme': 1.8,
      'luxe': 2.5,
    },
  },
  {
    category: 'Rénovation partielle',
    pricePerM2Min: 400,
    pricePerM2Max: 1200,
    basePrice: 8000,
    maxTotalPrice: 200000,
  },
  {
    category: 'Peinture',
    pricePerM2Min: 25,
    pricePerM2Max: 60,
    basePrice: 500,
    maxTotalPrice: 15000,
    materialMultipliers: {
      'standard': 1.0,
      'glycéro': 1.2,
      'acrylique premium': 1.4,
      'décorative': 1.8,
    },
  },
  {
    category: 'Plomberie',
    pricePerM2Min: 80,
    pricePerM2Max: 200,
    basePrice: 1500,
    maxTotalPrice: 50000,
  },
  {
    category: 'Électricité',
    pricePerM2Min: 90,
    pricePerM2Max: 180,
    basePrice: 2000,
    maxTotalPrice: 40000,
  },
  {
    category: 'Carrelage/Sols',
    pricePerM2Min: 45,
    pricePerM2Max: 120,
    basePrice: 1000,
    maxTotalPrice: 30000,
    materialMultipliers: {
      'carrelage standard': 1.0,
      'grès cérame': 1.3,
      'pierre naturelle': 1.8,
      'marbre': 2.5,
    },
  },
  {
    category: 'Maçonnerie',
    pricePerM2Min: 60,
    pricePerM2Max: 150,
    basePrice: 2500,
    maxTotalPrice: 100000,
  },
  {
    category: 'Menuiserie',
    pricePerM2Min: 200,
    pricePerM2Max: 800,
    basePrice: 1500,
    maxTotalPrice: 80000,
    materialMultipliers: {
      'PVC': 1.0,
      'bois standard': 1.4,
      'aluminium': 1.6,
      'bois exotique': 2.0,
    },
  },
  {
    category: 'Isolation',
    pricePerM2Min: 40,
    pricePerM2Max: 120,
    basePrice: 2000,
    maxTotalPrice: 35000,
    materialMultipliers: {
      'laine de verre': 1.0,
      'laine de roche': 1.1,
      'ouate de cellulose': 1.3,
      'polyuréthane': 1.5,
    },
  },
  {
    category: 'Toiture',
    pricePerM2Min: 80,
    pricePerM2Max: 250,
    basePrice: 5000,
    maxTotalPrice: 80000,
    materialMultipliers: {
      'tuiles mécaniques': 1.0,
      'tuiles plates': 1.3,
      'ardoise': 1.8,
      'zinc': 2.0,
    },
  },
  {
    category: 'Cuisine',
    pricePerM2Min: 500,
    pricePerM2Max: 2000,
    basePrice: 5000,
    maxTotalPrice: 50000,
    materialMultipliers: {
      'entrée de gamme': 1.0,
      'milieu de gamme': 1.5,
      'haut de gamme': 2.5,
      'sur mesure': 3.5,
    },
  },
  {
    category: 'Salle de bain',
    pricePerM2Min: 600,
    pricePerM2Max: 2500,
    basePrice: 4000,
    maxTotalPrice: 40000,
    materialMultipliers: {
      'standard': 1.0,
      'confort': 1.5,
      'premium': 2.2,
      'luxe': 3.0,
    },
  },
  {
    category: 'CVC/Chauffage',
    pricePerM2Min: 60,
    pricePerM2Max: 150,
    basePrice: 3000,
    maxTotalPrice: 50000,
  },
  {
    category: 'Climatisation',
    pricePerM2Min: 80,
    pricePerM2Max: 200,
    basePrice: 2500,
    maxTotalPrice: 30000,
  },
  {
    category: 'Pompe à chaleur',
    pricePerM2Min: 100,
    pricePerM2Max: 300,
    basePrice: 8000,
    maxTotalPrice: 25000,
  },
  {
    category: 'Fenêtres',
    pricePerM2Min: 300,
    pricePerM2Max: 1000,
    basePrice: 2000,
    maxTotalPrice: 40000,
  },
  {
    category: 'Panneaux solaires',
    pricePerM2Min: 200,
    pricePerM2Max: 400,
    basePrice: 8000,
    maxTotalPrice: 30000,
  },
  {
    category: 'Extension',
    pricePerM2Min: 1200,
    pricePerM2Max: 2500,
    basePrice: 20000,
    maxTotalPrice: 300000,
  },
  {
    category: 'Surélévation',
    pricePerM2Min: 1500,
    pricePerM2Max: 3000,
    basePrice: 30000,
    maxTotalPrice: 400000,
  },
  {
    category: 'Construction neuve',
    pricePerM2Min: 1200,
    pricePerM2Max: 2800,
    basePrice: 50000,
    maxTotalPrice: 1000000,
  },
  {
    category: 'Terrasse/Balcon',
    pricePerM2Min: 100,
    pricePerM2Max: 400,
    basePrice: 2000,
    maxTotalPrice: 30000,
  },
  {
    category: 'Piscine',
    pricePerM2Min: 500,
    pricePerM2Max: 2000,
    basePrice: 15000,
    maxTotalPrice: 100000,
  },
  {
    category: 'Jardin/Paysage',
    pricePerM2Min: 30,
    pricePerM2Max: 150,
    basePrice: 1500,
    maxTotalPrice: 50000,
  },
  {
    category: 'Clôture/Portail',
    pricePerM2Min: 50,
    pricePerM2Max: 300,
    basePrice: 1000,
    maxTotalPrice: 20000,
  },
  {
    category: 'Démolition/Gros œuvre',
    pricePerM2Min: 40,
    pricePerM2Max: 150,
    basePrice: 2000,
    maxTotalPrice: 80000,
  },
  {
    category: 'Rénovation énergétique',
    pricePerM2Min: 100,
    pricePerM2Max: 300,
    basePrice: 5000,
    maxTotalPrice: 60000,
  },
  {
    category: 'Aménagement',
    pricePerM2Min: 200,
    pricePerM2Max: 800,
    basePrice: 3000,
    maxTotalPrice: 50000,
  },
  {
    category: 'Décoration',
    pricePerM2Min: 50,
    pricePerM2Max: 200,
    basePrice: 1000,
    maxTotalPrice: 25000,
  },
];

/**
 * Obtenir le coefficient régional basé sur le code postal
 */
export function getRegionalCoefficient(postalCode: string): number {
  if (!postalCode || postalCode.length < 2) return 1.0;
  
  const department = postalCode.substring(0, 2);
  
  const region = REGIONAL_COEFFICIENTS.find(r => 
    r.departments.includes(department)
  );
  
  return region ? region.coefficient : 1.0;
}

/**
 * Obtenir les règles de prix pour une catégorie
 */
export function getPricingRule(category: string): PricingRule | null {
  const normalizedCategory = category.toLowerCase().trim();
  
  const rule = PRICING_RULES.find(r => 
    r.category.toLowerCase() === normalizedCategory ||
    normalizedCategory.includes(r.category.toLowerCase())
  );
  
  return rule || null;
}

/**
 * Calculer le prix estimé avec les règles strictes
 */
export function calculateEstimateWithRules(
  category: string,
  surface: number,
  postalCode: string,
  materialQuality?: string
): { min: number; max: number; confidence: number } {
  const rule = getPricingRule(category);
  
  if (!rule) {
    // Règle par défaut pour catégories non reconnues
    return {
      min: Math.round(surface * 100),
      max: Math.round(surface * 500),
      confidence: 0.5,
    };
  }
  
  // Coefficient régional
  const regionalCoef = getRegionalCoefficient(postalCode);
  
  // Coefficient matériaux
  let materialCoef = 1.0;
  if (materialQuality && rule.materialMultipliers) {
    const normalizedQuality = materialQuality.toLowerCase();
    const matchingKey = Object.keys(rule.materialMultipliers).find(key =>
      normalizedQuality.includes(key.toLowerCase())
    );
    if (matchingKey) {
      materialCoef = rule.materialMultipliers[matchingKey];
    }
  }
  
  // Calcul de base
  let minPrice = surface * rule.pricePerM2Min * regionalCoef * materialCoef;
  let maxPrice = surface * rule.pricePerM2Max * regionalCoef * materialCoef;
  
  // Appliquer le prix de base si la surface est petite
  if (rule.basePrice && minPrice < rule.basePrice) {
    minPrice = rule.basePrice * regionalCoef;
    maxPrice = Math.max(maxPrice, rule.basePrice * 1.5 * regionalCoef);
  }
  
  // Appliquer le plafond
  if (rule.maxTotalPrice) {
    minPrice = Math.min(minPrice, rule.maxTotalPrice * 0.7);
    maxPrice = Math.min(maxPrice, rule.maxTotalPrice);
  }
  
  // Arrondir
  minPrice = Math.round(minPrice / 100) * 100;
  maxPrice = Math.round(maxPrice / 100) * 100;
  
  // S'assurer que min < max
  if (minPrice >= maxPrice) {
    maxPrice = minPrice * 1.3;
  }
  
  return {
    min: minPrice,
    max: maxPrice,
    confidence: 0.85,
  };
}

/**
 * Valider une estimation IA contre les règles
 */
export function validateEstimation(
  estimation: { min: number; max: number },
  category: string,
  surface: number,
  postalCode: string
): { isValid: boolean; correctedEstimation?: { min: number; max: number }; warnings: string[] } {
  const warnings: string[] = [];
  const ruleBasedEstimate = calculateEstimateWithRules(category, surface, postalCode);
  
  // Vérifier si l'estimation IA est dans une fourchette raisonnable (±40%)
  const minThreshold = ruleBasedEstimate.min * 0.6;
  const maxThreshold = ruleBasedEstimate.max * 1.4;
  
  let isValid = true;
  let correctedEstimation = { ...estimation };
  
  if (estimation.min < minThreshold) {
    warnings.push(`Estimation min trop basse (${estimation.min}€), ajustée à ${Math.round(minThreshold)}€`);
    correctedEstimation.min = Math.round(minThreshold);
    isValid = false;
  }
  
  if (estimation.max > maxThreshold) {
    warnings.push(`Estimation max trop haute (${estimation.max}€), ajustée à ${Math.round(maxThreshold)}€`);
    correctedEstimation.max = Math.round(maxThreshold);
    isValid = false;
  }
  
  // Vérifier l'écart entre min et max (ne doit pas dépasser 100%)
  const gap = (correctedEstimation.max - correctedEstimation.min) / correctedEstimation.min;
  if (gap > 1.0) {
    warnings.push(`Écart trop important entre min et max (${Math.round(gap * 100)}%), ajusté`);
    correctedEstimation.max = Math.round(correctedEstimation.min * 1.5);
    isValid = false;
  }
  
  return {
    isValid,
    correctedEstimation: isValid ? undefined : correctedEstimation,
    warnings,
  };
}
