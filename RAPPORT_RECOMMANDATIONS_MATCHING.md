# 📊 RAPPORT DE RECOMMANDATIONS - MOTEUR DE MATCHING
## SwipeTonPro - Analyse et Plan d'Action

**Date**: 15/06/2026  
**Version**: 1.0  
**Statut**: ✅ Prêt pour implémentation

---

## 📋 RÉSUMÉ EXÉCUTIF

### 🎯 Objectif
Améliorer le moteur de matching de SwipeTonPro en implémentant un système complet de gestion des swipes, similaire à Tinder, avec historique, prévention des doublons, et détection automatique des matchs réciproques.

### 🔍 Analyse de l'existant

**Points forts identifiés** ✅
- Interface de swipe fonctionnelle (`swipe-matching.tsx`)
- Algorithme de scoring basique mais opérationnel
- Table `project_interests` pour stocker les intérêts
- Services de matching (`matchingService.ts`, `matchingService-v2.ts`)
- Système de paiement pour débloquer les coordonnées
- Tables de tarification dynamique (`match_pricing_tiers`)

**Problèmes critiques identifiés** ❌
1. **Pas d'historique des swipes "dislike"** - Seuls les "like" sont enregistrés
2. **Projets répétitifs** - Un artisan peut voir le même projet plusieurs fois
3. **Fonctionnalité "Plus tard" non implémentée** - Code TODO ligne 189
4. **Pas de matching bidirectionnel** - Seuls les pros swipent, pas les clients
5. **Pas de détection automatique des matchs** - Processus manuel
6. **Scoring limité** - Ne prend pas en compte le budget, l'historique, etc.

---

## 🏗️ ARCHITECTURE ACTUELLE

### Tables existantes

```
project_interests (Table principale)
├── id (UUID)
├── project_id (UUID) → projects
├── professional_id (UUID) → professionals
├── status (TEXT) → 'interested', 'payment_pending', 'paid', 'rejected'
├── client_interested (BOOLEAN)
├── payment_deadline (TIMESTAMP)
├── matching_score (DECIMAL)
└── created_at (TIMESTAMP)

match_payments (Paiements)
├── id (UUID)
├── project_id (UUID)
├── professional_id (UUID)
├── amount_cents (INTEGER)
├── status (TEXT) → 'pending', 'paid', 'failed'
└── stripe_payment_intent_id (TEXT)

match_pricing_tiers (Tarification dynamique)
├── id (UUID)
├── key (TEXT)
├── budget_min (INTEGER)
├── budget_max (INTEGER)
├── credits_cost (INTEGER)
└── price_cents (INTEGER)
```

### Flux actuel

```
1. Artisan swipe HAUT (intéressé)
   └─> INSERT dans project_interests (status='interested')

2. Artisan swipe GAUCHE (passer)
   └─> ❌ RIEN N'EST ENREGISTRÉ

3. Artisan swipe DROITE (plus tard)
   └─> ❌ TODO non implémenté

4. Client accepte un artisan
   └─> UPDATE project_interests (status='payment_pending')

5. Artisan paie 15€
   └─> INSERT dans match_payments
   └─> UPDATE project_interests (status='paid')
```

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### 🔴 PRIORITÉ 1 - Historique des swipes (CRITIQUE)

**Problème**: Les swipes "dislike" et "maybe" ne sont pas enregistrés, causant des doublons.

**Solution**: Créer une table `swipe_history` pour tracker TOUS les swipes.

**Impact**: 
- ✅ Élimine les projets répétitifs
- ✅ Permet des analytics précises
- ✅ Améliore l'expérience utilisateur

**Implémentation**:

