'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Star, 
  Gift, 
  Crown, 
  Trophy, 
  Zap, 
  Target,
  Award,
  Gem,
  Shield,
  Coins,
  TrendingUp,
  CheckCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LoyaltyTier {
  id: string;
  name: string;
  description: string;
  minPoints: number;
  maxPoints?: number;
  color: string;
  icon: React.ReactNode;
  benefits: string[];
  discountRate: number;
}

interface LoyaltyReward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  type: 'discount' | 'feature' | 'badge' | 'service';
  value?: string;
  icon: React.ReactNode;
  available: boolean;
  claimed?: boolean;
}

interface UserLoyaltyData {
  currentPoints: number;
  totalEarned: number;
  totalSpent: number;
  currentTier: string;
  nextTier?: string;
  progressToNext: number;
  streak: number;
  memberSince: string;
  rewards: LoyaltyReward[];
  achievements: Array<{
    id: string;
    name: string;
    description: string;
    icon: React.ReactNode;
    unlockedAt: string;
  }>;
}

interface LoyaltyProgramProps {
  userId: string;
  userType: 'client' | 'professional';
}

export default function LoyaltyProgram({ userId, userType }: LoyaltyProgramProps) {
  const [loyaltyData, setLoyaltyData] = useState<UserLoyaltyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const { toast } = useToast();

  const loyaltyTiers: LoyaltyTier[] = [
    {
      id: 'bronze',
      name: 'Bronze',
      description: 'Début de votre aventure',
      minPoints: 0,
      maxPoints: 99,
      color: 'bg-amber-600',
      icon: <Shield className="w-5 h-5" />,
      benefits: ['5% de réduction', 'Accès au support email', 'Badge Bronze'],
      discountRate: 5
    },
    {
      id: 'silver',
      name: 'Silver',
      description: 'Membre fidèle',
      minPoints: 100,
      maxPoints: 499,
      color: 'bg-gray-500',
      icon: <Award className="w-5 h-5" />,
      benefits: ['10% de réduction', 'Support prioritaire', 'Badge Silver', 'Accès anticipé'],
      discountRate: 10
    },
    {
      id: 'gold',
      name: 'Gold',
      description: 'Membre premium',
      minPoints: 500,
      maxPoints: 999,
      color: 'bg-yellow-500',
      icon: <Trophy className="w-5 h-5" />,
      benefits: ['15% de réduction', 'Support dédié', 'Badge Gold', 'Services exclusifs', 'Double points'],
      discountRate: 15
    },
    {
      id: 'platinum',
      name: 'Platinum',
      description: 'Membre VIP',
      minPoints: 1000,
      maxPoints: 2499,
      color: 'bg-purple-500',
      icon: <Crown className="w-5 h-5" />,
      benefits: ['20% de réduction', 'Concierge service', 'Badge Platinum', 'Events VIP', 'Triple points'],
      discountRate: 20
    },
    {
      id: 'diamond',
      name: 'Diamond',
      description: 'Membre élite',
      minPoints: 2500,
      color: 'bg-blue-500',
      icon: <Gem className="w-5 h-5" />,
      benefits: ['25% de réduction', 'Service premium', 'Badge Diamond', 'Partenariats exclusifs', 'Quadruple points'],
      discountRate: 25
    }
  ];

  const availableRewards: LoyaltyReward[] = [
    {
      id: 'discount-10',
      name: 'Réduction 10€',
      description: '10€ de réduction sur votre prochain projet',
      pointsCost: 100,
      type: 'discount',
      value: '10€',
      icon: <Gift className="w-5 h-5" />,
      available: true
    },
    {
      id: 'discount-25',
      name: 'Réduction 25€',
      description: '25€ de réduction sur votre prochain projet',
      pointsCost: 250,
      type: 'discount',
      value: '25€',
      icon: <Gift className="w-5 h-5" />,
      available: true
    },
    {
      id: 'priority-boost',
      name: 'Mise en avant prioritaire',
      description: 'Votre projet mis en avant pendant 7 jours',
      pointsCost: 500,
      type: 'feature',
      icon: <TrendingUp className="w-5 h-5" />,
      available: true
    },
    {
      id: 'verified-badge',
      name: 'Badge Vérifié+',
      description: 'Badge vérifié premium sur votre profil',
      pointsCost: 750,
      type: 'badge',
      icon: <CheckCircle className="w-5 h-5" />,
      available: true
    },
    {
      id: 'emergency-fast',
      name: 'Accès urgence prioritaire',
      description: 'Intervention prioritaire en cas d\'urgence',
      pointsCost: 1000,
      type: 'service',
      icon: <Zap className="w-5 h-5" />,
      available: true
    }
  ];

  useEffect(() => {
    loadLoyaltyData();
  }, [userId]);

  const loadLoyaltyData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/loyalty/user-data?userId=${userId}&userType=${userType}`);
      const data = await response.json();

      if (response.ok) {
        setLoyaltyData(data);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      console.error('Erreur chargement fidélité:', error);
      // Données de démo pour le développement
      setLoyaltyData({
        currentPoints: 350,
        totalEarned: 500,
        totalSpent: 150,
        currentTier: 'silver',
        nextTier: 'gold',
        progressToNext: 50,
        streak: 3,
        memberSince: '2024-01-15',
        rewards: availableRewards,
        achievements: [
          {
            id: 'first-project',
            name: 'Premier projet',
            description: 'Vous avez créé votre premier projet',
            icon: <Target className="w-4 h-4" />,
            unlockedAt: '2024-01-15'
          },
          {
            id: 'streak-week',
            name: 'Semaine active',
            description: '7 jours d\'activité consécutive',
            icon: <Zap className="w-4 h-4" />,
            unlockedAt: '2024-01-22'
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const claimReward = async (rewardId: string) => {
    setClaimingReward(rewardId);
    try {
      const response = await fetch('/api/loyalty/claim-reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rewardId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "✅ Récompense claimée !",
          description: "Votre récompense a été ajoutée à votre compte",
        });
        loadLoyaltyData();
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setClaimingReward(null);
    }
  };

  const getCurrentTier = () => {
    return loyaltyTiers.find(tier => tier.id === loyaltyData?.currentTier);
  };

  const getNextTier = () => {
    return loyaltyTiers.find(tier => tier.id === loyaltyData?.nextTier);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!loyaltyData) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Crown className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Programme de fidélité indisponible
          </h3>
          <p className="text-gray-600">
            Revenez plus tard pour découvrir nos avantages
          </p>
        </CardContent>
      </Card>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Programme de Fidélité</h2>
        <p className="text-gray-600">
          Cumulez des points et débloquez des avantages exclusifs
        </p>
      </div>

      {/* Current Tier */}
      <Card className={`border-2 ${currentTier?.color.replace('bg-', 'border-')}`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-3 ${currentTier?.color} rounded-full text-white`}>
                {currentTier?.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold">Niveau {currentTier?.name}</h3>
                <p className="text-gray-600">{currentTier?.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-2xl font-bold">
                <Coins className="w-6 h-6 text-yellow-500" />
                {loyaltyData.currentPoints}
              </div>
              <p className="text-sm text-gray-600">points</p>
            </div>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Vos avantages</h4>
              <ul className="space-y-2">
                {currentTier?.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">Vos statistiques</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Points cumulés</span>
                  <span className="font-medium">{loyaltyData.totalEarned}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Points dépensés</span>
                  <span className="font-medium">{loyaltyData.totalSpent}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Membre depuis</span>
                  <span className="font-medium">{new Date(loyaltyData.memberSince).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Série d'activité</span>
                  <span className="font-medium">{loyaltyData.streak} jours</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Prochain niveau : {nextTier.name}</span>
                <span className="text-sm text-gray-600">
                  {nextTier.minPoints - loyaltyData.currentPoints} points restants
                </span>
              </div>
              <Progress value={loyaltyData.progressToNext} className="h-2" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Boutique de récompenses
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loyaltyData.rewards.map((reward) => (
              <Card key={reward.id} className={`border ${!reward.available ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      {reward.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{reward.name}</h4>
                      <p className="text-sm text-gray-600">{reward.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{reward.pointsCost}</span>
                    </div>
                    
                    <Button
                      size="sm"
                      onClick={() => claimReward(reward.id)}
                      disabled={!reward.available || loyaltyData.currentPoints < reward.pointsCost || claimingReward === reward.id}
                    >
                      {claimingReward === reward.id ? (
                        <>
                          <div className="w-3 h-3 mr-1 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          En cours...
                        </>
                      ) : (
                        'Claim'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Succès débloqués
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loyaltyData.achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                <div className="p-2 bg-yellow-200 rounded-lg">
                  {achievement.icon}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{achievement.name}</h4>
                  <p className="text-xs text-gray-600">{achievement.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(achievement.unlockedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to earn points */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Comment gagner des points
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold">Actions quotidiennes</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Connexion quotidienne</span>
                  <Badge variant="secondary">+5 pts</Badge>
                </li>
                <li className="flex justify-between">
                  <span>Compléter son profil</span>
                  <Badge variant="secondary">+20 pts</Badge>
                </li>
                <li className="flex justify-between">
                  <span>Laisser un avis</span>
                  <Badge variant="secondary">+10 pts</Badge>
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold">Actions de projet</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Créer un projet</span>
                  <Badge variant="secondary">+15 pts</Badge>
                </li>
                <li className="flex justify-between">
                  <span>Finaliser un projet</span>
                  <Badge variant="secondary">+50 pts</Badge>
                </li>
                <li className="flex justify-between">
                  <span>Parrainer un ami</span>
                  <Badge variant="secondary">+100 pts</Badge>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
