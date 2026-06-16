# Guide du Système de Crédits Professionnels

## 📋 Vue d'ensemble

Le système de crédits professionnels permet aux artisans d'acheter des packs de crédits pour débloquer des contacts clients. Ce guide couvre l'achat de packs, la gestion du solde et les offres administratives.

## 🎯 Fonctionnalités principales

### 1. **Achat de Packs de Crédits**
- ✅ 4 packs prédéfinis avec bonus progressifs
- ✅ Paiement sécurisé via Stripe
- ✅ Crédits ajoutés instantanément après paiement
- ✅ Historique complet des achats

### 2. **Gestion du Solde**
- ✅ Solde stocké dans `professionals.credits_balance`
- ✅ Déduction atomique lors du déblocage de contacts
- ✅ Protection contre les race conditions
- ✅ Historique des transactions dans `credit_transactions`

### 3. **Offres Administratives**
- ✅ Fonction sécurisée réservée aux admins/modérateurs
- ✅ Attribution manuelle de crédits (bienvenue, geste commercial)
- ✅ Traçabilité complète dans `admin_actions`
- ✅ Notification automatique au professionnel

## 💰 Packs de Crédits Disponibles

| Pack | Crédits de base | Bonus | Total | Prix | Prix/crédit |
|------|----------------|-------|-------|------|-------------|
| **Starter** | 10 | 0 | 10 | 49€ | 4,90€ |
| **Standard** ⭐ | 25 | 5 | 30 | 99€ | 3,30€ |
| **Pro** | 50 | 15 | 65 | 179€ | 2,75€ |
| **Premium** | 100 | 35 | 135 | 299€ | 2,21€ |

> ⭐ Le pack **Standard** est mis en avant comme meilleure offre

## 🗄️ Structure de la Base de Données

### Tables créées

#### `credit_packs`
Définit les packs de crédits disponibles à l'achat.

