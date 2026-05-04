import Head from 'next/head';
import { useRouter } from 'next/router';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown>;
  keywords?: string[];
  type?: 'website' | 'article' | 'organization' | 'localBusiness';
}

const DEFAULT_SITE_NAME = 'SwipeTonPro';
const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://swipetonpro.fr';

// Generate JSON-LD structured data
function generateJsonLd(type: string, data: Record<string, unknown>) {
  const baseSchema = {
    '@context': 'https://schema.org',
    '@type': type,
  };
  return { ...baseSchema, ...data };
}

// SEO component for use in pages
export function SEO({
  title = 'SwipeTonPro - Marketplace BTP',
  description = 'Trouvez les meilleurs professionnels du BTP pour vos projets de rénovation et construction. Devis gratuit, mise en relation rapide.',
  image = '/og-image.png',
  url,
  noindex = false,
  jsonLd,
  keywords = [
    'professionnels BTP',
    'rénovation',
    'construction',
    'artisans',
    'devis',
    'chantier',
  ],
  type = 'website',
}: SEOProps) {
  const router = useRouter();
  const canonicalUrl =
    url || `${DEFAULT_BASE_URL}${router.asPath === '/' ? '' : router.asPath}`;
  const fullTitle = title.includes(DEFAULT_SITE_NAME)
    ? title
    : `${title} | ${DEFAULT_SITE_NAME}`;
  const fullImage = image.startsWith('http')
    ? image
    : `${DEFAULT_BASE_URL}${image}`;

  // Default Organization JSON-LD
  const organizationJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'SwipeTonPro',
    url: DEFAULT_BASE_URL,
    logo: `${DEFAULT_BASE_URL}/logo.png`,
    description: 'Marketplace BTP connectant particuliers et professionnels',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'contact@swipetonpro.fr',
    },
    sameAs: [
      'https://www.linkedin.com/company/swipetonpro',
      'https://twitter.com/swipetonpro',
    ],
  };

  const finalJsonLd = jsonLd || organizationJsonLd;

  return (
    <Head>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(', ')} />
      <meta
        name="robots"
        content={noindex ? 'noindex,nofollow' : 'index,follow'}
      />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

      {/* Open Graph / Facebook */}
      <meta property="og:site_name" content={DEFAULT_SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:url" content={canonicalUrl} />
      <meta
        property="og:type"
        content={type === 'article' ? 'article' : 'website'}
      />
      <meta property="og:locale" content="fr_FR" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@swipetonpro" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />

      {/* Viewport & Theme */}
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1, maximum-scale=5"
      />
      <meta name="theme-color" content="#f97316" />

      {/* Structured Data / JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finalJsonLd),
        }}
      />

      {/* Preconnect for performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin="anonymous"
      />
    </Head>
  );
}

// Backward compatibility - export SEOElements
export function SEOElements(props: SEOProps) {
  return <SEO {...props} />;
}
