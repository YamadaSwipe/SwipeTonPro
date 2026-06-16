# Guide du Système de Paiement pour le Matching

## 📋 Vue d'ensemble

Le système de paiement pour le matching permet de monétiser les mises en relation entre artisans et clients. Après un match mutuel (swipe réciproque), l'artisan doit payer pour débloquer les coordonnées complètes du client.

## 🎯 Fonctionnalités principales

### 1. **Blocage après Match**
- ✅ Quand il y a un match réciproque, le chat et les coordonnées restent verrouillés
- ✅ L'artisan voit qu'il y a un match mais ne peut pas contacter le client
- ✅ Les coordonnées (email, téléphone, nom complet) sont masquées

### 2. **Tarification Dynamique par Paliers**
Le prix du déblocage dépend de la valeur estimée du projet (estimation IA) :

| Palier | Budget estimé | Prix carte | Crédits |
|--------|---------------|------------|---------|
| **Petit projet** | 0€ - 1 000€ | 19€ | 4 crédits |
| **Projet standard** | 1 000€ - 2 000€ | 39€ | 8 crédits |
| **Projet moyen** | 2 000€ - 5 000€ | 69€ | 14 crédits |
| **Gros projet** | 5 000€ - 10 000€ | 129€ | 26 crédits |
| **Très gros projet** | 10 000€ - 15 000€ | 199€ | 40 crédits |
| **Projet important** | 15 000€ - 25 000€ | 250€ | 50 crédits |
| **Projet majeur** | 25 000€ - 50 000€ | 349€ | 70 crédits |
| **Projet exceptionnel** | > 50 000€ | 599€ | 120 crédits |

### 3. **Deux Modes de Paiement**

#### Option A : Paiement par Carte (Stripe)
- Paiement unique via Stripe Checkout
- Redirection sécurisée vers Stripe
- Confirmation automatique après paiement
- Déblocage instantané

#### Option B : Paiement par Crédits
- Utilisation des crédits disponibles sur le compte
- Déduction atomique (évite les race conditions)
- Déblocage instantané
- Les crédits peuvent être achetés par packs

## 🗄️ Structure de la Base de Données

### Tables modifiées/créées

#### `project_interests`
```sql
-- Nouvelles colonnes
is_unlocked BOOLEAN DEFAULT false
unlocked_at TIMESTAMP WITH TIME ZONE
```

#### `match_payments`
```sql
-- Colonnes existantes + nouvelles
payment_method TEXT CHECK (payment_method IN ('card', 'credits', 'free_promo'))
amount_cents INTEGER
amount_euros DECIMAL(10,2)
credits_used INTEGER
stripe_session_id TEXT
pricing_tier_id UUID
```

#### `conversations`
```sql
-- Nouvelle colonne
match_payment_id UUID REFERENCES match_payments(id)
```

### Fonctions SQL créées

#### `unlock_contact_after_payment()`
Trigger automatique qui :
- Débloque le contact dans `project_interests`
- Crée ou active la conversation
- Met à jour les timestamps

#### `check_contact_unlocked(p_professional_id, p_project_id)`
Vérifie si un contact est débloqué pour un professionnel donné.

#### `get_unlocked_contacts(p_professional_id)`
Récupère tous les contacts débloqués avec leurs informations.

#### `can_view_client_contact(p_project_id)`
Fonction de sécurité RLS pour masquer les coordonnées si non débloquées.

### Vues créées

#### `masked_projects`
Vue qui masque automatiquement les coordonnées selon le statut de déblocage :
- Email masqué : `***@***.**`
- Téléphone masqué : `** ** ** ** **`
- Nom masqué : `Client ***`

#### `match_payment_stats`
Statistiques quotidiennes pour le dashboard admin.

## 🔧 APIs créées

### `/api/unlock-contact-stripe` (POST)
Crée un lien de paiement Stripe pour débloquer un contact.

**Body:**
```json
{
  "projectId": "uuid",
  "professionalId": "uuid",
  "successUrl": "optional",
  "cancelUrl": "optional"
}
```

**Réponse:**
```json
{
  "success": true,
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/...",
  "matchPaymentId": "uuid",
  "pricing": {
    "amount": 15.00,
    "tier": "Gros projet",
    "description": "Projets de 5 000€ à 15 000€"
  }
}
```

### `/api/unlock-contact-credits` (POST)
Débloque un contact en utilisant des crédits.

**Body:**
```json
{
  "projectId": "uuid",
  "professionalId": "uuid"
}
```

**Réponse:**
```json
{
  "success": true,
  "payment": { ... },
  "creditsUsed": 3,
  "newBalance": 7,
  "pricing": { ... },
  "message": "Contact débloqué avec succès"
}
```

## 🎨 Composant UI

### `UnlockContactModal`
Modal React pour débloquer un contact avec deux options de paiement.

**Props:**
```typescript
interface UnlockContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  professionalId: string;
  projectTitle: string;
  estimatedBudgetMin: number;
  estimatedBudgetMax: number;
  creditsBalance: number;
  onSuccess?: () => void;
}
```

**Utilisation:**
```tsx
import { UnlockContactModal } from '@/components/professional/UnlockContactModal';

<UnlockContactModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  projectId={project.id}
  professionalId={professionalId}
  projectTitle={project.title}
  estimatedBudgetMin={project.estimated_budget_min}
  estimatedBudgetMax={project.estimated_budget_max}
  creditsBalance={professional.credits_balance}
  onSuccess={() => {
    // Rafraîchir les données
    refetch();
  }}
/>
```

## 📊 Configuration des Paliers

### Fichier: `src/config/matchPricingTiers.ts`

Les paliers peuvent être modifiés dans ce fichier ou via l'interface admin.

