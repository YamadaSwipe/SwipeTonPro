import { SEO } from '@/components/SEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Upload,
  Shield,
  CheckCircle,
  AlertCircle,
  FileText,
  Mail,
  Loader2,
  XCircle,
  Building2,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import GoogleAuthButton from '@/components/GoogleAuthButton';

// ─── Types ────────────────────────────────────────────────────────────────────

type InscriptionStep =
  | 'auth'
  | 'info'
  | 'documents'
  | 'portfolio'
  | 'validation';
type SiretStatus = 'idle' | 'checking' | 'valid' | 'invalid' | 'error';

interface ProData {
  email: string;
  password: string;
  confirmPassword: string;
  // Infos gérant
  managerFirstName: string;
  managerLastName: string;
  // Infos entreprise
  company: string;
  siret: string;
  specialites: string[];
  description: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  // Documents
  documents: {
    kbis: File | null;
    insurance: File | null;
    certifications: File[];
  };
  // Portfolio
  portfolio: {
    photos: File[];
    clientContacts: { name: string; phone: string }[];
  };
}

const SPECIALITES = [
  'Rénovation complète',
  'Plomberie',
  'Électricité',
  'Peinture',
  'Carrelage',
  'Maçonnerie',
  'Menuiserie',
  'Isolation',
  'Chauffage',
  'Climatisation',
];

const STEP_LABELS: Record<InscriptionStep, string> = {
  auth: 'Création du compte',
  info: 'Informations entreprise',
  documents: 'Documents',
  portfolio: 'Portfolio',
  validation: 'Confirmation',
};

const STEP_ORDER: InscriptionStep[] = [
  'auth',
  'info',
  'documents',
  'portfolio',
  'validation',
];

