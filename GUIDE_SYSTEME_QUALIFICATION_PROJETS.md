# Guide du Système de Qualification des Projets et E-mails de Réassurance

## 📋 Vue d'ensemble

Ce système ajoute deux fonctionnalités majeures pour améliorer la confiance et la rétention des utilisateurs :

1. **Badge "Projet Qualifié"** : Permet aux admins/modérateurs de valider la véracité des projets
2. **E-mails de Réassurance** : Messages insistant sur la sécurité et l'importance de rester sur la plateforme

---

## 🎯 Objectifs

### Pour les Particuliers
- **Rétention** : Les inciter à rester exclusivement sur la plateforme pour tous les échanges
- **Sécurité** : Les protéger contre les arnaques et les sorties de plateforme
- **Traçabilité** : Conserver un historique officiel en cas de litige

### Pour les Professionnels
- **Garantie de paiement** : Les encourager à demander le séquestre des fonds
- **Protection** : Éviter les impayés grâce au système de séquestre
- **Confiance** : Le badge "Projet Qualifié" rassure sur la véracité des projets

---

## 🗄️ Structure de la Base de Données

### Nouveaux Champs dans la Table `projects`

```sql
-- Badge de qualification
is_project_qualified BOOLEAN DEFAULT FALSE

-- Traçabilité
qualified_by UUID REFERENCES profiles(id)
qualified_at TIMESTAMPTZ
```

### Trigger Automatique

Le trigger `auto_qualify_project_on_validation()` qualifie automatiquement un projet lorsque son statut passe à `'published'`.

**Note importante** : Le statut `'validated'` n'existe pas dans l'enum `project_status`. Les valeurs possibles sont :
- `'draft'` : Brouillon
- `'pending'` : En attente
- `'published'` : Publié (visible par les professionnels)
- `'in_progress'` : En cours
- `'completed'` : Terminé
- `'cancelled'` : Annulé

---

## 📧 Templates d'E-mails

### 1. E-mail de Mise en Ligne (Particulier)

**Fichier** : `src/lib/qualificationEmailTemplates.ts`  
**Fonction** : `getProjectPublishedClientEmail()`

**Contenu clé** :
- ✅ Confirmation de la mise en ligne
- ⚠️ **SECTION CRITIQUE** : Avertissement sur l'importance de rester sur la plateforme
- 🔒 Liste des interdictions (NE JAMAIS partager téléphone, email, etc.)
- 🛡️ Explications détaillées des raisons de sécurité :
  - Historique officiel en cas de litige
  - Protection contre les arnaques
  - Médiation et support
  - Garantie de paiement sécurisé

**Déclenchement** : Lors de l'appel à `/api/notify-project-created`

---

### 2. E-mail de Matching (Professionnel)

**Fichier** : `src/lib/qualificationEmailTemplates.ts`  
**Fonction** : `getMatchConfirmedProfessionalEmail()`

**Contenu clé** :
- 🎉 Confirmation du match
- 💰 **SECTION CRITIQUE** : Importance du séquestre des fonds
- 🛡️ Explications détaillées des avantages du séquestre :
  1. Protection contre les impayés
  2. Sécurité juridique
  3. Libération automatique sous 48h
  4. Médiation en cas de désaccord
- ⚠️ Avertissement : Perte de toute protection en cas de paiement hors plateforme
- 📋 Prochaines étapes avec insistance sur le séquestre

**Déclenchement** : Lors de l'appel à `/api/notify-match`

---

### 3. E-mail de Matching (Particulier)

**Fichier** : `src/lib/qualificationEmailTemplates.ts`  
**Fonction** : `getMatchConfirmedClientEmail()`

**Contenu clé** :
- 🤝 Confirmation du professionnel
- ⚠️ **RAPPEL SÉCURITÉ** : Rester exclusivement sur la plateforme
- 🔒 Avantages de la messagerie SwipeTonPro :
  - Échanges conservés comme preuve
  - Surveillance des comportements suspects
  - Support réactif
  - Protection des données personnelles
- ⛔ Interdiction de partager coordonnées avant signature du contrat

**Déclenchement** : Lors de l'appel à `/api/notify-match`

---

## 🔧 Intégration dans le Code

### API de Notification de Projet Créé

**Fichier** : `src/pages/api/notify-project-created.ts`

