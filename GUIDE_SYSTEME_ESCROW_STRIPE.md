# 🔒 Guide du Système de Séquestre (Escrow) avec Stripe

## 📋 Vue d'ensemble

Ce guide décrit le système de paiement séquestré (escrow) intégré avec Stripe pour gérer les déblocages progressifs de fonds selon l'avancement des travaux.

## 🎯 Fonctionnalités principales

### 1. **Séquestre des fonds**
- Les fonds sont bloqués au début du projet
- Déblocage progressif par jalon validé
- Sécurité maximale pour le client et l'artisan

### 2. **Validation collaborative**
- Chaque jalon doit être validé par les deux parties
- Système de proposition/validation
- Historique complet des actions

### 3. **Déblocage sécurisé**
- Seul le client peut débloquer les fonds
- Transfert automatique vers le compte Stripe Connect de l'artisan
- Notifications en temps réel

## 🗄️ Structure de la base de données

### Table `projects` - Nouveaux champs

```sql
-- Activation du séquestre
escrow_enabled BOOLEAN DEFAULT false

-- Montant total séquestré
escrow_total_amount DECIMAL(10, 2) DEFAULT 0

-- ID du PaymentIntent Stripe
escrow_stripe_payment_intent_id TEXT

-- Statut du séquestre
escrow_status escrow_status DEFAULT 'pending'
-- Valeurs: 'pending', 'held', 'releasing', 'completed', 'refunded'
```

### Table `project_milestones` - Nouveaux champs

```sql
-- Montant à débloquer pour ce jalon
payment_amount DECIMAL(10, 2) DEFAULT 0

-- Pourcentage du montant total
payment_percentage DECIMAL(5, 2) DEFAULT 0

-- Statut du paiement
payment_status milestone_payment_status DEFAULT 'pending'
-- Valeurs: 'pending', 'ready_to_release', 'releasing', 'released', 'failed'

-- ID du transfert Stripe
stripe_transfer_id TEXT

-- Date de déblocage
funds_released_at TIMESTAMP WITH TIME ZONE

-- Métadonnées du paiement
payment_metadata JSONB DEFAULT '{}'
```

### Table `escrow_transactions`

```sql
CREATE TABLE escrow_transactions (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  milestone_id UUID REFERENCES project_milestones(id),
  
  -- Type: 'deposit', 'release', 'refund', 'adjustment'
  transaction_type TEXT NOT NULL,
  
  -- Montant
  amount DECIMAL(10, 2) NOT NULL,
  
  -- Informations Stripe
  stripe_payment_intent_id TEXT,
  stripe_transfer_id TEXT,
  stripe_refund_id TEXT,
  
  -- Statut: 'pending', 'processing', 'completed', 'failed', 'canceled'
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Détails
  description TEXT,
  error_message TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

## 🔧 Fonctions SQL principales

### 1. `initialize_project_escrow`

Initialise le système de séquestre pour un projet.

```sql
SELECT initialize_project_escrow(
  p_project_id := 'uuid-du-projet',
  p_total_amount := 5000.00,
  p_stripe_payment_intent_id := 'pi_xxx'
);
```

**Retour:**
```json
{
  "success": true,
  "project_id": "uuid",
  "amount": 5000.00
}
```

### 2. `calculate_milestone_payments`

Calcule la répartition des paiements entre les jalons.

```sql
SELECT calculate_milestone_payments(
  p_project_id := 'uuid-du-projet',
  p_total_amount := 5000.00
);
```

**Répartition par défaut:**
- Devis accepté: 10%
- Début du chantier: 20%
- Avancement 30%: 30%
- Avancement 60%: 30%
- Fin de chantier: 10%

### 3. `release_milestone_funds`

Débloque les fonds d'un jalon validé.

```sql
SELECT release_milestone_funds(
  p_milestone_id := 'uuid-du-jalon',
  p_released_by := 'uuid-du-client',
  p_stripe_transfer_id := 'tr_xxx'
);
```

**Vérifications de sécurité:**
- ✅ Le jalon doit être validé par les deux parties
- ✅ Seul le client peut débloquer
- ✅ Le séquestre doit être activé
- ✅ Les fonds ne doivent pas être déjà débloqués

## 🔌 API Endpoints

### POST `/api/release-milestone-funds`

Débloque les fonds d'un jalon validé.

**Request:**
```json
{
  "milestoneId": "uuid-du-jalon",
  "userId": "uuid-du-client"
}
```

**Response (succès):**
```json
{
  "success": true,
  "message": "Fonds débloqués avec succès",
  "data": {
    "milestoneId": "uuid",
    "amountReleased": 1000.00,
    "transferId": "tr_xxx",
    "isLastMilestone": false
  }
}
```

**Response (erreur):**
```json
{
  "error": "Seul le client du projet peut débloquer les fonds"
}
```

## 🎨 Interface utilisateur

### Composant `ProjectMilestonesTimeline`

**Props:**
```typescript
interface ProjectMilestonesTimelineProps {
  projectId: string;
  projectClientId: string;
  professionalUserId?: string;
  escrowEnabled?: boolean;  // ← Nouveau
  onMilestoneUpdate?: () => void;
}
```

**Utilisation:**
```tsx
<ProjectMilestonesTimeline
  projectId={project.id}
  projectClientId={project.client_id}
  professionalUserId={professional?.user_id}
  escrowEnabled={project.escrow_enabled}
  onMilestoneUpdate={loadProjectData}
