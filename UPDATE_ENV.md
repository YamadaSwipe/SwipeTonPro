# 📋 Mettre à jour votre configuration Supabase

## Étape 1: Récupérez vos clés sur Supabase

1. Allez sur https://supabase.com/dashboard
2. Sélectionnez votre projet
3. Allez dans **Settings** > **API**
4. Copiez ces deux valeurs:
   - **Project URL** : `https://votre-projet-ref.supabase.co`
   - **anon public** key : `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Étape 2: Mettez à jour .env.local

Ouvrez votre fichier `.env.local` et remplacez les lignes actuelles:

```env
# ❌ LIGNES À REMPLACER
NEXT_PUBLIC_SUPABASE_URL=https://xyzcompany.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.SUPABASE_ANON_KEY_EXEMPLE

# ✅ REMPLACEZ PAR VOS VRAIES VALEURS
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE_PROJET_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJVOTRE_VRAIE_CLE_ANON...
```

## Étape 3: Vérification

Après modification, redémarrez le serveur:
```bash
npm run dev
```

Puis allez sur http://localhost:3000/debug pour vérifier la connexion.

## Exemple de configuration correcte

```env
NEXT_PUBLIC_SUPABASE_URL=https://abc123def456.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiYzEyM2RlZjQ1NiIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjAwMDAwMDAwLCJleHAiOjIwMDAwMDAwMDB9.abc123def456
```

## Si vous avez besoin d'aide

Donnez-moi vos vraies valeurs et je vous aiderai à mettre à jour le fichier !