```typescript
import { getProjectPublishedClientEmail } from '@/lib/qualificationEmailTemplates';

// Dans le handler
const results = await Promise.allSettled([
  // Email au particulier - RÉASSURANCE SÉCURITÉ
  sendEmailServerSide({
    to: client.email,
    subject: `✅ Votre projet "${project.title}" est en ligne`,
    html: getProjectPublishedClientEmail({
      clientName: client.full_name || 'Client',
      projectTitle: project.title,
      projectUrl: `${BASE_URL}/particulier/dashboard`,
    }),
    fromType: 'noreply',
  }),
  // ... autres emails (support, team)
]);
```

---

### API de Notification de Match

**Fichier** : `src/pages/api/notify-match.ts`

```typescript
import { 
  getMatchConfirmedProfessionalEmail, 
  getMatchConfirmedClientEmail 
} from '@/lib/qualificationEmailTemplates';

// Dans le handler
const results = await Promise.allSettled([
  // Email au professionnel - SÉQUESTRE
  sendEmailServerSide({
    to: proProfile.email,
    subject: `🎉 Match confirmé — ${project.title} — Action requise`,
    html: getMatchConfirmedProfessionalEmail({
      proName: proProfile.full_name || 'Professionnel',
      projectTitle: project.title,
      clientName: clientProfile.full_name || 'Client',
      projectBudget: budgetDisplay,
      pricePaid: pricePaidDisplay,
      dashboardUrl: `${BASE_URL}/professionnel/dashboard`,
    }),
    fromType: 'noreply',
  }),
  
  // Email au particulier - RÉASSURANCE
  sendEmailServerSide({
    to: clientProfile.email,
    subject: `🤝 Votre professionnel est confirmé — ${project.title}`,
    html: getMatchConfirmedClientEmail({
      clientName: clientProfile.full_name || 'Client',
      proName: proProfile.full_name || 'Votre professionnel',
      projectTitle: project.title,
      dashboardUrl: `${BASE_URL}/particulier/dashboard`,
    }),
    fromType: 'noreply',
  }),
  // ... email support
]);
```

---

## 🎨 Affichage du Badge "Projet Qualifié"

### Dans les Composants Frontend

Pour afficher le badge sur les cartes de projet :

```tsx
import { Badge } from '@/components/ui/badge';

// Dans le composant ProjectCard
{project.is_project_qualified && (
  <Badge variant="success" className="flex items-center gap-1">
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
    Projet Qualifié
  </Badge>
)}
```

### Requête pour Récupérer les Projets

```typescript
const { data: projects } = await supabase
  .from('projects')
  .select('*, is_project_qualified, qualified_at, qualified_by')
  .eq('status', 'published')
  .order('created_at', { ascending: false });
```

---

## 👨‍💼 Interface Admin pour Qualifier un Projet

### Fonction de Qualification Manuelle

```typescript
async function qualifyProject(projectId: string, adminId: string) {
  const { data, error } = await supabase
    .from('projects')
    .update({
      is_project_qualified: true,
      qualified_by: adminId,
      qualified_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .select()
    .single();

  if (error) {
    console.error('Erreur qualification projet:', error);
    return { success: false, error };
  }

  return { success: true, data };
}
```

### Bouton dans l'Interface Admin

```tsx
<Button
  onClick={() => qualifyProject(project.id, currentAdmin.id)}
  variant="success"
  disabled={project.is_project_qualified}
>
  {project.is_project_qualified ? (
    <>
      <CheckCircle className="w-4 h-4 mr-2" />
      Déjà Qualifié
    </>
  ) : (
    <>
      <Shield className="w-4 h-4 mr-2" />
      Qualifier ce Projet
    </>
  )}
</Button>
```

---

## 📊 Statistiques et Suivi

### Requêtes Utiles

```sql
-- Nombre de projets qualifiés
SELECT COUNT(*) FROM projects WHERE is_project_qualified = TRUE;

-- Projets qualifiés par admin
SELECT 
  p.qualified_by,
  pr.full_name as admin_name,
  COUNT(*) as projects_qualified
FROM projects p
JOIN profiles pr ON p.qualified_by = pr.id
WHERE p.is_project_qualified = TRUE
GROUP BY p.qualified_by, pr.full_name;

-- Projets publiés non encore qualifiés
SELECT * FROM projects 
WHERE status = 'published' 
AND is_project_qualified = FALSE;
```

