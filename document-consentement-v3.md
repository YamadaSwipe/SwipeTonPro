# 📄 DOCUMENT DE CONSENTEMENT - VERSION 3

---

## 📋 **PRÉCISIONS SUR LES OPTIONS DE FRAIS**

---

## 💰 **OPTIONS DE RÉPARTITION DES FRAIS**

### **Options disponibles :**
- **Frais partagés** (50% client / 50% artisan)
- **Frais pris en charge par le client**
- **Frais offerts par l'artisan OU particulier**

---

## 📊 **EXEMPLE CONCRET AVEC BUDGET FRAIS COMPRISES**

### **Projet rénovation : 10 000 € (budget frais comprises)**

#### **Calcul des frais :**
- **Budget projet** : 10 000 € (frais déjà inclus)
- **Frais SwipeTonPro** : 3,3% = 325 €
- **Montant réel des travaux** : 10 000 € - 325 € = 9 675 €

#### **Options de répartition :**

| Option | Artisan reçoit | Client paie | Frais payés par |
|--------|----------------|-------------|------------------|
| **Frais offerts par l'artisan** | **9 675 €** | 10 000 € | Artisan (325 €) |
| **Frais partagés** | **9 837,50 €** | 10 000 € | Partagé (162,50 € chacun) |
| **Frais pris en charge par le client** | **10 000 €** | 10 325 € | Client (325 €) |

---

## 🖥️ **INTERFACE DASHBOARD - VERSION 3**

### **Composant React avec budget frais comprises**
```typescript
// src/components/documents/ConsentementForm.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface ConsentementData {
  projetId: string;
  budgetTotal: number; // Budget frais comprises
  fraisSwipeTonPro: number;
  montantReelTravaux: number;
  optionsFrais: 'partage' | 'client' | 'artisan' | 'particulier';
  // ... autres champs
}

const ConsentementForm = ({ projetId }: { projetId: string }) => {
  const [formData, setFormData] = useState<ConsentementData>({
    projetId,
    budgetTotal: 10000, // Exemple : 10 000 € frais comprises
    fraisSwipeTonPro: 0,
    montantReelTravaux: 0,
    optionsFrais: 'artisan'
  });

  // Calcul automatique des frais et montant réel
  React.useEffect(() => {
    const frais = formData.budgetTotal * 0.033; // 3,3%
    const montantReel = formData.budgetTotal - frais;
    
    setFormData(prev => ({
      ...prev,
      fraisSwipeTonPro: frais,
      montantReelTravaux: montantReel
    }));
  }, [formData.budgetTotal]);

  const handleFraisOption = (option: 'partage' | 'client' | 'artisan' | 'particulier') => {
    setFormData(prev => ({
      ...prev,
      optionsFrais: option
    }));
  };

  const getMontantArtisan = () => {
    switch (formData.optionsFrais) {
      case 'artisan':
      case 'particulier':
        // L'artisan absorbe la totalité des frais
        return formData.montantReelTravaux;
      case 'partage':
        // Partage des frais
        return formData.montantReelTravaux + (formData.fraisSwipeTonPro / 2);
      case 'client':
        // Le client paie tous les frais
        return formData.budgetTotal;
      default:
        return formData.montantReelTravaux;
    }
  };

  const getMontantClient = () => {
    switch (formData.optionsFrais) {
      case 'artisan':
      case 'particulier':
        // Le client ne paie que le budget total
        return formData.budgetTotal;
      case 'partage':
        // Le client paie le budget total + sa part des frais
        return formData.budgetTotal + (formData.fraisSwipeTonPro / 2);
      case 'client':
        // Le client paie le budget total + tous les frais
        return formData.budgetTotal + formData.fraisSwipeTonPro;
      default:
        return formData.budgetTotal;
    }
  };

  return (
    <div className="space-y-6">
      {/* Informations du projet */}
      <Card>
        <CardHeader>
          <CardTitle>Informations du projet</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Budget total (frais comprises)</Label>
            <Input 
              type="number" 
              value={formData.budgetTotal} 
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                budgetTotal: parseFloat(e.target.value) || 0 
              }))}
            />
            <p className="text-sm text-gray-500 mt-1">
              Ce montant inclut déjà les frais de sécurisation
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frais SwipeTonPro (3,3%)</Label>
              <Input 
                type="number" 
                value={formData.fraisSwipeTonPro} 
                readOnly 
                className="bg-gray-50"
              />
            </div>
            <div>
              <Label>Montant réel des travaux</Label>
              <Input 
                type="number" 
                value={formData.montantReelTravaux} 
                readOnly 
                className="bg-gray-50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Options de répartition des frais */}
      <Card>
        <CardHeader>
          <CardTitle>Options de répartition des frais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Frais : 3,3%</h4>
            <p className="text-sm text-gray-600 mb-2">
              Ces frais couvrent :
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Sécurisation du paiement</li>
              <li>• Gestion des versements</li>
              <li>• Protection client et artisan</li>
            </ul>
          </div>

          <div>
            <Label>Options de répartition des frais :</Label>
            <RadioGroup 
              value={formData.optionsFrais}
              onValueChange={handleFraisOption}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="partage" id="partage" />
                <Label htmlFor="partage">
                  Frais partagés (50% client / 50% artisan)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client" id="client" />
                <Label htmlFor="client">
                  Frais pris en charge par le client
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="artisan" id="artisan" />
                <Label htmlFor="artisan">
                  Frais offerts par l'artisan
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="particulier" id="particulier" />
                <Label htmlFor="particulier">
                  Frais offerts par le particulier
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Exemple concret affiché en temps réel */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Répartition des montants</h4>
            <div className="text-sm space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-medium">Budget projet (frais compris)</p>
                  <p className="text-lg font-bold">{formData.budgetTotal.toLocaleString('fr-FR')} €</p>
                </div>
                <div>
                  <p className="font-medium">Frais SwipeTonPro (3,3%)</p>
                  <p className="text-lg font-bold">{formData.fraisSwipeTonPro.toLocaleString('fr-FR')} €</p>
                </div>
              </div>
              
              <div className="border-t pt-2 mt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 p-3 rounded">
                    <p className="font-medium text-green-800">L'artisan reçoit</p>
                    <p className="text-xl font-bold text-green-600">
                      {getMontantArtisan().toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {formData.optionsFrais === 'artisan' || formData.optionsFrais === 'particulier' 
                        ? '(absorbe la totalité des frais)' 
                        : formData.optionsFrais === 'partage'
                        ? '(partage des frais)'
                        : '(aucun frais)'
                      }
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-medium text-blue-800">Le client paie</p>
                    <p className="text-xl font-bold text-blue-600">
                      {getMontantClient().toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {formData.optionsFrais === 'artisan' || formData.optionsFrais === 'particulier'
                        ? '(budget total)'
                        : formData.optionsFrais === 'partage'
                        ? '(budget + 50% frais)'
                        : '(budget + tous les frais)'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Résumé de l'option choisie */}
              <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                <p className="font-medium text-yellow-800">
                  {formData.optionsFrais === 'artisan' && '🎁 Frais offerts par l\'artisan'}
                  {formData.optionsFrais === 'particulier' && '🎁 Frais offerts par le particulier'}
                  {formData.optionsFrais === 'partage' && '🤝 Frais partagés'}
                  {formData.optionsFrais === 'client' && '💳 Frais pris en charge par le client'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={() => genererPDF(formData)}>
          Générer le document
        </Button>
        <Button variant="outline" onClick={() => telechargerModele()}>
          Télécharger le modèle
        </Button>
      </div>
    </div>
  );
};
```

