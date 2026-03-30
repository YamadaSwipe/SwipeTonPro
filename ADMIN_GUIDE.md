# Système de Gestion Administrative

## Vue d'ensemble

Le système de gestion administrative de SwipeTonPro permet aux administrateurs et aux membres de l'équipe de :

1. **Créer des utilisateurs** avec différents rôles
2. **Créer et valider des projets** directement via l'interface admin
3. **Gérer les rôles et permissions** des utilisateurs

## Rôles et Permissions

### Rôles disponibles

- **super_admin** (Super Administrateur)
  - Accès complet à toutes les fonctionnalités administratives
  - Peut créer d'autres admins et staff
  - Peut supprimer des données

- **admin** (Administrateur)
  - Gestion des utilisateurs et projets
  - Validation des projets
  - Création de projets directs
  - Gestion des configurations de base

- **support** (Support)
  - Peut répondre aux questions des utilisateurs
  - Accès à la liste des utilisateurs
  - Peut créer et valider des projets
  - Pas accès aux paramètres de configuration

- **moderator** (Modérateur)
  - Peut valider les projets
  - Peut retirer du contenu non approprié
  - Gestion des abus

- **team** (Équipe)
  - Accès limité à la gestion des projets
  - Peut créer des projets de test
  - Support basique

- **professional** (Professionnel)
  - Peut enchérir sur les projets
  - Gestion de son profil pro
  - Accès à ses projets en cours

- **client** (Client/Particulier)
  - Peut créer des projets
  - Gestion du profil client
  - Communication avec les professionnels

## APIs

### 1. Créer un Utilisateur

**Endpoint:** `POST /api/admin/create-user`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "full_name": "Jean Dupont",
  "role": "support",
  "phone": "+33612345678",
  "company_name": "Mon Entreprise" // Uniquement si role === "professional"
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "User created successfully",
  "userId": "uuid",
  "email": "user@example.com",
  "role": "support"
}
```

**Rôles valides pour création:** 
- super_admin, admin, support, moderator, team, professional, client

### 2. Créer un Projet (Admin)

**Endpoint:** `POST /api/admin/manage-projects`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "title": "Rénovation salle de bain",
  "description": "Rénovation complète avec carrelage et sanitaires neufs",
  "category": "Rénovation",
  "location": "123 Rue de la Paix",
  "city": "Paris",
  "postal_code": "75000",
  "work_types": ["plumbing", "tiling", "electrical"],
  "budget_min": 3000,
  "budget_max": 8000,
  "urgency": "high",
  "property_type": "Appartement",
  "created_on_behalf_of_user_id": "uuid_du_client", // Optionnel
  "validate_immediately": true // Les projets admin sont validés automatiquement
}
```

**Réponse (201):**
```json
{
  "success": true,
  "message": "Project created successfully and validated",
  "project": {
    "id": "uuid",
    "title": "Rénovation salle de bain",
    "status": "published",
    "validation_status": "validated",
    "created_by_admin": true
  }
}
```

### 3. Valider un Projet

**Endpoint:** `PATCH /api/admin/manage-projects`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "project_id": "uuid",
  "action": "validate",
  "validation_notes": "Projet accepté, qualité conforme aux standards"
}
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Project validated successfully",
  "project": {
    "id": "uuid",
    "validation_status": "validated"
  }
}
```

### 4. Rejeter un Projet

**Endpoint:** `PATCH /api/admin/manage-projects`

**Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "project_id": "uuid",
  "action": "reject",
  "validation_notes": "Manque documents requis, veuillez resoummettre"
}
```

## Pages Admin

### 1. Gestion Utilisateurs & Projets
**URL:** `/admin/manage-users-projects`

Deux onglets :
- **Créer Utilisateurs** : Formulaire pour créer des utilisateurs avec différents rôles
- **Créer Projets** : Formulaire pour créer des projets directement (auto-validés)

### 2. Validation des Projets
**URL:** `/admin/validate-projects`

Deux sections :
- **Projets en attente** : Liste des projets créés par les utilisateurs en attente de validation
- **Projets créés par admin** : Liste des projets créés directement par l'équipe admin

## Service Frontend

Utilisez `adminService` pour les opérations admin :

```typescript
import { adminService } from "@/services/adminService";

// Créer un utilisateur
const result = await adminService.createUser({
  email: "user@example.com",
  password: "password",
  full_name: "Full Name",
  role: "support"
});

// Créer un projet
const result = await adminService.createProject({
  title: "Project Title",
  description: "Description",
  category: "Category",
  location: "Address",
  city: "City",
  postal_code: "12345",
  validate_immediately: true
});

// Valider un projet
const result = await adminService.validateProject(projectId, "Notes");

// Rejeter un projet
const result = await adminService.rejectProject(projectId, "Raison du rejet");

// Récupérer les projets en attente
const { data } = await adminService.getPendingProjects();

// Récupérer les projets créés par admin
const { data } = await adminService.getAdminCreatedProjects();
```

## Flux de travail recommandé

### 1. Création d'un utilisateur staff
1. Aller à `/admin/manage-users-projects`
2. Onglet "Créer Utilisateurs"
3. Sélectionner le rôle (support, moderator, team, etc.)
4. Remplir les informations
5. Cliquer "Créer l'utilisateur"

### 2. Création d'un projet admin
1. Aller à `/admin/manage-users-projects`
2. Onglet "Créer Projets"
3. Remplir les informations du projet
4. Cliquer "Créer le projet"
5. Le projet est automatiquement validé et visible dans la liste des projets

### 3. Validation des projets utilisateurs
1. Aller à `/admin/validate-projects`
2. Section "Projets en attente"
3. Cliquer "Détails" sur un projet
4. Optionnellement ajouter des notes
5. Cliquer "Valider" ou "Rejeter"

## Base de données

### Nouvelles colonnes dans `projects`
- `validation_status` (TEXT): 'draft', 'pending', 'validated', 'rejected'
- `validated_by` (UUID): L'admin qui a validé
- `validated_at` (TIMESTAMP): Date de validation
- `validation_notes` (TEXT): Notes de validation
- `created_by_admin` (BOOLEAN): True si créé par admin

### Nouvelle table
- `staff_permissions` : Gestion granulaire des permissions pour chaque staff

### Nouvel enum
- `user_role` : Ajout de 'support', 'moderator', 'team'

## Sécurité

- ✅ Seuls les admins et staff peuvent créer des utilisateurs et projets
- ✅ Les rôles sont stockés dans la base de données Supabase
- ✅ Chaque action est enregistrée (validated_by, validated_at)
- ✅ Les modifications sont traçables
- ⚠️ Les projets créés par admin sont automatiquement validés

## Notes importantes

1. **Projets Admin** : Les projets créés par l'admin sont automatiquement validés et publiés
2. **Projection utilisateurs** : Seuls les projets avec `validation_status = 'validated'` et `status = 'published'` sont visibles aux utilisateurs
3. **Permissions** : Les rôles support, moderator et team peuvent valider les projets
4. **Audit** : Tous les validations sont enregistrées avec le user_id et le timestamp