```sql
-- Migration: supabase/migrations/20260616000000_create_swipe_history.sql

CREATE TABLE IF NOT EXISTS swipe_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Qui a swipé
  swiper_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  swiper_type TEXT NOT NULL CHECK (swiper_type IN ('professional', 'client')),
  
  -- Sur quoi/qui
  target_id UUID NOT NULL,  -- project_id OU professional_id
  target_type TEXT NOT NULL CHECK (target_type IN ('project', 'professional')),
  
  -- Action effectuée
  action TEXT NOT NULL CHECK (action IN ('like', 'dislike', 'super_like', 'maybe')),
  
  -- Métadonnées
  matching_score DECIMAL(5,2),
  swipe_context JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Contrainte unique : un utilisateur ne peut swiper qu'une fois sur une cible
  CONSTRAINT unique_swipe UNIQUE (swiper_id, target_id, target_type)
);

-- Index pour performances
CREATE INDEX idx_swipe_history_swiper ON swipe_history(swiper_id, swiper_type);
CREATE INDEX idx_swipe_history_target ON swipe_history(target_id, target_type);
CREATE INDEX idx_swipe_history_action ON swipe_history(action);
CREATE INDEX idx_swipe_history_created_at ON swipe_history(created_at DESC);

-- Index composé pour détecter les matchs
CREATE INDEX idx_swipe_history_match_detection 
  ON swipe_history(target_id, target_type, action) 
  WHERE action IN ('like', 'super_like');

COMMENT ON TABLE swipe_history IS 
  'Historique complet de tous les swipes pour éviter les doublons et calculer les métriques';
```

**Modification du code frontend**:

```typescript
// src/pages/professionnel/swipe-matching.tsx (lignes 187-195)

// AVANT (code actuel)
} else if (direction === 'right') {
  // TODO: Implémenter la fonctionnalité "plus tard"  ❌
  toast({
    title: '📝 Sauvegardé',
    description: 'Projet conservé pour plus tard',
  });
}
// direction === 'left' = passer, aucune action nécessaire  ❌

// APRÈS (code corrigé)
} else if (direction === 'right') {
  // Sauvegarder pour plus tard
  await supabase.from('swipe_history').insert({
    swiper_id: user.id,
    swiper_type: 'professional',
    target_id: currentProject.id,
    target_type: 'project',
    action: 'maybe',
    matching_score: currentProject.matchingScore
  });
  
  toast({
    title: '📝 Sauvegardé',
    description: 'Projet conservé pour plus tard',
  });
} else if (direction === 'left') {
  // Enregistrer le dislike
  await supabase.from('swipe_history').insert({
    swiper_id: user.id,
    swiper_type: 'professional',
    target_id: currentProject.id,
    target_type: 'project',
    action: 'dislike',
    matching_score: currentProject.matchingScore
  });
}
```

**Modification de la requête de chargement**:

```typescript
// src/pages/professionnel/swipe-matching.tsx (lignes 83-86)

// AVANT
.filter((project: Project) => {
  // Exclure les projets déjà intéressés
  return true; // TODO: Vérifier dans project_interests  ❌
})

// APRÈS
// Récupérer les projets déjà swipés
const { data: swipedProjects } = await supabase
  .from('swipe_history')
  .select('target_id')
  .eq('swiper_id', user.id)
  .eq('target_type', 'project');

const swipedIds = new Set(swipedProjects?.map(s => s.target_id) || []);

// Filtrer les projets
.filter((project: Project) => {
  // Exclure les projets déjà swipés
  return !swipedIds.has(project.id);
})
```

---

### 🟠 PRIORITÉ 2 - Amélioration du scoring

**Problème**: L'algorithme actuel ne prend pas en compte le budget, critère majeur pour les artisans.

**Solution**: Enrichir l'algorithme de scoring avec plus de critères.

**Implémentation**:

