-- Migration pour ajouter les champs d'abonnement Stripe
-- Permet de gérer le statut premium et les privilèges de matching

-- Ajouter les champs d'abonnement à la table professionals
ALTER TABLE professionals 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing')),
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS can_match BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS premium_features JSONB DEFAULT '{}';

-- Créer une table pour les abonnements Stripe
CREATE TABLE IF NOT EXISTS stripe_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES professionals(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  stripe_customer_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'past_due', 'canceled', 'trialing', 'incomplete', 'incomplete_expired', 'unpaid')),
  plan_id TEXT,
  plan_name TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_professionals_subscription_status ON professionals(subscription_status);
CREATE INDEX IF NOT EXISTS idx_professionals_can_match ON professionals(can_match);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id ON stripe_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_professional_id ON stripe_subscriptions(professional_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status ON stripe_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_subscription_id ON stripe_subscriptions(stripe_subscription_id);

-- Activer RLS sur la nouvelle table
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;

-- Politique RLS : Les utilisateurs peuvent voir leur propre abonnement
CREATE POLICY "Users can view their own subscription" 
ON stripe_subscriptions FOR SELECT 
USING (auth.uid() = user_id);

-- Politique RLS : Le système peut insérer/mettre à jour les abonnements
CREATE POLICY "System can manage subscriptions" 
ON stripe_subscriptions FOR ALL 
USING (true) 
WITH CHECK (true);

-- Commentaires pour documentation
COMMENT ON COLUMN professionals.subscription_status IS 'Statut de l''abonnement Stripe du professionnel';
COMMENT ON COLUMN professionals.can_match IS 'Indique si le professionnel peut effectuer des matchings (désactivé si paiement échoué)';
COMMENT ON COLUMN professionals.premium_features IS 'Fonctionnalités premium activées pour ce professionnel';
COMMENT ON TABLE stripe_subscriptions IS 'Table pour stocker les informations d''abonnement Stripe';
