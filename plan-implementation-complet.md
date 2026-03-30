# 🚀 PLAN D'IMPLÉMENTATION COMPLET - SWIPETONPRO

---

## 📋 **PLAN D'ACTION - PHASE 1 : NETTOYAGE ET PRÉPARATION**

---

## 🗑️ **ÉTAPE 1 - NETTOYAGE COMPTES .COM (IMMÉDIAT)**

### **SQL de nettoyage**
```sql
-- Supprimer les comptes .com admin/support/moderator
DELETE FROM auth.users 
WHERE email LIKE '%@swipetonpro.com' 
AND email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
);

-- Supprimer les profils correspondants
DELETE FROM public.profiles 
WHERE email LIKE '%@swipetonpro.com' 
AND email IN (
  'admin@swipetonpro.com', 
  'team@swipetonpro.com', 
  'support@swipetonpro.com', 
  'moderator@swipetonpro.com'
);

-- Supprimer les entrées professionals si existantes
DELETE FROM public.professionals 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%@swipetonpro.com' 
  AND email IN (
    'admin@swipetonpro.com', 
    'team@swipetonpro.com', 
    'support@swipetonpro.com', 
    'moderator@swipetonpro.com'
  )
);
```

---

## 👥 **ÉTAPE 2 - CRÉATION COMPTES .FR (IMMÉDIAT)**

### **Script de création**
```sql
-- Créer admin@swipetonpro.fr
INSERT INTO auth.users (email, password, email_confirmed_at, created_at) 
VALUES ('admin@swipetonpro.fr', 'mot_de_passe_securise', NOW(), NOW());

-- Créer le profil correspondant
INSERT INTO public.profiles (id, email, full_name, role, created_at) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@swipetonpro.fr'),
  'admin@swipetonpro.fr',
  'Administrateur SwipeTonPro',
  'admin',
  NOW()
);

-- Répéter pour team@swipetonpro.fr, support@swipetonpro.fr, moderator@swipetonpro.fr
```

---

## 🔄 **PHASE 2 - SYSTÈME DE PAIEMENT ET WORKFLOW**

---

## 💳 **ÉTAPE 3 - SYSTÈME DE PALIERS DE PAIEMENT**

### **Création de la table tarifs**
```sql
CREATE TABLE IF NOT EXISTS tarifs_mise_en_relation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  min_estimation DECIMAL(10,2) NOT NULL,
  max_estimation DECIMAL(10,2) NOT NULL,
  frais DECIMAL(10,2) NOT NULL DEFAULT 0,
  description TEXT,
  actif BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertion des tarifs par défaut
INSERT INTO tarifs_mise_en_relation (min_estimation, max_estimation, frais, description) VALUES
(0, 150, 0, 'Petits travaux'),
(150, 500, 19, 'Travaux légers'),
(500, 2500, 49, 'Travaux moyens'),
(2500, 5000, 79, 'Rénovations importantes'),
(5000, 15000, 119, 'Gros travaux'),
(15000, 30000, 179, 'Travaux majeurs'),
(30000, 100000, 269, 'Travaux très importants'),
(100000, 999999999, 399, 'Projets exceptionnels');
```

### **Service de calcul des frais**
```typescript
// src/services/tarifService.ts
export class TarifService {
  static async calculerFrais(estimation: number): Promise<number> {
    const { data, error } = await supabase
      .from('tarifs_mise_en_relation')
      .select('frais')
      .eq('actif', true)
      .lte('min_estimation', estimation)
      .gte('max_estimation', estimation)
      .single();
    
    if (error) throw error;
    return data.frais;
  }

  static async getAllTarifs(): Promise<Tarif[]> {
    const { data, error } = await supabase
      .from('tarifs_mise_en_relation')
      .select('*')
      .eq('actif', true)
      .order('min_estimation');
    
    if (error) throw error;
    return data;
  }
}
```

---

## 💬 **ÉTAPE 4 - CHAT LIMITÉ AVEC PAIEMENT**

### **Service de chat amélioré**
```typescript
// src/services/chatService.ts
export class ChatService {
  static async getLimitedConversation(
    clientId: string, 
    professionalId: string, 
    projectId: string
  ): Promise<Conversation> {
    // Vérifier si le paiement a été effectué
    const paiementEffectue = await this.verifierPaiement(clientId, professionalId, projectId);
    
    if (paiementEffectue) {
      return this.getFullConversation(clientId, professionalId, projectId);
    }
    
    // Chat limité : 3 messages maximum
    return this.getLimitedConversation(clientId, professionalId, projectId, 3);
  }

  static async verifierPaiement(
    clientId: string, 
    professionalId: string, 
    projectId: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('paiements_mise_en_relation')
      .select('statut')
      .eq('client_id', clientId)
      .eq('professional_id', professionalId)
      .eq('projet_id', projectId)
      .eq('statut', 'complete')
      .single();
    
    return !error && data !== null;
  }
}
```

