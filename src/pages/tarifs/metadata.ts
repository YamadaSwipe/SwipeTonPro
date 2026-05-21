import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs - SwipeTonPro',
  description: 'Découvrez les tarifs SwipeTonPro pour les particuliers et les artisans. Accès gratuit pour les particuliers, commissions adaptées pour les professionnels.',
  keywords: [
    'tarifs SwipeTonPro',
    'prix services',
    'coût plateforme',
    'gratuit particulier',
    'commission artisan',
    'abonnement professionnel',
    'tarifs compétitifs',
    'rapport qualité prix',
    'transparence prix',
    'sans engagement',
  ],
  openGraph: {
    title: 'Tarifs - SwipeTonPro',
    description: 'Tarifs transparents et compétitifs pour les services SwipeTonPro. Gratuit pour les particuliers.',
    url: 'https://SwipeTonPro.fr/tarifs',
    images: ['/og-tarifs.jpg'],
  },
}

export default function TarifsMetadata() {
  return null;
}