---

## 📄 **DOCUMENT DE CONSENTEMENT - VERSION 3**

### **Section Paiement sécurisé mise à jour**
```markdown
## PAIEMENT SÉCURISÉ SWIPETONPRO

### Frais de sécurisation : 3,3%

Ces frais couvrent :
- Sécurisation du paiement
- Gestion des versements
- Protection client et artisan

### Budget du projet (frais comprises) : [Budget total] €

- **Budget total** : [Budget total] € (frais déjà inclus)
- **Frais SwipeTonPro (3,3%)** : [Montant frais] €
- **Montant réel des travaux** : [Montant réel] €

### Options de répartition des frais :

[ ] Frais partagés (50% client / 50% artisan)
[ ] Frais pris en charge par le client
[ ] Frais offerts par l'artisan
[ ] Frais offerts par le particulier

### Répartition des montants :

#### Si frais offerts par l'artisan :
- **L'artisan reçoit** : [Montant réel] €
- **Le client paie** : [Budget total] €
- **Frais payés par** : L'artisan ([Montant frais] €)

#### Si frais offerts par le particulier :
- **L'artisan reçoit** : [Montant réel] €
- **Le client paie** : [Budget total] €
- **Frais payés par** : Le particulier ([Montant frais] €)

#### Si frais partagés :
- **L'artisan reçoit** : [Montant réel + 50% frais] €
- **Le client paie** : [Budget total + 50% frais] €
- **Frais payés par** : Partagé (50% chacun)

#### Si frais pris en charge par le client :
- **L'artisan reçoit** : [Budget total] €
- **Le client paie** : [Budget total + frais] €
- **Frais payés par** : Le client ([Montant frais] €)
```