---

## 🔐 Sécurité et Bonnes Pratiques

### 1. Permissions RLS (Row Level Security)

Assurez-vous que seuls les admins/modérateurs peuvent modifier `is_project_qualified` :

```sql
CREATE POLICY "Only admins can qualify projects"
ON projects
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT id FROM profiles 
    WHERE role IN ('admin', 'moderator', 'super_admin')
  )
);
```

### 2. Validation Côté Serveur

Toujours vérifier les permissions dans les API :

```typescript
// Vérifier que l'utilisateur est admin
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', userId)
  .single();

if (!['admin', 'moderator', 'super_admin'].includes(profile.role)) {
  return res.status(403).json({ error: 'Non autorisé' });
}
```

---

## 🚀 Déploiement

### 1. Appliquer la Migration

```bash
# En local
supabase db push

# En production
supabase db push --linked
```

### 2. Vérifier l'Application

```sql
-- Vérifier que les colonnes existent
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('is_project_qualified', 'qualified_by', 'qualified_at');

-- Vérifier que le trigger existe
SELECT trigger_name 
FROM information_schema.triggers 
WHERE trigger_name = 'trigger_auto_qualify_project';
```

### 3. Tester les E-mails

```bash
# Tester l'envoi d'email de mise en ligne
curl -X POST http://localhost:3000/api/notify-project-created \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"projectId": "xxx", "clientId": "yyy"}'

# Tester l'envoi d'email de matching
curl -X POST http://localhost:3000/api/notify-match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"projectId": "xxx", "professionalId": "yyy", "clientId": "zzz", "pricePaid": 50}'
```

---

## 📝 Checklist de Mise en Production

- [ ] Migration SQL appliquée en production
- [ ] Vérification des colonnes et triggers
- [ ] Tests des templates d'e-mails
- [ ] Configuration SMTP vérifiée
- [ ] Interface admin pour qualifier les projets
- [ ] Affichage du badge sur les cartes de projet
- [ ] Permissions RLS configurées
- [ ] Tests end-to-end complets
- [ ] Documentation mise à jour
- [ ] Formation de l'équipe support/modération

---

## 🆘 Dépannage

### Les E-mails ne Partent Pas

1. Vérifier la configuration SMTP dans `.env` :
   ```
   SMTP_HOST=ssl0.ovh.net
   SMTP_PORT=465
   SMTP_PASSWORD=votre_mot_de_passe
   ```

2. Vérifier les logs serveur :
   ```bash
   # Logs de l'API
   tail -f logs/api.log
   ```

3. Tester l'envoi manuel :
   ```typescript
   import { sendEmailServerSide } from '@/lib/email';
   
   await sendEmailServerSide({
     to: 'test@example.com',
     subject: 'Test',
     html: '<p>Test</p>',
     fromType: 'noreply',
   });
   ```

### Le Badge ne S'affiche Pas

1. Vérifier que le champ est bien récupéré :
   ```typescript
   console.log('Project data:', project);
   console.log('Is qualified:', project.is_project_qualified);
   ```

2. Vérifier la requête Supabase :
   ```typescript
   .select('*, is_project_qualified, qualified_at')
   ```

3. Vérifier les permissions RLS

### Le Trigger ne Fonctionne Pas

1. Vérifier que le trigger existe :
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'trigger_auto_qualify_project';
   ```

2. Tester manuellement :
   ```sql
   UPDATE projects 
   SET status = 'published' 
   WHERE id = 'votre_project_id';
   
   SELECT is_project_qualified, qualified_at 
   FROM projects 
   WHERE id = 'votre_project_id';
   ```

---

## 📞 Support

Pour toute question ou problème :
- **E-mail** : support@swipetonpro.fr
- **Documentation** : Ce guide
- **Code source** : 
  - Migration : `supabase/migrations/20260622000000_add_project_qualified_badge.sql`
  - Templates : `src/lib/qualificationEmailTemplates.ts`
  - APIs : `src/pages/api/notify-project-created.ts` et `src/pages/api/notify-match.ts`

---

**Date de création** : 22/06/2026  
**Version** : 1.0  
**Auteur** : Équipe SwipeTonPro