export default function InscriptionProPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState<InscriptionStep>('auth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [siretStatus, setSiretStatus] = useState<SiretStatus>('idle');
  const [siretCompanyName, setSiretCompanyName] = useState('');

  const [proData, setProData] = useState<ProData>({
    email: '',
    password: '',
    confirmPassword: '',
    managerFirstName: '',
    managerLastName: '',
    company: '',
    siret: '',
    specialites: [],
    description: '',
    phone: '',
    address: '',
    city: '',
    postal_code: '',
    documents: { kbis: null, insurance: null, certifications: [] },
    portfolio: { photos: [], clientContacts: [] },
  });

  const STORAGE_KEY = 'pro_signup_progress';

  // ── Chargement depuis localStorage ─────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ne pas restaurer les mots de passe et documents fichiers
        setProData((prev) => ({
          ...prev,
          email: parsed.email || prev.email,
          managerFirstName: parsed.managerFirstName || '',
          managerLastName: parsed.managerLastName || '',
          company: parsed.company || '',
          siret: parsed.siret || '',
          specialites: parsed.specialites || [],
          description: parsed.description || '',
          phone: parsed.phone || '',
          address: parsed.address || '',
          city: parsed.city || '',
          postal_code: parsed.postal_code || '',
          portfolio: {
            photos: [], // fichiers non sauvegardables
            clientContacts: parsed.portfolio?.clientContacts || [],
          },
        }));
        if (parsed.currentStep && parsed.currentStep !== 'auth') {
          setCurrentStep(parsed.currentStep);
          toast({
            title: 'Progression restaurée',
            description: 'Vos informations ont été récupérées',
          });
        }
      } catch (e) {
        console.error('Erreur chargement localStorage:', e);
      }
    }
  }, [toast]);

  // ── Auto-save vers localStorage ──────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const dataToSave = {
      email: proData.email,
      managerFirstName: proData.managerFirstName,
      managerLastName: proData.managerLastName,
      company: proData.company,
      siret: proData.siret,
      specialites: proData.specialites,
      description: proData.description,
      phone: proData.phone,
      address: proData.address,
      city: proData.city,
      postal_code: proData.postal_code,
      portfolio: {
        clientContacts: proData.portfolio.clientContacts,
      },
      currentStep,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  }, [proData, currentStep]);

  // ── Nettoyage localStorage après soumission ────────────────────────────────
  const clearSavedProgress = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // ── Tracking des abandons ────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentStep === 'auth') return; // Ne pas tracker avant l'étape auth
    if (currentStep === 'validation') return; // Ne pas tracker après soumission

    const trackAbandon = () => {
      // Envoyer l'abandon à l'API (fire and forget)
      fetch('/api/track-signup-abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: proData.email,
          userId: userId,
          lastStep: currentStep,
          partialData: {
            company: proData.company,
            siret: proData.siret,
            specialites: proData.specialites,
            city: proData.city,
          },
        }),
        keepalive: true, // Important pour beforeunload
      }).catch(() => {}); // Silencieux
    };

    window.addEventListener('beforeunload', trackAbandon);
    return () => window.removeEventListener('beforeunload', trackAbandon);
  }, [currentStep, proData, userId]);

  // ── Vérification auth au chargement ──────────────────────────────────────

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Attendre un peu pour éviter les conflits avec le dashboard
        await new Promise((resolve) => setTimeout(resolve, 500));

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          setIsCheckingAuth(false);
          return;
        }

        const user = session.user;
        setUserId(user.id);
        setProData((prev) => ({ ...prev, email: user.email || '' }));

        // Vérifier si profil professionnel existe déjà
        const { data: proProfile } = await supabase
          .from('professionals')
          .select('id, status')
          .eq('user_id', user.id)
          .maybeSingle();

        if (proProfile?.status === 'verified') {
          console.log('✅ Pro déjà vérifié, redirection vers dashboard');
          router.replace('/professionnel/dashboard');
          return;
        } else if (proProfile?.status === 'pending') {
          console.log('⏳ Pro en attente de validation');
          router.replace('/professionnel/validation-en-cours');
          return;
        } else if (proProfile?.status === 'rejected') {
          // Profil rejeté : reprendre à l'étape info pour modification
          setCurrentStep('info');
          // Charger les données existantes pour modification
          const { data: existingData } = await (supabase as any)
            .from('professionals')
            .select('company_name, siret, specialties, description')
            .eq('user_id', user.id)
            .single();

          if (existingData) {
            setProData((prev) => ({
              ...prev,
              company: existingData.company_name || '',
              siret: existingData.siret || '',
              specialites: existingData.specialties || [],
              description: existingData.description || '',
            }));
          }
        } else if (proProfile?.id) {
          setCurrentStep('documents');
        } else {
          setCurrentStep('info');
        }
      } catch (err) {
        console.error('Erreur vérification auth:', err);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthStatus();
  }, [supabase, router]);

  // ── Vérification SIRET — format + algorithme de Luhn ────────────────────

  // Algorithme de Luhn adapté au SIRET
  const luhnSiret = (siret: string): boolean => {
    if (!/^\d{14}$/.test(siret)) return false;
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let n = parseInt(siret[i]);
      if (i % 2 === 0) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
    }
    return sum % 10 === 0;
  };

  const verifySiret = useCallback((siret: string) => {
    if (siret.length !== 14 || !/^\d{14}$/.test(siret)) {
      setSiretStatus('idle');
      return;
    }
    setSiretStatus('checking');
    setSiretCompanyName('');

    // Petite pause pour le feedback visuel
    setTimeout(() => {
      if (luhnSiret(siret)) {
        setSiretStatus('valid');
      } else {
        setSiretStatus('invalid');
      }
    }, 400);
  }, []);

  const handleSiretChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 14);
    setProData((prev) => ({ ...prev, siret: cleaned }));
    setSiretStatus('idle');
    setSiretCompanyName('');
    if (cleaned.length === 14) verifySiret(cleaned);
  };

  // ── Étape 1 : Création compte ────────────────────────────────────────────

  const handleCreateAccount = async () => {
    setError('');
    if (
      !proData.email ||
      !proData.password ||
      proData.password !== proData.confirmPassword
    ) {
      setError('Veuillez remplir tous les champs correctement');
      return;
    }
    if (proData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: proData.email,
          password: proData.password,
          options: { data: { role: 'professionnel' } },
        }
      );

      if (signUpError || !authData.user) {
        setError(
          signUpError?.message || 'Erreur lors de la création du compte'
        );
        return;
      }

      // Upsert — non bloquant si le trigger Supabase a déjà créé le profil
      await (supabase as any).from('profiles').upsert(
        {
          id: authData.user.id,
          email: proData.email,
          role: 'professional',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      setUserId(authData.user.id);
      setCurrentStep('info');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  // ── Upload Documents ─────────────────────────────────────────────────────

  const uploadDocumentsIfPresent = async () => {
    if (!userId) return;

    console.log('Recherche ID professionnel pour upload...');

    // Récupérer d'abord l'ID du professionnel créé
    const { data: professional } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!professional?.id) {
      console.error('Professionnel non trouvé après création');
      return;
    }

    const actualProfessionalId = professional.id;
    console.log('ID professionnel trouvé:', actualProfessionalId);

    const documentsToUpload = [
      { type: 'siret', file: proData.documents.kbis, name: 'KBIS' },
      {
        type: 'insurance',
        file: proData.documents.insurance,
        name: 'Assurance',
      },
      {
        type: 'id',
        file: (proData.documents as any).idCard,
        name: "Pièce d'identité",
      },
      {
        type: 'other',
        file: (proData.documents as any).proofOfAddress,
        name: 'Justificatif de domicile',
      },
    ];

    console.log(
      'Documents à uploader:',
      documentsToUpload.filter((d) => d.file).map((d) => d.name)
    );

    for (const doc of documentsToUpload) {
      if (doc.file) {
        console.log(`Upload de ${doc.name}...`);
        try {
          const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(doc.file);
          });

          const response = await fetch('/api/upload-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              professionalId: actualProfessionalId,
              documentType: doc.type,
              fileName: doc.file.name,
              fileData: base64Data,
            }),
          });

          if (response.ok) {
            const result = await response.json();
            console.log(`${doc.name} uploadé avec succès:`, result);
          } else {
            console.error(`Erreur upload ${doc.name}:`, await response.text());
          }
        } catch (error) {
          console.error(`Erreur upload ${doc.name}:`, error);
        }
      } else {
        console.log(`${doc.name} non fourni`);
      }
    }

    // Upload portfolio photos
    if (proData.portfolio.photos.length > 0) {
      console.log(
        `Upload de ${proData.portfolio.photos.length} photos portfolio...`
      );
      for (let i = 0; i < proData.portfolio.photos.length; i++) {
        const photo = proData.portfolio.photos[i];
        try {
          const base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(photo);
          });

          const response = await fetch('/api/upload-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              professionalId: actualProfessionalId,
              documentType: 'portfolio',
              fileName: photo.name,
              fileData: base64Data,
            }),
          });

          if (response.ok) {
            console.log(`Portfolio ${i + 1} uploadé avec succès`);
          } else {
            console.error(
              `Erreur upload portfolio ${i + 1}:`,
              await response.text()
            );
          }
        } catch (error) {
          console.error(`Erreur upload portfolio ${i + 1}:`, error);
        }
      }
    }

    console.log('Upload documents terminé');
  };

  // ── Soumission finale ────────────────────────────────────────────────────

  const handleFinalSubmit = async () => {
    if (!userId) {
      setError('Erreur : utilisateur non identifié');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Mettre à jour le profil avec les infos du gérant et contact
      await supabase
        .from('profiles')
        .update({
          phone: proData.phone,
          full_name:
            `${proData.managerFirstName} ${proData.managerLastName}`.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      // Créer ou mettre à jour le profil professionnel complet
      const { data: existingPro, error: checkError } = await supabase
        .from('professionals')
        .select('id')
        .eq('user_id', userId)
        .single();

      let proError;
      if (existingPro) {
        // Mettre à jour le profil existant
        const { error } = await supabase
          .from('professionals')
          .update({
            siret: proData.siret,
            company_name: proData.company,
            specialties: proData.specialites,
            description: proData.description,
            status: 'pending',
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        proError = error;
        console.log('Profil professionnel mis à jour');
      } else {
        // Créer un nouveau profil
        const { error } = await supabase.from('professionals').insert({
          user_id: userId,
          siret: proData.siret,
          company_name: proData.company,
          specialties: proData.specialites,
          description: proData.description,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        proError = error;
        console.log('Nouveau profil professionnel créé');
      }

      if (proError) {
        console.error('Erreur Supabase:', proError);
        setError(
          `Erreur lors de la création du profil professionnel: ${proError.message}`
        );
        return;
      }

      // Upload documents si présents (ATTENDRE FIN AVANT REDIRECTION)
      console.log('Début upload documents...');
      try {
        await uploadDocumentsIfPresent();
        console.log('Upload documents terminé');
      } catch (uploadError) {
        console.error('Erreur upload documents (non bloquant):', uploadError);
      }

      // Notifier admin + support + team
      console.log('Envoi notifications admin...');
      const notificationResponse = await fetch('/api/notify-pro-inscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!notificationResponse.ok) {
        console.error(
          'Erreur notification:',
          await notificationResponse.text()
        );
      } else {
        const result = await notificationResponse.json();
        console.log('Notifications envoyées:', result);
      }

      // Envoyer email de bienvenue personnalisé au professionnel
      console.log('Envoi email de bienvenue au pro...');
      try {
        const welcomeResponse = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            userType: 'pro',
          }),
        });
        if (welcomeResponse.ok) {
          console.log('Email de bienvenue envoyé au pro');
        } else {
          console.error(
            'Erreur email de bienvenue:',
            await welcomeResponse.text()
          );
        }
      } catch (emailError) {
        console.error('Erreur envoi email de bienvenue:', emailError);
      }

      // Nettoyer le localStorage après soumission réussie
      clearSavedProgress();

      // Rediriger vers la page de validation en cours
      resetForm(); // Réinitialiser avant redirection
      router.push('/professionnel/validation-en-cours');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la finalisation');
    } finally {
      setLoading(false);
    }
  };

  // ── Réinitialiser le formulaire ────────────────────────────────────────────────

  const resetForm = () => {
    setProData({
      email: '',
      password: '',
      confirmPassword: '',
      managerFirstName: '',
      managerLastName: '',
      company: '',
      siret: '',
      specialites: [],
      description: '',
      phone: '',
      address: '',
      city: '',
      postal_code: '',
      documents: { kbis: null, insurance: null, certifications: [] },
      portfolio: { photos: [], clientContacts: [] },
    });
    setSiretStatus('idle');
    setSiretCompanyName('');
    setError('');
  };

  const toggleSpecialite = (spec: string) => {
    setProData((prev) => ({
      ...prev,
      specialites: prev.specialites.includes(spec)
        ? prev.specialites.filter((s) => s !== spec)
        : prev.specialites.length < 3
          ? [...prev.specialites, spec]
          : prev.specialites,
    }));
  };

  const canContinueFromInfo =
    proData.company.trim() !== '' &&
    proData.siret.length === 14 &&
    siretStatus !== 'invalid' &&
    siretStatus !== 'checking' &&
    proData.specialites.length > 0 &&
    proData.description.trim() !== '' &&
    proData.phone.trim() !== '' &&
    proData.city.trim() !== '';

  const progressPercent =
    (STEP_ORDER.indexOf(currentStep) / (STEP_ORDER.length - 1)) * 100;

  // ── Feedback SIRET ───────────────────────────────────────────────────────

  const SiretFeedback = () => {
    if (siretStatus === 'idle' || proData.siret.length < 14) return null;
    if (siretStatus === 'checking')
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600 mt-1.5">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Vérification en
          cours...
        </div>
      );
    if (siretStatus === 'valid')
      return (
        <div className="flex items-center gap-2 text-sm text-green-600 mt-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          {siretCompanyName
            ? `Format valide — ${siretCompanyName}`
            : 'Format SIRET valide ✓'}
        </div>
      );
    if (siretStatus === 'invalid')
      return (
        <div className="flex items-center gap-2 text-sm text-red-600 mt-1.5">
          <XCircle className="w-3.5 h-3.5" /> SIRET invalide — vérifiez les 14
          chiffres
        </div>
      );
    if (siretStatus === 'error')
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600 mt-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> Vérification impossible — sera
          contrôlé manuellement
        </div>
      );
    return null;
  };

  if (isCheckingAuth)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );

  return (
    <>
      <SEO
        title="Inscription Professionnel — SwipeTonPro"
        description="Rejoignez la marketplace BTP et accédez à des chantiers qualifiés"
      />

      <div className="min-h-screen bg-gradient-to-br from-surface via-surface-elevated to-surface">
        {/* Header */}
        <header className="border-b border-border bg-surface/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/professionnel"
                className="flex items-center gap-2 text-text-secondary hover:text-accent transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="font-semibold text-sm">Retour</span>
              </Link>
              {currentStep !== 'auth' && (
                <span className="font-mono text-xs font-semibold text-accent">
                  {STEP_LABELS[currentStep]}
                </span>
              )}
            </div>
            {currentStep !== 'auth' && (
              <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full gradient-accent transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-8 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* ── AUTH ─────────────────────────────────────────────────────── */}
          {currentStep === 'auth' && (
            <Card className="border-2 animate-fade-in">
              <CardContent className="p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Créer votre compte</h2>
                    <p className="text-text-secondary text-sm">
                      Vos identifiants de connexion
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Adresse email *
                  </label>
                  <Input
                    type="email"
                    placeholder="pro@entreprise.fr"
                    value={proData.email}
                    onChange={(e) =>
                      setProData((p) => ({ ...p, email: e.target.value }))
                    }
                    className="border-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Mot de passe *{' '}
                    <span className="font-normal text-text-secondary">
                      (min. 8 caractères)
                    </span>
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={proData.password}
                    onChange={(e) =>
                      setProData((p) => ({ ...p, password: e.target.value }))
                    }
                    className="border-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Confirmer le mot de passe *
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={proData.confirmPassword}
                    onChange={(e) =>
                      setProData((p) => ({
                        ...p,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="border-2"
                  />
                  {proData.confirmPassword &&
                    proData.password !== proData.confirmPassword && (
                      <p className="text-xs text-red-600 mt-1">
                        Les mots de passe ne correspondent pas
                      </p>
                    )}
                </div>

                <Button
                  size="lg"
                  onClick={handleCreateAccount}
                  disabled={
                    loading ||
                    !proData.email ||
                    !proData.password ||
                    proData.password.length < 8 ||
                    proData.password !== proData.confirmPassword
                  }
                  className="w-full gradient-accent text-white font-semibold py-6"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Créer mon compte
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Ou s'inscrire avec
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <GoogleAuthButton mode="signup" userType="professional" />
                </div>

                <p className="text-center text-sm text-text-secondary">
                  Déjà inscrit ?{' '}
                  <Link
                    href="/auth/login"
                    className="text-accent font-semibold hover:underline"
                  >
                    Se connecter
                  </Link>
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── INFO ─────────────────────────────────────────────────────── */}
          {currentStep === 'info' && (
            <Card className="border-2 animate-fade-in">
              <CardContent className="p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">
                      Informations entreprise
                    </h2>
                    <p className="text-text-secondary text-sm">
                      Coordonnées professionnelles
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Informations du gérant
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Prénom du gérant *
                      </label>
                      <Input
                        placeholder="Jean"
                        value={proData.managerFirstName}
                        onChange={(e) =>
                          setProData((p) => ({
                            ...p,
                            managerFirstName: e.target.value,
                          }))
                        }
                        className="border-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold mb-2">
                        Nom du gérant *
                      </label>
                      <Input
                        placeholder="Dupont"
                        value={proData.managerLastName}
                        onChange={(e) =>
                          setProData((p) => ({
                            ...p,
                            managerLastName: e.target.value,
                          }))
                        }
                        className="border-2"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-800">
                    Informations entreprise
                  </h3>
                  <p className="text-text-secondary text-sm mb-4">
                    Coordonnées professionnelles
                  </p>
                </div>

                {/* SIRET en premier → peut auto-remplir le nom */}
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Numéro SIRET *
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="14 chiffres"
                      value={proData.siret}
                      onChange={(e) => handleSiretChange(e.target.value)}
                      className={`border-2 pr-10 font-mono tracking-widest ${
                        siretStatus === 'valid'
                          ? 'border-green-400'
                          : siretStatus === 'invalid'
                            ? 'border-red-400'
                            : ''
                      }`}
                      maxLength={14}
                    />
                    <div className="absolute right-3 top-3">
                      {siretStatus === 'checking' && (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      )}
                      {siretStatus === 'valid' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {siretStatus === 'invalid' && (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <SiretFeedback />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Nom de l'entreprise *
                  </label>
                  <Input
                    placeholder="ex: Entreprise Martin & Fils"
                    value={proData.company}
                    onChange={(e) =>
                      setProData((p) => ({ ...p, company: e.target.value }))
                    }
                    className="border-2"
                  />
                  {siretCompanyName && proData.company === siretCompanyName && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ Nom récupéré automatiquement
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Téléphone professionnel *
                  </label>
                  <Input
                    type="tel"
                    placeholder="06 12 34 56 78"
                    value={proData.phone}
                    onChange={(e) =>
                      setProData((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="border-2"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold mb-2">
                      Ville *
                    </label>
                    <Input
                      placeholder="Paris"
                      value={proData.city}
                      onChange={(e) =>
                        setProData((p) => ({ ...p, city: e.target.value }))
                      }
                      className="border-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">
                      Code postal
                    </label>
                    <Input
                      placeholder="75001"
                      value={proData.postal_code}
                      onChange={(e) =>
                        setProData((p) => ({
                          ...p,
                          postal_code: e.target.value,
                        }))
                      }
                      className="border-2"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Adresse
                  </label>
                  <Input
                    placeholder="12 rue de la Paix"
                    value={proData.address}
                    onChange={(e) =>
                      setProData((p) => ({ ...p, address: e.target.value }))
                    }
                    className="border-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Spécialités{' '}
                    <span className="font-normal text-text-secondary">
                      (3 max) *
                    </span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SPECIALITES.map((spec) => (
                      <button
                        key={spec}
                        onClick={() => toggleSpecialite(spec)}
                        disabled={
                          !proData.specialites.includes(spec) &&
                          proData.specialites.length >= 3
                        }
                        className={`px-3 py-2 rounded-lg border-2 font-medium text-sm transition-all text-left ${
                          proData.specialites.includes(spec)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-border hover:border-accent/50'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {spec}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Présentation *
                  </label>
                  <Textarea
                    placeholder="Décrivez votre expérience, votre savoir-faire, votre zone d'intervention..."
                    value={proData.description}
                    onChange={(e) =>
                      setProData((p) => ({ ...p, description: e.target.value }))
                    }
                    rows={4}
                    className="border-2"
                  />
                </div>

                <Button
                  size="lg"
                  onClick={() => setCurrentStep('documents')}
                  disabled={!canContinueFromInfo}
                  className="w-full gradient-accent text-white font-semibold py-6"
                >
                  Continuer vers les documents
                </Button>
                {siretStatus === 'invalid' && (
                  <p className="text-xs text-center text-red-600">
                    SIRET invalide — corrigez le numéro avant de continuer
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── DOCUMENTS ────────────────────────────────────────────────── */}
          {currentStep === 'documents' && (
            <Card className="border-2 animate-fade-in">
              <CardContent className="p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Documents officiels</h2>
                    <p className="text-text-secondary text-sm">
                      Pour l'obtention du badge Certifié
                    </p>
                  </div>
                </div>

                {/* KBIS */}
                <div className="border-2 border-dashed border-border rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-0.5">
                        Extrait KBIS ou Avis de Situation SIRENE
                      </h3>
                      <p className="text-sm text-text-secondary mb-3">
                        Document de moins de 3 mois (PDF, JPG, PNG)
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          e.target.files &&
                          setProData((p) => ({
                            ...p,
                            documents: {
                              ...p.documents,
                              kbis: e.target.files![0],
                            },
                          }))
                        }
                        className="hidden"
                        id="kbis-upload"
                      />
                      <label htmlFor="kbis-upload">
                        <Button
                          variant="outline"
                          className="cursor-pointer"
                          asChild
                        >
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {proData.documents.kbis
                              ? 'Modifier'
                              : 'Télécharger'}
                          </span>
                        </Button>
                      </label>
                      {proData.documents.kbis && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          {proData.documents.kbis.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Assurance décennale */}
                <div className="border-2 border-dashed border-border rounded-xl p-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Shield className="w-5 h-5 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-0.5">
                        Attestation d'Assurance Décennale
                      </h3>
                      <p className="text-sm text-text-secondary mb-3">
                        En cours de validité (PDF, JPG, PNG)
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          e.target.files &&
                          setProData((p) => ({
                            ...p,
                            documents: {
                              ...p.documents,
                              insurance: e.target.files![0],
                            },
                          }))
                        }
                        className="hidden"
                        id="insurance-upload"
                      />
                      <label htmlFor="insurance-upload">
                        <Button
                          variant="outline"
                          className="cursor-pointer"
                          asChild
                        >
                          <span>
                            <Upload className="w-4 h-4 mr-2" />
                            {proData.documents.insurance
                              ? 'Modifier'
                              : 'Télécharger'}
                          </span>
                        </Button>
                      </label>
                      {proData.documents.insurance && (
                        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
                          <CheckCircle className="w-4 h-4" />
                          {proData.documents.insurance.name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-surface-elevated rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-text-secondary">
                    Notre équipe vérifiera vos documents sous 24-48h. Le badge{' '}
                    <strong>"Certifié"</strong> sera attribué après validation.
                  </p>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('info')}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    size="lg"
                    onClick={() => setCurrentStep('portfolio')}
                    className="flex-1 gradient-accent text-white font-semibold"
                  >
                    Continuer
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => setCurrentStep('portfolio')}
                  className="w-full text-text-secondary text-sm"
                >
                  Passer cette étape (optionnel)
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── PORTFOLIO ────────────────────────────────────────────────── */}
          {currentStep === 'portfolio' && (
            <Card className="border-2 animate-fade-in">
              <CardContent className="p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Vos réalisations</h2>
                    <p className="text-text-secondary text-sm">
                      Optionnel — 2 à 10 photos recommandées
                    </p>
                  </div>
                </div>

                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-accent transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files);
                        setProData((p) => ({
                          ...p,
                          portfolio: {
                            ...p.portfolio,
                            photos: [...p.portfolio.photos, ...files].slice(
                              0,
                              10
                            ),
                          },
                        }));
                      }
                    }}
                    className="hidden"
                    id="portfolio-upload"
                  />
                  <label
                    htmlFor="portfolio-upload"
                    className="cursor-pointer block"
                  >
                    <Upload className="w-10 h-10 text-text-muted mx-auto mb-3" />
                    <p className="font-semibold mb-1">Ajoutez des photos</p>
                    <p className="text-sm text-text-secondary">
                      Avant/Après recommandé — max 10 photos
                    </p>
                  </label>
                </div>

                {proData.portfolio.photos.length > 0 && (
                  <div className="grid grid-cols-3 gap-3">
                    {proData.portfolio.photos.map((file, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden border-2 border-green-400"
                      >
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Photo ${i + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-surface-elevated rounded-lg p-5">
                  <h4 className="font-semibold mb-2 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" /> Références
                    clients (optionnel)
                  </h4>
                  <p className="text-sm text-text-secondary mb-4">
                    Fournissez 2-3 contacts clients récents. Nous les
                    contacterons pour valider votre travail.
                  </p>
                  <div className="space-y-3">
                    {[0, 1, 2].map((idx) => (
                      <div key={idx} className="grid sm:grid-cols-2 gap-3">
                        <Input
                          placeholder="Nom du client"
                          value={
                            proData.portfolio.clientContacts[idx]?.name || ''
                          }
                          onChange={(e) => {
                            const c = [...proData.portfolio.clientContacts];
                            c[idx] = { ...c[idx], name: e.target.value };
                            setProData((p) => ({
                              ...p,
                              portfolio: { ...p.portfolio, clientContacts: c },
                            }));
                          }}
                          className="border-2"
                        />
                        <Input
                          placeholder="Téléphone"
                          value={
                            proData.portfolio.clientContacts[idx]?.phone || ''
                          }
                          onChange={(e) => {
                            const c = [...proData.portfolio.clientContacts];
                            c[idx] = { ...c[idx], phone: e.target.value };
                            setProData((p) => ({
                              ...p,
                              portfolio: { ...p.portfolio, clientContacts: c },
                            }));
                          }}
                          className="border-2"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep('documents')}
                    className="flex-1"
                  >
                    Retour
                  </Button>
                  <Button
                    size="lg"
                    onClick={handleFinalSubmit}
                    disabled={loading}
                    className="flex-1 gradient-accent text-white font-semibold"
                  >
                    {loading && (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    )}
                    Soumettre mon dossier
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="w-full text-sm text-text-secondary"
                >
                  Passer et soumettre
                </Button>
              </CardContent>
            </Card>
          )}

          {/* ── VALIDATION ───────────────────────────────────────────────── */}
          {currentStep === 'validation' && (
            <Card className="border-2 border-green-300 animate-fade-in">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Dossier soumis !</h2>
                  <p className="text-text-secondary">
                    Notre équipe examine votre dossier sous 24-48h
                  </p>
                </div>

                <div className="space-y-3 mb-8">
                  <div className="bg-surface-elevated rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">{proData.company}</p>
                      <p className="text-xs text-text-secondary">
                        SIRET {proData.siret}
                      </p>
                    </div>
                  </div>
                  <div className="bg-surface-elevated rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm">
                      Équipes admin, support et team notifiées
                    </p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-lg p-5 mb-6">
                  <h4 className="font-semibold mb-3 text-sm">
                    ⏱️ Prochaines étapes
                  </h4>
                  <ul className="space-y-2 text-sm text-text-secondary">
                    <li className="flex gap-2">
                      <span className="text-accent font-bold">1.</span>{' '}
                      Vérification des documents par notre équipe
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent font-bold">2.</span>{' '}
                      Validation du compte sous 24-48h
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent font-bold">3.</span> Email de
                      confirmation avec accès complets
                    </li>
                    <li className="flex gap-2">
                      <span className="text-accent font-bold">4.</span> Accès
                      aux projets disponibles
                    </li>
                  </ul>
                </div>

                <Button
                  size="lg"
                  onClick={() =>
                    router.push('/professionnel/validation-en-cours')
                  }
                  className="w-full gradient-accent text-white font-semibold py-6"
                >
                  Suivre l'état de ma validation →
                </Button>
                <p className="text-center text-sm text-text-muted mt-4">
                  Vous recevrez un email dès validation de votre compte
                </p>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </>
  );
}