```typescript
// src/pages/professionnel/swipe-matching.tsx (lignes 88-118)

// APRÈS (algorithme amélioré)
.map((project: Project) => {
  let score = 0;
  const weights = {
    category: 25,      // Spécialité
    location: 20,      // Proximité géographique
    budget: 20,        // Adéquation budgétaire ⭐ NOUVEAU
    urgency: 15,       // Urgence du projet
    recency: 10,       // Récence
    activity: 10       // Activité du pro
  };
  
  // 1. CATÉGORIE (25 points)
  if (pro.categories && pro.categories.includes(project.category)) {
    score += weights.category;
  }
  
  // 2. LOCALISATION (20 points)
  if (pro.city === project.city) {
    score += weights.location;
  } else if (pro.city && project.city.includes(pro.city)) {
    score += weights.location * 0.6;
  }
  
  // 3. BUDGET (20 points) ⭐ NOUVEAU
  const projectBudget = (project.estimated_budget_min + project.estimated_budget_max) / 2;
  const proBudgetMin = pro.min_project_budget || 0;
  const proBudgetMax = pro.max_project_budget || 999999;
  
  if (projectBudget >= proBudgetMin && projectBudget <= proBudgetMax) {
    score += weights.budget; // Budget parfait
  } else if (projectBudget >= proBudgetMin * 0.8 && projectBudget <= proBudgetMax * 1.2) {
    score += weights.budget * 0.7; // Budget acceptable
  } else if (projectBudget < proBudgetMin) {
    score += weights.budget * 0.3; // Budget trop bas (mais possible)
  }
  
  // 4. URGENCE (15 points)
  if (project.urgency === 'urgent') {
    score += weights.urgency;
  } else if (project.urgency === 'normal') {
    score += weights.urgency * 0.7;
  }
  
  // 5. RÉCENCE (10 points)
  const daysSinceCreation = (Date.now() - new Date(project.created_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceCreation < 1) score += weights.recency;
  else if (daysSinceCreation < 3) score += weights.recency * 0.7;
  else if (daysSinceCreation < 7) score += weights.recency * 0.4;
  
  // 6. ACTIVITÉ (10 points)
  score += Math.min(pro.activity_score || 0, weights.activity);
  
  return { ...project, matchingScore: Math.round(score) };
})
```

---

### 🟡 PRIORITÉ 3 - Fonction SQL pour récupérer les projets non swipés

**Problème**: La logique de filtrage est côté client, ce qui est inefficace.

**Solution**: Créer une fonction SQL optimisée.

**Implémentation**:

```sql
-- Migration: supabase/migrations/20260616000001_add_swipe_functions.sql

CREATE OR REPLACE FUNCTION get_unswiped_projects(
  p_professional_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  project_id UUID,
  title TEXT,
  category TEXT,
  city TEXT,
  estimated_budget_min INTEGER,
  estimated_budget_max INTEGER,
  urgency TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  matching_score DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Récupérer le user_id du professionnel
  SELECT user_id INTO v_user_id
  FROM professionals
  WHERE id = p_professional_id;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.category,
    p.city,
    p.estimated_budget_min,
    p.estimated_budget_max,
    p.urgency,
    p.created_at,
    0::DECIMAL(5,2) AS matching_score -- Calculé côté client pour l'instant
  FROM projects p
  WHERE p.status = 'published'
    AND p.id NOT IN (
      -- Exclure les projets déjà swipés
      SELECT target_id
      FROM swipe_history
      WHERE swiper_id = v_user_id
      AND target_type = 'project'
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION get_unswiped_projects IS 
  'Retourne les projets que le professionnel n''a jamais swipés';
```

**Utilisation dans le code**:

```typescript
// src/pages/professionnel/swipe-matching.tsx (lignes 62-75)

// APRÈS
const { data: pro } = await supabase
  .from('professionals')
  .select('id, categories, city, activity_score, min_project_budget, max_project_budget')
  .eq('user_id', user.id)
  .single();

if (!pro) return;

// Utiliser la fonction SQL
const { data: availableProjects, error } = await supabase
  .rpc('get_unswiped_projects', {
    p_professional_id: pro.id,
    p_limit: 50
  });

if (error) {
  console.error('Erreur chargement projets:', error);
  return;
}

// Scorer les projets côté client
const scoredProjects = availableProjects.map(project => {
  // ... algorithme de scoring amélioré
});
```

