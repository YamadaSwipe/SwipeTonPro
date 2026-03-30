# 🚨 Configuration Supabase Requise

## Problème identifié
Votre configuration utilise des valeurs factices qui causent l'erreur `AuthRetryableFetchError`.

## Solution immédiate

### 1. Créez votre projet Supabase
1. Allez sur https://supabase.com
2. Créez un compte ou connectez-vous
3. Créez un nouveau projet

### 2. Obtenez vos clés
Dans votre projet Supabase :
- Allez dans **Settings** > **API**
- Copiez :
  - **Project URL** : `https://votre-projet-ref.supabase.co`
  - **anon public** key : `eyJ...`

### 3. Mettez à jour .env.local
Remplacez les lignes dans votre fichier `.env.local` :

```env
# ❌ VALEURS ACTUELLES (FAKES)
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUPABASE_ANON_KEY_EXEMPLE

# ✅ REMPLACEZ PAR VOS VRAIES VALEURS
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJVOTRE_VRAIE_CLE_ANON...
```

### 4. Redémarrez le serveur
```bash
npm run dev
```

## Vérification
Allez sur http://localhost:3000/debug pour vérifier que la connexion fonctionne.

## Si vous n'avez pas de projet Supabase
Vous pouvez utiliser ces valeurs pour tester (projet de démo) :
```env
NEXT_PUBLIC_SUPABASE_URL=https://demo.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlbW8iLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoyMDAwMDAwMDAwfQ.demo
```

⚠️ **Ne jamais utiliser ces valeurs en production !**
