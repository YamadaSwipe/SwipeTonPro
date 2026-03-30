# Analyse Complète Workflow SwipeTonPro

## 🎯 Schéma des statuts correct

### ✅ Types de statuts (après migration)
```typescript
project_status: "draft" | "pending" | "published" | "in_progress" | "completed" | "cancelled"
```

### ✅ Workflow attendu
1. **draft** → Brouillon (création automatique)
2. **pending** → En attente validation support
3. **published** → Publié (visible par pros)
4. **in_progress** → En cours (pro accepté par pro)
5. **completed** → Terminé
6. **cancelled** → Annulé

## 🔍 Problèmes identifiés par rôle

### 👤 PARTICULIER
**✅ Fonctionnel**
- Création projet → `pending` ✅
- Dashboard particulier → Voir projets ✅
- Estimation IA → Affichée ✅

**❌ Problèmes**
- Email notification support → Non reçu ❌
- Suivi après validation → Non implémenté ❌

### 👨‍💼 PROFESSIONNEL
**✅ Fonctionnel**
- Accès dashboard pro → ✅

**❌ Problèmes**
- Voir projets publiés → Non vérifié ❌
- Système de bid → Non testé ❌
- Planning rendez-vous → Non implémenté ❌

### 👥 ADMIN/TEAM
**✅ Fonctionnel**
- Accès dashboard admin → ✅
- Voir projets → ✅

**❌ Problèmes critiques**
- Recherche projets → `draft` au lieu de `pending` ❌
- Validation projet → `active` au lieu de `published` ❌
- Rejet projet → `rejected` non vérifié ❌
- Notifications team → Non implémentées ❌

## 🚀 Corrections requises

### 1. STATUTS ADMIN
```typescript
// CORRIGER
.eq("status", "pending")  // au lieu de "draft"

// CORRIGER  
updateProjectStatus(projectId, 'published')  // au lieu de 'active'
```

### 2. NOTIFICATIONS
```typescript
// PARTICULIER → SUPPORT (déjà implémenté)
await axios.post("/api/send-email", {
  to: "support@swipetonpro.fr",
  subject: `📋 Nouveau projet en attente - ${title}`,
  html: getAdminProjectValidationNotificationHtml(...)
});

// ADMIN → PARTICULIER (déjà implémenté)
await axios.post("/api/send-email", {
  to: clientEmail,
  subject: `✅ Projet approuvé - ${title}`,
  html: getProjectApprovedNotificationHtml(...)
});

// ADMIN → TEAM (manquant)
await axios.post("/api/send-email", {
  to: "team@swipetonpro.fr", 
  subject: `🚀 Projet à appeler - ${title}`,
  html: getTeamCallNotificationHtml(...)
});
```

### 3. WORKFLOW PROFESSIONNEL
```typescript
// Voir projets disponibles
const { data } = await supabase
  .from('projects')
  .select('*')
  .eq('status', 'published')
  .order('created_at', { ascending: false });

// Postuler (créer bid)
const { data } = await supabase
  .from('bids')
  .insert({
    project_id: projectId,
    professional_id: professionalId,
    amount: bidAmount,
    message: bidMessage,
    status: 'pending'
  });

// Accepter bid (change statut projet)
await supabase
  .from('projects')
  .update({ status: 'in_progress' })
  .eq('id', projectId);
```

### 4. PLANNING
```typescript
// Table planning nécessaire
create_table planning (
  id uuid primary key,
  project_id uuid references projects(id),
  professional_id uuid references profiles(id),
  date timestamp,
  status 'pending' | 'confirmed' | 'cancelled'
);
```

## 🎯 Actions immédiates

1. **Corriger admin validation** → `draft` → `pending`, `active` → `published`
2. **Tester email support** → Vérifier configuration SMTP
3. **Implémenter notification team** → Après validation admin
4. **Vérifier workflow pro** → Accès projets + bids
5. **Implémenter planning** → Gestion rendez-vous
