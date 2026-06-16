# 📊 Guide du Système de Jalons de Projet

## 📋 Vue d'ensemble

Le système de jalons de projet permet un suivi collaboratif de l'avancement des travaux entre le client et l'artisan. Chaque partie peut proposer des jalons, mais ils doivent être validés par l'autre partie pour être confirmés.

**Version:** 1.0.0  
**Date:** 23 juin 2026  
**Auteur:** Senior Architect

---

## 🎯 Fonctionnalités principales

### 1. **Liste des Jalons**

Le système propose 6 types de jalons prédéfinis :

| Jalon | Description | Poids |
|-------|-------------|-------|
| ✅ **Devis accepté** | Le devis a été accepté par le client | 10% |
| ❌ **Devis refusé** | Le devis a été refusé par le client | 0% |
| 🚀 **Début du chantier** | Les travaux ont officiellement commencé | 20% |
| 📊 **Avancement à 30%** | Les travaux sont à 30% de leur avancement | 30% |
| 📈 **Avancement à 60%** | Les travaux sont à 60% de leur avancement | 60% |
| 🎉 **Fin de chantier** | Les travaux sont terminés | 100% |

### 2. **Logique de Validation Collaborative**

```
┌─────────────────────────────────────────────────────────┐
│  WORKFLOW DE VALIDATION                                 │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Client ou Artisan propose un jalon                  │
│     └─> Statut: "pending_validation" 🟡                 │
│                                                          │
│  2. L'autre partie reçoit une notification              │
│     └─> Peut valider ✅ ou rejeter ❌                   │
│                                                          │
│  3. Validation                                          │
│     ├─> Si validé: Statut "validated" 🟢               │
│     └─> Si rejeté: Statut "rejected" 🔴                │
│                                                          │
│  4. Historique complet conservé                         │
│     └─> Toutes les actions sont tracées                │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 3. **Calcul de la Progression**

La progression est calculée automatiquement en fonction des jalons validés :

```typescript
// Exemple de calcul
Jalons validés:
- Devis accepté (10%)
- Début du chantier (20%)
- Avancement à 30% (30%)

Progression affichée: 30% (le poids maximum)
```

---

## 🗄️ Structure de la Base de Données

### Table `project_milestones`

```sql
CREATE TABLE project_milestones (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id),
  milestone_type milestone_type NOT NULL,
  validation_status milestone_validation_status DEFAULT 'pending_validation',
  
  -- Proposition
  proposed_by UUID REFERENCES profiles(id),
  proposed_at TIMESTAMP,
  proposed_comment TEXT,
  
  -- Validation
  validated_by UUID REFERENCES profiles(id),
  validated_at TIMESTAMP,
  validation_comment TEXT,
  
  -- Métadonnées
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Table `milestone_validation_history`

```sql
CREATE TABLE milestone_validation_history (
  id UUID PRIMARY KEY,
  milestone_id UUID REFERENCES project_milestones(id),
  action TEXT CHECK (action IN ('proposed', 'validated', 'rejected', 'updated')),
  performed_by UUID REFERENCES profiles(id),
  performed_at TIMESTAMP DEFAULT NOW(),
  previous_status milestone_validation_status,
  new_status milestone_validation_status,
  comment TEXT,
  metadata JSONB DEFAULT '{}'
);
```

---

## 🔧 Fonctions SQL Disponibles

### 1. `propose_milestone()`

Permet de proposer un nouveau jalon ou de mettre à jour un jalon existant.

```sql
SELECT propose_milestone(
  p_project_id := 'uuid-du-projet',
  p_milestone_type := 'work_started',
  p_proposed_by := 'uuid-utilisateur',
  p_comment := 'Les travaux ont commencé ce matin'
);
```

**Retour:**
```json
{
  "success": true,
  "milestone_id": "uuid-du-jalon",
  "status": "pending_validation"
}
```

### 2. `validate_milestone()`

Permet de valider ou rejeter un jalon proposé.

```sql
SELECT validate_milestone(
  p_milestone_id := 'uuid-du-jalon',
  p_validated_by := 'uuid-utilisateur',
  p_comment := 'Confirmé, les travaux ont bien démarré',
  p_action := 'validate' -- ou 'reject'
);
```

**Retour:**
```json
{
  "success": true,
  "milestone_id": "uuid-du-jalon",
  "status": "validated"
}
```

### 3. `get_project_milestones()`

Récupère tous les jalons d'un projet avec les informations des utilisateurs.

```sql
SELECT * FROM get_project_milestones('uuid-du-projet');
```

---

## 💻 Utilisation Frontend

### Service TypeScript

