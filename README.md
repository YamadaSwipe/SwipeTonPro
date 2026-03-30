# SwipeTonPro 2.0

Marketplace BTP Haute Fidélité avec système de matching double-aveugle.

## 🎯 Concept

Plateforme de mise en relation entre particuliers et professionnels du BTP, avec protection maximale des deux parties via un système de matching double-aveugle. Aucun contact direct n'est possible sans validation mutuelle et paiement sécurisé.

## ✨ Fonctionnalités Principales

### Pour les Particuliers
- **Diagnostic Conversationnel IA**: Interface step-by-step pour qualifier le projet
- **Upload Photos Obligatoire**: Analyse automatique de la zone de travaux
- **Quadrillage IA**: Simulation technique si la zone n'est pas claire
- **Estimation Haute Sécurité**: Fourchette de prix avec +25% pour imprévus
- **Dashboard de Candidatures**: Consultation des portfolios anonymisés des pros
- **Protection Totale**: Coordonnées masquées jusqu'au match validé

### Pour les Professionnels
- **Onboarding Certifié**: Vérification SIRET + Assurance Décennale
- **Badge "Certifié IA"**: Validation automatique des documents
- **Flux de Chantiers**: Projets anonymisés avec photos quadrillées
- **Système de Crédits**: 1 crédit = 1 candidature
- **Portfolio Protégé**: Masquage auto des logos/numéros avant match
- **Dashboard Pro**: Gestion des candidatures et statistiques

## 🔒 Système Double-Aveugle

1. **Phase 1 - Publication**: Projet anonymisé publié sur le flux pros
2. **Phase 2 - Candidature**: Pro utilise 1 crédit pour postuler
3. **Phase 3 - Review**: Particulier consulte portfolio anonymisé
4. **Phase 4 - Match**: Validation mutuelle requise
5. **Phase 5 - Paiement**: Transaction sécurisée via Stripe
6. **Phase 6 - Déverrouillage**: Coordonnées complètes échangées

## 🛠️ Stack Technique

- **Frontend**: Next.js 15.2 (Pages Router) + React 18
- **Styling**: Tailwind CSS v3 + Shadcn/UI
- **Backend**: Supabase (Auth + Database + Storage)
- **Paiements**: Stripe (à intégrer)
- **IA**: OpenAI Vision API (analyse photos - à intégrer)
- **Design**: Mobile-first, style FinTech premium

## 📁 Structure du Projet

```
src/
├── components/
│   ├── ui/              # Composants Shadcn/UI
│   ├── SEO.tsx          # Gestion SEO
│   ├── ProtectedRoute.tsx
│   └── LoadingSpinner.tsx
├── pages/
│   ├── index.tsx        # Landing page
│   ├── particulier/
│   │   ├── index.tsx    # Espace particulier
│   │   ├── diagnostic.tsx  # Tunnel de qualification
│   │   └── dashboard.tsx   # Gestion candidatures
│   └── professionnel/
│       ├── index.tsx    # Espace pro
│       ├── inscription.tsx # Onboarding certifié
│       └── dashboard.tsx   # Flux de chantiers
├── lib/
│   ├── api.ts           # Fonctions API Supabase
│   ├── imageProcessing.ts  # Analyse IA photos
│   └── validation.ts    # Validations formulaires
└── styles/
    └── globals.css      # Styles globaux + variables
```

## 🚀 Installation

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev

# Ouvrir http://localhost:3000
```

## 🔐 Configuration Supabase (À faire)

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Configurer les tables:
   - `users` (auth)
   - `pro_profiles`
   - `particulier_profiles`
   - `projects`
   - `candidatures`
   - `transactions`
3. Ajouter les variables d'environnement dans `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 💳 Configuration Stripe (À faire)

```env
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_key
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

## 🤖 Configuration IA (À faire)

```env
OPENAI_API_KEY=your_openai_key
```

## 📋 Roadmap

- [x] Landing page + Navigation
- [x] Tunnel diagnostic particulier
- [x] Onboarding professionnel
- [x] Dashboards particulier/pro
- [ ] Intégration Supabase Auth
- [ ] Système de crédits avec recharge
- [ ] Analyse IA des photos (OpenAI Vision)
- [ ] Anonymisation automatique portfolios
- [ ] Paiements Stripe
- [ ] Notifications email
- [ ] Système d'avis clients
- [ ] Panel admin de modération

## 🎨 Design System

**Couleurs:**
- Primary: #2563EB (Bleu pro)
- Accent: #8B5CF6 (Violet premium)
- Success: #10B981 (Vert certification)
- Warning: #F59E0B (Orange attention)
- Error: #EF4444 (Rouge rejet)

**Typographie:**
- Headings: Inter Bold (700-800)
- Body: Inter Regular/Medium (400-500)
- Mono: JetBrains Mono (code/stats)

**Spacing:**
- Mobile: 4/6/8
- Desktop: 6/8/12/16

## 📄 Licence

Propriétaire - SwipeTonPro 2.0 © 2026