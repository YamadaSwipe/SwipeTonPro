# Guide de Gestion des Abonnements Stripe

## 📋 Vue d'ensemble

Ce guide explique comment le système gère les abonnements Stripe et les privilèges de matching des professionnels.

## 🗄️ Structure de la Base de Données

### Table `professionals` - Nouveaux champs

| Champ | Type | Description |
|-------|------|-------------|
| `subscription_status` | TEXT | Statut de l'abonnement (`active`, `inactive`, `past_due`, `canceled`, `trialing`) |
| `subscription_id` | TEXT | ID de l'abonnement Stripe |
| `subscription_start_date` | TIMESTAMP | Date de début de l'abonnement |
| `subscription_end_date` | TIMESTAMP | Date de fin de période actuelle |
| `can_match` | BOOLEAN | Privilège de matching (désactivé si paiement échoué) |
| `premium_features` | JSONB | Fonctionnalités premium activées |

### Table `stripe_subscriptions`

Nouvelle table pour stocker l'historique complet des abonnements Stripe.

| Champ | Type | Description |
|-------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | Référence vers auth.users |
| `professional_id` | UUID | Référence vers professionals |
| `stripe_subscription_id` | TEXT | ID Stripe de l'abonnement |
| `stripe_customer_id` | TEXT | ID Stripe du client |
| `status` | TEXT | Statut de l'abonnement |
| `plan_id` | TEXT | ID du plan Stripe |
| `plan_name` | TEXT | Nom du plan |
| `current_period_start` | TIMESTAMP | Début de la période actuelle |
| `current_period_end` | TIMESTAMP | Fin de la période actuelle |
| `cancel_at_period_end` | BOOLEAN | Annulation programmée |
| `canceled_at` | TIMESTAMP | Date d'annulation |
| `metadata` | JSONB | Métadonnées Stripe |

## 🔄 Webhooks Stripe Gérés

### 1. `customer.subscription.created` / `customer.subscription.updated`

**Déclenchement :** Création ou mise à jour d'un abonnement

**Actions effectuées :**
1. ✅ Récupération de l'utilisateur via `stripe_customer_id`
2. ✅ Récupération du professionnel associé
3. ✅ Mise à jour/création dans `stripe_subscriptions`
4. ✅ Mise à jour du statut dans `professionals`
5. ✅ Activation/désactivation du privilège `can_match` selon le statut
6. ✅ Notification envoyée au professionnel

**Statuts activant le matching :**
- `active` : Abonnement actif
- `trialing` : Période d'essai

**Exemple de notification (abonnement actif) :**
```
Titre: 🎉 Abonnement Premium activé !
Message: Votre abonnement premium est maintenant actif. Vous avez accès à toutes les fonctionnalités de matching.
```

### 2. `invoice.payment_failed`

**Déclenchement :** Échec de paiement d'une facture d'abonnement

**Actions effectuées :**
1. ⚠️ Récupération de l'utilisateur via `stripe_customer_id`
2. ⚠️ Désactivation du privilège `can_match` (passage à `false`)
3. ⚠️ Mise à jour du statut à `past_due`
4. ⚠️ Notification d'alerte envoyée au professionnel

**Exemple de notification :**
```
Titre: ⚠️ Échec de paiement
Message: Le paiement de votre abonnement a échoué. Vos privilèges de matching ont été temporairement désactivés. Veuillez mettre à jour vos informations de paiement.
```

### 3. `customer.subscription.deleted`

**Déclenchement :** Suppression/annulation d'un abonnement

**Actions effectuées :**
1. ❌ Mise à jour du statut à `canceled`
2. ❌ Désactivation du privilège `can_match`
3. ❌ Mise à jour de `stripe_subscriptions` avec date d'annulation
4. ❌ Notification envoyée au professionnel

**Exemple de notification :**
```
Titre: ❌ Abonnement annulé
Message: Votre abonnement premium a été annulé. Vos privilèges de matching ont été désactivés.
```