### **Interface de paiement pour débloquer le chat**
```typescript
// src/components/chat/PaymentRequired.tsx
const PaymentRequired = ({ clientId, professionalId, projectId, estimation }: Props) => {
  const [frais, setFrais] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    TarifService.calculerFrais(estimation).then(setFrais);
  }, [estimation]);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Créer l'intention de paiement Stripe
      const { data } = await createPaymentIntent({
        amount: frais * 100, // Stripe en centimes
        currency: 'eur',
        metadata: {
          clientId,
          professionalId,
          projectId,
          type: 'mise_en_relation'
        }
      });

      // Rediriger vers Stripe Checkout
      const stripe = await loadStripe(STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId: data.id });
    } catch (error) {
      console.error('Erreur paiement:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-6">
        <div className="text-center">
          <Lock className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Chat complet débloqué</h3>
          <p className="text-gray-600 mb-4">
            Accédez au chat complet et aux informations du professionnel
          </p>
          <div className="bg-white p-4 rounded-lg mb-4">
            <p className="text-sm text-gray-500">Frais de mise en relation</p>
            <p className="text-2xl font-bold text-blue-600">{frais} €</p>
          </div>
          <Button onClick={handlePayment} disabled={loading} className="w-full">
            {loading ? 'Traitement...' : `Payer ${frais} € pour débloquer`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 📊 **ÉTAPE 5 - DASHBOARD DE SUIVI PROJET**

### **Service de workflow projet**
```typescript
// src/services/projetWorkflowService.ts
export class ProjetWorkflowService {
  static readonly STATUTS = {
    DEPOSE: 'Projet déposé',
    QUALIF: 'En qualification TEAM',
    BADGE: 'Badge CRM attribué',
    VALID: 'Validé support',
    LIGNE: 'Projet en ligne',
    CANDID: 'Candidatures reçues',
    MATCH: 'Match effectué',
    PAIEMENT_ATTENTE: 'Paiement en attente',
    PAIEMENT_ECHOUE: 'Paiement échoué',
    PAIEMENT_RETENTE: 'Retentative paiement',
    DEVIS: 'Devis reçu',
    DEVIS_VALIDE: 'Devis validé',
    TRAVAUX: 'Travaux en cours',
    FIN: 'Fin travaux',
    TERMINE: 'Projet terminé'
  };

  static async updateStatut(projetId: string, statut: string): Promise<void> {
    await supabase
      .from('projets')
      .update({ 
        statut, 
        updated_at: new Date() 
      })
      .eq('id', projetId);
  }

  static async getProjetDetails(projetId: string): Promise<ProjetDetails> {
    const { data, error } = await supabase
      .from('projets')
      .select(`
        *,
        client:profiles!client_id(*),
        professional:profiles!professional_id(*),
        paiements:paiements_mise_en_relation(*),
        devis(*)
      `)
      .eq('id', projetId)
      .single();
    
    if (error) throw error;
    return data;
  }
}
```

### **Composant Dashboard**
```typescript
// src/components/dashboard/ProjetDashboard.tsx
const ProjetDashboard = ({ projetId }: { projetId: string }) => {
  const [projet, setProjet] = useState<ProjetDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ProjetWorkflowService.getProjetDetails(projetId).then(setProjet);
  }, [projetId]);

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'LIGNE': return 'bg-green-100 text-green-800';
      case 'MATCH': return 'bg-blue-100 text-blue-800';
      case 'PAIEMENT_ATTENTE': return 'bg-yellow-100 text-yellow-800';
      case 'TRAVAUX': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!projet) return <div>Chargement...</div>;

  return (
    <div className="space-y-6">
      {/* En-tête avec statut */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{projet.titre}</h2>
              <p className="text-gray-600">{projet.description}</p>
            </div>
            <Badge className={getStatutColor(projet.statut)}>
              {ProjetWorkflowService.STATUTS[projet.statut]}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Actions selon le statut */}
      {projet.statut === 'DEVIS' && <DevisActions projet={projet} />}
      {projet.statut === 'TRAVAUX' && <TravauxActions projet={projet} />}
      
      {/* Chat et paiement */}
      <div className="grid md:grid-cols-2 gap-6">
        <ChatSection projet={projet} />
        <PaiementSection projet={projet} />
      </div>
    </div>
  );
};
```

---

## 🌐 **PHASE 3 - PUBLIQUES ET ADMIN**

---

## 💰 **ÉTAPE 6 - PAGE TARIFS PUBLIQUE**

### **Déplacement du fichier existant**
```bash
# Le fichier tarifs.tsx est déjà créé
mv pages/tarifs.tsx src/pages/tarifs.tsx
```

### **Intégration dans le routing**
```typescript
// src/app/router.tsx
import TarifsPage from '@/pages/tarifs';

