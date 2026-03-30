-- Table pour les métadonnées SEO des pages
CREATE TABLE IF NOT EXISTS page_seo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  og_image TEXT,
  structured_data JSONB,
  no_index BOOLEAN DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_page_seo_slug ON page_seo(slug);
CREATE INDEX IF NOT EXISTS idx_page_seo_last_updated ON page_seo(last_updated);
CREATE INDEX IF NOT EXISTS idx_page_seo_no_index ON page_seo(no_index);

-- Table pour les logs de performance SEO
CREATE TABLE IF NOT EXISTS seo_performance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'page_speed', 'core_web_vitals', 'mobile_friendly', etc.
  metric_value NUMERIC,
  metric_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les mots-clés et leur performance
CREATE TABLE IF NOT EXISTS keyword_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  search_volume INTEGER DEFAULT 0,
  competition_level TEXT DEFAULT 'medium', -- 'low', 'medium', 'high'
  ranking_position INTEGER,
  click_through_rate NUMERIC DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour le suivi des backlinks
CREATE TABLE IF NOT EXISTS backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,
  anchor_text TEXT,
  link_type TEXT DEFAULT 'external', -- 'external', 'internal', 'nofollow'
  domain_authority INTEGER DEFAULT 0,
  page_authority INTEGER DEFAULT 0,
  discovered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_checked TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour l'analyse des concurrents
CREATE TABLE IF NOT EXISTS competitor_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name TEXT NOT NULL,
  competitor_url TEXT NOT NULL,
  target_keywords TEXT[] DEFAULT '{}',
  ranking_data JSONB,
  backlink_count INTEGER DEFAULT 0,
  domain_authority INTEGER DEFAULT 0,
  estimated_traffic INTEGER DEFAULT 0,
  last_analyzed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security)
ALTER TABLE page_seo ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE keyword_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE backlinks ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_analysis ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour page_seo
CREATE POLICY "Anyone can view page SEO" ON page_seo
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage page SEO" ON page_seo
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Politiques RLS pour les autres tables (lecture publique, écriture admin)
CREATE POLICY "Anyone can view SEO performance logs" ON seo_performance_logs
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage SEO performance logs" ON seo_performance_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can view keyword performance" ON keyword_performance
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage keyword performance" ON keyword_performance
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can view backlinks" ON backlinks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage backlinks" ON backlinks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can view competitor analysis" ON competitor_analysis
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage competitor analysis" ON competitor_analysis
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Trigger pour mettre à jour last_updated
CREATE OR REPLACE FUNCTION update_page_seo_last_updated()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_page_seo_last_updated
  BEFORE UPDATE ON page_seo
  FOR EACH ROW
  EXECUTE FUNCTION update_page_seo_last_updated();

-- Trigger pour logger les changements SEO
CREATE OR REPLACE FUNCTION log_seo_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Logger dans les logs de performance
  INSERT INTO seo_performance_logs (page_slug, metric_type, metric_value, metric_details)
  VALUES (
    NEW.slug,
    'seo_update',
    1,
    jsonb_build_object(
      'old_title', OLD.title,
      'new_title', NEW.title,
      'old_description', OLD.description,
      'new_description', NEW.description,
      'changed_by', auth.uid()
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_seo_changes
  AFTER UPDATE ON page_seo
  FOR EACH ROW
  EXECUTE FUNCTION log_seo_changes();

-- Insertion des métadonnées SEO de base
INSERT INTO page_seo (slug, title, description, keywords, structured_data) VALUES
  ('/', 
   'EDSwipe - Trouvez les meilleurs artisans pour vos travaux',
   'EDSwipe connecte les particuliers avec des artisans qualifiés. Obtenez des devis gratuits pour vos travaux de rénovation, plomberie, électricité, et plus encore.',
   ARRAY['artisan', 'travaux', 'rénovation', 'plomberie', 'électricité', 'chauffage', 'menuiserie', 'maçonnerie', 'peinture', 'devis gratuit'],
   '{"@context": "https://schema.org", "@type": "WebSite", "name": "EDSwipe", "url": "https://edswipe.fr"}'
  ),
  
  ('/projets',
   'Projets de Travaux - EDSwipe',
   'Parcourez les projets de travaux publiés par les particuliers et trouvez des opportunités correspondant à vos compétences.',
   ARRAY['projets travaux', 'opportunités artisan', 'devis travaux', 'chantier disponible', 'artisan indépendant'],
   '{"@context": "https://schema.org", "@type": "CollectionPage", "name": "Projets de travaux"}'
  ),
  
  ('/professionnels/inscription',
   'Inscription Artisans - EDSwipe',
   'Inscrivez-vous en tant qu''artisan sur EDSwipe et accédez à des projets qualifiés. Rejoignez notre réseau de professionnels certifiés.',
   ARRAY['inscription artisan', 'devenir artisan', 'artisan indépendant', 'entreprise artisanale', 'trouver clients'],
   '{"@context": "https://schema.org", "@type": "WebPage", "name": "Inscription artisans"}'
  ),
  
  ('/comment-ca-marche',
   'Comment ça Marche - EDSwipe',
   'Découvrez comment EDSwipe fonctionne : créez votre projet, recevez des devis d''artisans qualifiés, et choisissez le meilleur professionnel.',
   ARRAY['comment fonctionne edswipe', 'guide utilisation', 'trouver artisan', 'obtenir devis', 'processus travaux'],
   '{"@context": "https://schema.org", "@type": "HowTo", "name": "Comment utiliser EDSwipe"}'
  ),
  
  ('/tarifs',
   'Tarifs - EDSwipe',
   'Découvrez les tarifs EDSwipe pour les particuliers et les artisans. Accès gratuit pour les particuliers, commissions adaptées pour les professionnels.',
   ARRAY['tarifs edswipe', 'prix services', 'coût plateforme', 'gratuit particulier', 'commission artisan'],
   '{"@context": "https://schema.org", "@type": "WebPage", "name": "Tarifs EDSwipe"}'
  ),
  
  ('/contact',
   'Contact - EDSwipe',
   'Contactez l''équipe EDSwipe pour toute question sur nos services de mise en relation entre particuliers et artisans qualifiés.',
   ARRAY['contact edswipe', 'support client', 'question service', 'aide artisan', 'contact équipe'],
   '{"@context": "https://schema.org", "@type": "ContactPage", "name": "Contact EDSwipe"}'
  )
ON CONFLICT (slug) DO NOTHING;

-- Insertion des mots-clés de base
INSERT INTO keyword_performance (keyword, search_volume, competition_level, ranking_position) VALUES
  ('artisan travaux', 10000, 'high', 15),
  ('trouver artisan', 8000, 'high', 12),
  ('devis travaux gratuit', 5000, 'medium', 8),
  ('artisan plomberie', 3000, 'medium', 10),
  ('artisan électricité', 2800, 'medium', 9),
  ('rénovation maison', 4500, 'high', 20),
  ('artisan proche de chez moi', 2000, 'medium', 7),
  ('entreprise artisanale', 1500, 'low', 5),
  ('artisan certifié', 1200, 'low', 6),
  ('travaux rénovation', 3500, 'medium', 18)
ON CONFLICT (keyword) DO NOTHING;
