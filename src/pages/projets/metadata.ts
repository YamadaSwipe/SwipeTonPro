import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Projets de Travaux - EDSwipe',
  description: 'Parcourez les projets de travaux publiés par les particuliers et trouvez des opportunités correspondant à vos compétences. Plomberie, électricité, rénovation, et plus.',
  keywords: [
    'projets travaux',
    'opportunités artisan',
    'devis travaux',
    'chantier disponible',
    'trouver chantier',
    'artisan indépendant',
    'travaux rénovation',
    'plomberie électricité',
    'chauffage climatisation',
    'menuiserie charpente',
    'maçonnerie carrelage',
    'peinture décoration',
    'couverture toiture',
    'France artisans',
  ],
  openGraph: {
    title: 'Projets de Travaux - EDSwipe',
    description: 'Parcourez les projets de travaux et trouvez des opportunités pour votre entreprise artisanale.',
    url: 'https://edswipe.fr/projets',
    images: ['/og-projets.jpg'],
  },
}

export default function ProjetsMetadata() {
  return null;
}
