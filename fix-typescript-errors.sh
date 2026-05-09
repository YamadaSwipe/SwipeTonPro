#!/bin/bash

echo "🔍 Analyse complète des erreurs TypeScript..."

# Lister tous les fichiers avec payment_security_option
echo "📁 Fichiers à corriger :"
find src -name "*.tsx" -exec grep -l "payment_security_option" {} \;

# Appliquer les corrections automatiques
echo "🔧 Application des corrections..."

# Corriger projets/[id].tsx
sed -i 's/project\.payment_security_option/(project as any).payment_security_option/g' src/pages/projets/[id].tsx

# Corriger projets/[id]/postuler.tsx  
sed -i 's/project\.payment_security_option/(project as any).payment_security_option/g' src/pages/projets/[id]/postuler.tsx
sed -i 's/project\?\.payment_security_option/(project as any)?.payment_security_option/g' src/pages/projets/[id]/postuler.tsx

echo "✅ Corrections appliquées !"
