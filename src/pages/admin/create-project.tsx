import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { SEO } from '@/components/SEO';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Plus,
  X,
  AlertCircle,
  MapPin,
  Calendar,
  DollarSign,
  Home,
  CheckCircle,
  ArrowLeft,
  Save,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProjectFormData {
  title: string;
  description: string;
  category: string;
  location: string;
  city: string;
  postal_code: string;
  work_type: string[];
  budget_min: string;
  budget_max: string;
  urgency: string;
  desired_start_date: string;
  desired_deadline: string;
  property_type: string;
  property_surface: string;
  property_address: string;
  primary_profession: string;
  client_first_name: string;
  client_last_name: string;
  client_email: string;
  client_phone: string;
}

import { WORK_TYPES, PROFESSIONS } from '@/lib/constants/work-types';

// Regrouper les types de travaux par catégorie
const CATEGORIZED_WORK_TYPES = {
  'Rénovation complète': [
    'Rénovation maison complète',
    'Rénovation appartement complet',
    'Rénovation villa complète',
    'Rénovation local commercial complet',
    'Restauration bâtiment ancien',
    'Rénovation habitation complète',
    'Reprise complète gros œuvre',
    'Rénovation structure complète',
  ],
  'Gros œuvre': [
    'Terrassement',
    'Fondations',
    'Maçonnerie',
    'Béton armé',
    'Charpente',
    'Couverture',
    'Zinguerie',
    'Démolition',
    'Désamiantage',
    'Débarras',
    'Nettoyage chantier',
  ],
  'Second œuvre': [
    'Plomberie',
    'Électricité',
    'Chauffage',
    'Climatisation',
    'Ventilation',
    'Isolation',
    'Plâtrerie',
    'Peinture',
    'Carrelage',
    'Parquet',
    'Revêtements sols',
    'Cloisons',
    'Faux plafonds',
  ],
  'Extension/Surélévation': [
    'Extension maison',
    'Surélévation toiture',
    'Ajout étage',
    'Véranda',
    'Véranda fermée',
    'Porche',
    'Agrandissement',
    'Création pièce supplémentaire',
    'Extension latérale',
  ],
  'Aménagements extérieurs': [
    'Terrasse',
    'Balcon',
    'Piscine',
    'Clôture',
    'Portail',
    'Allée jardin',
    'Aménagement paysager',
    'Mur de soutènement',
    'Terrasse bois',
    'Terrasse composite',
    'Abri de jardin',
    'Carport',
  ],
  Menuiseries: [
    'Fenêtres',
    'Portes',
    'Volets',
    'Portes de garage',
    'Velux',
    'Vitrines',
    'Baie vitrée',
    "Porte d'entrée",
    'Fenêtre de toit',
    'Velux électrique',
    'Volets roulants',
  ],
  'Salle de bain': [
    'Salle de bain complète',
    'Douche',
    'Baignoire',
    'Meuble salle de bain',
    'Carrelage salle de bain',
    'Plomberie salle de bain',
    "Douche à l'italienne",
    'Bain douche',
    'Sauna',
    'Hamman',
  ],
  Cuisine: [
    'Cuisine complète',
    'Meuble cuisine',
    'Électroménager',
    'Plans de travail',
    'Crédence',
    'Siphon cuisine',
    'Îlot central',
    'Hotte aspirante',
    'Plan de travail quartz',
  ],
  'Rénovation énergétique': [
    'Isolation murs',
    'Isolation combles',
    'Isolation toiture',
    'Fenêtres double vitrage',
    'Chauffage basse température',
    'Pompe à chaleur',
    'Panneaux solaires',
    'VMC',
    'Isolation extérieure',
  ],
  Finitions: [
    'Peinture intérieure',
    'Peinture extérieure',
    'Papier peint',
    'Enduit décoratif',
    'Faux marbre',
    'Staff',
    'Enduit de façade',
    'Ravalement façade',
    'Enduit plâtre',
    'Flocage',
  ],
  'Équipements techniques': [
    'Chauffe-eau',
    'Radiateurs',
    'Thermostat',
    'Tableau électrique',
    'Compteur',
    'Vidéophone',
    'Alarme',
    'Interphone',
    'Climatisation réversible',
    'Cheminée',
  ],
  Réseaux: [
    'Assainissement',
    "Adduction d'eau",
    'Électricité générale',
    'Téléphonie',
    'Internet',
    'Télévision',
    'Fibre optique',
    'Réseau électrique',
    'Évacuation eaux usées',
    'Réseau gaz',
  ],
  Divers: [
    'Ascenseur',
    'Monte-charge',
    'Escalier',
    'Rampes',
    'Garage',
    'Cave',
    'Grenier',
    'Toiture végétale',
    'Ouvrages métalliques',
    'Bois',
    'Menuiserie extérieure',
    'Agencement intérieur',
    'Rangement',
    'Dressing',
    'Placard',
    'Diagnostic immobilier',
    'Expertise bâtiment',
    'Mise aux normes',
  ],
};

