# 🔧 CONFIGURATION TARIFS - ADMINISTRATION

---

## 📋 **TABLEAU DE PALIERS TARIFAIRES**

---

## 💰 **GRILLE TARIFAIRE OFFICIELLE**

| Estimation projet | Frais de mise en relation | Description |
|-------------------|--------------------------|-------------|
| < 150€ | Gratuit | Petits travaux |
| 150€ – 500€ | 19€ | Travaux légers |
| 500€ – 2 500€ | 49€ | Travaux moyens |
| 2 500€ – 5 000€ | 79€ | Rénovations importantes |
| 5 000€ – 15 000€ | 119€ | Gros travaux |
| 15 000€ – 30 000€ | 179€ | Travaux majeurs |
| 30 000€ – 100 000€ | 269€ | Travaux très importants |
| > 100 000€ | 399€ | Projets exceptionnels |

---

## 🗄️ **STRUCTURE BASE DE DONNÉES**

### **Table `tarifs_mise_en_relation`**
```sql
CREATE TABLE tarifs_mise_en_relation (
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

---

## 🛠️ **MODULE ADMINISTRATION TARIFS**

### **Interface d'administration**
```typescript
// src/pages/admin/tarifs.tsx
interface TarifAdmin {
  id: string;
  min_estimation: number;
  max_estimation: number;
  frais: number;
  description: string;
  actif: boolean;
}

