import { SEO } from "@/components/SEO";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { authService } from '@/services/authService';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Briefcase,
  Star,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  Save,
  Upload,
  FileText,
  Download,
  RefreshCw,
  ArrowLeft,
  Trash2,
  Plus,
  Badge,
  Eye,
  Globe,
  Linkedin
} from 'lucide-react';
import { Facebook, Instagram } from "lucide-react";

const tableMap: Record<string, string> = {
  'siret': 'professional_documents',
  'insurance': 'professional_documents', 
  'certification': 'professional_certifications',
  'portfolio': 'professional_portfolio',
  'other': 'professional_documents'
};

// Types pour les données
interface ProfessionalDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploaded_at: string;
  verified: boolean;
}

interface ProfessionalReference {
  id: string;
  client_name: string;
  project_title: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProfessionalCertification {
  id: string;
  name: string;
  organization: string;
  date_obtained: string;
  expiry_date?: string;
  url?: string;
}

export default function ProfessionalProfileEnhanced() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const [profile, setProfile] = useState({
    email: "",
    companyName: "",
    siret: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    description: "",
    verificationStatus: "pending" as "pending" | "validated" | "rejected",
    rating: 0,
    completedProjects: 0,
    memberSince: "",
    website: "",
    linkedin: "",
    facebook: "",
    instagram: "",
    activities: [] as string[],
    workAreas: [] as string[],
    // Nouveaux champs
    profilePhoto: "",
    birthDate: "",
    vatNumber: "",
    companySize: "",
    experienceYears: 0,
    interventionRadius: 50,
    languages: [] as string[],
    // Champs identité et rôle
    firstName: "",
    lastName: "",
    position: "",
    department: "",
    // Champs revalidation
    revalidationRequested: false,
    revalidationDate: "",
    revalidationReason: ""
  });

  const [revalidationModal, setRevalidationModal] = useState(false);
  const [revalidationReason, setRevalidationReason] = useState("");

  const [documents, setDocuments] = useState<ProfessionalDocument[]>([]);
  const [references, setReferences] = useState<ProfessionalReference[]>([]);
  const [certifications, setCertifications] = useState<ProfessionalCertification[]>([]);

  useEffect(() => {
    const loadProfessionalProfile = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (!currentUser) {
          router.push('/auth/login');
          return;
        }

        setUser(currentUser);

        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        const { data: professional, error: professionalError } = await supabase
          .from('professionals')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (professionalError || userError) throw professionalError || userError;

        if (professional && userProfile) {
          setProfile({
            email: currentUser.email || "",
            companyName: (professional as any).company_name || "",
            siret: (professional as any).siret || "",
            phone: userProfile.phone || "",
            address: userProfile.address || "",
            city: userProfile.city || "",
            postalCode: userProfile.postal_code || "",
            description: (professional as any).description || "",
            verificationStatus: (professional as any).status as "pending" | "validated" | "rejected",
            rating: 0,
            completedProjects: 0,
            memberSince: new Date((professional as any).created_at).toLocaleDateString(),
            website: (professional as any).website || "",
            linkedin: (professional as any).linkedin || "",
            facebook: (professional as any).facebook || "",
            instagram: (professional as any).instagram || "",
            activities: (professional as any).activities || [],
            workAreas: (professional as any).work_areas || [],
            // Nouveaux champs
            profilePhoto: (professional as any).profile_photo || "",
            birthDate: (professional as any).birth_date || "",
            vatNumber: (professional as any).vat_number || "",
            companySize: (professional as any).company_size || "",
            experienceYears: (professional as any).experience_years || 0,
            interventionRadius: (professional as any).intervention_radius || 50,
            languages: (professional as any).languages || [],
            // Champs identité et rôle
            firstName: (userProfile as any).first_name || "",
            lastName: (userProfile as any).last_name || "",
            position: (professional as any).job_position || "",
            department: (professional as any).department || "",
            // Champs revalidation
            revalidationRequested: (professional as any).revalidation_requested || false,
            revalidationDate: (professional as any).revalidation_date || "",
            revalidationReason: (professional as any).revalidation_reason || ""
          });
        }

        // Charger les documents
        await loadDocuments(currentUser.id);
        await loadReferences(currentUser.id);
        await loadCertifications(currentUser.id);

      } catch (error) {
        console.error('Erreur chargement profil:', error);
      }
    };

