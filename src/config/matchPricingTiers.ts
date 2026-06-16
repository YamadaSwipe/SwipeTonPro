/**
 * Configuration de la tarification dynamique par paliers pour les mises en relation
 * Basé sur l'estimation IA du budget du projet
 */

export interface MatchPricingTier {
  key: string;
  label: string;
  description: string;
  budgetMin: number; // en centimes (ex: 100000 = 1000€)
  budgetMax: number | null; // null = pas de limite supérieure
  creditsCost: number; // nombre de crédits requis
  priceCents: number; // prix en centimes pour paiement par carte
  priceEuros: number; // prix en euros (calculé)
  sortOrder: number;
}

/**
 * Paliers de tarification par défaut
 * Ces valeurs peuvent être modifiées par les admins via l'interface
 */
export const DEFAULT_PRICING_TIERS: MatchPricingTier[] = [
  {
    key: 'tier_1',
    label: 'Petit projet',
    description: 'Projets jusqu\'à 1 000€ d\'estimation',
    budgetMin: 0,
    budgetMax: 100000, // 1000€
    creditsCost: 4,
    priceCents: 1900, // 19€
    priceEuros: 19.00,
    sortOrder: 1,
  },
  {
    key: 'tier_2',
    label: 'Projet standard',
    description: 'Projets de 1 000€ à 2 000€ d\'estimation',
    budgetMin: 100000, // 1000€
    budgetMax: 200000, // 2000€
    creditsCost: 8,
    priceCents: 3900, // 39€
    priceEuros: 39.00,
    sortOrder: 2,
  },
  {
    key: 'tier_3',
    label: 'Projet moyen',
    description: 'Projets de 2 000€ à 5 000€ d\'estimation',
    budgetMin: 200000, // 2000€
    budgetMax: 500000, // 5000€
    creditsCost: 14,
    priceCents: 6900, // 69€
    priceEuros: 69.00,
    sortOrder: 3,
  },
  {
    key: 'tier_4',
    label: 'Gros projet',
    description: 'Projets de 5 000€ à 10 000€ d\'estimation',
    budgetMin: 500000, // 5000€
    budgetMax: 1000000, // 10000€
    creditsCost: 26,
    priceCents: 12900, // 129€
    priceEuros: 129.00,
    sortOrder: 4,
  },
  {
    key: 'tier_5',
    label: 'Très gros projet',
    description: 'Projets de 10 000€ à 15 000€ d\'estimation',
    budgetMin: 1000000, // 10000€
    budgetMax: 1500000, // 15000€
    creditsCost: 40,
    priceCents: 19900, // 199€
    priceEuros: 199.00,
    sortOrder: 5,
  },
  {
    key: 'tier_6',
    label: 'Projet important',
    description: 'Projets de 15 000€ à 25 000€ d\'estimation',
    budgetMin: 1500000, // 15000€
    budgetMax: 2500000, // 25000€
    creditsCost: 50,
    priceCents: 25000, // 250€
    priceEuros: 250.00,
    sortOrder: 6,
  },
  {
    key: 'tier_7',
    label: 'Projet majeur',
    description: 'Projets de 25 000€ à 50 000€ d\'estimation',
    budgetMin: 2500000, // 25000€
    budgetMax: 5000000, // 50000€
    creditsCost: 70,
    priceCents: 34900, // 349€
    priceEuros: 349.00,
    sortOrder: 7,
  },
  {
    key: 'tier_8',
    label: 'Projet exceptionnel',
    description: 'Projets > 50 000€ d\'estimation',
    budgetMin: 5000000, // 50000€
    budgetMax: null, // pas de limite
    creditsCost: 120,
    priceCents: 59900, // 599€
    priceEuros: 599.00,
    sortOrder: 8,
  },
];

/**
 * Détermine le palier tarifaire approprié selon le budget estimé
 * @param estimatedBudget Budget estimé en centimes (ex: 250000 = 2500€)
 * @returns Le palier tarifaire correspondant ou null si aucun palier ne correspond
 */
