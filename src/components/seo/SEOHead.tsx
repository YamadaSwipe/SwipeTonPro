// SEO Component pour les pages dynamiques
import { Head } from 'next/document'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  noIndex?: boolean
  structuredData?: Record<string, any>
}

export function SEOHead({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = '/og-image.jpg',
  noIndex = false,
  structuredData,
}: SEOHeadProps) {
  const fullTitle = title ? `${title} | EDSwipe` : 'EDSwipe - Trouvez les meilleurs artisans pour vos travaux'
  
  return (
    <Head>
      {/* Meta tags de base */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || 'EDSwipe connecte les particuliers avec des artisans qualifiés. Obtenez des devis gratuits pour vos travaux.'} />
      <meta name="keywords" content={keywords.join(', ')} />
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={`https://edswipe.fr${canonical}`} />}
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || 'EDSwipe connecte les particuliers avec des artisans qualifiés.'} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={`https://edswipe.fr${canonical || '/'}`} />
      <meta property="og:image" content={`https://edswipe.fr${ogImage}`} />
      <meta property="og:site_name" content="EDSwipe" />
      <meta property="og:locale" content="fr_FR" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || 'EDSwipe connecte les particuliers avec des artisans qualifiés.'} />
      <meta name="twitter:image" content={`https://edswipe.fr${ogImage}`} />
      
      {/* Additional meta */}
      <meta name="author" content="EDSwipe" />
      <meta name="publisher" content="EDSwipe" />
      <meta name="theme-color" content="#3B82F6" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  )
}

// Structured Data pour les pages de projets
export function ProjectStructuredData(project: any) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": project.title,
    "description": project.description,
    "provider": {
      "@type": "LocalBusiness",
      "name": "EDSwipe",
      "url": "https://edswipe.fr"
    },
    "areaServed": {
      "@type": "Place",
      "name": `${project.city}, ${project.postal_code}`
    },
    "serviceType": project.category,
    "offers": {
      "@type": "Offer",
      "price": project.budget_max,
      "priceCurrency": "EUR"
    }
  }
}

// Structured Data pour les pages d'artisans
export function ProfessionalStructuredData(professional: any) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": professional.company_name,
    "description": professional.description,
    "url": `https://edswipe.fr/artisans/${professional.id}`,
    "telephone": professional.phone,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": professional.city,
      "postalCode": professional.postal_code,
      "addressCountry": "FR"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": professional.latitude,
      "longitude": professional.longitude
    },
    "aggregateRating": professional.rating ? {
      "@type": "AggregateRating",
      "ratingValue": professional.rating,
      "reviewCount": professional.review_count
    } : undefined,
    "serviceType": professional.specialities
  }
}

// Structured Data pour la page d'accueil
export function HomeStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "EDSwipe",
    "url": "https://edswipe.fr",
    "description": "EDSwipe connecte les particuliers avec des artisans qualifiés pour tous types de travaux de rénovation.",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://edswipe.fr/projets?search={search_term_string}",
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://www.facebook.com/edswipe",
      "https://www.twitter.com/edswipe",
      "https://www.linkedin.com/company/edswipe"
    ]
  }
}

// Structured Data pour les breadcrumbs
export function BreadcrumbStructuredData(breadcrumbs: Array<{name: string, url: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": breadcrumbs.map((crumb, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": crumb.name,
      "item": `https://edswipe.fr${crumb.url}`
    }))
  }
}

// Structured Data pour les FAQ
export function FAQStructuredData(faqs: Array<{question: string, answer: string}>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }
}

export default SEOHead