    loadProfessionalProfile();
  }, []);

  const loadDocuments = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('professional_documents')
        .select('*')
        .eq('professional_id', userId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Erreur chargement documents:', error);
    }
  };

  const loadReferences = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('professional_references')
        .select('*')
        .eq('professional_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      setReferences(data || []);
    } catch (error) {
      console.error('Erreur chargement références:', error);
    }
  };

  const loadCertifications = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .from('professional_certifications')
        .select('*')
        .eq('professional_id', userId)
        .order('date_obtained', { ascending: false });

      if (error) throw error;
      setCertifications(data || []);
    } catch (error) {
      console.error('Erreur chargement certifications:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      // Éviter les conflits en utilisant une seule transaction
      const professionalUpdateData: any = {
        company_name: profile.companyName || null,
        siret: profile.siret || null,
        description: profile.description || null,
        website: profile.website || null,
        linkedin: profile.linkedin || null,
        facebook: profile.facebook || null,
        instagram: profile.instagram || null,
        activities: profile.activities || [],
        work_areas: profile.workAreas || [],
        // Nouveaux champs
        profile_photo: profile.profilePhoto || null,
        birth_date: profile.birthDate || null,
        vat_number: profile.vatNumber || null,
        company_size: profile.companySize || null,
        experience_years: profile.experienceYears || 0,
        intervention_radius: profile.interventionRadius || 50,
        languages: profile.languages || [],
        // Champs identité et rôle
        job_position: profile.position || null,
        department: profile.department || null,
        // Champs revalidation
        revalidation_requested: profile.revalidationRequested || null,
        revalidation_date: profile.revalidationDate || null,
        revalidation_reason: profile.revalidationReason || null,
        updated_at: new Date().toISOString()
      };

      // Mettre à jour les deux tables séquentiellement
      const { error: professionalError } = await supabase
        .from('professionals')
        .update(professionalUpdateData)
        .eq('user_id', currentUser.id);

      if (professionalError) {
        throw professionalError;
      }

      const { error: userError } = await supabase
        .from('profiles')
        .update({
          phone: profile.phone || null,
          address: profile.address || null,
          city: profile.city || null,
          postal_code: profile.postalCode || null,
          // Champs identité
          first_name: profile.firstName || null,
          last_name: profile.lastName || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (userError) {
        throw userError;
      }

      setSuccess(true);
      setEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRevalidationRequest = async () => {
    if (!revalidationReason.trim()) {
      alert('Veuillez indiquer la raison de votre demande de revalidation');
      return;
    }

    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      const { error: professionalError } = await supabase
        .from('professionals')
        .update({
          revalidation_requested: true,
          revalidation_date: new Date().toISOString(),
          revalidation_reason: revalidationReason,
          previous_status: profile.verificationStatus,
          status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', currentUser.id);

      if (professionalError) throw professionalError;

      // Ajouter à l'historique
      const { error: historyError } = await (supabase as any)
        .from('professional_validation_history')
        .insert({
          professional_id: currentUser.id,
          status: 'pending',
          reason: revalidationReason,
          created_at: new Date().toISOString()
        });

      if (historyError) throw historyError;

      setProfile(prev => ({
        ...prev,
        verificationStatus: 'pending',
        revalidationRequested: true,
        revalidationDate: new Date().toISOString(),
        revalidationReason: revalidationReason
      }));

      setRevalidationModal(false);
      setRevalidationReason('');
      alert('Votre demande de revalidation a été soumise avec succès');
    } catch (error) {
      console.error('Erreur demande de revalidation:', error);
      alert('Erreur lors de la soumission de la demande');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) return;

      for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${currentUser.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        const { error: insertError } = await (supabase as any)
          .from(tableMap[type as keyof typeof tableMap])
          .insert({
            professional_id: currentUser.id,
            name: file.name,
            type: type,
            url: publicUrl,
            uploaded_at: new Date().toISOString(),
            verified: false
          });

        if (insertError) {
          console.error('DB error:', insertError);
          throw insertError;
        }
      }

      await loadDocuments(currentUser.id);
    } catch (error) {
      console.error('Erreur upload:', error);
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('professional_documents')
        .delete()
        .eq('id', docId);

      if (error) throw error;
      
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        await loadDocuments(currentUser.id);
      }
    } catch (error) {
      console.error('Erreur suppression document:', error);
    }
  };

  const addReference = () => {
    setReferences(prev => [...prev, {
      id: Date.now().toString(),
      client_name: "",
      project_title: "",
      rating: 5,
      comment: "",
      date: new Date().toISOString().split('T')[0]
    }]);
  };

  const updateReference = (index: number, field: string, value: any) => {
    setReferences(prev => prev.map((ref, i) => 
      i === index ? { ...ref, [field]: value } : ref
    ));
  };

  const removeReference = (index: number) => {
    setReferences(prev => prev.filter((_, i) => i !== index));
  };

  const addCertification = () => {
    setCertifications(prev => [...prev, {
      id: Date.now().toString(),
      name: "",
      organization: "",
      date_obtained: "",
      expiry_date: "",
      url: ""
    }]);
  };

  const updateCertification = (index: number, field: string, value: string) => {
    setCertifications(prev => prev.map((cert, i) => 
      i === index ? { ...cert, [field]: value } : cert
    ));
  };

  const removeCertification = (index: number) => {
    setCertifications(prev => prev.filter((_, i) => i !== index));
  };

  const addActivity = () => {
    setProfile(prev => ({
      ...prev,
      activities: [...prev.activities, ""]
    }));
  };

  const updateActivity = (index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      activities: prev.activities.map((act, i) => i === index ? value : act)
    }));
  };

  const removeActivity = (index: number) => {
    setProfile(prev => ({
      ...prev,
      activities: prev.activities.filter((_, i) => i !== index)
    }));
  };

  const addWorkArea = () => {
    setProfile(prev => ({
      ...prev,
      workAreas: [...prev.workAreas, ""]
    }));
  };

  const updateWorkArea = (index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      workAreas: prev.workAreas.map((area, i) => i === index ? value : area)
    }));
  };

  const removeWorkArea = (index: number) => {
    setProfile(prev => ({
      ...prev,
      workAreas: prev.workAreas.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    setProfile(prev => ({
      ...prev,
      languages: [...prev.languages, ""]
    }));
  };

  const updateLanguage = (index: number, value: string) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.map((lang, i) => i === index ? value : lang)
    }));
  };

  const removeLanguage = (index: number) => {
    setProfile(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const documentTypes = [
    { id: 'kbis', name: 'KBIS / Extrait K', description: 'Document officiel de l\'entreprise' },
    { id: 'insurance', name: 'Assurance professionnelle', description: 'Attestation d\'assurance RC Pro' },
    { id: 'certification', name: 'Certifications', description: 'Qualifications professionnelles' },
    { id: 'portfolio', name: 'Portfolio travaux', description: 'Photos de réalisations' },
    { id: 'other', name: 'Autres documents', description: 'Documents complémentaires' }
  ];

  return (
    <ProtectedRoute>
      <SEO title="Mon Profil Professionnel - SwipeTonPro" />
      
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <Link href="/professionnel/dashboard" className="mr-4">
                  <ArrowLeft className="h-5 w-5 text-gray-600 hover:text-gray-900" />
                </Link>
                <h1 className="text-xl font-semibold text-gray-900">Mon Profil</h1>
              </div>
              <div className="flex items-center space-x-4">
                {success && (
                  <div className="flex items-center text-green-600 text-sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Profil mis à jour avec succès
                  </div>
                )}
                {profile.verificationStatus === "rejected" && !profile.revalidationRequested && (
                  <Button onClick={() => setRevalidationModal(true)} variant="outline" className="border-orange-500 text-orange-600 hover:bg-orange-50">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Demander une revalidation
                  </Button>
                )}
                {editing ? (
                  <Button onClick={handleSave} disabled={loading} className="gradient-primary text-white">
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? "Enregistrement..." : "Enregistrer"}
                  </Button>
                ) : (
                  <Button onClick={() => setEditing(true)} variant="outline">
                    <Edit2 className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header avec photo de profil */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center space-x-6">
                <div className="relative">
                  {profile.profilePhoto ? (
                    <img 
                      src={profile.profilePhoto} 
                      alt="Photo de profil" 
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  {editing && (
                    <Button size="sm" className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0">
                      <Upload className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">{profile.companyName}</h2>
                      <p className="text-gray-600">{profile.email}</p>
                      <p className="text-sm text-gray-600">
                        {profile.firstName} {profile.lastName} 
                        {profile.position && ` - ${profile.position}`}
                        {profile.department && ` (${profile.department})`}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        profile.verificationStatus === "validated" ? "bg-green-100 text-green-800" : 
                        profile.verificationStatus === "pending" ? "bg-orange-100 text-orange-800" : "bg-red-100 text-red-800"
                      }`}>
                        {profile.verificationStatus === "validated" ? (
                          <><CheckCircle className="h-4 w-4 mr-1" /> Vérifié</>
                        ) : profile.verificationStatus === "pending" ? (
                          <><Clock className="h-4 w-4 mr-1" /> En attente</>
                        ) : (
                          <><AlertCircle className="h-4 w-4 mr-1" /> Rejeté</>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">Membre depuis {profile.memberSince}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Informations professionnelles */}
              <Card>
                <CardHeader>
                  <CardTitle>Informations professionnelles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      {editing ? (
                        <Input
                          value={profile.firstName}
                          onChange={(e) => setProfile(prev => ({ ...prev, firstName: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.firstName}</p>
                      )}
                    </div>
                    <div>
                      <Label>Nom</Label>
                      {editing ? (
                        <Input
                          value={profile.lastName}
                          onChange={(e) => setProfile(prev => ({ ...prev, lastName: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Poste dans l'entreprise</Label>
                      {editing ? (
                        <Input
                          value={profile.position}
                          onChange={(e) => setProfile(prev => ({ ...prev, position: e.target.value }))}
                          placeholder="Ex: Gérant, Directeur technique..."
                        />
                      ) : (
                        <p className="text-gray-900">{profile.position || "Non renseigné"}</p>
                      )}
                    </div>
                    <div>
                      <Label>Département/Service</Label>
                      {editing ? (
                        <Input
                          value={profile.department}
                          onChange={(e) => setProfile(prev => ({ ...prev, department: e.target.value }))}
                          placeholder="Ex: Technique, Commercial..."
                        />
                      ) : (
                        <p className="text-gray-900">{profile.department || "Non renseigné"}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nom de l'entreprise</Label>
                      {editing ? (
                        <Input
                          value={profile.companyName}
                          onChange={(e) => setProfile(prev => ({ ...prev, companyName: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.companyName}</p>
                      )}
                    </div>
                    <div>
                      <Label>SIRET</Label>
                      {editing ? (
                        <Input
                          value={profile.siret}
                          onChange={(e) => setProfile(prev => ({ ...prev, siret: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.siret}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Téléphone</Label>
                      {editing ? (
                        <Input
                          value={profile.phone}
                          onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.phone}</p>
                      )}
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-gray-900">{profile.email}</p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label>Adresse</Label>
                      {editing ? (
                        <Input
                          value={profile.address}
                          onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.address}</p>
                      )}
                    </div>
                    <div>
                      <Label>Ville</Label>
                      {editing ? (
                        <Input
                          value={profile.city}
                          onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.city}</p>
                      )}
                    </div>
                    <div>
                      <Label>Code postal</Label>
                      {editing ? (
                        <Input
                          value={profile.postalCode}
                          onChange={(e) => setProfile(prev => ({ ...prev, postalCode: e.target.value }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.postalCode}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>TVA (si applicable)</Label>
                      {editing ? (
                        <Input
                          value={profile.vatNumber}
                          onChange={(e) => setProfile(prev => ({ ...prev, vatNumber: e.target.value }))}
                          placeholder="FR12345678901"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.vatNumber || "Non renseigné"}</p>
                      )}
                    </div>
                    <div>
                      <Label>Effectif entreprise</Label>
                      {editing ? (
                        <select
                          value={profile.companySize}
                          onChange={(e) => setProfile(prev => ({ ...prev, companySize: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Sélectionner...</option>
                          <option value="1">1 personne</option>
                          <option value="2-5">2-5 personnes</option>
                          <option value="6-10">6-10 personnes</option>
                          <option value="11-20">11-20 personnes</option>
                          <option value="20+">Plus de 20 personnes</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile.companySize || "Non renseigné"}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Années d'expérience</Label>
                      {editing ? (
                        <Input
                          type="number"
                          value={profile.experienceYears}
                          onChange={(e) => setProfile(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.experienceYears} ans</p>
                      )}
                    </div>
                    <div>
                      <Label>Rayon d'intervention (km)</Label>
                      {editing ? (
                        <Input
                          type="number"
                          value={profile.interventionRadius}
                          onChange={(e) => setProfile(prev => ({ ...prev, interventionRadius: parseInt(e.target.value) || 50 }))}
                        />
                      ) : (
                        <p className="text-gray-900">{profile.interventionRadius} km</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label>Description</Label>
                    {editing ? (
                      <textarea
                        className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        rows={4}
                        value={profile.description}
                        onChange={(e) => setProfile(prev => ({ ...prev, description: e.target.value }))}
                        disabled={!editing}
                        placeholder="Décrivez votre entreprise et vos services..."
                      />
                    ) : (
                      <p className="text-gray-900">{profile.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Réseaux sociaux */}
              <Card>
                <CardHeader>
                  <CardTitle>Réseaux sociaux</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="flex items-center">
                        <Globe className="h-4 w-4 mr-2" />
                        Site web
                      </Label>
                      {editing ? (
                        <Input
                          value={profile.website}
                          onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                          placeholder="https://..."
                        />
                      ) : (
                        <p className="text-gray-900">{profile.website || "Non renseigné"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="flex items-center">
                        <Linkedin className="h-4 w-4 mr-2" />
                        LinkedIn
                      </Label>
                      {editing ? (
                        <Input
                          value={profile.linkedin}
                          onChange={(e) => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                          placeholder="https://linkedin.com/..."
                        />
                      ) : (
                        <p className="text-gray-900">{profile.linkedin || "Non renseigné"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="flex items-center">
                        <Facebook className="h-4 w-4 mr-2" />
                        Facebook
                      </Label>
                      {editing ? (
                        <Input
                          value={profile.facebook}
                          onChange={(e) => setProfile(prev => ({ ...prev, facebook: e.target.value }))}
                          placeholder="https://facebook.com/..."
                        />
                      ) : (
                        <p className="text-gray-900">{profile.facebook || "Non renseigné"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="flex items-center">
                        <Instagram className="h-4 w-4 mr-2" />
                        Instagram
                      </Label>
                      {editing ? (
                        <Input
                          value={profile.instagram}
                          onChange={(e) => setProfile(prev => ({ ...prev, instagram: e.target.value }))}
                          placeholder="https://instagram.com/..."
                        />
                      ) : (
                        <p className="text-gray-900">{profile.instagram || "Non renseigné"}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Langues */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Langues parlées</CardTitle>
                    {editing && (
                      <Button onClick={addLanguage} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.languages.map((language, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {editing ? (
                        <>
                          <Input
                            value={language}
                            onChange={(e) => updateLanguage(index, e.target.value)}
                            placeholder="Langue..."
                          />
                          <Button
                            onClick={() => removeLanguage(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{language}</span>
                      )}
                    </div>
                  ))}
                  {profile.languages.length === 0 && !editing && (
                    <p className="text-gray-500">Aucune langue renseignée</p>
                  )}
                </CardContent>
              </Card>

              {/* Activités */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Activités</CardTitle>
                    {editing && (
                      <Button onClick={addActivity} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.activities.map((activity, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {editing ? (
                        <>
                          <Input
                            value={activity}
                            onChange={(e) => updateActivity(index, e.target.value)}
                            placeholder="Type d'activité..."
                          />
                          <Button
                            onClick={() => removeActivity(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-sm">{activity}</span>
                      )}
                    </div>
                  ))}
                  {profile.activities.length === 0 && !editing && (
                    <p className="text-gray-500">Aucune activité renseignée</p>
                  )}
                </CardContent>
              </Card>

              {/* Zones d'intervention */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Zones d'intervention
                    </CardTitle>
                    {editing && (
                      <Button onClick={addWorkArea} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.workAreas.map((area, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {editing ? (
                        <>
                          <Input
                            value={area}
                            onChange={(e) => updateWorkArea(index, e.target.value)}
                            placeholder="Zone d'intervention..."
                          />
                          <Button
                            onClick={() => removeWorkArea(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="px-2 py-1 border border-gray-300 text-gray-800 rounded text-sm">{area}</span>
                      )}
                    </div>
                  ))}
                  {profile.workAreas.length === 0 && !editing && (
                    <p className="text-gray-500">Aucune zone d'intervention renseignée</p>
                  )}
                </CardContent>
              </Card>

              {/* Références clients */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Références clients</CardTitle>
                    {editing && (
                      <Button onClick={addReference} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {references.map((reference, index) => (
                    <div key={reference.id} className="border rounded-lg p-4 space-y-3">
                      {editing && (
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Référence {index + 1}</h4>
                          <Button
                            onClick={() => removeReference(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nom du client</Label>
                          {editing ? (
                            <Input
                              value={reference.client_name}
                              onChange={(e) => updateReference(index, 'client_name', e.target.value)}
                            />
                          ) : (
                            <p className="text-gray-900">{reference.client_name}</p>
                          )}
                        </div>
                        <div>
                          <Label>Titre du projet</Label>
                          {editing ? (
                            <Input
                              value={reference.project_title}
                              onChange={(e) => updateReference(index, 'project_title', e.target.value)}
                            />
                          ) : (
                            <p className="text-gray-900">{reference.project_title}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <Label>Commentaire</Label>
                        {editing ? (
                          <textarea
                            className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            value={reference.comment}
                            onChange={(e) => updateReference(index, 'comment', e.target.value)}
                            disabled={!editing}
                          />
                        ) : (
                          <p className="text-gray-900">{reference.comment}</p>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <div>
                          <Label>Note</Label>
                          {editing ? (
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => updateReference(index, 'rating', star)}
                                  className={`p-1 ${star <= reference.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                  <Star className="h-4 w-4 fill-current" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${star <= reference.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <Label>Date</Label>
                          {editing ? (
                            <Input
                              type="date"
                              value={reference.date}
                              onChange={(e) => updateReference(index, 'date', e.target.value)}
                            />
                          ) : (
                            <p className="text-gray-900">{reference.date}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {references.length === 0 && !editing && (
                    <p className="text-gray-500">Aucune référence client</p>
                  )}
                </CardContent>
              </Card>

              {/* Certifications */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Certifications professionnelles</CardTitle>
                    {editing && (
                      <Button onClick={addCertification} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {certifications.map((certification, index) => (
                    <div key={certification.id} className="border rounded-lg p-4 space-y-3">
                      {editing && (
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Certification {index + 1}</h4>
                          <Button
                            onClick={() => removeCertification(index)}
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Nom de la certification</Label>
                          {editing ? (
                            <Input
                              value={certification.name}
                              onChange={(e) => updateCertification(index, 'name', e.target.value)}
                            />
                          ) : (
                            <p className="text-gray-900">{certification.name}</p>
                          )}
                        </div>
                        <div>
                          <Label>Organisme</Label>
                          {editing ? (
                            <Input
                              value={certification.organization}
                              onChange={(e) => updateCertification(index, 'organization', e.target.value)}
                            />
                          ) : (
                            <p className="text-gray-900">{certification.organization}</p>
                          )}
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Date d'obtention</Label>
                          {editing ? (
                            <Input
                              type="date"
                              value={certification.date_obtained}
                              onChange={(e) => updateCertification(index, 'date_obtained', e.target.value)}
                            />
                          ) : (
                            <p className="text-gray-900">{certification.date_obtained}</p>
                          )}
                        </div>
                        <div>
                          <Label>Date d'expiration (si applicable)</Label>
                          {editing ? (
                            <Input
                              type="date"
                              value={certification.expiry_date || ''}
                              onChange={(e) => updateCertification(index, 'expiry_date', e.target.value)}
                            />
                          ) : (
                            <p className="text-gray-900">{certification.expiry_date || "N/A"}</p>
                          )}
                        </div>
                      </div>
                      {certification.url && (
                        <div>
                          <Label>Lien vers la certification</Label>
                          <a
                            href={certification.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            Voir la certification
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                  {certifications.length === 0 && !editing && (
                    <p className="text-gray-500">Aucune certification</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Colonne de droite */}
            <div className="space-y-6">
              {/* Documents */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Documents
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {editing && (
                    <div className="space-y-3">
                      {documentTypes.map((type) => (
                        <div key={type.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="font-medium">{type.name}</h4>
                              <p className="text-sm text-gray-600">{type.description}</p>
                            </div>
                          </div>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleFileUpload(e, type.id)}
                            className="w-full text-sm"
                            disabled={uploading}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                              {doc.verified && (
                                <span className="ml-2 text-green-600">
                                  <CheckCircle className="h-3 w-3 inline" /> Vérifié
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button size="sm" variant="outline" asChild>
                            <a href={doc.url} target="_blank" rel="noopener noreferrer">
                              <Eye className="h-3 w-3" />
                            </a>
                          </Button>
                          {editing && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteDocument(doc.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {documents.length === 0 && !editing && (
                    <p className="text-gray-500">Aucun document</p>
                  )}
                </CardContent>
              </Card>

              {/* Statistiques */}
              <Card>
                <CardHeader>
                  <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Note moyenne</span>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-orange-500 mr-1" />
                      <span className="font-semibold">{profile.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Projets complétés</span>
                    <span className="font-semibold">{profile.completedProjects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Références</span>
                    <span className="font-semibold">{references.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Certifications</span>
                    <span className="font-semibold">{certifications.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Documents</span>
                    <span className="font-semibold">{documents.length}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions rapides */}
              <Card>
                <CardHeader>
                  <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href="/professionnel/projects">
                    <Button variant="outline" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      Mes projets
                    </Button>
                  </Link>
                  <Link href="/professionnel/documents">
                    <Button variant="outline" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger modèles
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modal de demande de revalidation */}
        {revalidationModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Demander une revalidation</h3>
              <p className="text-gray-600 mb-4">
                Votre profil a été rejeté. Vous pouvez demander une nouvelle validation en expliquant les modifications apportées.
              </p>
              <div className="mb-4">
                <Label htmlFor="revalidationReason">Raison de la demande</Label>
                <textarea
                  id="revalidationReason"
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                  placeholder="Expliquez les modifications apportées à votre profil..."
                  value={revalidationReason}
                  onChange={(e) => setRevalidationReason(e.target.value)}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRevalidationModal(false);
                    setRevalidationReason('');
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleRevalidationRequest}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Soumettre la demande
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