/>
```

### Bouton de déblocage

Le bouton apparaît uniquement si:
1. ✅ Le séquestre est activé (`escrowEnabled = true`)
2. ✅ Le jalon est validé (`validation_status = 'validated'`)
3. ✅ Le statut de paiement est `'ready_to_release'`
4. ✅ L'utilisateur connecté est le client du projet

```tsx
{escrowEnabled &&
  milestone &&
  isValidated &&
  milestone.payment_status === 'ready_to_release' &&
  user?.id === projectClientId && (
    <Button
      onClick={() => openReleaseModal(milestone)}
      className="bg-gradient-to-r from-green-600 to-emerald-600"
    >
      <DollarSign className="h-4 w-4 mr-2" />
      Débloquer les fonds ({milestone.payment_amount}€)
    </Button>
  )}
```

## 🔐 Sécurité

### Vérifications côté serveur

1. **Authentification:**
   - Vérification que l'utilisateur est bien le client du projet
   - Utilisation de `SUPABASE_SERVICE_ROLE_KEY` pour les opérations sensibles

2. **Validation:**
   - Le jalon doit être validé par les deux parties
   - Le séquestre doit être activé
   - Les fonds ne doivent pas être déjà débloqués

3. **Stripe:**
   - Utilisation de Stripe Connect pour les transferts
   - Vérification du compte Connect de l'artisan
   - Gestion des erreurs avec rollback

### Politiques RLS

```sql
-- Les clients peuvent voir les transactions de leurs projets
CREATE POLICY "Clients can view escrow transactions"
  ON escrow_transactions FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE client_id = auth.uid()
    )
  );

-- Les professionnels peuvent voir les transactions des projets matchés
CREATE POLICY "Professionals can view escrow transactions"
  ON escrow_transactions FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM project_interests 
      WHERE professional_id IN (
        SELECT id FROM professionals WHERE user_id = auth.uid()
      ) AND status = 'accepted'
    )
  );
```

## 📊 Workflow complet

### 1. Initialisation du projet

```typescript
// Lors de la création du projet avec séquestre
const { data } = await supabase.rpc('initialize_project_escrow', {
  p_project_id: projectId,
  p_total_amount: 5000.00,
  p_stripe_payment_intent_id: paymentIntent.id
});