export function getPricingTierForBudget(
  estimatedBudget: number,
  tiers: MatchPricingTier[] = DEFAULT_PRICING_TIERS
): MatchPricingTier | null {
  // Trier les paliers par budget minimum décroissant
  const sortedTiers = [...tiers].sort((a, b) => b.budgetMin - a.budgetMin);

  // Trouver le premier palier qui correspond
  for (const tier of sortedTiers) {
    if (
      estimatedBudget >= tier.budgetMin &&
      (tier.budgetMax === null || estimatedBudget < tier.budgetMax)
    ) {
      return tier;
    }
  }

  // Si aucun palier ne correspond, retourner le palier le plus bas
  return sortedTiers[sortedTiers.length - 1] || null;
}

/**
 * Convertit un montant en euros en centimes
 * @param euros Montant en euros
 * @returns Montant en centimes
 */
export function eurosToCents(euros: number): number {
  return Math.round(euros * 100);
}

/**
 * Convertit un montant en centimes en euros
 * @param cents Montant en centimes
 * @returns Montant en euros
 */
export function centsToEuros(cents: number): number {
  return cents / 100;
}

/**
 * Formate un montant en euros pour l'affichage
 * @param euros Montant en euros
 * @returns Montant formaté (ex: "15,00 €")
 */
export function formatEuros(euros: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(euros);
}

/**
 * Calcule le prix de déblocage selon l'estimation du projet
 * @param estimatedBudgetMin Budget minimum estimé en euros
 * @param estimatedBudgetMax Budget maximum estimé en euros
 * @returns Objet contenant le palier et les informations de prix
 */
export function calculateUnlockPrice(
  estimatedBudgetMin: number,
  estimatedBudgetMax: number
): {
  tier: MatchPricingTier | null;
  priceCents: number;
  priceEuros: number;
  creditsCost: number;
  budgetUsed: number;
} {
  // Utiliser le budget maximum s'il existe, sinon le minimum
  const budgetToUse = estimatedBudgetMax || estimatedBudgetMin || 0;
  const budgetInCents = eurosToCents(budgetToUse);

  const tier = getPricingTierForBudget(budgetInCents);

  if (!tier) {
    // Valeur par défaut si aucun palier trouvé
    return {
      tier: null,
      priceCents: 500, // 5€ par défaut
      priceEuros: 5.0,
      creditsCost: 1,
      budgetUsed: budgetToUse,
    };
  }

  return {
    tier,
    priceCents: tier.priceCents,
    priceEuros: tier.priceEuros,
    creditsCost: tier.creditsCost,
    budgetUsed: budgetToUse,
  };
}

/**
 * Récupère la description du palier pour l'affichage
 * @param tier Palier tarifaire
 * @returns Description formatée
 */
export function getTierDisplayInfo(tier: MatchPricingTier): {
  title: string;
  description: string;
  price: string;
  credits: string;
} {
  return {
    title: tier.label,
    description: tier.description,
    price: formatEuros(tier.priceEuros),
    credits: `${tier.creditsCost} crédit${tier.creditsCost > 1 ? 's' : ''}`,
  };
}

/**
 * Valide qu'un budget est dans la fourchette d'un palier
 * @param budgetCents Budget en centimes
 * @param tier Palier tarifaire
 * @returns true si le budget correspond au palier
 */
export function isBudgetInTier(
  budgetCents: number,
  tier: MatchPricingTier
): boolean {
  return (
    budgetCents >= tier.budgetMin &&
    (tier.budgetMax === null || budgetCents < tier.budgetMax)
  );
}

/**
 * Récupère tous les paliers triés par ordre d'affichage
 * @param tiers Liste des paliers (optionnel, utilise les paliers par défaut sinon)
 * @returns Paliers triés
 */
export function getSortedTiers(
  tiers: MatchPricingTier[] = DEFAULT_PRICING_TIERS
): MatchPricingTier[] {
  return [...tiers].sort((a, b) => a.sortOrder - b.sortOrder);
}