```typescript
import { projectMilestonesService } from '@/services/projectMilestonesService';

// Récupérer les jalons
const { data, error } = await projectMilestonesService.getProjectMilestones(projectId);

// Proposer un jalon
const result = await projectMilestonesService.proposeMilestone({
  projectId: 'uuid',
  milestoneType: 'work_started',
  proposedBy: userId,
  comment: 'Commentaire optionnel'
});

// Valider un jalon
const validation = await projectMilestonesService.validateMilestone({
  milestoneId: 'uuid',
  validatedBy: userId,
  comment: 'Commentaire optionnel',
  action: 'validate' // ou 'reject'
});

// Calculer la progression
const progress = projectMilestonesService.calculateProgress(milestones);
```

### Composant React

```tsx
import { ProjectMilestonesTimeline } from '@/components/milestones/ProjectMilestonesTimeline';

<ProjectMilestonesTimeline
  projectId={project.id}
  projectClientId={project.client_id}
  professionalUserId={professional?.user_id}
  onMilestoneUpdate={() => {
    // Callback après mise à jour
  }}
/>
```

---

## 🎨 Interface Utilisateur

### Affichage Timeline

```
┌─────────────────────────────────────────────────────────┐
│  Suivi de l'avancement du projet          [30% complété]│
├─────────────────────────────────────────────────────────┤
│                                                          │
│  [████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]    │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ✅ Devis accepté                    [Validé] 🟢 │   │
│  │ Proposé par: Jean Dupont (Client)               │   │
│  │ Le 15 juin 2026 à 14:30                         │   │
│  │ Validé par: Artisan Pro (Artisan)               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🚀 Début du chantier                [Validé] 🟢 │   │
│  │ Proposé par: Artisan Pro (Artisan)              │   │
│  │ Le 20 juin 2026 à 08:00                         │   │
│  │ "Les travaux ont commencé ce matin"             │   │
│  │ Validé par: Jean Dupont (Client)                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📊 Avancement à 30%    [En attente validation] 🟡│  │
│  │ Proposé par: Artisan Pro (Artisan)              │   │
│  │ Le 23 juin 2026 à 16:45                         │   │
│  │ "Fondations terminées"                          │   │
│  │ [Valider / Rejeter]                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📈 Avancement à 60%                             │   │
│  │ [Proposer ce jalon]                             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔐 Sécurité et Permissions

### Row Level Security (RLS)

```sql
-- Les clients peuvent voir les jalons de leurs projets
CREATE POLICY "Clients can view milestones of their projects"
  ON project_milestones FOR SELECT
  USING (project_id IN (
    SELECT id FROM projects WHERE client_id = auth.uid()
  ));

-- Les professionnels peuvent voir les jalons des projets matchés
CREATE POLICY "Professionals can view milestones of matched projects"
  ON project_milestones FOR SELECT
  USING (project_id IN (
    SELECT project_id FROM project_interests 
    WHERE professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    ) AND status = 'accepted'
  ));
```

### Règles de Validation

1. **Proposition** : Seuls le client ou l'artisan du projet peuvent proposer un jalon
2. **Validation** : Seule l'autre partie (pas celle qui a proposé) peut valider
3. **Modification** : Un jalon peut être modifié tant qu'il n'est pas validé
4. **Historique** : Toutes les actions sont enregistrées et non modifiables

---

## 📱 Intégration dans les Dashboards

### Dashboard Client

**Route:** `/particulier/projects/[id]`

```tsx
// Affiche la timeline des jalons pour le projet
<ProjectMilestonesTimeline
  projectId={projectId}
  projectClientId={clientId}
  professionalUserId={professionalUserId}
/>
```

### Dashboard Artisan

**Route:** `/professionnel/projects/[id]`

```tsx
// Même composant, permissions gérées automatiquement
<ProjectMilestonesTimeline
  projectId={projectId}
  projectClientId={clientId}
  professionalUserId={userId}
/>
```

### Dashboard Admin

**Route:** `/admin/projects/[id]`

Les admins peuvent voir tous les jalons mais ne peuvent pas les modifier (lecture seule).

---

## 🔔 Notifications

### Événements Déclenchant des Notifications

1. **Nouveau jalon proposé** → Notification à l'autre partie
2. **Jalon validé** → Notification à celui qui a proposé
3. **Jalon rejeté** → Notification à celui qui a proposé

### Exemple de Notification

```typescript
{
  type: 'milestone_proposed',
  title: 'Nouveau jalon proposé',
  message: 'L\'artisan a proposé le jalon "Avancement à 30%"',
  data: {
    project_id: 'uuid',
    milestone_id: 'uuid',
    milestone_type: 'progress_30'
  }
}
```

---

## 📊 Métriques et Analytics

### Indicateurs Clés

- **Taux de validation** : % de jalons validés vs proposés
- **Délai moyen de validation** : Temps entre proposition et validation
- **Progression moyenne** : % d'avancement moyen des projets
- **Jalons les plus utilisés** : Statistiques par type de jalon

### Requête Analytics

```sql
-- Statistiques globales
SELECT 
  milestone_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE validation_status = 'validated') as validated,
  COUNT(*) FILTER (WHERE validation_status = 'pending_validation') as pending,
  COUNT(*) FILTER (WHERE validation_status = 'rejected') as rejected,
  AVG(EXTRACT(EPOCH FROM (validated_at - proposed_at))/3600) as avg_validation_hours