```sql
CREATE TABLE credit_packs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  credits_amount INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  price_cents INTEGER NOT NULL,
  price_euros DECIMAL(10,2) GENERATED,
  stripe_price_id TEXT,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Colonnes importantes :**
- `credits_amount` : Nombre de crédits de base
- `bonus_credits` : Crédits bonus offerts
- `price_cents` : Prix en centimes (1€ = 100 centimes)
- `is_featured` : Pack mis en avant (meilleure offre)
- `stripe_price_id` : ID du prix Stripe (optionnel)

#### `credit_pack_purchases`
Historique des achats de packs par les professionnels.

```sql
CREATE TABLE credit_pack_purchases (
  id UUID PRIMARY KEY,
  professional_id UUID REFERENCES professionals(id),
  credit_pack_id UUID REFERENCES credit_packs(id),
  credits_purchased INTEGER NOT NULL,
  bonus_credits INTEGER DEFAULT 0,
  total_credits INTEGER GENERATED,
  price_paid_cents INTEGER NOT NULL,
  price_paid_euros DECIMAL(10,2) GENERATED,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  completed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

**Statuts possibles :**
- `pending` : En attente de paiement
- `completed` : Paiement réussi, crédits ajoutés
- `failed` : Paiement échoué
- `refunded` : Remboursé

### Fonctions SQL créées

#### `credit_pack_purchase_completed()`
Trigger automatique qui crédite le compte après achat réussi.

```sql
-- Déclenché automatiquement quand status passe à 'completed'
-- Appelle add_credits() pour ajouter les crédits de manière atomique
```

#### `admin_grant_credits(p_professional_id, p_amount, p_reason, p_admin_user_id)`
Fonction sécurisée pour offrir des crédits manuellement.

**Paramètres :**
- `p_professional_id` : UUID du professionnel
- `p_amount` : Nombre de crédits à offrir
- `p_reason` : Raison de l'attribution (ex: "Offre de bienvenue")
- `p_admin_user_id` : UUID de l'admin qui effectue l'action

**Sécurité :**
- ✅ Vérifie que l'utilisateur est admin/moderator
- ✅ Valide le montant (doit être positif)
- ✅ Trace l'action dans `admin_actions`
- ✅ Notifie le professionnel

**Retour :**
```json
{
  "success": true,
  "previous_balance": 10,
  "new_balance": 35,
  "added": 25,
  "transaction_id": "uuid"
}
```

#### `get_active_credit_packs()`
Récupère tous les packs actifs avec calcul du prix par crédit.

```sql
SELECT * FROM get_active_credit_packs();
```

**Retourne :**
- id, name, description
- credits_amount, bonus_credits, total_credits
- price_euros, is_featured
- price_per_credit (calculé)

#### `add_credits()` (mise à jour)
Fonction atomique pour ajouter des crédits (achat, bonus, remboursement).

**Nouveaux paramètres :**
- `p_reference_type` : Type de référence (ex: 'credit_pack')
- `p_reference_id` : ID de la référence associée

### Vues créées

#### `credit_pack_purchase_stats`
Statistiques quotidiennes des achats de packs.

```sql
SELECT * FROM credit_pack_purchase_stats
WHERE date >= NOW() - INTERVAL '30 days'
ORDER BY date DESC;
```

**Colonnes :**
- `date` : Date du jour
- `total_purchases` : Nombre total d'achats
- `completed_purchases` : Achats réussis
- `pending_purchases` : En attente
- `failed_purchases` : Échoués
- `total_credits_sold` : Total de crédits vendus
- `total_revenue` : Revenu total généré
- `unique_buyers` : Nombre d'acheteurs uniques
- `avg_purchase_amount` : Montant moyen d'achat

## 🔧 APIs créées

### `/api/purchase-credit-pack` (POST)
Crée un lien de paiement Stripe pour acheter un pack de crédits.

**Authentification :** Requise (professionnel uniquement)

**Body :**
```json
{
  "packId": "uuid-du-pack",
  "successUrl": "https://example.com/success", // optionnel
  "cancelUrl": "https://example.com/cancel"    // optionnel
}
```

**Réponse :**
```json
{
  "success": true,
  "sessionId": "cs_xxx",
  "url": "https://checkout.stripe.com/...",
  "purchaseId": "uuid",
  "pack": {
    "name": "Pack Standard",
    "credits": 25,
    "bonus": 5,
    "total": 30,
    "price": 99.00
  }
}
```

**Workflow :**
1. Vérifie que l'utilisateur est un professionnel
2. Récupère les infos du pack
3. Crée un enregistrement `credit_pack_purchases` (status: pending)
4. Crée/récupère le customer Stripe
5. Crée une session Stripe Checkout
6. Retourne l'URL de paiement

### `/api/admin/grant-credits` (POST)
Permet aux admins d'offrir des crédits à un professionnel.

**Authentification :** Requise (admin/moderator uniquement)

**Body :**
```json
{
  "professionalId": "uuid-du-pro",
  "amount": 50,
  "reason": "Offre de bienvenue"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "50 crédits ont été offerts à Entreprise XYZ",
  "professional": {
    "id": "uuid",
    "company_name": "Entreprise XYZ",
    "previous_balance": 10,
    "new_balance": 60,
    "credits_granted": 50
  },
  "admin": {
    "id": "uuid",
    "name": "Jean Dupont",
    "role": "admin"
  },
  "reason": "Offre de bienvenue",
  "transaction_id": "uuid"
}
```

**Sécurité :**
- ✅ Vérifie le rôle admin/moderator
- ✅ Valide tous les paramètres
- ✅ Utilise la fonction SQL sécurisée
- ✅ Trace l'action dans `admin_actions`

### `/api/unlock-contact-credits` (POST)
Débloque un contact en utilisant des crédits (existant, déjà documenté).

**Lien avec le système :**
- Utilise `spend_credits()` pour déduire les crédits
- Le coût dépend du palier tarifaire du projet
- Voir `GUIDE_SYSTEME_PAIEMENT_MATCHING.md` pour plus de détails

## 🔄 Webhook Stripe

### Gestion des achats de packs
Le webhook `/api/stripe-webhook` gère l'événement `checkout.session.completed` avec `type: 'credit_pack_purchase'`.

**Metadata de la session Stripe :**
```json
{
  "type": "credit_pack_purchase",
  "purchase_id": "uuid",
  "professional_id": "uuid",
  "pack_id": "uuid",
  "credits_amount": "25",
  "bonus_credits": "5"
}
```

**Workflow du webhook :**
1. Reçoit l'événement `checkout.session.completed`
2. Vérifie le type `credit_pack_purchase`
3. Met à jour `credit_pack_purchases.status` à `completed`
4. Le trigger SQL `credit_pack_purchase_completed` :
   - Appelle `add_credits()` pour créditer le compte
   - Met à jour `completed_at`
   - Crée une transaction dans `credit_transactions`
   - Notifie le professionnel

## 🔐 Sécurité

### Politiques RLS

#### Table `credit_packs`
```sql
-- Les professionnels peuvent voir les packs actifs
CREATE POLICY "Professionals can view active credit packs"
  ON credit_packs FOR SELECT
  USING (is_active = true);

-- Les admins peuvent tout gérer
CREATE POLICY "Admins can manage credit packs"
  ON credit_packs FOR ALL
  USING (role IN ('admin', 'super_admin'));
```

#### Table `credit_pack_purchases`
```sql
-- Les professionnels voient leurs propres achats
CREATE POLICY "Professionals can view own purchases"
  ON credit_pack_purchases FOR SELECT
  USING (professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  ));

-- Les admins voient tout
CREATE POLICY "Admins can view all purchases"
  ON credit_pack_purchases FOR SELECT
  USING (role IN ('admin', 'super_admin', 'moderator'));
```

### Protection des transactions

1. **Fonction atomique `spend_credits()`**
   - Lock FOR UPDATE sur la ligne du professionnel
   - Évite les race conditions
   - Rollback automatique en cas d'erreur

2. **Fonction atomique `add_credits()`**
   - Lock FOR UPDATE sur la ligne du professionnel
   - Validation du type de transaction
   - Traçabilité complète

3. **Idempotence du webhook**
   - Table `webhook_events` pour éviter les doublons
   - Vérification de l'événement avant traitement
   - Statut de traitement (processing, completed, failed)

## 📊 Utilisation dans le code

### Récupérer les packs actifs

```typescript
const { data: packs, error } = await supabase
  .rpc('get_active_credit_packs');

// Retourne:
// [
//   {
//     id: 'uuid',
//     name: 'Pack Standard',
//     credits_amount: 25,
//     bonus_credits: 5,
//     total_credits: 30,
//     price_euros: 99.00,
//     is_featured: true,
//     price_per_credit: 3.30
//   },
//   ...
// ]
```

### Acheter un pack

```typescript
const response = await fetch('/api/purchase-credit-pack', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    packId: 'uuid-du-pack',
    successUrl: '/professionnel/credits?success=true',
    cancelUrl: '/professionnel/credits?canceled=true'
  })
});

const { url } = await response.json();
// Rediriger vers url pour le paiement Stripe
window.location.href = url;
```

### Offrir des crédits (admin)

```typescript
const response = await fetch('/api/admin/grant-credits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    professionalId: 'uuid-du-pro',
    amount: 50,
    reason: 'Offre de bienvenue'
  })
});

const result = await response.json();
console.log(result.message); // "50 crédits ont été offerts à..."
```

### Vérifier le solde

```typescript
const { data: professional } = await supabase
  .from('professionals')
  .select('credits_balance')
  .eq('user_id', userId)
  .single();

console.log(`Solde: ${professional.credits_balance} crédits`);
```

### Historique des transactions

```typescript
const { data: transactions } = await supabase
  .from('credit_transactions')
  .select('*')
  .eq('professional_id', professionalId)
  .order('created_at', { ascending: false })
  .limit(20);

// Afficher l'historique
transactions.forEach(t => {
  console.log(`${t.type}: ${t.amount} crédits - ${t.description}`);
});
```

## 🧪 Tests

### Tester l'achat d'un pack

```bash
# 1. Récupérer les packs disponibles
curl -X GET http://localhost:3000/api/credit-packs \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. Acheter un pack
curl -X POST http://localhost:3000/api/purchase-credit-pack \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "packId": "uuid-du-pack"
  }'

# 3. Suivre le lien Stripe retourné et effectuer le paiement test
# 4. Vérifier que les crédits ont été ajoutés
```

### Tester l'offre admin

```bash
curl -X POST http://localhost:3000/api/admin/grant-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "professionalId": "uuid-du-pro",
    "amount": 25,
    "reason": "Test offre de bienvenue"
  }'
```

### Tester la déduction de crédits

```bash
# Débloquer un contact avec des crédits
curl -X POST http://localhost:3000/api/unlock-contact-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "projectId": "uuid-du-projet",
    "professionalId": "uuid-du-pro"
  }'
```

## 📈 Statistiques Admin

### Vue des achats de packs

```sql
-- Statistiques des 30 derniers jours
SELECT 
  date,
  total_purchases,
  completed_purchases,
  total_credits_sold,
  total_revenue,
  unique_buyers
FROM credit_pack_purchase_stats
WHERE date >= NOW() - INTERVAL '30 days'
ORDER BY date DESC;
```

### Professionnels avec le plus de crédits

```sql
SELECT 
  p.company_name,
  p.credits_balance,
  COUNT(cpp.id) as total_purchases,
  SUM(cpp.total_credits) FILTER (WHERE cpp.status = 'completed') as total_credits_purchased
FROM professionals p
LEFT JOIN credit_pack_purchases cpp ON cpp.professional_id = p.id
GROUP BY p.id, p.company_name, p.credits_balance
ORDER BY p.credits_balance DESC
LIMIT 20;
```

### Historique des offres admin

```sql
SELECT 
  aa.created_at,
  p_admin.first_name || ' ' || p_admin.last_name as admin_name,
  p_pro.company_name as professional_name,
  (aa.details->>'credits_granted')::integer as credits_granted,
  aa.details->>'reason' as reason
FROM admin_actions aa
JOIN profiles p_admin ON p_admin.id = aa.admin_id
JOIN professionals p_pro ON p_pro.id = aa.target_id::uuid
WHERE aa.action_type = 'grant_credits'
ORDER BY aa.created_at DESC
LIMIT 50;
```

## 🔗 Intégration avec le système existant

### Lien avec le déblocage de contacts

Le système de crédits est intégré au système de paiement de matching :

1. **Achat de packs** → Crédite `professionals.credits_balance`
2. **Déblocage de contact** → Utilise `/api/unlock-contact-credits`
3. **Déduction atomique** → Via `spend_credits()`
4. **Historique** → Dans `credit_transactions`

Voir `GUIDE_SYSTEME_PAIEMENT_MATCHING.md` pour plus de détails.

### Workflow complet

```
1. Professionnel achète un pack
   ↓
2. Paiement Stripe
   ↓
3. Webhook reçu
   ↓
4. Trigger SQL crédite le compte
   ↓
5. Notification envoyée
   ↓
6. Professionnel voit un match
   ↓
7. Clique sur "Débloquer avec crédits"
   ↓
8. API vérifie le solde
   ↓
9. Fonction spend_credits() déduit
   ↓
10. Contact débloqué
```

## 🆘 Dépannage

### Les crédits ne sont pas ajoutés après paiement

1. Vérifier les logs du webhook Stripe
2. Vérifier que `credit_pack_purchases.status = 'completed'`
3. Vérifier que le trigger `credit_pack_purchase_completed` existe
4. Vérifier les logs de la fonction `add_credits()`

### Erreur "Unauthorized" lors de l'offre admin

1. Vérifier que l'utilisateur a le rôle `admin`, `super_admin` ou `moderator`
2. Vérifier que la fonction `admin_grant_credits` existe
3. Vérifier les permissions RLS sur `profiles`

### Les crédits sont déduits mais le contact n'est pas débloqué

1. Vérifier que `project_interests.is_unlocked = true`
2. Vérifier le trigger `unlock_contact_after_payment`
3. Vérifier que `match_payments.status = 'paid'`

## 📝 Notes importantes

- ⚠️ **Solde en base de données** : Le solde est stocké dans `professionals.credits_balance` et mis à jour de manière atomique
- ⚠️ **Pas de remboursement automatique** : Les achats de packs sont définitifs
- ⚠️ **Crédits non transférables** : Les crédits sont liés au compte professionnel
- ✅ **Historique permanent** : Toutes les transactions sont conservées dans `credit_transactions`
- ✅ **Traçabilité admin** : Toutes les offres admin sont tracées dans `admin_actions`

## 🔗 Fichiers concernés

### Migrations SQL
- `supabase/migrations/20260620000000_create_credit_packs_system.sql`

### APIs
- `src/pages/api/purchase-credit-pack.ts` - Achat de packs
- `src/pages/api/admin/grant-credits.ts` - Offres admin
- `src/pages/api/stripe-webhook.ts` - Webhook Stripe (modifié)
- `src/pages/api/unlock-contact-credits.ts` - Déblocage avec crédits (existant)

### Guides connexes
- `GUIDE_SYSTEME_PAIEMENT_MATCHING.md` - Système de déblocage de contacts
- `GUIDE_ABONNEMENTS_STRIPE.md` - Abonnements professionnels

---

**Auteur:** Système SwipeTonPro  
**Date:** 20 juin 2026  
**Version:** 1.0
