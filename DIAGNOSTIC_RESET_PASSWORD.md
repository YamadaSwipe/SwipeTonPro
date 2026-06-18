# 🔍 Diagnostic du problème de réinitialisation de mot de passe

## 📋 Problème identifié

Le lien de réinitialisation reçu par email redirige vers Supabase au lieu de la page de réinitialisation du site.

### Lien reçu (problématique):
```
https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/verify?token=636ad9b55c9d04352806b0b18e7b291685e17ea29e9d568d55824bf5&type=recovery&redirect_to=https://www.swipetonpro.fr/auth/reset-password
```

## 🔎 Analyse du problème

### 1. **Le lien pointe vers Supabase directement**
- Le lien commence par `https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/verify`
- Cela signifie que Supabase envoie son propre email au lieu d'utiliser notre template personnalisé

### 2. **Deux méthodes d'envoi d'email coexistent**

Dans `src/pages/api/auth/reset-password-fixed.ts`:

**Méthode 1 (Resend - personnalisée):**
```typescript
if (process.env.RESEND_API_KEY) {
  const resetLink = await generateRecoveryLink(email, redirectUrl);
  const sent = await sendResetEmailViaResend(email, resetLink);
}
```

**Méthode 2 (Supabase - par défaut):**
```typescript
const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
  redirectTo: redirectUrl,
});
```

### 3. **Le problème**
- Si `RESEND_API_KEY` n'est pas configuré ou si la méthode Resend échoue, le système utilise `resetPasswordForEmail` de Supabase
- Cette méthode utilise le template email de Supabase (pas notre template personnalisé)
- Le lien généré par Supabase passe d'abord par leur serveur avant de rediriger

## ✅ Solutions possibles

### Solution 1: Vérifier la configuration Resend (RECOMMANDÉ)

Le fichier `.env.local` contient:
```
RESEND_API_KEY=re_uDSUn6my_KFG7JVbrxmyMT1ztteQwpj16
```

**Actions à vérifier:**
1. La clé API Resend est-elle valide?
2. Le domaine `swipetonpro.fr` est-il vérifié dans Resend?
3. Les logs montrent-ils des erreurs d'envoi via Resend?

### Solution 2: Configurer les URL de redirection dans Supabase

Dans le dashboard Supabase:
1. Aller dans **Authentication > URL Configuration**
2. Ajouter dans **Redirect URLs**:
   - `https://www.swipetonpro.fr/auth/reset-password`
   - `https://www.swipetonpro.fr/**`
   - `http://localhost:3000/auth/reset-password` (pour dev)

### Solution 3: Désactiver les emails Supabase

Dans le dashboard Supabase:
1. Aller dans **Authentication > Email Templates**
2. Désactiver le template "Reset Password" de Supabase
3. Forcer l'utilisation exclusive de Resend

## 🔧 Corrections à appliquer

### 1. Améliorer la gestion d'erreur dans l'API

Le code actuel ne log pas les erreurs Resend, ce qui rend le debugging difficile.

### 2. Ajouter un fallback plus robuste

Si Resend échoue, au lieu d'utiliser Supabase, on devrait:
- Logger l'erreur
- Retourner une erreur explicite
- Ne pas utiliser le fallback Supabase qui crée de la confusion

### 3. Vérifier la configuration du domaine

Le lien montre `www.swipetonpro.fr` mais le `.env.local` a plusieurs URLs:
```
NEXT_PUBLIC_SITE_URL=https://www.swipetonpro.fr
NEXT_PUBLIC_VERCEL_URL= www.swipetonpro.fr
NEXT_PUBLIC_VERCEL_URL= www.swipetonpro.com  # Doublon!
```

## 📝 Prochaines étapes

1. ✅ Vérifier que Resend fonctionne correctement
2. ✅ Améliorer le logging des erreurs
3. ✅ Configurer les redirect URLs dans Supabase
4. ✅ Tester le flux complet de réinitialisation
