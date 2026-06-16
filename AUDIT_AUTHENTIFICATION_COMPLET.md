# 🔐 AUDIT COMPLET DU SYSTÈME D'AUTHENTIFICATION

**Date**: 16/06/2026  
**Projet**: SwipeTonPro  
**Environnement**: Production (Vercel + Supabase + Resend)

---

## 📋 RÉSUMÉ EXÉCUTIF

### ✅ Points Forts Identifiés
1. **Système de réinitialisation de mot de passe** : Utilise Resend avec génération de liens sécurisés
2. **API d'update de mot de passe** : Utilise le service role key pour forcer la mise à jour
3. **AuthContext centralisé** : Gestion unifiée de l'authentification
4. **Protection contre les locks** : Retry logic implémentée dans le logout

### ❌ Bugs Critiques Identifiés

#### 1. **INSCRIPTION PARTICULIERS - Profil créé en double**
**Fichier**: `src/pages/particulier/create-account.tsx` (lignes 266-275)

**Problème**:
```typescript
// Ligne 266 - Premier insert du profil
const { error: profileError } = await supabase.from('profiles').insert({
  id: user.id,
  email,
  full_name: `${formData.firstName} ${formData.lastName}`,
  phone: formData.phone,
  address: formData.address,
  city: formData.city,
  postal_code: formData.postalCode,
  role: 'client',
});
```

**Impact**: 
- Le trigger Supabase `auto_create_profile_with_role` crée déjà un profil automatiquement
- Tentative de création manuelle = conflit potentiel
- Risque de données incohérentes

---

#### 2. **INSCRIPTION PROFESSIONNELS - Documents non enregistrés**
**Fichier**: `src/pages/professionnel/inscription.tsx` (lignes 410-529)

**Problème**:
```typescript
// Ligne 416 - Récupération de l'ID professionnel
const { data: professional } = await supabase
  .from('professionals')
  .select('id')
  .eq('user_id', userId)
  .single();

// MAIS le profil professionnel n'est créé qu'à la ligne 577 !
```

**Impact**:
- Les documents sont uploadés AVANT la création du profil professionnel
- `professional?.id` est NULL
- Les documents ne sont jamais associés correctement
- Les professionnels ne peuvent pas être vérifiés

---

#### 3. **UPLOAD DOCUMENTS - Mauvais ID utilisé**
**Fichier**: `src/pages/api/upload-document.ts` (lignes 89-96)

**Problème**:
```typescript
// Ligne 90 - Recherche avec user_id au lieu de l'ID direct
const { data: professional } = await supabase
  .from('professionals')
  .select('id')
  .eq('user_id', professionalId) // ❌ professionalId est déjà l'ID du pro
  .single();

const actualProfessionalId = professional?.id || professionalId;
```

**Impact**:
- Confusion entre `user_id` et `professional_id`
- Documents mal associés
- Impossible de retrouver les documents uploadés

---

#### 4. **CONNEXION - Redirection non explicite**
**Fichier**: `src/pages/auth/login.tsx` (lignes 60-71)

**Problème**:
```typescript
// Ligne 60 - Redirection basée sur useEffect
useEffect(() => {
  if (!loginSuccess || !role) return;

  const destination =
    role === 'admin' || role === 'super_admin'
      ? '/admin/dashboard'
      : role === 'professional'
        ? '/professionnel/dashboard'
        : '/particulier/dashboard';

  router.push(destination);
}, [loginSuccess, role, router]);
```

**Impact**:
- Dépend du chargement asynchrone du rôle dans AuthContext
- Peut causer des boucles de redirection
- Pas de feedback visuel pendant le chargement du rôle

---

#### 5. **AUTHCONTEXT - Chargement des données non attendu**
**Fichier**: `src/context/AuthContext.tsx` (lignes 400-450)

**Problème**:
```typescript
// Ligne 450 - Login function
const login = async (email: string, password: string) => {
  // ...
  if (data.user) {
    setUser({...});
    
    // Charger les données utilisateur de manière asynchrone sans bloquer
    loadUserData(data.user.id).catch(err => {
      console.error('❌ AuthContext: Error loading user data:', err);
    });
    
    return { success: true }; // ❌ Retourne AVANT que loadUserData soit terminé
  }
};
```

**Impact**:
- Le rôle n'est pas encore chargé quand login() retourne
- La page de login redirige avant d'avoir le rôle
- Cause des redirections vers des pages incorrectes

---