// Calculer la répartition des paiements
await supabase.rpc('calculate_milestone_payments', {
  p_project_id: projectId,
  p_total_amount: 5000.00
});
```

### 2. Validation d'un jalon

```typescript
// L'artisan propose un jalon
await projectMilestonesService.proposeMilestone({
  projectId,
  milestoneType: 'work_started',
  proposedBy: professionalId,
  comment: 'Les travaux ont commencé'
});

// Le client valide le jalon
await projectMilestonesService.validateMilestone({
  milestoneId,
  validatedBy: clientId,
  action: 'validate'
});

// → Le statut passe automatiquement à 'ready_to_release'
```

### 3. Déblocage des fonds

```typescript
// Le client clique sur le bouton de déblocage
const response = await fetch('/api/release-milestone-funds', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    milestoneId,
    userId: clientId
  })
});

// → Transfert Stripe créé
// → Statut du jalon: 'released'
// → Notifications envoyées
```

## 🔔 Notifications

### Notifications automatiques

1. **Fonds débloqués (Artisan):**
   ```
   💰 Fonds débloqués !
   1000€ ont été transférés sur votre compte pour le jalon "Début du chantier".
   ```

2. **Paiement effectué (Client):**
   ```
   ✅ Paiement effectué
   1000€ ont été versés à l'artisan pour le jalon "Début du chantier".
   ```

3. **Projet terminé:**
   ```
   🎉 Projet terminé
   Tous les paiements ont été effectués. Le projet est maintenant terminé.
   ```

## 🧪 Tests

### Test du déblocage

```bash
# 1. Créer un projet avec séquestre
curl -X POST http://localhost:3000/api/create-project \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Rénovation cuisine",
    "escrow_enabled": true,
    "total_amount": 5000
  }'

# 2. Valider un jalon
curl -X POST http://localhost:3000/api/validate-milestone \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneId": "uuid",
    "validatedBy": "client-uuid",
    "action": "validate"
  }'

# 3. Débloquer les fonds
curl -X POST http://localhost:3000/api/release-milestone-funds \
  -H "Content-Type: application/json" \
  -d '{
    "milestoneId": "uuid",
    "userId": "client-uuid"
  }'
```

## 📈 Monitoring

### Requêtes utiles

```sql
-- Voir tous les projets avec séquestre actif
SELECT 
  id, 
  title, 
  escrow_total_amount, 
  escrow_status
FROM projects
WHERE escrow_enabled = true;

-- Voir les transactions d'un projet
SELECT 
  transaction_type,
  amount,
  status,
  description,
  created_at
FROM escrow_transactions
WHERE project_id = 'uuid-du-projet'
ORDER BY created_at DESC;

-- Voir les jalons prêts à débloquer
SELECT 
  pm.id,
  pm.milestone_type,
  pm.payment_amount,
  p.title as project_title
FROM project_milestones pm
JOIN projects p ON pm.project_id = p.id
WHERE pm.payment_status = 'ready_to_release'
  AND p.escrow_enabled = true;
```

## ⚠️ Points d'attention

1. **Stripe Connect requis:**
   - L'artisan doit avoir un compte Stripe Connect configuré
   - Vérifier `stripe_account_id` avant le transfert

2. **Montants en euros:**
   - Les montants en base sont en euros (DECIMAL)
   - Conversion en centimes pour Stripe (x100)

3. **Irréversibilité:**
   - Les transferts Stripe sont irréversibles
   - Bien vérifier avant de débloquer

4. **Gestion des erreurs:**
   - Rollback automatique en cas d'échec Stripe
   - Logs détaillés pour le debugging

## 🚀 Prochaines améliorations

- [ ] Support des remboursements partiels
- [ ] Gestion des litiges
- [ ] Déblocage automatique après X jours
- [ ] Dashboard admin pour le monitoring
- [ ] Export des transactions en PDF

## 📞 Support

Pour toute question ou problème:
- Consulter les logs: `console.log` dans l'API
- Vérifier les transactions Stripe Dashboard
- Consulter la table `escrow_transactions`

---

**Version:** 1.0.0  
**Date:** 24 juin 2026  
**Auteur:** Senior Architect
