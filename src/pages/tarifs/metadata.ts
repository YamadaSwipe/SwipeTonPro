import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tarifs - EDSwipe',
  description: 'Découvrez les tarifs EDSwipe pour les particuliers et les artisans. Accès gratuit pour les particuliers, commissions adaptées pour les professionnels.',
  keywords: [
    'tarifs edswipe',
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
    title: 'Tarifs - EDSwipe',
    description: 'Tarifs transparents et compétitifs pour les services EDSwipe. Gratuit pour les particuliers.',
    url: 'https://edswipe.fr/tarifs',
    images: ['/og-tarifs.jpg'],
  },
}

export default function TarifsMetadata() {
  return null;
}