---

## 📧 **EMAILS D'EXPLICATION - VERSION 3**

### **Email pour le particulier**
```markdown
📧 Objet : Comment fonctionne le paiement sécurisé dans SwipeTonPro

Bonjour [Particulier],

Découvrez comment fonctionne notre système de paiement sécurisé SwipeTonPro :

🔒 **Paiement sécurisé SwipeTonPro**

**Frais : 3,3%**

Ces frais couvrent :
- Sécurisation du paiement
- Gestion des versements  
- Protection client et artisan

💰 **Budget frais comprises :**
Le budget que vous proposez inclut déjà les frais de sécurisation.

📊 **Exemple concret pour votre projet :**

Budget projet : 10 000 € (frais comprises)
- Frais SwipeTonPro (3,3%) : 325 €
- Montant réel des travaux : 9 675 €

**Options de répartition :**

🎁 **Frais offerts par l'artisan**
➡️ L'artisan reçoit : 9 675 €
➡️ Vous payez : 10 000 €

🎁 **Frais offerts par vous**
➡️ L'artisan reçoit : 9 675 €
➡️ Vous payez : 10 000 €

🤝 **Frais partagés**
➡️ L'artisan reçoit : 9 837,50 €
➡️ Vous payez : 10 162,50 €

💳 **Frais pris en charge par vous**
➡️ L'artisan reçoit : 10 000 €
➡️ Vous payez : 10 325 €

📄 **Document de consentement :**
Vous trouverez dans votre dashboard le document de consentement à remplir 
pour formaliser les modalités de paiement.

Cordialement,
L'équipe SwipeTonPro
```

### **Email pour le professionnel**
```markdown
📧 Objet : Présentation du paiement sécurisé SwipeTonPro

Bonjour [Professionnel],

Découvrez comment présenter notre système de paiement sécurisé à vos clients :

🔒 **Paiement sécurisé SwipeTonPro**

**Frais : 3,3%**

Ces frais couvrent :
- Sécurisation du paiement
- Gestion des versements
- Protection client et artisan

💰 **Budget frais comprises :**
Le budget proposé au client inclut déjà les frais de sécurisation.

📊 **Exemple concret à présenter :**

Budget projet : 10 000 € (frais comprises)
- Frais SwipeTonPro (3,3%) : 325 €
- Montant réel des travaux : 9 675 €

**Options à proposer au client :**

🎁 **Frais offerts par vous**
➡️ Vous recevez : 9 675 €
➡️ Client paie : 10 000 €
➡️ Vous payez : 325 € (frais)

🤝 **Frais partagés**
➡️ Vous recevez : 9 837,50 €
➡️ Client paie : 10 162,50 €
➡️ Chacun paie : 162,50 € (frais)

💡 **Conseil commercial :**
Proposer les frais offerts est un excellent argument qui rassure le client 
et montre votre sérieux. Le client paie le budget convenu sans surprise.

📄 **Document de consentement :**
Utilisez le document dans votre dashboard pour formaliser 
les modalités de paiement avec votre client.

Cordialement,
L'équipe SwipeTonPro
```

---

## 🎯 **POINTS CLÉS DE LA VERSION 3**

### **💰 Budget frais comprises**
- **Pas d'impression d'ajouter** des frais
- **Budget total** inclut déjà les 3,3%
- **Montant réel** des travaux calculé automatiquement
- **Transparence totale** sur la répartition

### **🔄 Options étendues**
- **4 options** au lieu de 3
- **"Frais offerts par le particulier"** ajouté
- **Calculs automatiques** pour chaque option
- **Présentation claire** des montants reçus/payés

### **📊 Exemples concrets**
- **9 675 €** si l'artisan absorbe la totalité
- **9 837,50 €** si frais partagés
- **10 000 €** si client paie les frais
- **10 325 €** si client paie tout (rare)

### **🖥️ Interface améliorée**
- **Calculs en temps réel**
- **Affichage clair** des montants
- **Résumé visuel** de l'option choisie
- **Explications** pour chaque cas

---

## 🎉 **CONCLUSION V3**

**Cette version 3 apporte :**
- **💰 Budget frais comprises** pour plus de transparence
- **🔄 4 options de répartition** au lieu de 3
- **📊 Calculs automatiques** et précis
- **📧 Communication claire** avec exemples
- **🖥️ Interface intuitive** avec résumé visuel

**✨ Solution complète et transparente pour la gestion des frais de sécurisation !**