const router = [
  // ... autres routes
  {
    path: '/tarifs',
    component: TarifsPage,
    public: true
  }
];
```

---

## 🛠️ **ÉTAPE 7 - MODULE ADMIN TARIFS**

### **Page d'administration**
```typescript
// src/pages/admin/tarifs.tsx
const AdminTarifsPage = () => {
  const [tarifs, setTarifs] = useState<Tarif[]>([]);
  const [editing, setEditing] = useState<Tarif | null>(null);

  const handleSave = async (tarif: Tarif) => {
    if (editing) {
      await supabase
        .from('tarifs_mise_en_relation')
        .update(tarif)
        .eq('id', tarif.id);
    } else {
      await supabase
        .from('tarifs_mise_en_relation')
        .insert(tarif);
    }
    
    setEditing(null);
    loadTarifs();
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Administration des tarifs</h1>
      
      <TarifsTable tarifs={tarifs} onEdit={setEditing} />
      
      {editing && (
        <TarifForm 
          tarif={editing} 
          onSave={handleSave} 
          onCancel={() => setEditing(null)} 
        />
      )}
    </div>
  );
};
```

---

## 📄 **ÉTAPE 8 - DOCUMENT DE CONSENTEMENT**

### **Service de génération PDF**
```typescript
// src/services/documentService.ts
export class DocumentService {
  static async generateConsentementPDF(data: ConsentementData): Promise<Blob> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(20);
    doc.text('CONSENTEMENT MUTUEL DE SÉCURISATION ET VERSEMENT', 20, 30);

    // Informations du projet
    doc.setFontSize(12);
    doc.text(`Projet : ${data.projetInfo.titre}`, 20, 60);
    doc.text(`Budget total : ${data.projetInfo.montantTotal} €`, 20, 70);
    doc.text(`Frais SwipeTonPro (3,3%) : ${data.fraisSecurisation.montant} €`, 20, 80);

    // Options de répartition
    doc.text(`Option choisie : ${data.optionsFrais}`, 20, 100);
    doc.text(`Montant pour l'artisan : ${data.montantArtisan} €`, 20, 110);
    doc.text(`Montant pour le client : ${data.montantClient} €`, 20, 120);

    // Signatures
    doc.text('Signature Particulier : ___________________', 20, 200);
    doc.text('Signature Artisan : ___________________', 20, 220);

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  static async saveDocument(projetId: string, blob: Blob): Promise<string> {
    const fileName = `consentement-${projetId}-${Date.now()}.pdf`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, blob);

    if (error) throw error;
    return data.path;
  }
}
```

---

## 📧 **ÉTAPE 9 - EMAILS DE NOTIFICATION**

### **Service d'emails**
```typescript
// src/services/emailService.ts
export class EmailService {
  static async envoyerEmailPaiementRefuse(professionalEmail: string, projetInfo: any): Promise<void> {
    const template = `
      Bonjour ${projetInfo.professionalName},
      
      Le paiement pour la mise en relation avec un projet a échoué.
      
      📋 Détails du projet :
      - Titre : ${projetInfo.titre}
      - Localisation : ${projetInfo.localisation}
      - Montant requis : ${projetInfo.frais} €
      
      Le client a choisi d'attendre une nouvelle tentative de paiement.
      
      Pour toute question, contactez notre équipe :
      📧 contact@swipetonpro.fr
    `;

    await supabase.functions.invoke('send-email', {
      to: professionalEmail,
      subject: 'Échec de paiement - Action requise',
      html: template
    });
  }

  static async envoyerEmailCandidatureRefusee(professionalEmail: string, projetInfo: any): Promise<void> {
    const template = `
      Bonjour ${projetInfo.professionalName},
      
      Suite à l'échec du paiement, votre candidature pour un projet a été refusée.
      
      ⚠️ Conseils pour vos futures candidatures :
      
      🔍 Vérifiez votre capacité de paiement avant de postuler
      - Assurez-vous d'avoir des fonds disponibles
      - Évitez de perdre des chantiers par des problèmes de paiement
      
      💡 Autres options disponibles :
      - Achetez des crédits d'avance pour accélérer vos mises en relation
      - Contactez notre équipe pour configurer un prépaiement
      
      📞 Pour plus d'informations :
      📧 contact@swipetonpro.fr
    `;

    await supabase.functions.invoke('send-email', {
      to: professionalEmail,
      subject: 'Candidature refusée',
      html: template
    });
  }