**Fonctions utiles:**
```typescript
// Calculer le prix pour un budget donné
const pricing = calculateUnlockPrice(budgetMin, budgetMax);

// Formater un montant en euros
const formatted = formatEuros(15.50); // "15,50 €"

// Convertir euros <-> centimes
const cents = eurosToCents(15.50); // 1550
const euros = centsToEuros(1550); // 15.50
```

## 🔐 Sécurité

### Protection des données sensibles
1. **RLS (Row Level Security)** : Les coordonnées ne sont visibles que si débloquées
2. **Fonction `can_view_client_contact()`** : Vérifie les permissions avant affichage
3. **Vue `masked_projects`** : Masque automatiquement les données sensibles
4. **Validation UUID** : Toutes les APIs valident les UUIDs
5. **Vérification d'autorisation** : L'artisan ne peut débloquer que ses propres contacts

### Prévention des abus
- **Contrainte unique** : Un seul paiement actif par couple (professional_id, project_id)
- **Fonction atomique `spend_credits`** : Évite les race conditions
- **Vérification du match mutuel** : Le client doit avoir swipé right aussi
- **Logging** : Tous les événements sont tracés dans `admin_actions`

## 🚀 Migration

### Appliquer la migration
```bash
# La migration est dans:
supabase/migrations/20260619000000_enhance_match_payment_system.sql

# Elle sera appliquée automatiquement au prochain déploiement
```

### Que fait la migration ?
1. ✅ Ajoute les colonnes `is_unlocked` et `unlocked_at` à `project_interests`
2. ✅ Ajoute la colonne `payment_method` à `match_payments`
3. ✅ Ajoute la colonne `match_payment_id` à `conversations`
4. ✅ Crée les triggers automatiques de déblocage
5. ✅ Crée les fonctions de vérification et récupération
6. ✅ Crée les vues de masquage et statistiques
7. ✅ Migre les données existantes (marque comme débloqués les paiements déjà effectués)

## 📈 Statistiques Admin

### Vue `match_payment_stats`
Accessible pour les admins, elle fournit :
- Nombre total de paiements par jour
- Paiements réussis vs en attente vs échoués
- Répartition carte vs crédits vs gratuit
- Revenu total généré
- Crédits totaux utilisés
- Nombre d'artisans et projets uniques

### Requête exemple
```sql
SELECT * FROM match_payment_stats
WHERE date >= NOW() - INTERVAL '30 days'
ORDER BY date DESC;
```

## 🧪 Tests

### Tester le paiement par crédits
```bash
curl -X POST http://localhost:3000/api/unlock-contact-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "uuid-du-projet",
    "professionalId": "uuid-du-pro"
  }'
```

### Tester le paiement par carte
```bash
curl -X POST http://localhost:3000/api/unlock-contact-stripe \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "uuid-du-projet",
    "professionalId": "uuid-du-pro"
  }'
```

## 🔄 Workflow Complet

1. **Match mutuel** : Client et artisan swipent right
2. **Notification** : L'artisan reçoit une notification de match
3. **Affichage verrouillé** : L'artisan voit le projet mais les coordonnées sont masquées
4. **Clic sur "Débloquer"** : Modal s'ouvre avec les deux options de paiement
5. **Choix du mode** :
   - **Crédits** : Déduction instantanée + déblocage
   - **Carte** : Redirection Stripe → Paiement → Webhook → Déblocage
6. **Déblocage** : Trigger SQL met à jour `project_interests` et crée la conversation
7. **Accès complet** : L'artisan peut voir les coordonnées et envoyer des messages
8. **Notification client** : Le client est notifié qu'un artisan a débloqué son projet

## 📝 Notes importantes

- ⚠️ **Un seul paiement par match** : Impossible de payer deux fois pour le même projet
- ⚠️ **Match mutuel requis** : Le client doit avoir swipé right aussi
- ⚠️ **Pas de remboursement automatique** : Les paiements sont définitifs
- ✅ **Déblocage permanent** : Une fois débloqué, le contact reste accessible
- ✅ **Historique conservé** : Tous les paiements sont tracés dans `match_payments`

## 🆘 Dépannage

### Le contact ne se débloque pas après paiement
1. Vérifier que le webhook Stripe est configuré
2. Vérifier les logs du trigger `unlock_contact_after_payment`
3. Vérifier que `match_payments.status` est bien 'paid' ou 'completed'

### Erreur "Crédits insuffisants" alors que le solde est suffisant
1. Vérifier que la fonction `spend_credits` existe
2. Vérifier les contraintes sur `credit_transactions`
3. Vérifier qu'il n'y a pas de race condition (plusieurs requêtes simultanées)

### Les coordonnées restent masquées
1. Vérifier `project_interests.is_unlocked = true`
2. Vérifier la fonction `can_view_client_contact()`
3. Vérifier les politiques RLS sur la table `projects`

## 🔗 Fichiers concernés

### Migrations SQL
- `supabase/migrations/20260619000000_enhance_match_payment_system.sql`

### Configuration
- `src/config/matchPricingTiers.ts`

### APIs
- `src/pages/api/unlock-contact-stripe.ts`
- `src/pages/api/unlock-contact-credits.ts`

### Composants
- `src/components/professional/UnlockContactModal.tsx`

### Services (à intégrer dans vos composants existants)
- Utiliser la vue `masked_projects` au lieu de `projects` pour l'affichage
- Appeler `check_contact_unlocked()` pour vérifier le statut
- Utiliser `get_unlocked_contacts()` pour lister les contacts débloqués

---

**Auteur:** Système SwipeTonPro  
**Date:** 19 juin 2026  
**Version:** 1.0