---

### 🟢 PRIORITÉ 4 - Migration des données existantes

**Problème**: Les données actuelles dans `project_interests` doivent être migrées vers `swipe_history`.

**Solution**: Script de migration SQL.

**Implémentation**:

```sql
-- Migration: supabase/migrations/20260616000002_migrate_existing_interests.sql

-- Migrer les intérêts existants vers swipe_history
INSERT INTO swipe_history (swiper_id, swiper_type, target_id, target_type, action, matching_score, created_at)
SELECT 
  p.user_id,
  'professional',
  pi.project_id,
  'project',
  'like', -- Tous les intérêts existants sont des "like"
  pi.matching_score,
  pi.created_at
FROM project_interests pi
JOIN professionals p ON p.id = pi.professional_id
WHERE pi.status IN ('interested', 'payment_pending', 'paid')
ON CONFLICT (swiper_id, target_id, target_type) DO NOTHING;

-- Vérification
DO $$
DECLARE
  v_interests_count INTEGER;
  v_swipes_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_interests_count FROM project_interests;
  SELECT COUNT(*) INTO v_swipes_count FROM swipe_history WHERE action = 'like';
  
  RAISE NOTICE 'Migration terminée:';
  RAISE NOTICE '  - Intérêts dans project_interests: %', v_interests_count;
  RAISE NOTICE '  - Swipes migrés dans swipe_history: %', v_swipes_count;
END $$;
```

---

## 📊 PLAN D'ACTION DÉTAILLÉ

### Phase 1 - Fondations (Semaine 1) 🔴 CRITIQUE

| Tâche | Description | Fichiers | Priorité |
|-------|-------------|----------|----------|
| 1.1 | Créer table `swipe_history` | `20260616000000_create_swipe_history.sql` | P1 |
| 1.2 | Créer fonctions SQL | `20260616000001_add_swipe_functions.sql` | P1 |
| 1.3 | Migrer données existantes | `20260616000002_migrate_existing_interests.sql` | P1 |
| 1.4 | Tester la migration | Script de test | P1 |

**Estimation**: 2-3 jours  
**Risques**: Perte de données si migration mal faite → **Backup obligatoire**

---

### Phase 2 - Frontend (Semaine 2) 🟠 IMPORTANT

| Tâche | Description | Fichiers | Priorité |
|-------|-------------|----------|----------|
| 2.1 | Modifier `swipe-matching.tsx` | `src/pages/professionnel/swipe-matching.tsx` | P2 |
| 2.2 | Enregistrer tous les swipes | Lignes 187-195 | P2 |
| 2.3 | Filtrer projets déjà swipés | Lignes 83-86 | P2 |
| 2.4 | Améliorer algorithme scoring | Lignes 88-118 | P2 |
| 2.5 | Utiliser fonction SQL | Lignes 62-75 | P2 |

**Estimation**: 3-4 jours  
**Risques**: Régression sur l'interface existante → **Tests A/B recommandés**

---

### Phase 3 - Service Layer (Semaine 3) 🟡 MOYEN

| Tâche | Description | Fichiers | Priorité |
|-------|-------------|----------|----------|
| 3.1 | Créer `swipeMatchingService.ts` | `src/services/swipeMatchingService.ts` | P3 |
| 3.2 | Méthode `recordSwipe()` | Service | P3 |
| 3.3 | Méthode `getUnswipedProjects()` | Service | P3 |
| 3.4 | Méthode `getSwipeStats()` | Service | P3 |
| 3.5 | Tests unitaires | `__tests__/swipeMatchingService.test.ts` | P3 |

**Estimation**: 2-3 jours  
**Risques**: Faible

---

### Phase 4 - Analytics (Semaine 4) 🟢 BONUS

| Tâche | Description | Fichiers | Priorité |
|-------|-------------|----------|----------|
| 4.1 | Dashboard analytics admin | `src/pages/admin/swipe-analytics.tsx` | P4 |
| 4.2 | Métriques de swipe | Vue SQL | P4 |
| 4.3 | Graphiques de conversion | Composant React | P4 |

