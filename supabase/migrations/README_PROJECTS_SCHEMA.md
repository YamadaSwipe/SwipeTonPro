# Schéma de la table projects

## Structure complète de la table `projects`

```sql
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  location text NOT NULL,
  city text NOT NULL,
  postal_code text NOT NULL,
  estimated_budget_min integer,
  estimated_budget_max integer,
  desired_start_date date,
  photos text[] DEFAULT '{}',
  status project_status DEFAULT 'draft',
  ai_analysis jsonb,
  views_count integer DEFAULT 0,
  bids_count integer DEFAULT 0,
  surface DECIMAL(10,2), -- ✅ NOUVEAU
  property_type TEXT, -- ✅ NOUVEAU
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

## Colonnes ajoutées le 2026-03-02

### surface
- **Type**: DECIMAL(10,2)
- **Description**: Surface du projet en mètres carrés
- **Contrainte**: > 0
- **Index**: idx_projects_surface

### property_type
- **Type**: TEXT
- **Description**: Type de bien (Appartement, Maison, Studio, etc.)
- **Contrainte**: NOT NULL et != ''
- **Index**: idx_projects_property_type

## Types de données

### project_status
- `draft`
- `pending_validation`
- `published`
- `in_progress`
- `completed`
- `cancelled`

### property_type (valeurs attendues)
- "Appartement"
- "Maison"
- "Studio"
- "Villa"
- "Local commercial"
- "Garage"
- "Cave"
- "Autre"
