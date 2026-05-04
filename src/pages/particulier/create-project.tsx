import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { SEO } from '@/components/SEO';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Plus,
  Minus,
  Lock,
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFormData {
  title: string;
  description: string;
  work_type: string;
  address: string;
  city: string;
  postal_code: string;
  budget_min: string;
  budget_max: string;
  urgency: string;
  timeline: string;
  additional_details: string;
  payment_security_option?: string;
}

const WORK_TYPES = [
  'Plomberie',
  'Électricité',
  'Chauffage/Climatisation',
  'Menuiserie',
  'Maçonnerie',
  'Couverture',
  'Carrelage',
  'Peinture',
  'Jardinage/Paysagisme',
  'Déménagement',
  'Nettoyage',
  'Autre',
];

const URGENCY_LEVELS = [
  { value: 'low', label: 'Faible - Dans les prochains mois' },
  { value: 'medium', label: 'Moyenne - Dans les prochaines semaines' },
  { value: 'high', label: 'Élevée - Dans les prochains jours' },
  { value: 'urgent', label: 'Urgente - Dès que possible' },
];

const TIMELINE_OPTIONS = [
  { value: 'flexible', label: 'Flexible - Selon disponibilité' },
  { value: 'specific', label: 'Date spécifique' },
  { value: 'asap', label: 'Dès que possible' },
];