const CATEGORIES = [
  'Construction neuve',
  'Rénovation complète',
  'Rénovation partielle',
  'Aménagement',
  'Extension',
  'Surélévation',
  'Décoration',
  'Jardin/Paysage',
  'Électricité',
  'Plomberie',
  'CVC/Chauffage',
  'Toiture/Zinguerie',
  'Menuiserie',
  'Peinture',
  'Isolation',
  'Carrelage/Sols',
  'Cuisine',
  'Salle de bain',
  'Rénovation énergétique',
  'Piscine',
  'Terrasse/Balcon',
  'Clôture/Portail',
  'Démolition/Gros œuvre',
  'Autre',
];

const PROPERTY_TYPES = [
  'Maison individuelle',
  'Appartement',
  'Studio',
  'Villa',
  'Local commercial',
  'Bureau',
  'Entrepôt',
  'Garage',
  'Terrain',
  'Immeuble',
  'Duplex',
  'Triplex',
  'Loft',
  'Atelier',
  'Cave',
  'Grenier',
  'Chalet',
  'Barn',
  'Ferme',
  'Château',
  'Hôtel particulier',
  'Résidence',
  'Camping',
  'Autre',
];

export default function AdminCreateProject() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [successDialog, setSuccessDialog] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  // États pour le défilement des types de travaux
  const [currentVisibleCategory, setCurrentVisibleCategory] = useState(0);
  const workTypesScrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    description: '',
    category: '',
    location: '',
    city: '',
    postal_code: '',
    work_type: [],
    budget_min: '',
    budget_max: '',
    urgency: '',
    desired_start_date: '',
    desired_deadline: '',
    property_type: '',
    property_surface: '',
    property_address: '',
    primary_profession: '',
    client_first_name: '',
    client_last_name: '',
    client_email: '',
    client_phone: '',
  });

  const handleInputChange = (field: keyof ProjectFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleWorkType = (workType: string) => {
    setFormData((prev) => ({
      ...prev,
      work_type: prev.work_type.includes(workType)
        ? prev.work_type.filter((wt) => wt !== workType)
        : [...prev.work_type, workType],
    }));
  };

  // Fonctions pour la navigation dans les types de travaux
  const scrollWorkTypes = (direction: 'up' | 'down') => {
    if (!workTypesScrollRef.current) return;

    const container = workTypesScrollRef.current;
    const categories = Object.keys(CATEGORIZED_WORK_TYPES);
    const categoryHeight = container.scrollHeight / categories.length;

    if (direction === 'up') {
      const newIndex = Math.max(0, currentVisibleCategory - 1);
      container.scrollTo({
        top: newIndex * categoryHeight,
        behavior: 'smooth',
      });
      setCurrentVisibleCategory(newIndex);
    } else {
      const newIndex = Math.min(
        categories.length - 1,
        currentVisibleCategory + 1
      );
      container.scrollTo({
        top: newIndex * categoryHeight,
        behavior: 'smooth',
      });
      setCurrentVisibleCategory(newIndex);
    }
  };

  // Détecter la catégorie visible lors du défilement
  useEffect(() => {
    const container = workTypesScrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const categories = Object.keys(CATEGORIZED_WORK_TYPES);
      const categoryHeight = container.scrollHeight / categories.length;
      const currentCategory = Math.floor(container.scrollTop / categoryHeight);
      setCurrentVisibleCategory(
        Math.min(currentCategory, categories.length - 1)
      );
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleCategoryWorkTypes = (category: string) => {
    const categoryWorkTypes =
      CATEGORIZED_WORK_TYPES[category as keyof typeof CATEGORIZED_WORK_TYPES] ||
      [];

    setFormData((prev) => {
      // Vérifier si tous les types de la catégorie sont déjà sélectionnés
      const allCategorySelected = categoryWorkTypes.every((wt) =>
        prev.work_type.includes(wt)
      );

      if (allCategorySelected) {
        // Désélectionner toute la catégorie
        return {
          ...prev,
          work_type: prev.work_type.filter(
            (wt) => !categoryWorkTypes.includes(wt)
          ),
        };
      } else {
        // Sélectionner toute la catégorie
        const newWorkTypes = [
          ...new Set([...prev.work_type, ...categoryWorkTypes]),
        ];
        return {
          ...prev,
          work_type: newWorkTypes,
        };
      }
    });
  };

  const clearAllWorkTypes = () => {
    setFormData((prev) => ({ ...prev, work_type: [] }));
  };

  const selectAllWorkTypes = () => {
    setFormData((prev) => ({ ...prev, work_type: WORK_TYPES }));
  };

  const validateForm = () => {
    const required = [
      'title',
      'description',
      'category',
      'location',
      'city',
      'postal_code',
      'client_first_name',
      'client_last_name',
      'client_email',
    ];

    for (const field of required) {
      const value = formData[field as keyof ProjectFormData];
      if (typeof value === 'string' && !value.trim()) {
        toast({
          title: 'Erreur de validation',
          description: `Le champ ${field} est requis`,
          variant: 'destructive',
        });
        return false;
      }
    }

    if (formData.work_type.length === 0) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez sélectionner au moins un type de travail',
        variant: 'destructive',
      });
      return false;
    }

    // Validation spécifique pour certains types de travaux
    const requiresSpecialSkills = [
      'Électricité',
      'Plomberie',
      'Chauffage',
      'Climatisation',
    ];
    const hasSpecialWork = formData.work_type.some((wt) =>
      requiresSpecialSkills.includes(wt)
    );

    if (hasSpecialWork && !formData.description) {
      toast({
        title: 'Information requise',
        description:
          "Pour les travaux d'électricité, plomberie ou chauffage, veuillez fournir une description détaillée",
        variant: 'destructive',
      });
      return false;
    }

    if (formData.client_email && !formData.client_email.includes('@')) {
      toast({
        title: 'Erreur de validation',
        description: "L'email du client est invalide",
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Créer le projet
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: 'admin-created', // ID temporaire pour les projets créés par admin
          title: formData.title,
          description: formData.description,
          category: formData.category,
          location: formData.location,
          city: formData.city,
          postal_code: formData.postal_code,
          work_type: formData.work_type,
          budget_min: formData.budget_min
            ? parseInt(formData.budget_min)
            : null,
          budget_max: formData.budget_max
            ? parseInt(formData.budget_max)
            : null,
          urgency: formData.urgency,
          desired_start_date: formData.desired_start_date || null,
          desired_deadline: formData.desired_deadline || null,
          property_type: formData.property_type,
          property_surface: formData.property_surface
            ? parseInt(formData.property_surface)
            : null,
          property_address: formData.property_address,
          client_first_name: formData.client_first_name,
          client_last_name: formData.client_last_name,
          client_email: formData.client_email,
          client_phone: formData.client_phone,
          status: 'published', // Publié directement par admin
        })
        .select()
        .single();

      if (projectError) throw projectError;

      setCreatedProjectId(projectData.id);
      setSuccessDialog(true);

      toast({
        title: 'Succès',
        description: 'Projet créé avec succès',
      });
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le projet',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEO title="Créer Projet - Admin" />
      <AdminLayout title="Créer un Projet">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Créer un nouveau projet</h1>
                <p className="text-muted-foreground">
                  Créez un projet au nom d'un client
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            {/* Informations Client */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-5 w-5" />
                  Informations Client
                </CardTitle>
                <CardDescription>
                  Informations sur le client pour qui vous créez ce projet
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_first_name">Prénom *</Label>
                  <Input
                    id="client_first_name"
                    placeholder="Jean"
                    value={formData.client_first_name}
                    onChange={(e) =>
                      handleInputChange('client_first_name', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_last_name">Nom *</Label>
                  <Input
                    id="client_last_name"
                    placeholder="Dupont"
                    value={formData.client_last_name}
                    onChange={(e) =>
                      handleInputChange('client_last_name', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_email">Email *</Label>
                  <Input
                    id="client_email"
                    type="email"
                    placeholder="jean.dupont@email.com"
                    value={formData.client_email}
                    onChange={(e) =>
                      handleInputChange('client_email', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_phone">Téléphone</Label>
                  <Input
                    id="client_phone"
                    placeholder="06 12 34 56 78"
                    value={formData.client_phone}
                    onChange={(e) =>
                      handleInputChange('client_phone', e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Informations Projet */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Détails du Projet
                </CardTitle>
                <CardDescription>
                  Description complète du projet à réaliser
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Titre du projet *</Label>
                    <Input
                      id="title"
                      placeholder="Rénovation cuisine"
                      value={formData.title}
                      onChange={(e) =>
                        handleInputChange('title', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        handleInputChange('category', value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une catégorie" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="primary_profession">
                    Métier principal recherché *
                  </Label>
                  <Select
                    value={formData.primary_profession}
                    onValueChange={(value) =>
                      handleInputChange('primary_profession', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le métier principal" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFESSIONS.map((profession) => (
                        <SelectItem key={profession} value={profession}>
                          {profession}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description détaillée *</Label>
                  <Textarea
                    id="description"
                    placeholder="Décrivez en détail les travaux à réaliser..."
                    rows={4}
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange('description', e.target.value)
                    }
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Types de travaux *</Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={selectAllWorkTypes}
                        className="text-xs"
                      >
                        Tout sélectionner
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={clearAllWorkTypes}
                        className="text-xs"
                      >
                        Tout désélectionner
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {formData.work_type.length} sélectionné(s)
                      </span>
                    </div>
                  </div>

                  <div className="relative">
                    {/* Flèche de navigation haut */}
                    <button
                      type="button"
                      onClick={() => scrollWorkTypes('up')}
                      className="nav-arrow up"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 15l7-7 7 7"
                        />
                      </svg>
                    </button>

                    {/* Conteneur avec ascenseur personnalisé */}
                    <div
                      ref={workTypesScrollRef}
                      className="work-types-container space-y-4 scroll-smooth"
                    >
                      {Object.entries(CATEGORIZED_WORK_TYPES).map(
                        ([category, workTypes]) => (
                          <div key={category} className="space-y-2">
                            <div className="sticky-header flex items-center justify-between">
                              <h4 className="font-medium text-sm text-muted-foreground">
                                {category}
                              </h4>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  toggleCategoryWorkTypes(category)
                                }
                                className="text-xs h-6 px-2"
                              >
                                {workTypes.every((wt) =>
                                  formData.work_type.includes(wt)
                                )
                                  ? 'Désélectionner'
                                  : 'Sélectionner'}
                              </Button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {workTypes.map((workType) => (
                                <Badge
                                  key={workType}
                                  className={`work-type-badge ${
                                    formData.work_type.includes(workType)
                                      ? 'selected'
                                      : ''
                                  }`}
                                  onClick={() => toggleWorkType(workType)}
                                >
                                  {workType}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Flèche de navigation bas */}
                    <button
                      type="button"
                      onClick={() => scrollWorkTypes('down')}
                      className="nav-arrow down"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {/* Indicateur de position */}
                    <div className="position-indicator">
                      {Object.keys(CATEGORIZED_WORK_TYPES).map((_, index) => (
                        <div
                          key={index}
                          className={`position-dot ${
                            index === currentVisibleCategory
                              ? 'active'
                              : 'inactive'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Localisation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Localisation
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Adresse *</Label>
                  <Input
                    id="location"
                    placeholder="123 Rue de la République"
                    value={formData.location}
                    onChange={(e) =>
                      handleInputChange('location', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">Ville *</Label>
                  <Input
                    id="city"
                    placeholder="Paris"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal *</Label>
                  <Input
                    id="postal_code"
                    placeholder="75001"
                    value={formData.postal_code}
                    onChange={(e) =>
                      handleInputChange('postal_code', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_type">Type de bien</Label>
                  <Select
                    value={formData.property_type}
                    onValueChange={(value) =>
                      handleInputChange('property_type', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_surface">Surface (m²)</Label>
                  <Input
                    id="property_surface"
                    type="number"
                    placeholder="120"
                    value={formData.property_surface}
                    onChange={(e) =>
                      handleInputChange('property_surface', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="property_address">
                    Adresse complète du bien
                  </Label>
                  <Input
                    id="property_address"
                    placeholder="123 Rue de la République, 75001 Paris"
                    value={formData.property_address}
                    onChange={(e) =>
                      handleInputChange('property_address', e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Budget et Délais */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Budget et Délais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Budget minimum (€)</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    placeholder="5000"
                    value={formData.budget_min}
                    onChange={(e) =>
                      handleInputChange('budget_min', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Budget maximum (€)</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    placeholder="15000"
                    value={formData.budget_max}
                    onChange={(e) =>
                      handleInputChange('budget_max', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgence</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) =>
                      handleInputChange('urgency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner l'urgence" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Basse</SelectItem>
                      <SelectItem value="medium">Moyenne</SelectItem>
                      <SelectItem value="high">Haute</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="urgency">Type de projet</Label>
                  <Select
                    value={formData.urgency}
                    onValueChange={(value) =>
                      handleInputChange('urgency', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner le type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Neuf</SelectItem>
                      <SelectItem value="renovation">Rénovation</SelectItem>
                      <SelectItem value="extension">Extension</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desired_start_date">
                    Date de début souhaitée
                  </Label>
                  <Input
                    id="desired_start_date"
                    type="date"
                    value={formData.desired_start_date}
                    onChange={(e) =>
                      handleInputChange('desired_start_date', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desired_deadline">
                    Date limite souhaitée
                  </Label>
                  <Input
                    id="desired_deadline"
                    type="date"
                    value={formData.desired_deadline}
                    onChange={(e) =>
                      handleInputChange('desired_deadline', e.target.value)
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={() => router.back()}>
                Annuler
              </Button>
              <Button onClick={handleSubmit} disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Créer le projet
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Dialog de succès */}
        <Dialog open={successDialog} onOpenChange={setSuccessDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Projet créé avec succès
              </DialogTitle>
              <DialogDescription>
                Le projet a été créé et publié. Les professionnels peuvent
                maintenant y candidater.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  ID du projet: {createdProjectId}
                </AlertDescription>
              </Alert>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSuccessDialog(false)}>
                Fermer
              </Button>
              <Button onClick={() => router.push(`/admin/projects`)}>
                Voir les projets
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AdminLayout>
    </>
  );
}