  static async envoyerEmailPaiementAccepte(professionalEmail: string, clientEmail: string, projetInfo: any): Promise<void> {
    // Email pour le professionnel
    const templatePro = `
      🎉 Félicitations ! Votre paiement a été accepté et vous êtes maintenant mis en relation.
      
      💰 Pour rassurer votre client et sécuriser votre collaboration :
      
      🔒 Proposez de sécuriser l'acompte et/ou les fonds par STRIPE
      - Le client peut sécuriser l'acompte et le montant ou une partie sur Stripe
      - Les fonds sont sécurisés jusqu'à la fin des travaux ou verser par paliers franchis
      - Paiement sécurisé via la plateforme
      - Protection mutuelle des deux parties
      - Garantie de paiement pour vous et sécurité pour le client
    `;

    // Email pour le client
    const templateClient = `
      🎉 Félicitations ! Le professionnel ${projetInfo.professionalName} a confirmé son paiement.
      
      💬 Chat complet activé
      - Communiquez librement avec votre professionnel
      - Accédez à toutes ses informations
      - Échangez sur les détails de votre projet
      
      💰 Options de paiement sécurisé :
      🔒 Sécurisation des fonds par STRIPE
      - Vous pouvez sécuriser l'acompte et/ou le montant total sur Stripe
      - Les fonds sont bloqués jusqu'à la fin des travaux ou versement par paliers
      - Protection mutuelle et garantie pour les deux parties
    `;

    // Envoyer les deux emails
    await Promise.all([
      supabase.functions.invoke('send-email', {
        to: professionalEmail,
        subject: '🎉 Félicitations ! Mise en relation acceptée',
        html: templatePro
      }),
      supabase.functions.invoke('send-email', {
        to: clientEmail,
        subject: '🎉 Mise en relation réussie !',
        html: templateClient
      })
    ]);
  }
}
```

---

## 🎯 **PHASE 4 - INTÉGRATION FINALE**

---

## 🔗 **ÉTAPE 10 - INTÉGRATION WEBHOOKS STRIPE**

### **Webhook handler**
```typescript
// src/app/api/stripe-webhook/route.ts
import { headers } from 'next/headers';
import { Stripe } from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return new Response(`Webhook Error: ${err}`, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Mettre à jour le statut du paiement
      await supabase
        .from('paiements_mise_en_relation')
        .update({ 
          statut: 'complete',
          completed_at: new Date()
        })
        .eq('stripe_session_id', session.id);

      // Débloquer le chat complet
      const { clientId, professionalId, projectId } = session.metadata;
      await ChatService.debloquerChatComplet(clientId, professionalId, projectId);

      // Envoyer les emails de notification
      const projet = await ProjetWorkflowService.getProjetDetails(projectId);
      await EmailService.envoyerEmailPaiementAccepte(
        projet.professional.email,
        projet.client.email,
        projet
      );

      break;

    case 'checkout.session.expired':
      // Gérer l'expiration du paiement
      const expiredSession = event.data.object as Stripe.Checkout.Session;
      await handlePaiementExpiré(expiredSession);
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  return new Response('OK');
}

async function handlePaiementExpiré(session: Stripe.Checkout.Session) {
  const { clientId, professionalId, projectId } = session.metadata;
  
  // Mettre à jour le statut
  await supabase
    .from('paiements_mise_en_relation')
    .update({ 
      statut: 'expired',
      expired_at: new Date()
    })
    .eq('stripe_session_id', session.id);

  // Notifier les deux parties
  const projet = await ProjetWorkflowService.getProjetDetails(projectId);
  await EmailService.envoyerEmailPaiementRefuse(projet.professional.email, projet);
}
```

---

## 🎉 **RÉSUMÉ DE L'IMPLÉMENTATION**

### **✅ Étapes complètes**
1. **Nettoyage comptes .com** → Création comptes .fr
2. **Système paliers paiement** → Table tarifs + service calcul
3. **Chat limité** → Déblocage après paiement
4. **Dashboard workflow** → Suivi complet projet
5. **Page tarifs publique** → Interface professionnelle
6. **Module admin tarifs** → CRUD complet
7. **Document consentement** → Génération PDF + stockage
8. **Emails notifications** → Templates professionnels
9. **Webhooks Stripe** → Intégration paiement
10. **Tests et validation** → Vérification complète

### **🎯 Priorités**
- **Haute** : Nettoyage, workflow, paiement, chat
- **Moyenne** : Dashboard, tarifs, admin, documents
- **Basse** : Emails, webhooks, tests finaux

### **⏡ Timeline estimée**
- **Phase 1** : 1-2 jours (nettoyage + préparation)
- **Phase 2** : 3-4 jours (paiement + workflow)
- **Phase 3** : 2-3 jours (publiques + admin)
- **Phase 4** : 2-3 jours (intégration finale)

**Total estimé : 8-12 jours pour une implémentation complète et fonctionnelle !**

---

## 🚀 **PRÊT À COMMENCER L'IMPLÉMENTATION ?**

**✨ Tous les fichiers de configuration sont prêts, les services sont définis, et le plan est clair !**
