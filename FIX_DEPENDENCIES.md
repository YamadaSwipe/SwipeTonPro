# Correction Dépendances Manquantes

## Problèmes identifiés
1. `suppressHydrationWarning` n'existe pas dans Next.js 15.5.7
2. `@opentelemetry/api` module manquant

## Solutions

### 1. Installer les dépendances manquantes
```bash
npm install @opentelemetry/api
```

### 2. Configuration Next.js nettoyée
- Retrait de `suppressHydrationWarning`
- Configuration minimale et stable

### 3. Procédure de nettoyage complète
```bash
# Arrêter le serveur
Ctrl+C

# Supprimer node_modules et .next
rm -rf node_modules .next

# Réinstaller les dépendances
npm install

# Redémarrer
npm run dev
```