## 🔐 Logique de Sécurité

### Idempotence des Webhooks

Tous les webhooks sont traités de manière idempotente via la table `webhook_events` :
- Vérification si l'événement a déjà été traité
- Enregistrement du statut (`processing`, `completed`, `failed`)
- Protection contre les doublons

### Gestion des Erreurs

En cas d'erreur lors du traitement :
1. L'erreur est loggée dans la console
2. Le statut de l'événement est mis à `failed` avec le message d'erreur
3. Une réponse HTTP 200 est retournée pour éviter les retries Stripe inutiles

## 📊 Flux de Données

```
Stripe Webhook
    ↓
Vérification Idempotence
    ↓
Récupération stripe_customer → user_id
    ↓
Récupération professional_id
    ↓
Mise à jour stripe_subscriptions
    ↓
Mise à jour professionals (subscription_status, can_match)
    ↓
Envoi notification
    ↓
Marquage événement comme completed
```

## 🛠️ Configuration Requise

### Variables d'Environnement

```env
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Configuration Stripe Dashboard

1. Créer un webhook endpoint : `https://votre-domaine.com/api/stripe-webhook`
2. Activer les événements suivants :
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
3. Copier le secret du webhook dans `STRIPE_WEBHOOK_SECRET`

## 🧪 Tests

### Tester avec Stripe CLI

```bash
# Installer Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe-webhook

# Déclencher un événement de test
stripe trigger customer.subscription.created
stripe trigger invoice.payment_failed
stripe trigger customer.subscription.deleted
```

### Vérifier dans la Base de Données

```sql
-- Vérifier les abonnements
SELECT * FROM stripe_subscriptions ORDER BY created_at DESC;

-- Vérifier le statut des professionnels
SELECT id, subscription_status, can_match, subscription_id 
FROM professionals 
WHERE subscription_status IS NOT NULL;

-- Vérifier les événements webhook
SELECT * FROM webhook_events 
WHERE event_type LIKE '%subscription%' 
ORDER BY created_at DESC;
```

## 📝 Notes Importantes

1. **Privilège `can_match`** : Ce champ contrôle si un professionnel peut effectuer des matchings. Il est automatiquement géré par les webhooks.

2. **Statuts d'abonnement** :
   - `active` : Abonnement actif, matching autorisé
   - `trialing` : Période d'essai, matching autorisé
   - `past_due` : Paiement en retard, matching désactivé
   - `canceled` : Abonnement annulé, matching désactivé
   - `inactive` : Pas d'abonnement, matching désactivé

3. **Notifications** : Toutes les actions importantes génèrent une notification pour informer le professionnel.

4. **Sécurité** : Les webhooks utilisent la vérification de signature Stripe pour garantir l'authenticité des événements.

## 🔍 Dépannage

### Le webhook ne se déclenche pas

1. Vérifier que l'URL du webhook est correcte dans Stripe Dashboard
2. Vérifier que `STRIPE_WEBHOOK_SECRET` est correctement configuré
3. Consulter les logs Stripe Dashboard → Developers → Webhooks

### Le statut ne se met pas à jour

1. Vérifier les logs de l'API : `console.log` dans le webhook
2. Vérifier la table `webhook_events` pour voir si l'événement a été traité
3. Vérifier que la table `stripe_customers` contient bien le `stripe_customer_id`

### Le matching reste désactivé après paiement réussi

1. Vérifier que l'événement `customer.subscription.updated` a bien été reçu
2. Vérifier le statut de l'abonnement dans Stripe Dashboard
3. Forcer une mise à jour manuelle si nécessaire :

```sql
UPDATE professionals 
SET can_match = true, subscription_status = 'active'
WHERE id = 'professional_id';
```

## 📚 Ressources

- [Documentation Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Documentation Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe CLI](https://stripe.com/docs/stripe-cli)
