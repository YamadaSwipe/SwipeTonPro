# GUIDE - Gestion de la Grille Tarifaire des Matchs

## 📍 OÙ MODIFIER LA GRILLE TARIFAIRE?

### ✅ Solution IDEALE: Panneau Admin (Sans coder!)

**URL d'accès:** `https://www.swipetonpro.fr/admin/match-pricing-tiers`

**Accès requis:**

- Connexion en tant qu'admin ou super_admin
- Compte avec role = 'admin' dans la table profiles

**Avantages:**

- ✓ Aucun code à modifier
- ✓ Modification en temps réel
- ✓ Interface utilisateur intuitive
- ✓ Historique des modifications
- ✓ Activation/désactivation des paliers

---

## 🎯 STRUCTURE ACTUELLE DE LA GRILLE

La grille tarifaire est stockée dans la table Supabase: **match_pricing_tiers**

Chaque palier contient:

```
id: UUID
key: string (identifiant unique)
label: string (nom affiché)
description: string (description)
budget_min: number (en centimes)
budget_max: number|null (en centimes, null = illimité)
credits_cost: number (coût en crédits)
price_cents: number (prix en centimes)
sort_order: number (ordre d'affichage)
is_active: boolean (activation)
created_at: timestamp
updated_at: timestamp
created_by: UUID (admin_id)
```

---

## 📋 COMMENT MODIFIER VIA LE PANNEAU ADMIN

### Étape 1: Accéder au panneau

1. Allez sur `/admin/match-pricing-tiers`
2. Vous verrez un tableau avec tous les paliers actuels

### Étape 2: Créer un nouveau palier

1. Cliquez le bouton "Nouveau palier"
2. Remplissez les champs:
   - **Clé (identifiant)**: unique, ex: "small"
   - **Nom du palier**: ex: "Petit projet"
   - **Description**: ex: "Projets jusqu'à 1000€"
   - **Budget min (centimes)**: ex: 0
   - **Budget max (centimes)**: ex: 100000 (laisser à 0 = illimité)
   - **Prix (centimes)**: ex: 500 (= 5€)
   - **Ordre d'affichage**: 1, 2, 3, etc.
3. Activez le palier avec le switch
4. Cliquez "Créer"

### Étape 3: Modifier un palier existant

1. Cliquez l'icône ✏️ sur le palier
2. Modifiez les champs
3. Cliquez "Mettre à jour"

### Étape 4: Supprimer un palier

1. Cliquez l'icône 🗑️
2. Confirmez la suppression

---

## 💾 GRILLE TARIFAIRE ACTUELLE

La grille est définie dans la base de données Supabase.

Pour vérifier la grille actuelle, consultez:

- Table: `match_pricing_tiers`
- Vue: `match_pricing_summary` (statistics)

### Format des prix:

- **Prix en centimes dans la DB** (prix_cents)
- **Affichage**: divisé par 100 pour obtenir les euros
- Ex: 500 centimes = 5€

---

## 🔍 STRUCTURE DE LA FONCTION RPC

La RPC SQL `get_match_price(p_budget)` recherche automatiquement le bon palier:

```sql
SELECT * FROM match_pricing_tiers
WHERE is_active = true
  AND p_budget >= budget_min
  AND (budget_max IS NULL OR p_budget < budget_max)
ORDER BY sort_order ASC
LIMIT 1
```

Exemple:

- Si budget = 750€ (75000 centimes)
- Et grille: 0-500€→5€, 500-2000€→10€, ...
- Retourne: palier "500-2000€→10€"

---

## 📂 FICHIERS IMPLIQUES

### Frontend (Panneau Admin)

**Fichier:** `src/pages/admin/match-pricing-tiers.tsx`

- Interface complète de gestion
- Création/modification/suppression
- Visualisation des stats

### Backend (API d'Administration)

**Fichier:** `src/pages/api/admin/match-pricing-tiers.ts`

- GET: Récupère la liste des paliers
- POST: Crée un nouveau palier
- PUT: Met à jour un palier
- DELETE: Supprime (soft-delete)

### Utilisation (Paiement)

**Fichiers:**

- `src/pages/api/create-match-payment.ts` - Utilise get_match_price RPC
- `src/services/matchPaymentService.ts` - Service de paiement

---

## ⚙️ PARAMETRES IMPORTANTS

Lors de la création/modification d'un palier:

| Paramètre    | Type         | Exemple                 | Description                              |
| ------------ | ------------ | ----------------------- | ---------------------------------------- |
| key          | string       | "small"                 | Identifiant unique                       |
| label        | string       | "Petit projet"          | Nom affiché                              |
| description  | string       | "Projets jusqu'à 1000€" | Description                              |
| budget_min   | number       | 0                       | Budget min en centimes                   |
| budget_max   | number\|null | 100000                  | Budget max en centimes (null = illimité) |
| credits_cost | number       | 1                       | Coût en crédits                          |
| price_cents  | number       | 500                     | Prix en centimes                         |
| sort_order   | number       | 1                       | Ordre d'affichage                        |
| is_active    | boolean      | true                    | Activation du palier                     |

---

## 🚀 EXEMPLE DE CONFIGURATION COMPLETE

### Palier 1: Petit projet

- Budget: 0€ - 500€
- Prix: 5€ (500 centimes)
- Credits: 1

### Palier 2: Projet moyen

- Budget: 500€ - 2000€
- Prix: 10€ (1000 centimes)
- Credits: 1

### Palier 3: Gros projet

- Budget: 2000€ - 5000€
- Prix: 15€ (1500 centimes)
- Credits: 1

### Palier 4: Grand projet

- Budget: 5000€ - 10000€
- Prix: 25€ (2500 centimes)
- Credits: 2

### Palier 5: Projet très important

- Budget: 10000€+
- Prix: 50€ (5000 centimes)
- Credits: 5

---

## 🔐 SECURITE

- Authentification requise: Bearer token
- Vérification du role: admin ou super_admin obligatoire
- Soft-delete: les paliers supprimés restent en DB (is_active = false)
- Audit: champ created_by et updated_at
- UUID validation

---

## ❓ FAQ

**Q: Où voir les prix actuels appliqués?**
R: Dans le panneau admin `/admin/match-pricing-tiers`

**Q: Comment tester une nouvelle grille?**
R: Créez un palier en test (is_active = false), puis activez-le

**Q: Les prix sont en EUR ou centimes?**
R: Stockés en centimes dans la DB (ex: 500 = 5€)

**Q: Que se passe-t-il si je modifie un palier?**
R: Les paiements futurs utiliseront le nouveau prix
Les paiements passés ne changent pas

**Q: Puis-je avoir plusieurs paliers avec le même budget_min?**
R: Déconseillé. La RPC prend le premier trouvé (order by sort_order)

**Q: Comment désactiver un palier sans le supprimer?**
R: Utilisez le switch "Palier actif" dans l'interface admin

---

## 📞 SUPPORT

Si la page admin n'est pas accessible:

1. Vérifiez que vous êtes loggé en tant qu'admin
2. Vérifiez votre role dans la table profiles
3. Attendez le rechargement de la page (cache)
4. Consultez les logs serveur si erreur API

**Endpoint de l'API:** `/api/admin/match-pricing-tiers`

---

## ✅ CONCLUSION

La grille tarifaire peut être entièrement gérée via le panneau admin sans aucune modification de code!

Accédez à: `https://www.swipetonpro.fr/admin/match-pricing-tiers`