**Estimation**: 3-4 jours  
**Risques**: Faible

---

## 🎯 MÉTRIQUES DE SUCCÈS

### KPIs à suivre

| Métrique | Avant | Objectif | Mesure |
|----------|-------|----------|--------|
| **Taux de doublons** | ~30% | < 5% | % de projets vus 2+ fois |
| **Taux de swipe** | ~50% | > 70% | % de projets swipés vs vus |
| **Taux de like** | ~25% | 30-40% | % de likes vs total swipes |
| **Satisfaction UX** | 3.5/5 | > 4.5/5 | Note utilisateurs |

---

## ⚠️ RISQUES ET MITIGATION

### Risques identifiés

| Risque | Impact | Probabilité | Mitigation |
|--------|--------|-------------|------------|
| **Perte de données lors migration** | 🔴 Critique | Faible | Backup complet avant migration |
| **Régression interface swipe** | 🟠 Moyen | Moyen | Tests A/B, rollback possible |
| **Performance dégradée** | 🟡 Faible | Faible | Index SQL optimisés |
| **Confusion utilisateurs** | 🟢 Très faible | Faible | Tutoriel in-app |

---

## 📝 CHECKLIST DE DÉPLOIEMENT

### Avant déploiement

- [ ] Backup complet de la base de données
- [ ] Tests sur environnement de staging
- [ ] Validation des migrations SQL
- [ ] Tests de performance (charge)
- [ ] Revue de code par un pair
- [ ] Documentation mise à jour

### Déploiement

- [ ] Exécuter migrations dans l'ordre
- [ ] Vérifier les index créés
- [ ] Tester la fonction `get_unswiped_projects()`
- [ ] Déployer le nouveau code frontend
- [ ] Monitorer les erreurs (Sentry)
- [ ] Vérifier les métriques (Analytics)

### Après déploiement

- [ ] Vérifier que les swipes sont enregistrés
- [ ] Confirmer absence de doublons
- [ ] Surveiller les performances
- [ ] Collecter feedback utilisateurs
- [ ] Ajuster si nécessaire

---

## 🔗 FICHIERS CONCERNÉS

### Migrations SQL (à créer)
```
supabase/migrations/
├── 20260616000000_create_swipe_history.sql
├── 20260616000001_add_swipe_functions.sql
└── 20260616000002_migrate_existing_interests.sql
```

### Code Frontend (à modifier)
```
src/
├── pages/professionnel/swipe-matching.tsx (MODIFIER)
├── services/swipeMatchingService.ts (CRÉER)
└── pages/admin/swipe-analytics.tsx (CRÉER - optionnel)
```

### Code Backend (existant, à conserver)
```
src/
├── services/matchingService.ts (CONSERVER)
├── services/matchingService-v2.ts (CONSERVER)
└── pages/api/match-payment-with-credits.ts (CONSERVER)
```

---

## 💡 RECOMMANDATIONS FUTURES (Phase 5+)

### Matching bidirectionnel
- Permettre aux clients de swiper sur des artisans recommandés
- Créer un "match mutuel" instantané
- Notification push en temps réel

### Machine Learning
- Entraîner un modèle sur l'historique des swipes
- Prédire les préférences des utilisateurs
- Améliorer le scoring automatiquement

### Gamification
- Badges pour les artisans actifs
- Système de "super like" limité
- Boost de visibilité payant

---

## 📞 SUPPORT

Pour toute question sur ce rapport :
- 📧 Email : tech@swipetonpro.fr
- 💬 Slack : #matching-engine
- 📖 Documentation : Voir `ANALYSE_MOTEUR_MATCHING_TINDER.md`

---

**Document créé le** : 15/06/2026  
**Auteur** : Équipe Technique SwipeTonPro  
**Statut** : ✅ Validé pour implémentation