#### 6. **RESET PASSWORD - Validation de session complexe**
**Fichier**: `src/pages/auth/reset-password.tsx` (lignes 29-97)

**Problème**:
```typescript
// Trop de tentatives de validation
if (typeof (supabase.auth as any).getSessionFromUrl === 'function') {
  // Tentative 1
}

if (!validated) {
  // Tentative 2 avec getSession
}

// Pas de nettoyage systématique du hash
if (window.location.hash) {
  window.history.replaceState(...);
}
```

**Impact**:
- Logique trop complexe
- Délais inutiles
- Hash reste parfois dans l'URL

---

## 🔧 CORRECTIONS NÉCESSAIRES

### 1. Corriger l'inscription des particuliers

**Action**: Supprimer la création manuelle du profil (le trigger le fait déjà)

```typescript
// ❌ SUPPRIMER CES LIGNES (266-299)
const { error: profileError } = await supabase.from('profiles').insert({
  id: user.id,
  email,
  full_name: `${formData.firstName} ${formData.lastName}`,
  phone: formData.phone,
  address: formData.address,
  city: formData.city,
  postal_code: formData.postalCode,
  role: 'client',
});

// ✅ REMPLACER PAR
// Mettre à jour le profil créé automatiquement par le trigger
const { error: profileError } = await supabase
  .from('profiles')
  .update({
    full_name: `${formData.firstName} ${formData.lastName}`,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    postal_code: formData.postalCode,
  })
  .eq('id', user.id);
```

---

### 2. Corriger l'ordre de création du profil professionnel

**Action**: Créer le profil professionnel AVANT d'uploader les documents

```typescript
// ✅ DÉPLACER LA CRÉATION DU PROFIL AVANT L'UPLOAD
// Ligne 533 - Créer le profil professionnel D'ABORD
const { data: existingPro, error: checkError } = await supabase
  .from('professionals')
  .select('id')
  .eq('user_id', userId)
  .single();

let professionalId;
if (existingPro) {
  // Mettre à jour
  await supabase.from('professionals').update({...}).eq('user_id', userId);
  professionalId = existingPro.id;
} else {
  // Créer
  const { data: newPro } = await supabase.from('professionals').insert({...}).select().single();
  professionalId = newPro.id;
}

// ENSUITE uploader les documents avec le bon ID
await uploadDocumentsIfPresent(professionalId);
```

---

### 3. Corriger l'API upload-document

**Action**: Utiliser directement le professionalId sans recherche

```typescript
// ❌ SUPPRIMER (lignes 89-96)
const { data: professional } = await supabase
  .from('professionals')
  .select('id')
  .eq('user_id', professionalId)
  .single();

const actualProfessionalId = professional?.id || professionalId;

// ✅ REMPLACER PAR
// professionalId est déjà l'ID correct de la table professionals
const { data: documentData, error: insertError } = await supabase
  .from('documents')
  .insert({
    professional_id: professionalId, // Utiliser directement
    type: documentType,
    file_name: fileName,
    file_url: urlData.publicUrl,
    status: 'pending', // ❌ NE PAS auto-vérifier
    created_at: new Date().toISOString(),
  })
  .select()
  .single();
```

---

### 4. Corriger la connexion avec chargement synchrone

**Action**: Attendre le chargement du rôle avant de rediriger

```typescript
// ✅ MODIFIER la fonction login dans AuthContext
const login = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email,
        created_at: data.user.created_at,
      });
      
      // ✅ ATTENDRE le chargement des données
      await loadUserData(data.user.id);
      
      return { success: true };
    }
  } catch (error) {
    return { success: false, error: 'Erreur système' };
  }
};
```

---

### 5. Simplifier la validation du reset password

**Action**: Utiliser une seule méthode de validation

```typescript
// ✅ SIMPLIFIER (lignes 29-97)
useEffect(() => {
  const checkResetSession = async () => {
    try {
      console.log('🔍 Vérification de la session de récupération...');

      // Une seule tentative avec getSession
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData?.session?.user) {
        setErrorMessage(
          'Ce lien de réinitialisation est invalide ou a expiré. Demandez un nouveau lien.'
        );
        setTokenValid(false);
      } else {
        console.log('✅ Session trouvée:', sessionData.session.user.email);
        setTokenValid(true);
      }

      // Nettoyer le hash immédiatement
      if (window.location.hash) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }
    } catch (error) {
      console.error('❌ Erreur vérification:', error);
      setErrorMessage('Erreur lors de la validation du lien.');
      setTokenValid(false);
    } finally {
      setIsValidating(false);
    }
  };

  checkResetSession();
}, []);
```

