# 🔍 Diagnostic - Boucle Infinie lors de la Connexion

## Problème Identifié

Le site bug lors de la connexion avec des messages en boucle infinie dans la console.

## Causes Identifiées

### 1. **Boucle Infinie dans `authService.ts` (ligne 322)**

```typescript
useEffect(() => {
  // ...
}, [fetchProfile, setLoading, setProfile, setUser]); // ❌ PROBLÈME ICI
```

**Problème** : Les dépendances incluent des fonctions `setState` qui changent à chaque render, causant une boucle infinie.

### 2. **Fonction `fetchProfile` non mémorisée**

La fonction `fetchProfile` est redéfinie à chaque render, ce qui déclenche le `useEffect` en boucle.

### 3. **Double système d'authentification**

- `AuthContext.tsx` : Système principal avec `useAuth()`
- `authService.ts` : Contient un autre hook `useAuth()` qui crée des conflits

## Solutions à Appliquer

### Solution 1 : Corriger les dépendances du useEffect
- Retirer `setLoading`, `setProfile`, `setUser` des dépendances
- Mémoriser `fetchProfile` avec `useCallback`

### Solution 2 : Nettoyer la subscription
- S'assurer que la subscription est bien nettoyée

### Solution 3 : Éviter les doubles hooks
- Utiliser uniquement `AuthContext` pour l'authentification
- Supprimer ou renommer le hook `useAuth()` dans `authService.ts`

## Fichiers Concernés

1. `src/services/authService.ts` - Ligne 322 (dépendances incorrectes)
2. `src/context/AuthContext.tsx` - Système principal OK
3. `src/pages/auth/login.tsx` - Utilise le bon contexte

## Impact

- ❌ Connexion bloquée
- ❌ Messages d'erreur en boucle dans la console
- ❌ Performance dégradée
- ❌ Expérience utilisateur cassée
