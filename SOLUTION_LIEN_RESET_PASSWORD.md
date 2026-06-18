# 🔍 SOLUTION - Lien de Réinitialisation Invalide/Expiré

## 📊 Problème Identifié

**Symptôme:** Le lien de réinitialisation reçu par email affiche "lien invalide ou expiré" quand on clique dessus.

**Cause racine:** Le lien généré par Supabase est un lien de **vérification** qui redirige vers votre site, mais il ne contient **PAS** de hash avec les tokens dans l'URL finale.

---

## 🔍 Analyse du Lien Généré

### Format du lien actuel:
```
https://qhuvnpmqlucpjdslnfui.supabase.co/auth/v1/verify?token=xxx&type=recovery&redirect_to=https://www.swipetonpro.fr/auth/reset-password
```

### Ce qui se passe:
1. ✅ L'utilisateur clique sur le lien dans l'email
2. ✅ Supabase vérifie le token
3. ✅ Supabase redirige vers `https://www.swipetonpro.fr/auth/reset-password`
4. ❌ **MAIS** la redirection ne contient PAS de hash avec `access_token` et `refresh_token`
5. ❌ La page `/auth/reset-password` ne trouve pas de session valide
6. ❌ Message d'erreur: "Ce lien de réinitialisation est invalide ou a expiré"

---

## 🎯 Solution

Le problème vient de la configuration Supabase Auth. Il faut que Supabase ajoute les tokens dans le hash lors de la redirection.

### Option 1: Vérifier la configuration Supabase Auth (RECOMMANDÉ)

1. **Aller dans le dashboard Supabase:**
   - URL: https://supabase.com/dashboard/project/qhuvnpmqlucpjdslnfui
   - Section: Authentication > URL Configuration

2. **Vérifier les paramètres:**
   - **Site URL:** `https://www.swipetonpro.fr`
   - **Redirect URLs:** Ajouter `https://www.swipetonpro.fr/auth/reset-password`
   - **Email Templates:** Vérifier que le template "Reset Password" utilise bien `{{ .ConfirmationURL }}`

3. **Vérifier le "Auth Flow":**
   - Dans Authentication > Settings
   - **Enable Email Confirmations:** Activé
   - **Secure email change:** Activé
   - **Enable email OTP:** Désactivé (pour utiliser les liens magiques)

### Option 2: Utiliser un lien magique au lieu de recovery

Modifier `src/pages/api/auth/reset-password.ts` pour utiliser `magiclink` au lieu de `recovery`:

```typescript
const { data, error } = await supabaseAdmin.auth.admin.generateLink({
  type: 'magiclink',  // Au lieu de 'recovery'
  email,
  options: {
    redirectTo: redirectUrl,
  },
});
```

### Option 3: Créer une page intermédiaire de vérification

Créer une page `/auth/verify-reset` qui:
1. Reçoit le token de Supabase
2. Échange le token contre une session
3. Redirige vers `/auth/reset-password` avec la session active

---

## 🔧 Solution Immédiate (Workaround)

En attendant de configurer Supabase correctement, voici une solution temporaire:

### 1. Créer une API pour échanger le token

**Fichier:** `src/pages/api/auth/exchange-reset-token.ts`

```typescript
import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, type } = req.body;

  if (!token || type !== 'recovery') {
    return res.status(400).json({ error: 'Token invalide' });
  }

  try {
    // Vérifier le token avec Supabase
    const { data, error } = await supabaseAdmin.auth.verifyOtp({
      token_hash: token,
      type: 'recovery',
    });

    if (error || !data.session) {
      return res.status(400).json({ error: 'Token invalide ou expiré' });
    }

    // Retourner la session
    return res.status(200).json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: data.user,
    });
  } catch (error: any) {
    console.error('Erreur exchange token:', error);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
```

### 2. Créer une page de vérification

**Fichier:** `src/pages/auth/verify-reset.tsx`

```typescript
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/integrations/supabase/client';

export default function VerifyResetPage() {
  const router = useRouter();

  useEffect(() => {
    const verifyToken = async () => {
      const { token, type } = router.query;

      if (!token || type !== 'recovery') {
        router.push('/auth/login?error=invalid_token');
        return;
      }

      try {
        // Échanger le token contre une session
        const response = await fetch('/api/auth/exchange-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, type }),
        });

        const data = await response.json();

        if (!response.ok) {
          router.push('/auth/login?error=token_expired');
          return;
        }

        // Créer la session côté client
        await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        });

        // Rediriger vers la page de reset
        router.push('/auth/reset-password');
      } catch (error) {
        console.error('Erreur vérification:', error);
        router.push('/auth/login?error=verification_failed');
      }
    };

    if (router.isReady) {
      verifyToken();
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
        <p>Vérification du lien de réinitialisation...</p>
      </div>
    </div>
  );
}
```

### 3. Modifier le redirect_to dans l'API

Dans `src/pages/api/auth/reset-password.ts`:

```typescript
function getRedirectUrl(req: NextApiRequest): string {
  return `${getHostBaseUrl(req)}/auth/verify-reset`;  // Au lieu de /auth/reset-password
}
```

---

## 🧪 Test de la Solution

1. **Demander un nouveau lien de réinitialisation**
2. **Cliquer sur le lien dans l'email**
3. **Vérifier que vous êtes redirigé vers `/auth/verify-reset`**
4. **Vérifier que la page échange le token et redirige vers `/auth/reset-password`**
5. **Vérifier que vous pouvez maintenant changer votre mot de passe**

---

## 📝 Recommandation Finale

**La meilleure solution à long terme est de configurer correctement Supabase Auth** pour qu'il ajoute automatiquement les tokens dans le hash lors de la redirection.

Cela nécessite:
1. Configuration correcte des URLs dans le dashboard Supabase
2. Vérification des templates d'email
3. Activation du bon "Auth Flow"

**En attendant, utilisez la solution workaround ci-dessus** qui crée une page intermédiaire pour échanger le token.

---

## 🔗 Liens Utiles

- [Supabase Auth - Password Recovery](https://supabase.com/docs/guides/auth/passwords#password-recovery)
- [Supabase Auth - Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Auth - Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)

---

**Date:** 18/06/2026 23:47  
**Développeur:** Assistant Full Stack Senior  
**Statut:** 🔍 PROBLÈME IDENTIFIÉ - SOLUTION PROPOSÉE
