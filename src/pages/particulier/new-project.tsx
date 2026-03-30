import { SEO } from "@/components/SEO";
import { useState } from "react";
import { authService } from "@/services/authService";
import { projectService } from "@/services/projectService";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, MapPin, Calendar, DollarSign, AlertCircle, Home } from "lucide-react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import Image from 'next/image';

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [aiEstimation, setAiEstimation] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    city: "",
    postal_code: "",
    estimated_budget_min: "",
    estimated_budget_max: "",
    desired_start_period: "",
    urgency: "normal" as "low" | "normal" | "high",
    surface: "",
    property_type: "",
  });

  const workDeadlines = ["Moins de 1 mois", "1-2 mois", "2-3 mois", "3-6 mois", "Plus de 6 mois"];

  const propertyTypes = ["Appartement", "Maison", "Studio", "Villa", "Local commercial", "Garage", "Cave", "Autre"];

  const categories = [
    "Rénovation complète", "Rénovation partielle", "Construction neuve", "Extension",
    "Électricité", "Plomberie", "Menuiserie", "Peinture", "Cuisine", "Salle de bain",
    "Toiture", "Isolation", "Carrelage/Sols", "CVC/Chauffage", "Aménagement",
    "Jardin/Paysage", "Piscine", "Terrasse/Balcon", "Clôture/Portail",
    "Surélévation", "Décoration", "Rénovation énergétique", "Démolition/Gros œuvre", "Autre"
  ];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray].slice(0, 10));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const session = await authService.getCurrentSession();
      if (!session) {
        router.push('/particulier/inscription');
        return;
      }
      if (!formData.title || formData.title.length < 3) throw new Error("Le titre doit contenir au moins 3 caractères");
      if (!formData.description || formData.description.length < 20) throw new Error("La description doit contenir au moins 20 caractères");
      if (!formData.category) throw new Error("Veuillez sélectionner une catégorie");
      if (!formData.city || formData.city.length < 2) throw new Error("Veuillez entrer une ville valide");
      if (!formData.surface || parseFloat(formData.surface) <= 0) throw new Error("Veuillez entrer une surface valide");
      if (!formData.property_type) throw new Error("Veuillez sélectionner un type de bien");
      if (!formData.estimated_budget_min || !formData.estimated_budget_max) throw new Error("Veuillez renseigner un budget minimum et maximum");
      const budgetMin = parseFloat(formData.estimated_budget_min);
      const budgetMax = parseFloat(formData.estimated_budget_max);
      if (isNaN(budgetMin) || isNaN(budgetMax) || budgetMin <= 0 || budgetMax <= 0) throw new Error("Les budgets doivent être des nombres positifs");
      if (budgetMin >= budgetMax) throw new Error("Le budget minimum doit être inférieur au budget maximum");
      if (selectedFiles.length > 10) throw new Error("Maximum 10 fichiers autorisés");
      for (const file of selectedFiles) {
        if (file.size > 5 * 1024 * 1024) throw new Error(`Le fichier ${file.name} est trop volumineux (max 5MB)`);
      }
      const project = await projectService.createProject({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        city: formData.city,
        postal_code: formData.postal_code,
        estimated_budget_min: parseFloat(formData.estimated_budget_min),
        estimated_budget_max: parseFloat(formData.estimated_budget_max),
        desired_start_period: formData.desired_start_period,
        urgency: formData.urgency,
        surface: parseFloat(formData.surface),
        property_type: formData.property_type,
        status: "pending",
        ai_analysis: aiEstimation,
      });
      if (project.error) throw new Error(project.error.message);
      if (selectedFiles.length > 0 && project.data && project.data.id) {
        const uploadResult = await projectService.uploadProjectImages(project.data.id, selectedFiles);
        if (uploadResult.error) throw new Error(uploadResult.error.message);
      }
      if (project.data && project.data.id) setCreatedProjectId(project.data.id);
      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const calculateAIEstimation = async () => {
    console.log('🚀 calculateAIEstimation called');
    if (!formData.description || formData.description.length < 20) {
      console.log('❌ Description too short');
      setError("Veuillez décrire votre projet en détail pour obtenir une estimation IA");
      return;
    }
    console.log('✅ Description valid, starting API call...');
    setIsCalculating(true);
    try {
      const response = await fetch('/api/ai-estimation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          category: formData.category,
          city: formData.city,
          estimated_budget_min: formData.estimated_budget_min,
          estimated_budget_max: formData.estimated_budget_max,
          surface: parseFloat(formData.surface) || undefined,
          type_bien: formData.property_type,
        }),
      });
      console.log('📡 API response status:', response.status);
      console.log('📡 API response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('📡 Raw response text:', responseText);
      
      // Vérifier si c'est du HTML (page d'erreur)
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        console.log('❌ HTML response received - API error page');
        throw new Error('L\'API a retourné une page d\'erreur. Vérifiez les logs du serveur.');
      }
      
      const data = JSON.parse(responseText);
      console.log('📊 API response data:', data);
      if (data.error) {
        console.log('❌ API error:', data.error);
        throw new Error(data.error);
      }
      if (data.success && (data.estimatedCost || data.estimation?.estimation_min)) {
        const estimation = data.estimatedCost || data.estimation.estimation_min;
        console.log('✅ Estimation received:', estimation);
        setAiEstimation(estimation);
      } else {
        console.log('❌ No estimation in response');
        throw new Error("Impossible d'obtenir une estimation");
      }
    } catch (err: any) {
      console.error('❌ AI Estimation Error:', err);
      setError(err.message || "Erreur lors de l'estimation IA");
    } finally {
      console.log('🏁 Calculation finished');
      setIsCalculating(false);
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setCreatedProjectId(null);
    setAiEstimation(null);
    setSelectedFiles([]);
    setLoading(false);
    setFormData({
      title: '',
      description: '',
      category: '',
      city: '',
      postal_code: '',
      estimated_budget_min: '',
      estimated_budget_max: '',
      desired_start_period: '',
      urgency: 'normal',
      surface: '',
      property_type: '',
    });
  };

  return (
    <ProtectedRoute>
      <SEO
        title="Nouveau Projet - SwipeTonPro"
        description="Créez votre projet de travaux et trouvez le professionnel idéal"
      />
      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        <header className="border-b border-border bg-surface-elevated/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/particulier/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour au tableau de bord
              </Button>
            </Link>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Card className="border-2">
            <CardHeader>
              {!success && (
                <>
                  <CardTitle className="text-3xl font-bold">Créer un nouveau projet</CardTitle>
                  <p className="text-text-secondary mt-2">
                    Décrivez votre projet en détail pour recevoir les meilleures offres de nos professionnels certifiés
                  </p>
                </>
              )}
            </CardHeader>

            <CardContent>

              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{error}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setError(null); setLoading(false); }}
                      className="ml-4 hover:bg-destructive/20"
                    >
                      ✕
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-success bg-success/10">
                  <AlertDescription className="text-success">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">🎉 Votre projet a été créé avec succès !</h3>
                        <p className="text-sm mt-1">Il est en attente de validation par notre équipe.</p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-md">
                        <p className="text-sm font-medium">Récapitulatif :</p>
                        <ul className="text-sm mt-2 space-y-1">
                          <li>• Titre : {formData.title}</li>
                          <li>• Catégorie : {formData.category}</li>
                          <li>• Budget : {formData.estimated_budget_min}€ - {formData.estimated_budget_max}€</li>
                          <li>• Ville : {formData.city}</li>
                          {aiEstimation && (
                            <li>• Estimation IA : {aiEstimation}€</li>
                          )}
                          {selectedFiles.length > 0 && (
                            <li>• Fichiers joints : {selectedFiles.length}</li>
                          )}
                        </ul>
                      </div>
                      <div className="bg-green-50 p-3 rounded-md border border-green-200">
                        <p className="text-sm font-medium text-green-800">
                          ✅ <strong>Ce qui se passe maintenant :</strong>
                        </p>
                        <ol className="text-sm mt-2 space-y-1 text-green-700">
                          <li>1. Notre équipe examine votre projet dans les 24h</li>
                          <li>2. Vous recevrez un email une fois validé</li>
                          <li>3. Les professionnels pourront alors faire des offres</li>
                        </ol>
                      </div>
                      <div className="flex gap-3 mt-6">
                        <Button onClick={() => router.push('/particulier/dashboard')} className="flex-1">
                          Retour au dashboard
                        </Button>
                        <Button onClick={resetForm} variant="outline" className="flex-1">
                          Créer un autre projet
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {!success && (
                <form onSubmit={handleSubmit} className="space-y-6">

                  <div className="space-y-2">
                    <Label htmlFor="title">Titre du projet *</Label>
                    <Input
                      id="title"
                      placeholder="Ex: Rénovation salle de bain complète"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Catégorie *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      disabled={loading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez une catégorie" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 overflow-y-auto">
                        {categories.map((cat, index) => (
                          <SelectItem key={cat} value={cat} className={index < 5 ? 'bg-orange-50 font-semibold' : ''}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description détaillée *</Label>
                    <Textarea
                      id="description"
                      placeholder="Décrivez votre projet en détail : surface, matériaux souhaités, contraintes particulières..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      rows={6}
                      required
                      disabled={loading}
                    />
                    <p className="text-sm text-text-muted">
                      Plus votre description est détaillée, meilleures seront les offres que vous recevrez
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Ville *
                      </Label>
                      <Input
                        id="city"
                        placeholder="Ex: Paris"
                        value={formData.city}
                        onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Code Postal *</Label>
                      <Input
                        id="postal_code"
                        placeholder="Ex: 75001"
                        value={formData.postal_code}
                        onChange={(e) => setFormData(prev => ({ ...prev, postal_code: e.target.value }))}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="property_type">
                        <Home className="w-4 h-4 inline mr-2" />
                        Type de bien *
                      </Label>
                      <Select
                        value={formData.property_type}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, property_type: value }))}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez un type de bien" />
                        </SelectTrigger>
                        <SelectContent>
                          {propertyTypes.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="surface">
                        <MapPin className="w-4 h-4 inline mr-2" />
                        Surface (m²) *
                      </Label>
                      <Input
                        id="surface"
                        type="number"
                        placeholder="Ex: 50"
                        value={formData.surface}
                        onChange={(e) => setFormData(prev => ({ ...prev, surface: e.target.value }))}
                        required
                        disabled={loading}
                        min="1"
                        step="0.1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="budget_min">
                        <DollarSign className="w-4 h-4 inline mr-2" />
                        Budget minimum (€) *
                      </Label>
                      <Input
                        id="budget_min"
                        type="number"
                        placeholder="1000"
                        value={formData.estimated_budget_min}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_budget_min: e.target.value }))}
                        required
                        disabled={loading}
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="budget_max">Budget maximum (€) *</Label>
                      <Input
                        id="budget_max"
                        type="number"
                        placeholder="5000"
                        value={formData.estimated_budget_max}
                        onChange={(e) => setFormData(prev => ({ ...prev, estimated_budget_max: e.target.value }))}
                        required
                        disabled={loading}
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start_period">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        Période souhaitée pour les travaux *
                      </Label>
                      <Select
                        value={formData.desired_start_period}
                        onValueChange={(value) => setFormData(prev => ({ ...prev, desired_start_period: value }))}
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez une période" />
                        </SelectTrigger>
                        <SelectContent>
                          {workDeadlines.map(period => (
                            <SelectItem key={period} value={period}>{period}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="urgency">Urgence</Label>
                      <Select
                        value={formData.urgency}
                        onValueChange={(value: "low" | "normal" | "high") =>
                          setFormData(prev => ({ ...prev, urgency: value }))
                        }
                        disabled={loading}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Basse (flexible)</SelectItem>
                          <SelectItem value="normal">Normale</SelectItem>
                          <SelectItem value="high">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="include_estimation"
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                        disabled={loading}
                        onChange={(e) => {
                          console.log('🤖 Checkbox clicked:', e.target.checked);
                          if (e.target.checked) {
                            console.log('🔄 Starting AI estimation...');
                            calculateAIEstimation();
                          }
                        }}
                      />
                      <Label htmlFor="include_estimation" className="text-sm">
                        Obtenir une estimation IA gratuite (recommandé)
                      </Label>
                    </div>
                    {isCalculating && (
                      <p className="text-xs text-blue-500">🤖 Calcul en cours...</p>
                    )}
                    {aiEstimation && (
                      <p className="text-xs text-green-600">✅ Estimation : {aiEstimation}€</p>
                    )}
                    <p className="text-xs text-gray-500">
                      Notre IA analysera votre projet pour vous donner une estimation précise du budget et des délais
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="images">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Photos (optionnel, max 10)
                    </Label>
                    <p className="text-xs text-gray-500 mb-2">
                      Ajoutez des photos pour aider les professionnels à mieux comprendre votre projet
                    </p>
                    <Input
                      id="images"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileSelect}
                      disabled={loading || selectedFiles.length >= 10}
                    />
                    {selectedFiles.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-4">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="relative group">
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              width={500}
                              height={300}
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      size="lg"
                      className="flex-1 gradient-primary text-white"
                      disabled={loading}
                    >
                      {loading ? "Création en cours..." : "Publier le projet"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="lg"
                      onClick={() => router.back()}
                      disabled={loading}
                    >
                      Annuler
                    </Button>
                  </div>

                </form>
              )}

            </CardContent>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
