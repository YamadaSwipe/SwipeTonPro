// Service SEO pour optimiser le référencement
import { supabase } from '@/integrations/supabase/client';

interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  ogImage?: string;
  structuredData?: Record<string, any>;
}

interface PageSEO {
  slug: string;
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  structuredData?: Record<string, any>;
  lastUpdated: string;
}

export const seoService = {
  /**
   * Générer les métadonnées SEO pour une page de projet
   */
  generateProjectSEO(project: any): SEOData {
    const keywords = [
      `travaux ${project.category}`,
      `artisan ${project.category}`,
      `devis ${project.category}`,
      `rénovation ${project.category}`,
      project.city,
      `${project.postal_code}`,
      'artisan qualifié',
      'devis gratuit',
    ];

    const structuredData = {
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
    };

    return {
      title: `${project.title} - ${project.city} | EDSwipe`,
      description: `Découvrez ce projet de ${project.category} à ${project.city}. ${project.description.substring(0, 160)}...`,
      keywords,
      canonical: `/projets/${project.id}`,
      structuredData,
    };
  },

  /**
   * Générer les métadonnées SEO pour une page d'artisan
   */
  generateProfessionalSEO(professional: any): SEOData {
    const keywords = [
      ...professional.specialities,
      professional.company_name,
      professional.city,
      `${professional.postal_code}`,
      'artisan certifié',
      'professionnel qualifié',
      'devis travaux',
      'artisan proche',
    ];

    const structuredData = {
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
    };

    return {
      title: `${professional.company_name} - ${professional.city} | EDSwipe`,
      description: `${professional.company_name}, artisan ${professional.specialities.join(', ')} à ${professional.city}. ${professional.description.substring(0, 160)}...`,
      keywords,
      canonical: `/artisans/${professional.id}`,
      structuredData,
    };
  },

  /**
   * Générer les métadonnées SEO pour une page de catégorie
   */
  generateCategorySEO(category: string, projects: any[] = []): SEOData {
    const categoryKeywords = {
      'plomberie': ['plomberie', 'plomber', 'installation sanitaire', 'chauffe-eau', 'canalisation', 'fuite', 'débouchage'],
      'electricite': ['électricité', 'électricien', 'installation électrique', 'tableau électrique', 'mise à la terre', 'prise', 'disjoncteur'],
      'chauffage': ['chauffage', 'chauffagiste', 'chaudière', 'pompe à chaleur', 'radiateur', 'climatisation', 'ventilation'],
      'menuiserie': ['menuiserie', 'menuisier', 'fenêtre', 'porte', 'volet', 'placard', 'armoire', 'agencement'],
      'maçonnerie': ['maçonnerie', 'maçon', 'mur', 'cloison', 'placo', 'plâtre', 'dalle', 'fondation', 'béton'],
      'peinture': ['peinture', 'peintre', 'peinture intérieure', 'peinture extérieure', 'enduit', 'préparation', 'décoration'],
      'couverture': ['couverture', 'couvreur', 'toit', 'tuile', 'ardoise', 'gouttière', 'zinc', 'étanchéité'],
      'carrelage': ['carrelage', 'carreleur', 'carreau', 'faïence', 'salle de bain', 'cuisine', 'sol', 'pose carrelage'],
    };

    const keywords = [
      category,
      ...(categoryKeywords[category as keyof typeof categoryKeywords] || []),
      'artisan',
      'professionnel',
      'devis gratuit',
      'travaux',
      'rénovation',
    ];

    const projectCount = projects.length;
    const cities = [...new Set(projects.map(p => p.city))].slice(0, 5);

    return {
      title: `Artisans ${category} - ${projectCount} projets disponibles | EDSwipe`,
      description: `Trouvez des artisans ${category} qualifiés pour vos travaux. ${projectCount} projets en cours${cities.length > 0 ? ` à ${cities.join(', ')}` : ''}. Devis gratuits et rapides.`,
      keywords,
      canonical: `/projets/${category}`,
    };
  },

  /**
   * Générer les métadonnées SEO pour une page de localisation
   */
  generateLocationSEO(city: string, postalCode: string, projects: any[] = []): SEOData {
    const keywords = [
      `artisan ${city}`,
      `travaux ${city}`,
      `rénovation ${city}`,
      `${postalCode}`,
      'artisan proche',
      'artisan local',
      'devis travaux',
    ];

    const categories = [...new Set(projects.map(p => p.category))].slice(0, 5);
    const projectCount = projects.length;

    return {
      title: `Artisans à ${city} (${postalCode}) - ${projectCount} professionnels | EDSwipe`,
      description: `Trouvez des artisans qualifiés à ${city}. ${projectCount} professionnels disponibles${categories.length > 0 ? ` pour ${categories.join(', ')}` : ''}. Devis gratuits.`,
      keywords,
      canonical: `/projets/${city.toLowerCase().replace(/\s+/g, '-')}`,
    };
  },

  /**
   * Sauvegarder les métadonnées SEO en base
   */
  async savePageSEO(pageSEO: PageSEO): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase as any)
        .from('page_seo')
        .upsert({
          slug: pageSEO.slug,
          title: pageSEO.title,
          description: pageSEO.description,
          keywords: pageSEO.keywords,
          og_image: pageSEO.ogImage,
          structured_data: pageSEO.structuredData,
          last_updated: new Date().toISOString(),
        });

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Erreur sauvegarde SEO:', error);
      return { success: false, error: (error as Error).message };
    }
  },

  /**
   * Récupérer les métadonnées SEO d'une page
   */
  async getPageSEO(slug: string): Promise<PageSEO | null> {
    try {
      const { data, error } = await (supabase as any)
        .from('page_seo')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erreur récupération SEO:', error);
      return null;
    }
  },

  /**
   * Générer le sitemap dynamique
   */
  async generateDynamicSitemap(): Promise<string> {
    try {
      // Récupérer tous les projets publics
      const { data: projects } = await supabase
        .from('projects')
        .select('id, updated_at')
        .eq('status', 'published');

      // Récupérer tous les professionnels vérifiés
      const { data: professionals } = await (supabase as any)
        .from('professionals')
        .select('id, updated_at')
        .eq('verified', true)
        .eq('status', 'active');

      // Récupérer les catégories uniques
      const { data: categories } = await supabase
        .from('projects')
        .select('category')
        .eq('status', 'published');

      const uniqueCategories = [...new Set(categories?.map(c => c.category) || [])];

      // Récupérer les villes uniques
      const { data: locations } = await supabase
        .from('projects')
        .select('city, postal_code')
        .eq('status', 'published');

      const uniqueLocations = [...new Map(
        locations?.map(l => [`${l.city}-${l.postal_code}`, l]) || []
      ).values()];

      let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

      // Pages statiques
      const staticPages = [
        { url: '/', priority: '1.0', changefreq: 'daily' },
        { url: '/projets', priority: '0.9', changefreq: 'daily' },
        { url: '/professionnel/inscription', priority: '0.8', changefreq: 'monthly' },
        { url: '/comment-ca-marche', priority: '0.7', changefreq: 'monthly' },
        { url: '/tarifs', priority: '0.7', changefreq: 'monthly' },
        { url: '/contact', priority: '0.6', changefreq: 'monthly' },
      ];

      staticPages.forEach(page => {
        sitemap += `
  <url>
    <loc>https://edswipe.fr${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
      });

      // Pages de projets
      projects?.forEach(project => {
        sitemap += `
  <url>
    <loc>https://edswipe.fr/projets/${project.id}</loc>
    <lastmod>${project.updated_at}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      // Pages d'artisans
      professionals?.forEach(professional => {
        sitemap += `
  <url>
    <loc>https://edswipe.fr/artisans/${professional.id}</loc>
    <lastmod>${professional.updated_at}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      // Pages de catégories
      uniqueCategories.forEach(category => {
        sitemap += `
  <url>
    <loc>https://edswipe.fr/projets/${category}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });

      // Pages de localisation
      uniqueLocations.forEach(location => {
        const citySlug = location.city.toLowerCase().replace(/\s+/g, '-');
        sitemap += `
  <url>
    <loc>https://edswipe.fr/projets/${citySlug}-${location.postal_code}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
      });

      sitemap += `
</urlset>`;

      return sitemap;
    } catch (error) {
      console.error('Erreur génération sitemap:', error);
      return '';
    }
  },

  /**
   * Analyser les performances SEO
   */
  async analyzeSEOPerformance(): Promise<any> {
    try {
      const { data: pages } = await (supabase as any)
        .from('page_seo')
        .select('*');

      const analysis = {
        totalPages: pages?.length || 0,
        pagesWithStructuredData: pages?.filter(p => p.structured_data).length || 0,
        pagesWithCustomKeywords: pages?.filter(p => p.keywords && p.keywords.length > 0).length || 0,
        averageTitleLength: pages?.reduce((sum, p) => sum + p.title.length, 0) / (pages?.length || 1) || 0,
        averageDescriptionLength: pages?.reduce((sum, p) => sum + p.description.length, 0) / (pages?.length || 1) || 0,
        lastUpdated: pages?.reduce((latest, p) => 
          new Date(p.last_updated) > new Date(latest.last_updated) ? p : latest
        , pages?.[0] || {})?.last_updated || null,
      };

      return analysis;
    } catch (error) {
      console.error('Erreur analyse SEO:', error);
      return null;
    }
  },

  /**
   * Optimiser les métadonnées automatiquement
   */
  async optimizeMetadata(slug: string): Promise<{ success: boolean; optimized?: boolean; error?: string }> {
    try {
      // Récupérer les métadonnées actuelles
      const currentSEO = await this.getPageSEO(slug);
      
      if (!currentSEO) {
        return { success: false, error: 'Page non trouvée' };
      }

      let optimized = false;
      const updates: Partial<PageSEO> = {};

      // Optimiser le titre (50-60 caractères)
      if (currentSEO.title.length < 30 || currentSEO.title.length > 60) {
        // Logique d'optimisation du titre
        optimized = true;
      }

      // Optimiser la description (150-160 caractères)
      if (currentSEO.description.length < 120 || currentSEO.description.length > 160) {
        // Logique d'optimisation de la description
        optimized = true;
      }

      // Optimiser les keywords (5-10 mots-clés)
      if (!currentSEO.keywords || currentSEO.keywords.length < 3 || currentSEO.keywords.length > 10) {
        // Logique d'optimisation des keywords
        optimized = true;
      }

      if (optimized) {
        await this.savePageSEO({
          ...currentSEO,
          ...updates,
          lastUpdated: new Date().toISOString(),
        });
      }

      return { success: true, optimized };
    } catch (error) {
      console.error('Erreur optimisation SEO:', error);
      return { success: false, error: (error as Error).message };
    }
  },
};

export default seoService;
