'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  Phone, 
  MapPin, 
  Clock, 
  Euro, 
  Users, 
  CheckCircle,
  Zap,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EmergencyProjectFormProps {
  onSuccess?: (projectId: string) => void;
}

export default function EmergencyProjectForm({ onSuccess }: EmergencyProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    urgency_level: 'critical',
    address: '',
    city: '',
    postal_code: '',
    phone: '',
    estimated_budget_min: '',
    estimated_budget_max: '',
    immediate_intervention: true,
    photos: [] as File[],
    consent_urgent_pricing: false
  });
  
  const { toast } = useToast();

  const EMERGENCY_MULTIPLIER = 1.5; // 50% de majoration pour les urgences
  const EMERGENCY_CATEGORIES = [
    'plomberie', 'electricite', 'chauffage', 'climatisation', 
    'couverture', 'securite', 'fuite', 'panne_electrique'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.consent_urgent_pricing) {
      toast({
        title: "Consentement requis",
        description: "Vous devez accepter la majoration tarifaire pour les interventions d'urgence",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Upload des photos si présentes
      const photoUrls = [];
      for (const photo of formData.photos) {
        const formDataUpload = new FormData();
        formDataUpload.append('file', photo);
        
        const response = await fetch('/api/upload/project-photo', {
          method: 'POST',
          body: formDataUpload
        });
        
        if (response.ok) {
          const data = await response.json();
          photoUrls.push(data.url);
        }
      }

      // Calcul du budget avec majoration
      const baseBudgetMin = parseFloat(formData.estimated_budget_min) || 0;
      const baseBudgetMax = parseFloat(formData.estimated_budget_max) || 0;
      
      const urgentBudgetMin = Math.round(baseBudgetMin * EMERGENCY_MULTIPLIER);
      const urgentBudgetMax = Math.round(baseBudgetMax * EMERGENCY_MULTIPLIER);

      // Créer le projet d'urgence
      const projectData = {
        ...formData,
        estimated_budget_min: urgentBudgetMin,
        estimated_budget_max: urgentBudgetMax,
        urgency: 'urgent',
        status: 'published',
        is_emergency: true,
        emergency_level: formData.urgency_level,
        photos: photoUrls,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: { user } } = await (supabase as any).auth.getUser();
      if (!user) throw new Error('Non authentifié');

      const { data: project, error } = await (supabase as any)
        .from('projects')
        .insert({
          ...projectData,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;

      // Notifier les professionnels disponibles immédiatement
      await notifyAvailableProfessionals(project.id);

      toast({
        title: "🚨 Demande d'urgence envoyée !",
        description: "Les professionnels disponibles sont notifiés immédiatement",
      });

      onSuccess?.(project.id);

    } catch (error: any) {
      console.error('Erreur création projet urgence:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la demande d'urgence",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const notifyAvailableProfessionals = async (projectId: string) => {
    try {
      // Récupérer les professionnels disponibles et qualifiés
      const { data: professionals } = await (supabase as any)
        .from('professionals')
        .select('id, user_id, categories, city, emergency_available')
        .eq('emergency_available', true)
        .in('categories', [formData.category]);

      if (professionals) {
        // Notifier chaque professionnel
        for (const pro of professionals) {
          await (supabase as any)
            .from('notifications')
            .insert({
              user_id: pro.user_id,
              type: 'emergency_request',
              title: '🚨 Intervention d\'urgence requise',
              message: `Une urgence ${formData.category} nécessite une intervention immédiate à ${formData.city}`,
              data: {
                project_id: projectId,
                urgency_level: formData.urgency_level,
                location: formData.city
              },
              priority: 'high',
              created_at: new Date().toISOString(),
              read: false
            });
        }
      }
    } catch (error) {
      console.error('Erreur notification professionnels:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...files].slice(0, 5) // Max 5 photos
    }));
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const getUrgencyColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getUrgencyLabel = (level: string) => {
    switch (level) {
      case 'critical': return 'Critique - Danger immédiat';
      case 'high': return 'Haut - Très urgent';
      case 'medium': return 'Moyen - Urgent';
      default: return 'Normal';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto border-red-200">
      <CardHeader className="bg-red-50 border-b border-red-200">
        <CardTitle className="flex items-center gap-2 text-red-700">
          <AlertTriangle className="w-6 h-6" />
          Demande d'Intervention d'Urgence
        </CardTitle>
        <p className="text-red-600 text-sm">
          Pour les situations nécessitant une intervention immédiate (24h/24 et 7j/7)
        </p>
      </CardHeader>

      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alertes importantes */}
          <Alert className="border-red-200 bg-red-50">
            <Zap className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-700">
              <strong>Tarification d'urgence :</strong> Majoration de 50% appliquée pour toute intervention d'urgence.
              Les professionnels interviennent dans les plus brefs délais.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Informations de base */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre de l'urgence *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Fuite d'eau importante, Panne électrique..."
                  required
                />
              </div>

              <div>
                <Label htmlFor="category">Type de problème *</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez le type de problème" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMERGENCY_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="urgency_level">Niveau d'urgence *</Label>
                <Select value={formData.urgency_level} onValueChange={(value) => setFormData(prev => ({ ...prev, urgency_level: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full" />
                        Critique - Danger immédiat
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-orange-500 rounded-full" />
                        Haut - Très urgent
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                        Moyen - Urgent
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="phone">Téléphone d'urgence *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Votre numéro de téléphone"
                  required
                />
              </div>
            </div>

            {/* Localisation */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Adresse exacte *</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Numéro, rue..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="postal_code">Code postal *</Label>
                  <Input
                    id="postal_code"
                    value={formData.postal_code}
                    onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                    placeholder="75000"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder="Paris"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estimated_budget_min">Budget minimum (€)</Label>
                  <Input
                    id="estimated_budget_min"
                    type="number"
                    value={formData.estimated_budget_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_budget_min: e.target.value }))}
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label htmlFor="estimated_budget_max">Budget maximum (€)</Label>
                  <Input
                    id="estimated_budget_max"
                    type="number"
                    value={formData.estimated_budget_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, estimated_budget_max: e.target.value }))}
                    placeholder="500"
                  />
                </div>
              </div>

              {formData.estimated_budget_min && formData.estimated_budget_max && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-orange-700">
                    <Euro className="w-4 h-4" />
                    <span className="font-medium">Tarif urgence estimé :</span>
                  </div>
                  <div className="text-orange-600 text-sm">
                    {Math.round(parseFloat(formData.estimated_budget_min) * EMERGENCY_MULTIPLIER)}€ - {Math.round(parseFloat(formData.estimated_budget_max) * EMERGENCY_MULTIPLIER)}€
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description détaillée de l'urgence *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Décrivez précisément le problème, les risques, et ce qui doit être fait en urgence..."
              rows={4}
              required
            />
          </div>

          {/* Photos */}
          <div>
            <Label>Photos du problème (optionnel)</Label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
              className="mb-3"
            />
            
            {formData.photos.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.photos.map((photo, index) => (
                  <div key={index} className="relative">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt={`Photo ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                      onClick={() => removePhoto(index)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Consentement */}
          <div className="space-y-4">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="consent_urgent_pricing"
                checked={formData.consent_urgent_pricing}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, consent_urgent_pricing: checked as boolean }))
                }
              />
              <Label htmlFor="consent_urgent_pricing" className="text-sm">
                J'accepte la majoration tarifaire de 50% pour les interventions d'urgence et comprends que les professionnels interviendront dans les plus brefs délais
              </Label>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="immediate_intervention"
                checked={formData.immediate_intervention}
                onCheckedChange={(checked) => 
                  setFormData(prev => ({ ...prev, immediate_intervention: checked as boolean }))
                }
              />
              <Label htmlFor="immediate_intervention" className="text-sm">
                Je suis disponible immédiatement pour accueillir le professionnel
              </Label>
            </div>
          </div>

          {/* Bouton de soumission */}
          <Button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-6"
            disabled={loading || !formData.consent_urgent_pricing}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi de la demande d'urgence...
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 mr-2" />
                Lancer la demande d'urgence
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