export default function CreateProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    work_type: '',
    address: '',
    city: '',
    postal_code: '',
    budget_min: '',
    budget_max: '',
    urgency: 'medium',
    timeline: 'flexible',
    additional_details: '',
    payment_security_option: '',
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      router.push('/auth/login');
      return;
    }
  };

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError('');
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      setError('Le titre du projet est requis');
      return false;
    }
    if (!formData.description.trim()) {
      setError('La description du projet est requise');
      return false;
    }
    if (!formData.work_type) {
      setError('Le type de travail est requis');
      return false;
    }
    if (!formData.address.trim()) {
      setError("L'adresse est requise");
      return false;
    }
    if (!formData.city.trim()) {
      setError('La ville est requise');
      return false;
    }
    if (!formData.postal_code.trim()) {
      setError('Le code postal est requis');
      return false;
    }
    if (
      formData.budget_min &&
      formData.budget_max &&
      parseInt(formData.budget_min) > parseInt(formData.budget_max)
    ) {
      setError(
        'Le budget minimum ne peut pas être supérieur au budget maximum'
      );
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      // Créer le projet
      const { data: project, error: projectError } = await (supabase as any)
        .from('projects')
        .insert({
          title: formData.title,
          description: formData.description,
          work_types: [formData.work_type],
          address: formData.address,
          city: formData.city,
          postal_code: formData.postal_code,
          budget_min: formData.budget_min
            ? parseInt(formData.budget_min)
            : null,
          budget_max: formData.budget_max
            ? parseInt(formData.budget_max)
            : null,
          urgency: formData.urgency,
          timeline: formData.timeline,
          additional_details: formData.additional_details,
          payment_security_option: formData.payment_security_option,
          client_id: session.user.id,
          status: 'pending',
          validation_status: 'pending',
        })
        .select()
        .single();

      if (projectError) {
        throw projectError;
      }

      // Notifier Support + Team + créer le lead CRM
      console.log('Envoi notification projet créé...');
      const notificationResponse = await fetch('/api/notify-project-created', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project.id,
          clientId: session.user.id,
        }),
      });

      if (!notificationResponse.ok) {
        console.error(
          'Erreur notification projet:',
          await notificationResponse.text()
        );
      } else {
        const result = await notificationResponse.json();
        console.log('Notification projet envoyée:', result);
      }

      setSuccess(true);

      // Réinitialiser le formulaire avant redirection
      setFormData({
        title: '',
        description: '',
        work_type: '',
        address: '',
        city: '',
        postal_code: '',
        budget_min: '',
        budget_max: '',
        urgency: 'medium',
        timeline: '',
        additional_details: '',
        payment_security_option: '',
      });
      setFiles([]);

      // Rediriger vers la page des projets après 2 secondes
      setTimeout(() => {
        router.push('/particulier/projects');
      }, 2000);
    } catch (error: any) {
      console.error('Erreur création projet:', error);
      setError(
        error.message || 'Une erreur est survenue lors de la création du projet'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Projet créé avec succès !
            </h2>
            <p className="text-gray-600 mb-4">
              Votre projet a été publié et les professionnels pourront
              maintenant y répondre.
            </p>
            <p className="text-sm text-gray-500">
              Redirection vers vos projets...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <SEO title="Créer un projet - EDSwipe" />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Link href="/particulier/dashboard">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                  </Button>
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">
                  Créer un nouveau projet
                </h1>
              </div>
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-600"
              >
                Particulier
              </Badge>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Informations principales */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Home className="w-5 h-5 mr-2" />
                  Informations du projet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="title">Titre du projet *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Ex: Installation d'une nouvelle salle de bain"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description détaillée *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                    placeholder="Décrivez votre projet en détail..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="work_type">Type de travail *</Label>
                  <Select
                    value={formData.work_type}
                    onValueChange={(value) =>
                      handleInputChange('work_type', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez un type de travail" />
                    </SelectTrigger>
                    <SelectContent>
                      {WORK_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Localisation du projet
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="address">Adresse *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange('address', e.target.value)
                    }
                    placeholder="123 rue de la République"
                    className="mt-1"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ville *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange('city', e.target.value)
                      }
                      placeholder="Paris"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="postal_code">Code postal *</Label>
                    <Input
                      id="postal_code"
                      value={formData.postal_code}
                      onChange={(e) =>
                        handleInputChange('postal_code', e.target.value)
                      }
                      placeholder="75001"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Budget et timing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <DollarSign className="w-5 h-5 mr-2" />
                  Budget et délais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="budget_min">Budget minimum (€)</Label>
                    <Input
                      id="budget_min"
                      type="number"
                      value={formData.budget_min}
                      onChange={(e) =>
                        handleInputChange('budget_min', e.target.value)
                      }
                      placeholder="1000"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="budget_max">Budget maximum (€)</Label>
                    <Input
                      id="budget_max"
                      type="number"
                      value={formData.budget_max}
                      onChange={(e) =>
                        handleInputChange('budget_max', e.target.value)
                      }
                      placeholder="5000"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="urgency">Niveau d'urgence</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) =>
                      handleInputChange('urgency', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez l'urgence" />
                    </SelectTrigger>
                    <SelectContent>
                      {URGENCY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timeline">Délais souhaités</Label>
                  <Select
                    value={formData.timeline}
                    onValueChange={(value) =>
                      handleInputChange('timeline', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionnez les délais" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIMELINE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Options de paiement séquestré */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lock className="w-5 h-5 mr-2 text-purple-600" />
                  Options de paiement séquestré
                </CardTitle>
                <p className="text-sm text-gray-600 mt-2">
                  Protégez vos fonds grâce à notre opérateur partenaire.
                  Choisissez comment bloquer et libérer les paiements.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="payment_security_option">
                    Option de sécurisation *
                  </Label>
                  <Select
                    value={formData.payment_security_option || ''}
                    onValueChange={(value) =>
                      handleInputChange('payment_security_option', value)
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Choisissez une option de sécurisation" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deposit_only">
                        Acompte uniquement
                      </SelectItem>
                      <SelectItem value="full_amount">
                        Montant total des travaux
                      </SelectItem>
                      <SelectItem value="milestones">
                        Versement par paliers (signature, début, milieu, fin)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-2">
                    Les fonds seront bloqués via notre partenaire financier et
                    libérés selon les étapes validées avec l'artisan.
                  </p>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">
                    Pourquoi choisir le paiement séquestré ?
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Protection complète de vos fonds</li>
                    <li>• Libération par étapes validées</li>
                    <li>• Médiation en cas de litige</li>
                    <li>• Opérateur financier agréé et régulé</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Détails additionnels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="w-5 h-5 mr-2" />
                  Informations complémentaires
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="additional_details">
                    Détails additionnels
                  </Label>
                  <Textarea
                    id="additional_details"
                    value={formData.additional_details}
                    onChange={(e) =>
                      handleInputChange('additional_details', e.target.value)
                    }
                    placeholder="Informations supplémentaires, contraintes particulières, etc."
                    rows={3}
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Erreur */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="text-red-800">{error}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <Link href="/particulier/dashboard">
                <Button variant="outline" disabled={loading}>
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={loading}>
                {loading ? 'Création en cours...' : 'Créer le projet'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
