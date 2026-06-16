# 🗺️ Guide de Recherche Géographique - SwipeTonPro

## 📋 Vue d'ensemble

Ce guide explique comment utiliser le système de recherche géographique optimisé pour filtrer les artisans et les chantiers par distance.

## 🎯 Fonctionnalités implémentées

### ✅ Ce qui a été fait

1. **Migration SQL avec PostGIS** (`supabase/migrations/20260616140000_optimize_geo_search.sql`)
   - Activation de l'extension PostGIS pour des calculs géographiques optimisés
   - Ajout de colonnes `location_point` (GEOGRAPHY) pour stockage optimisé
   - Index spatiaux GIST pour des recherches ultra-rapides
   - Triggers automatiques pour synchroniser latitude/longitude avec location_point

2. **Fonctions SQL optimisées**
   - `find_nearby_professionals(project_id, radius_km, limit)` - Trouve les artisans près d'un projet
   - `find_nearby_projects(professional_id, radius_km, limit)` - Trouve les projets près d'un artisan
   - `search_by_postal_code(postal_code, radius_km, type)` - Recherche par code postal
   - `calculate_distance(lat1, lon1, lat2, lon2)` - Calcul de distance Haversine (fallback)

3. **API REST** (`src/pages/api/geo-search.ts`)
   - Endpoint `/api/geo-search` pour toutes les recherches géographiques
   - Support de multiples modes de recherche

4. **Service TypeScript** (`src/services/optimizedGeoService.ts`)
   - Service réutilisable pour l'application
   - Gestion automatique du fallback si PostGIS n'est pas disponible

## 🚀 Utilisation

### 1. Appliquer la migration SQL

```bash
# Si vous utilisez Supabase CLI
supabase db push

# Ou exécutez directement le fichier SQL dans votre base de données
psql -h votre-host -U votre-user -d votre-db -f supabase/migrations/20260616140000_optimize_geo_search.sql
```

### 2. Utiliser l'API REST

#### Rechercher les artisans près d'un projet

```typescript
const response = await fetch('/api/geo-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'professionals',
    projectId: 'uuid-du-projet',
    radiusKm: 50,  // Rayon en kilomètres
    limit: 20      // Nombre max de résultats
  })
});

const { success, data, count } = await response.json();
// data contient les artisans avec leur distance
```

#### Rechercher les projets près d'un artisan

```typescript
const response = await fetch('/api/geo-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'projects',
    professionalId: 'uuid-du-professionnel',
    radiusKm: 30,
    limit: 10
  })
});
```

#### Rechercher par code postal

```typescript
const response = await fetch('/api/geo-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'professionals', // ou 'projects'
    postalCode: '75001',
    radiusKm: 25
  })
});
```

#### Rechercher par coordonnées GPS

```typescript
const response = await fetch('/api/geo-search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'professionals',
    latitude: 48.8566,
    longitude: 2.3522,
    radiusKm: 40
  })
});
```

### 3. Utiliser le service TypeScript

```typescript
import { optimizedGeoService } from '@/services/optimizedGeoService';

// Rechercher les artisans près d'un projet
const { professionals, error } = await optimizedGeoService.findProfessionalsNearProject(
  projectId,
  { radiusKm: 50, limit: 20 }
);

// Rechercher les projets près d'un artisan
const { projects, error } = await optimizedGeoService.findProjectsNearProfessional(
  professionalId,
  { radiusKm: 30, limit: 10 }
);

// Rechercher par code postal
const { results, error } = await optimizedGeoService.searchByPostalCode(
  '75001',
  'professionals',
  { radiusKm: 25 }
);

// Rechercher par coordonnées GPS
const { results, error } = await optimizedGeoService.searchByCoordinates(
  48.8566,
  2.3522,
  'professionals',
  { radiusKm: 40, limit: 15 }
);
```

### 4. Utiliser directement les fonctions SQL

```sql
-- Trouver les artisans dans un rayon de 30km autour d'un projet
SELECT * FROM find_nearby_professionals(
  'uuid-du-projet'::UUID,
  30.0,  -- rayon en km
  20     -- limite de résultats
);

-- Trouver les projets dans un rayon de 50km autour d'un artisan
SELECT * FROM find_nearby_projects(
  'uuid-du-professionnel'::UUID,
  50.0,
  15
);

-- Rechercher par code postal
SELECT * FROM search_by_postal_code(
  '75001',
  25.0,
  'professionals'  -- ou 'projects'
);
```

## 📊 Structure des données retournées

### Professionnels avec distance

```typescript
{
  professional_id: string;
  user_id: string;
  company_name: string;
  distance_km: number;        // Distance en kilomètres (arrondie à 1 décimale)
  within_coverage: boolean;   // Dans le rayon de couverture du pro
  score: number;              // Score de matching (0-100)
}
```

### Projets avec distance

```typescript
{
  project_id: string;
  title: string;
  category: string;
  city: string;
  postal_code: string;
  distance_km: number;
  within_coverage: boolean;
}
```

## ⚙️ Configuration

### Rayon de couverture par défaut

Le rayon de couverture est défini dans la table `professionals` :

```sql
-- Mettre à jour le rayon de couverture d'un artisan
UPDATE professionals 
SET coverage_radius = 75  -- en kilomètres
WHERE id = 'uuid-du-professionnel';
```

### Géocodage des codes postaux

Le service inclut une base de données simplifiée des codes postaux français. Pour une solution production complète, intégrez l'API gouvernementale :

