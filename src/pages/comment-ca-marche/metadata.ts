import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Comment ça Marche - EDSwipe',
  description: 'Découvrez comment EDSwipe fonctionne : créez votre projet, recevez des devis d\'artisans qualifiés, et choisissez le meilleur professionnel pour vos travaux.',
  keywords: [
    'comment fonctionne edswipe',
    'guide utilisation',
    'trouver artisan',
    'obtenir devis',
    'processus travaux',
    'étapes projet',
    'sélection artisan',
    'devis en ligne',
    'comparaison artisans',
    'travaux simplifiés',
  ],
  openGraph: {
    title: 'Comment ça Marche - EDSwipe',
    description: 'Le processus simple pour trouver le meilleur artisan pour vos travaux avec EDSwipe.',
    url: 'https://edswipe.fr/comment-ca-marche',
    images: ['/og-comment-ca-marche.jpg'],
  },
}

export default function CommentCaMarcheMetadata() {
  return null;
}
