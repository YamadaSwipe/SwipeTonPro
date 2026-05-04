import { GetServerSideProps } from 'next';

const STATIC_URLS = [
  '',
  '/professionnel',
  '/professionnel/inscription',
  '/professionnel/comment-ca-marche',
  '/particulier',
  '/particulier/create-account',
  '/particulier/diagnostic',
  '/particulier/comment-ca-marche',
  '/auth/login',
  '/auth/pro-signup',
  '/contact',
  '/faq',
  '/mentions-legales',
  '/cgv',
  '/politique-confidentialite',
];

function generateSiteMap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://swipetonpro.fr';
  
  const currentDate = new Date().toISOString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${STATIC_URLS.map((url) => `
  <url>
    <loc>${baseUrl}${url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${url === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${url === '' ? '1.0' : url.includes('inscription') ? '0.9' : '0.8'}</priority>
  </url>
  `).join('')}
</urlset>
`;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const sitemap = generateSiteMap();

  res.setHeader('Content-Type', 'text/xml');
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate');
  res.write(sitemap);
  res.end();

  return {
    props: {},
  };
};

export default function SiteMap() {
  // This component doesn't render anything
  return null;
}