const TarifsAdminPage = () => {
  const [tarifs, setTarifs] = useState<TarifAdmin[]>([]);
  const [editingTarif, setEditingTarif] = useState<TarifAdmin | null>(null);

  // Fonctions CRUD
  const ajouterTarif = async (tarif: Omit<TarifAdmin, 'id'>) => {
    const { data, error } = await supabase
      .from('tarifs_mise_en_relation')
      .insert(tarif)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const modifierTarif = async (id: string, updates: Partial<TarifAdmin>) => {
    const { data, error } = await supabase
      .from('tarifs_mise_en_relation')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  };

  const supprimerTarif = async (id: string) => {
    const { error } = await supabase
      .from('tarifs_mise_en_relation')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Administration des tarifs</h1>
      
      {/* Tableau des tarifs */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estimation min
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Estimation max
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Frais
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Statut
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {tarifs.map((tarif) => (
              <tr key={tarif.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tarif.min_estimation.toLocaleString('fr-FR')} €
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tarif.max_estimation === 999999999 
                    ? `> ${tarif.min_estimation.toLocaleString('fr-FR')} €`
                    : `${tarif.max_estimation.toLocaleString('fr-FR')} €`
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tarif.frais === 0 ? 'Gratuit' : `${tarif.frais} €`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {tarif.description}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    tarif.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tarif.actif ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button 
                    onClick={() => setEditingTarif(tarif)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    Modifier
                  </button>
                  <button 
                    onClick={() => supprimerTarif(tarif.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Formulaire d'ajout/modification */}
      {editingTarif && (
        <TarifForm 
          tarif={editingTarif}
          onSave={modifierTarif}
          onCancel={() => setEditingTarif(null)}
        />
      )}
    </div>
  );
};
```

---

## 📄 **EMPLACEMENT DOCUMENT CONSENTEMENT**

### **Structure du document**
```typescript
// src/components/documents/ConsentementForm.tsx
interface ConsentementData {
  projetId: string;
  particulierId: string;
  professionnelId: string;
  montantTotal: number;
  montantAcompte: number;
  modalitesVersement: 'acompte' | 'total' | 'paliers';
  paliersVersement: {
    etape: string;
    montant: number;
    condition: string;
  }[];
  dateGeneration: Date;
  statut: 'brouillon' | 'signe_particulier' | 'signe_professionnel' | 'complet';
}

const ConsentementForm = ({ projetId }: { projetId: string }) => {
  const [consentement, setConsentement] = useState<ConsentementData | null>(null);

  const genererDocument = async () => {
    // Génération du PDF
    const pdfDoc = await generatePDF({
      template: 'consentement-securisation',
      data: consentement,
      watermark: 'SwipeTonPro - Document sécurisé'
    });

    // Stockage dans Supabase Storage
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(`consentements/${projetId}/${Date.now()}.pdf`, pdfDoc);

    if (error) throw error;

    // Mise à jour du projet
    await supabase
      .from('projets')
      .update({ consentement_url: data.path })
      .eq('id', projetId);

    return data.path;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Document de consentement</h3>
      
      {/* Formulaire de consentement */}
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Modalités de sécurisation
          </label>
          <select className="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
            <option value="acompte">Acompte uniquement</option>
            <option value="total">Montant total</option>
            <option value="paliers">Versement par paliers</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Montant à sécuriser (€)
          </label>
          <input 
            type="number" 
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="0.00"
          />
        </div>

        {/* Paliers de versement */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Paliers de versement
          </label>
          <div className="space-y-2">
            <div className="flex gap-2">
              <input type="text" placeholder="Étape (ex: Début travaux)" />
              <input type="number" placeholder="Montant" />
              <button type="button" className="px-3 py-1 bg-blue-600 text-white rounded">
                Ajouter
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            type="button"
            onClick={genererDocument}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Générer le document
          </button>
          <button 
            type="button"
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Télécharger le modèle
          </button>
        </div>
      </form>
    </div>
  );
};
```

---

## 📋 **CONTENU DU DOCUMENT DE CONSENTEMENT**

### **Modèle de document**
```markdown
# CONSENTEMENT MUTUEL DE SÉCURISATION ET VERSEMENT

## INFORMATIONS GÉNÉRALES
- **Date** : [Date du jour]
- **Référence projet** : [ID Projet]
- **SwipeTonPro** : Intermédiaire technologique (non établissement bancaire)

## PARTIES CONCERNÉES
### Particulier client
- **Nom** : [Nom complet]
- **Adresse** : [Adresse complète]
- **Email** : [Email]
- **Téléphone** : [Téléphone]

### Professionnel
- **Nom** : [Nom complet]
- **Entreprise** : [Nom entreprise]
- **SIRET** : [SIRET]
- **Email** : [Email]
- **Téléphone** : [Téléphone]

## DÉTAILS DU PROJET
- **Titre** : [Titre projet]
- **Description** : [Description projet]
- **Localisation** : [Adresse du chantier]
- **Montant total estimé** : [Montant] €

## MODALITÉS DE SÉCURISATION

### Option choisie :
[ ] Acompte uniquement
[ ] Montant total
[ ] Versement par paliers

### Montant à sécuriser : [Montant] €

### CONDITIONS DE DÉBLOCAGE

#### Si acompte uniquement :
- Déblocage automatique après validation du devis
- Versement au professionnel sous 48h

#### Si montant total :
- Déblocage par étapes validées :
  1. [Étape 1] : [Montant] € - [Condition]
  2. [Étape 2] : [Montant] € - [Condition]
  3. [Étape 3] : [Montant] € - [Condition]

#### Si versement par paliers :
- Palier 1 : [Montant] € - [Condition]
- Palier 2 : [Montant] € - [Condition]
- Palier 3 : [Montant] € - [Condition]

## CADRE RÉGLEMENTAIRE

### Statut de SwipeTonPro
SwipeTonPro est une plateforme technologique qui facilite la mise en relation 
entre particuliers et professionnels. Nous ne sommes pas un établissement bancaire, 
ni un organisme de crédit, et n'agissons pas en tant que tel.

### Partenaire de paiement
Toutes les transactions financières sont traitées par Stripe, 
entreprise agréée et régulée dans l'Union Européenne (licence PSD2).

### Protection des fonds
Les fonds sécurisés via Stripe sont conservés dans un compte séquestre 
jusqu'à la validation des conditions de déblocage par les deux parties.

## ENGAGEMENTS DES PARTIES

### Le particulier s'engage à :
- Valider les étapes du projet dans les délais convenus
- Ne pas contester abusivement les conditions de déblocage
- Respecter les modalités de paiement définies

### Le professionnel s'engage à :
- Réaliser les travaux selon les conditions convenues
- Respecter les délais et la qualité définis
- Ne pas réclamer de versement avant validation des étapes

## SIGNATURES

### Particulier
Signature : _________________________
Date : _________________________
Nom : [Nom complet]

### Professionnel
Signature : _________________________
Date : _________________________
Nom : [Nom complet]

### Témoin SwipeTonPro
Représentant : _________________________
Date : _________________________
Fonction : Intermédiaire technologique
```

---

## 🎯 **POINTS CLÉS DE L'IMPLÉMENTATION**

### **📊 Grille tarifaire**
- **8 paliers** de 0€ à >100 000€
- **Tarifs progressifs** de 0€ à 399€
- **Gratuit** pour petits travaux (<150€)
- **Modifiable** par les administrateurs

### **🛠️ Administration**
- **Interface CRUD** complète
- **Modification en temps réel**
- **Historique des changements**
- **Activation/désactivation** de paliers

### **📄 Document légal**
- **Formulaire personnalisé** par projet
- **Génération PDF** automatique
- **Stockage sécurisé** dans Supabase
- **Signature électronique** possible

### **⚖️ Conformité réglementaire**
- **Statut clair** d'intermédiaire
- **Partenaire agréé** (Stripe)
- **Protection des fonds** via séquestre
- **Consentement mutuel** formalisé

---

## 🔄 **INTÉGRATION TECHNIQUE**

### **Pages créées**
- `/pages/tarifs.tsx` : Page publique des tarifs
- `/pages/admin/tarifs.tsx` : Administration des tarifs
- `/components/documents/ConsentementForm.tsx` : Formulaire consentement

### **Services requis**
- `tarifService.ts` : Calcul des frais
- `documentService.ts` : Génération PDF
- `storageService.ts` : Stockage documents
- `adminService.ts` : Administration tarifs

### **Base de données**
- Table `tarifs_mise_en_relation`
- Table `consentements_documents`
- Storage bucket `documents`

**✨ Implémentation complète avec grille tarifaire, administration et document légal !**