---

## 🧪 TESTS À EFFECTUER

### Test 1: Inscription Particulier
1. ✅ Créer un compte particulier
2. ✅ Vérifier qu'un seul profil est créé
3. ✅ Vérifier que le rôle est 'client'
4. ✅ Vérifier que les données sont complètes
5. ✅ Vérifier la redirection vers le dashboard

### Test 2: Inscription Professionnel
1. ✅ Créer un compte professionnel
2. ✅ Remplir les informations entreprise
3. ✅ Uploader les documents (KBIS, assurance)
4. ✅ Vérifier que les documents sont bien enregistrés en BDD
5. ✅ Vérifier que le profil professionnel est créé
6. ✅ Vérifier la redirection vers validation-en-cours

### Test 3: Mot de passe oublié
1. ✅ Demander un lien de réinitialisation
2. ✅ Vérifier la réception de l'email (Resend)
3. ✅ Cliquer sur le lien
4. ✅ Vérifier que la page s'ouvre correctement
5. ✅ Définir un nouveau mot de passe
6. ✅ Vérifier la redirection vers /auth/login
7. ✅ Se connecter avec le nouveau mot de passe

### Test 4: Connexion
1. ✅ Se connecter en tant que particulier
2. ✅ Vérifier la redirection vers /particulier/dashboard
3. ✅ Se connecter en tant que professionnel
4. ✅ Vérifier la redirection vers /professionnel/dashboard
5. ✅ Se connecter en tant qu'admin
6. ✅ Vérifier la redirection vers /admin/dashboard

### Test 5: Sessions
1. ✅ Se connecter
2. ✅ Rafraîchir la page
3. ✅ Vérifier que la session est maintenue
4. ✅ Fermer le navigateur et rouvrir
5. ✅ Vérifier que la session persiste

---

## 📊 PRIORITÉS DE CORRECTION

| Priorité | Bug | Impact | Difficulté |
|----------|-----|--------|------------|
| 🔴 P0 | Documents professionnels non enregistrés | CRITIQUE | Moyenne |
| 🔴 P0 | AuthContext - Chargement asynchrone | CRITIQUE | Facile |
| 🟠 P1 | Profil particulier créé en double | Élevé | Facile |
| 🟠 P1 | Upload documents - Mauvais ID | Élevé | Facile |
| 🟡 P2 | Reset password - Validation complexe | Moyen | Facile |
| 🟡 P2 | Connexion - Redirection non explicite | Moyen | Facile |

---

## 🎯 PLAN D'ACTION

### Phase 1: Corrections Critiques (P0)
1. ✅ Corriger AuthContext pour attendre loadUserData
2. ✅ Corriger l'ordre de création du profil professionnel
3. ✅ Tester l'inscription professionnelle complète

### Phase 2: Corrections Importantes (P1)
4. ✅ Supprimer la création manuelle du profil particulier
5. ✅ Corriger l'API upload-document
6. ✅ Tester l'inscription particulière

### Phase 3: Améliorations (P2)
7. ✅ Simplifier la validation du reset password
8. ✅ Améliorer le feedback visuel de connexion
9. ✅ Tests complets de bout en bout

---

## 📝 NOTES TECHNIQUES

### Trigger Supabase
Le trigger `auto_create_profile_with_role` crée automatiquement un profil lors de l'inscription:
- Détecte le rôle dans `user_metadata`
- Crée le profil avec le bon rôle
- Évite les doublons

### Resend vs SMTP
- Production utilise Resend (API key configurée)
- Fallback sur SMTP OVH si Resend indisponible
- Emails de réinitialisation envoyés depuis `contact@swipetonpro.fr`

### Structure des rôles
- `client`: Particuliers
- `professional`: Professionnels
- `admin`: Administrateurs
- `super_admin`: Super administrateurs
- `support`, `moderator`, `team`: Rôles staff

---

## ✅ VALIDATION FINALE

Une fois toutes les corrections appliquées:
1. Tester l'inscription complète (particulier + professionnel)
2. Tester le flux de mot de passe oublié
3. Tester la connexion et les redirections
4. Vérifier la persistance des sessions
5. Valider l'upload des documents professionnels
6. Déployer sur Vercel
7. Tester en production

---

**Audit réalisé par**: Assistant IA  
**Dernière mise à jour**: 16/06/2026 03:26