FROM project_milestones
GROUP BY milestone_type;
```

---

## 🧪 Tests

### Test de Proposition

```typescript
test('Un client peut proposer un jalon', async () => {
  const result = await projectMilestonesService.proposeMilestone({
    projectId: testProjectId,
    milestoneType: 'work_started',
    proposedBy: clientId,
    comment: 'Test'
  });
  
  expect(result.data?.success).toBe(true);
  expect(result.data?.status).toBe('pending_validation');
});
```

### Test de Validation

```typescript
test('Un artisan peut valider un jalon proposé par le client', async () => {
  const result = await projectMilestonesService.validateMilestone({
    milestoneId: testMilestoneId,
    validatedBy: professionalId,
    action: 'validate'
  });
  
  expect(result.data?.success).toBe(true);
  expect(result.data?.status).toBe('validated');
});
```

---

## 🚀 Migration et Déploiement

### Étapes de Déploiement

1. **Exécuter la migration SQL**
   ```bash
   # La migration crée automatiquement :
   # - Les types ENUM
   # - Les tables
   # - Les fonctions
   # - Les politiques RLS
   # - Les index
   ```

2. **Vérifier les types TypeScript**
   ```bash
   # Régénérer les types Supabase si nécessaire
   npx supabase gen types typescript --project-id <project-id>
   ```

3. **Tester en développement**
   ```bash
   npm run dev
   # Tester les fonctionnalités sur /particulier/projects/[id]
   ```

4. **Déployer en production**
   ```bash
   git add .
   git commit -m "feat: Système de jalons de projet collaboratifs"
   git push origin main
   ```

---

## 📝 Bonnes Pratiques

### Pour les Développeurs

1. **Toujours utiliser le service** : Ne pas appeler directement les fonctions SQL
2. **Gérer les erreurs** : Vérifier `error` dans les réponses
3. **Optimiser les requêtes** : Utiliser les index créés
4. **Respecter les permissions** : Utiliser les fonctions de vérification

### Pour les Utilisateurs

1. **Commentaires clairs** : Ajouter des commentaires explicatifs
2. **Validation rapide** : Valider ou rejeter rapidement les jalons
3. **Communication** : Utiliser les commentaires pour communiquer
4. **Suivi régulier** : Consulter régulièrement l'avancement

---

## 🐛 Dépannage

### Problème : Jalon non visible

**Solution :**
```sql
-- Vérifier les politiques RLS
SELECT * FROM project_milestones WHERE project_id = 'uuid';
-- Si vide, vérifier que l'utilisateur a accès au projet
```

### Problème : Impossible de valider

**Cause possible :** L'utilisateur essaie de valider son propre jalon

**Solution :** Seule l'autre partie peut valider

### Problème : Progression incorrecte

**Solution :**
```typescript
// Recalculer manuellement
const milestones = await projectMilestonesService.getProjectMilestones(projectId);
const progress = projectMilestonesService.calculateProgress(milestones.data);
```

---

## 📚 Ressources

- **Migration SQL** : `supabase/migrations/20260623000000_create_project_milestones_system.sql`
- **Service TypeScript** : `src/services/projectMilestonesService.ts`
- **Composant Timeline** : `src/components/milestones/ProjectMilestonesTimeline.tsx`
- **Page Client** : `src/pages/particulier/projects/[id].tsx`
- **Page Artisan** : `src/pages/professionnel/projects/[id].tsx`

---

## 🎉 Conclusion

Le système de jalons de projet offre une solution complète et collaborative pour suivre l'avancement des travaux. Il garantit la transparence entre le client et l'artisan tout en conservant un historique complet de toutes les actions.

**Avantages clés :**
- ✅ Validation collaborative
- ✅ Historique complet
- ✅ Interface visuelle claire
- ✅ Sécurité renforcée
- ✅ Notifications automatiques
- ✅ Métriques détaillées

---

**Version:** 1.0.0  
**Dernière mise à jour:** 23 juin 2026  
**Auteur:** Senior Architect