```typescript
// Exemple d'intégration avec api-adresse.data.gouv.fr
async function geocodePostalCode(postalCode: string) {
  const response = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${postalCode}&type=municipality&limit=1`
  );
  const data = await response.json();
  
  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].geometry.coordinates;
    return { latitude: lat, longitude: lng };
  }
  
  return null;
}
```

## 🔧 Optimisations

### Index spatiaux

Les index GIST sur `location_point` permettent des recherches très rapides :

```sql
-- Vérifier les index
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('profiles', 'projects');
```

### Triggers automatiques

Les coordonnées sont automatiquement synchronisées :

```sql
-- Lors de l'insertion ou mise à jour de latitude/longitude,
-- location_point est automatiquement calculé
UPDATE profiles 
SET latitude = 48.8566, longitude = 2.3522 
WHERE id = 'uuid';
-- location_point est mis à jour automatiquement !
```

## 📈 Performance

### Avec PostGIS (recommandé)

- ✅ Recherche spatiale native ultra-rapide
- ✅ Index GIST optimisés
- ✅ Calculs géographiques précis
- ✅ Support de millions d'enregistrements

### Sans PostGIS (fallback)

- ⚠️ Calcul Haversine en PL/pgSQL
- ⚠️ Index B-tree sur latitude/longitude
- ⚠️ Performance correcte jusqu'à ~100k enregistrements

## 🧪 Tests

### Test de la fonction SQL

```sql
-- Créer un projet de test
INSERT INTO projects (id, title, category, city, postal_code, latitude, longitude, status)
VALUES (
  gen_random_uuid(),
  'Test Plomberie',
  'Plomberie',
  'Paris',
  '75001',
  48.8566,
  2.3522,
  'published'
);

-- Tester la recherche
SELECT * FROM find_nearby_professionals(
  (SELECT id FROM projects WHERE title = 'Test Plomberie'),
  50.0,
  10
);
```

### Test de l'API

```bash
# Test avec curl
curl -X POST http://localhost:3000/api/geo-search \
  -H "Content-Type: application/json" \
  -d '{
    "type": "professionals",
    "postalCode": "75001",
    "radiusKm": 30
  }'
```

## 🐛 Dépannage

### PostGIS n'est pas disponible

Si l'extension PostGIS n'est pas disponible, le système utilise automatiquement le fallback avec `calculate_distance()`.

```sql
-- Vérifier si PostGIS est installé
SELECT * FROM pg_extension WHERE extname = 'postgis';

-- Si vide, le fallback sera utilisé automatiquement
```

### Coordonnées manquantes

```sql
-- Vérifier les profils sans coordonnées
SELECT id, city, postal_code 
FROM profiles 
WHERE latitude IS NULL OR longitude IS NULL;

-- Mettre à jour manuellement
UPDATE profiles 
SET latitude = 48.8566, longitude = 2.3522 
WHERE postal_code = '75001' AND latitude IS NULL;
```

### Performance lente

```sql
-- Vérifier les index
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'projects')
  AND indexname LIKE '%location%';

-- Analyser les statistiques
ANALYZE profiles;
ANALYZE projects;
```

## 📚 Ressources

- [PostGIS Documentation](https://postgis.net/documentation/)
- [API Adresse Data Gouv](https://adresse.data.gouv.fr/api-doc/adresse)
- [Formule de Haversine](https://fr.wikipedia.org/wiki/Formule_de_haversine)

## 🎓 Exemples d'intégration

### Dans un composant React

```typescript
import { useState, useEffect } from 'react';
import { optimizedGeoService } from '@/services/optimizedGeoService';

function NearbyProfessionals({ projectId }: { projectId: string }) {
  const [professionals, setProfessionals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfessionals() {
      const { professionals, error } = await optimizedGeoService
        .findProfessionalsNearProject(projectId, { radiusKm: 50 });
      
      if (!error) {
        setProfessionals(professionals);
      }
      setLoading(false);
    }
    
    loadProfessionals();
  }, [projectId]);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h2>Artisans à proximité</h2>
      {professionals.map(pro => (
        <div key={pro.professional_id}>
          <h3>{pro.company_name}</h3>
          <p>Distance: {pro.distance_km} km</p>
          <p>Score: {pro.score}/100</p>
        </div>
      ))}
    </div>
  );
}
```

### Dans une API Next.js

```typescript
// pages/api/projects/[id]/nearby-professionals.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { optimizedGeoService } from '@/services/optimizedGeoService';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const { radiusKm = 50 } = req.body;

  const { professionals, error } = await optimizedGeoService
    .findProfessionalsNearProject(id as string, { radiusKm });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ professionals });
}
```

## ✅ Checklist de déploiement

- [ ] Appliquer la migration SQL
- [ ] Vérifier que PostGIS est activé (ou accepter le fallback)
- [ ] Mettre à jour les coordonnées existantes
- [ ] Tester les fonctions SQL
- [ ] Tester l'API REST
- [ ] Intégrer dans l'interface utilisateur
- [ ] Configurer le géocodage des codes postaux
- [ ] Monitorer les performances

## 🎉 Conclusion

Le système de recherche géographique est maintenant opérationnel et optimisé. Il utilise PostGIS quand disponible pour des performances maximales, avec un fallback automatique sur le calcul Haversine.

**Prochaines étapes recommandées :**
1. Intégrer l'API gouvernementale pour le géocodage complet
2. Ajouter un cache Redis pour les recherches fréquentes
3. Implémenter des filtres avancés (spécialités, budget, etc.)
4. Créer des composants UI réutilisables pour l'affichage des résultats
