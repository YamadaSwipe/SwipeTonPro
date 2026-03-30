# 📄 DOCUMENT DE CONSENTEMENT - VERSION 2

---

## 📋 **MODÈLE DE DOCUMENT DE CONSENTEMENT**

---

## 📄 **CONTENU COMPLET DU DOCUMENT**

```markdown
# CONSENTEMENT MUTUEL DE SÉCURISATION ET VERSEMENT

## INFORMATIONS GÉNÉRALES
- **Date** : [Date du jour]
- **Référence projet** : [ID Projet]
- **SwipeTonPro** : Intermédiaire technologique (non établissement bancaire)

## PARTIES CONCERNÉES

### Particulier client
- **Nom complet** : [Nom complet]
- **Adresse** : [Adresse complète]
- **Email** : [Email]
- **Téléphone** : [Téléphone]

### Professionnel / Gérant société
- **Nom complet** : [Nom complet]
- **Nom de l'entreprise** : [Nom entreprise]
- **Forme juridique** : [SASU/EURL/SARL/etc]
- **SIRET** : [SIRET]
- **Adresse** : [Adresse entreprise]
- **Email** : [Email]
- **Téléphone** : [Téléphone]

## DÉTAILS DU PROJET
- **Titre** : [Titre projet]
- **Description** : [Description projet]
- **Localisation** : [Adresse du chantier]
- **Montant total estimé** : [Montant] €

## PAIEMENT SÉCURISÉ SWIPETONPRO

### Frais de sécurisation : 3,3%

Ces frais couvrent :
- Sécurisation du paiement
- Gestion des versements
- Protection client et artisan

### Options de répartition des frais :

[ ] Frais partagés (50% client / 50% artisan)
[ ] Frais pris en charge par le client
[ ] Frais offerts par l'artisan

### Calcul du paiement sécurisé :

Montant projet : [Montant projet] €
Frais sécurisation (3,3%) : [Montant frais] €
Total sécurisé : [Total] €

## MODALITÉS DE SÉCURISATION

### Options de sécurisation (cocher une ou plusieurs) :

[ ] Acompte uniquement
[ ] Totalité du projet
[ ] Versement par paliers

### Montant à sécuriser : [Montant] €

### Mode de versement :

[ ] Versement en une seule fois
[ ] Versement par paliers

## PALIERS DE VERSEMENT

### Si acompte uniquement :
[ ] Acompte signature : [Montant] €
[ ] Acompte début chantier : [Montant] €

### Si totalité ou par paliers :
[ ] Signature du devis : [Montant] €
[ ] Début chantier : [Montant] €
[ ] Milieu chantier : [Montant] €
[ ] Réception fin de chantier : [Montant] €
[ ] Fin de chantier (montant total) : [Montant] €

## EXEMPLE CONCRET

### Projet rénovation : 10 000 €

#### Paiement sécurisé SwipeTonPro :

| Description | Montant |
|-------------|---------|
| Montant projet | 10 000 € |
| Frais sécurisation (3,3%) | 325 € |
| Total | 10 325 € |

#### Options possibles :

**Option 1 - Frais offerts par l'artisan**
➡️ Client paie : 10 000 €

**Option 2 - Frais partagés**
➡️ Client paie : 5 162,50 € (50%)
➡️ Artisan paie : 5 162,50 € (50%)

**Option 3 - Frais pris en charge par le client**
➡️ Client paie : 10 325 €

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
- Payer sa part des frais de sécurisation selon l'option choisie

### Le professionnel s'engage à :
- Réaliser les travaux selon les conditions convenues
- Respecter les délais et la qualité définis
- Ne pas réclamer de versement avant validation des étapes
- Payer sa part des frais de sécurisation selon l'option choisie

## SIGNATURES

### Particulier client
Je déclare avoir lu, compris et accepté les conditions de ce document.

Signature : _________________________
Date : _________________________
Nom : [Nom complet]

### Professionnel / Gérant société
Je déclare avoir lu, compris et accepté les conditions de ce document.

Signature : _________________________
Date : _________________________
Nom : [Nom complet]
Qualité : Gérant de [Nom entreprise]
```

---

## 🖥️ **INTERFACE DASHBOARD**

### **Composant React pour le formulaire**
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
  particulierInfo: {
    nom: string;
    adresse: string;
    email: string;
    telephone: string;
  };
  professionnelInfo: {
    nom: string;
    entreprise: string;
    formeJuridique: string;
    siret: string;
    adresse: string;
    email: string;
    telephone: string;
  };
  projetInfo: {
    titre: string;
    description: string;
    localisation: string;
    montantTotal: number;
  };
  fraisSecurisation: {
    pourcentage: number;
    montant: number;
    total: number;
  };
  optionsFrais: 'partage' | 'client' | 'artisan';
  optionsSecurisation: {
    acompte: boolean;
    total: boolean;
    paliers: boolean;
  };
  modeVersement: 'unique' | 'paliers';
  paliersVersement: {
    signature: number;
    debutChantier: number;
    milieuChantier: number;
    receptionFin: number;
    finChantier: number;
  };
}

const ConsentementForm = ({ projetId }: { projetId: string }) => {
  const [formData, setFormData] = useState<ConsentementData>({
    // Initialisation avec les données du projet
  });

  const calculerFrais = (montant: number) => {
    const frais = montant * 0.033; // 3,3%
    return {
      pourcentage: 3.3,
      montant: frais,
      total: montant + frais
    };
  };

  const handleFraisOption = (option: 'partage' | 'client' | 'artisan') => {
    const frais = calculerFrais(formData.projetInfo.montantTotal);
    
    let repartition = {
      client: 0,
      artisan: 0
    };

    switch (option) {
      case 'client':
        repartition.client = frais.total;
        repartition.artisan = 0;
        break;
      case 'artisan':
        repartition.client = formData.projetInfo.montantTotal;
        repartition.artisan = frais.montant;
        break;
      case 'partage':
        repartition.client = frais.total / 2;
        repartition.artisan = frais.total / 2;
        break;
    }

    setFormData(prev => ({
      ...prev,
      optionsFrais: option,
      fraisSecurisation: {
        ...frais,
        repartition
      }
    }));
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
            <Label>Titre du projet</Label>
            <Input value={formData.projetInfo.titre} readOnly />
          </div>
          <div>
            <Label>Montant total estimé</Label>
            <Input 
              type="number" 
              value={formData.projetInfo.montantTotal} 
              readOnly 
            />
          </div>
        </CardContent>
      </Card>

      {/* Paiement sécurisé */}
      <Card>
        <CardHeader>
          <CardTitle>Paiement sécurisé SwipeTonPro</CardTitle>
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
            </RadioGroup>
          </div>

          {/* Exemple concret */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Exemple concret affiché au client</h4>
            <div className="text-sm space-y-1">
              <p>Projet rénovation : {formData.projetInfo.montantTotal.toLocaleString('fr-FR')} €</p>
              <div className="border-t pt-2">
                <table className="w-full text-sm">
                  <tr>
                    <td className="py-1">Montant projet</td>
                    <td className="text-right">{formData.projetInfo.montantTotal.toLocaleString('fr-FR')} €</td>
                  </tr>
                  <tr>
                    <td className="py-1">Frais sécurisation (3,3%)</td>
                    <td className="text-right">{formData.fraisSecurisation.montant.toLocaleString('fr-FR')} €</td>
                  </tr>
                  <tr className="font-semibold border-t">
                    <td className="py-1">Total</td>
                    <td className="text-right">{formData.fraisSecurisation.total.toLocaleString('fr-FR')} €</td>
                  </tr>
                </table>
              </div>
              
              {formData.optionsFrais === 'artisan' && (
                <div className="mt-2 text-green-600 font-semibold">
                  ➡️ Frais offerts par l'artisan
                  <br />Client paie : {formData.projetInfo.montantTotal.toLocaleString('fr-FR')} €
                </div>
              )}
              
              {formData.optionsFrais === 'partage' && (
                <div className="mt-2 text-blue-600 font-semibold">
                  ➡️ Frais partagés artisan/particulier
                  <br />Client paie : {(formData.fraisSecurisation.total / 2).toLocaleString('fr-FR')} € (50%)
                  <br />Artisan paie : {(formData.fraisSecurisation.total / 2).toLocaleString('fr-FR')} € (50%)
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modalités de sécurisation */}
      <Card>
        <CardHeader>
          <CardTitle>Modalités de sécurisation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Options de sécurisation (cocher une ou plusieurs) :</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="acompte"
                  checked={formData.optionsSecurisation.acompte}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      optionsSecurisation: {
                        ...prev.optionsSecurisation,
                        acompte: checked as boolean
                      }
                    }))
                  }
                />
                <Label htmlFor="acompte">Acompte uniquement</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="total"
                  checked={formData.optionsSecurisation.total}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      optionsSecurisation: {
                        ...prev.optionsSecurisation,
                        total: checked as boolean
                      }
                    }))
                  }
                />
                <Label htmlFor="total">Totalité du projet</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="paliers"
                  checked={formData.optionsSecurisation.paliers}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({
                      ...prev,
                      optionsSecurisation: {
                        ...prev.optionsSecurisation,
                        paliers: checked as boolean
                      }
                    }))
                  }
                />
                <Label htmlFor="paliers">Versement par paliers</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Mode de versement :</Label>
            <RadioGroup 
              value={formData.modeVersement}
              onValueChange={(value: 'unique' | 'paliers') => 
                setFormData(prev => ({ ...prev, modeVersement: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="unique" id="unique" />
                <Label htmlFor="unique">Versement en une seule fois</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paliers" id="paliers" />
                <Label htmlFor="paliers">Versement par paliers</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Paliers de versement */}
          {(formData.optionsSecurisation.acompte || formData.optionsSecurisation.total || formData.optionsSecurisation.paliers) && (
            <div className="space-y-3">
              <Label>Paliers de versement :</Label>
              
              {formData.optionsSecurisation.acompte && (
                <div className="space-y-2">
                  <h5 className="font-medium">Si acompte uniquement :</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Acompte signature (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.signature}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            signature: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Acompte début chantier (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.debutChantier}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            debutChantier: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(formData.optionsSecurisation.total || formData.optionsSecurisation.paliers) && (
                <div className="space-y-2">
                  <h5 className="font-medium">Si totalité ou par paliers :</h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Signature du devis (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.signature}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            signature: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Début chantier (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.debutChantier}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            debutChantier: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Milieu chantier (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.milieuChantier}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            milieuChantier: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Réception fin de chantier (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.receptionFin}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            receptionFin: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Fin de chantier (montant total) (€)</Label>
                      <Input 
                        type="number"
                        value={formData.paliersVersement.finChantier}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          paliersVersement: {
                            ...prev.paliersVersement,
                            finChantier: parseFloat(e.target.value) || 0
                          }
                        }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
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

export default ConsentementForm;
```

---

## 📧 **EMAILS D'EXPLICATION**

### **Email pour le particulier**
```markdown
📧 Objet : Comment présenter le paiement sécurisé dans SwipeTonPro

Bonjour [Particulier],

Découvrez comment fonctionne notre système de paiement sécurisé SwipeTonPro :

🔒 **Paiement sécurisé SwipeTonPro**

**Frais : 3,3%**

Ces frais couvrent :
- Sécurisation du paiement
- Gestion des versements  
- Protection client et artisan

💰 **Options disponibles :**
- Frais partagés (50% client / 50% artisan)
- Frais pris en charge par le client
- Frais offerts par l'artisan

📊 **Exemple concret pour votre projet :**

Projet rénovation : 10 000 €

| Description | Montant |
|-------------|---------|
| Montant projet | 10 000 € |
| Frais sécurisation (3,3%) | 325 € |
| Total | 10 325 € |

**Options possibles :**

🎁 **Frais offerts par l'artisan**
➡️ Client paie : 10 000 €

🤝 **Frais partagés**
➡️ Client paie : 5 162,50 € (50%)
➡️ Artisan paie : 5 162,50 € (50%)

💳 **Frais pris en charge par le client**
➡️ Client paie : 10 325 €

📄 **Document de consentement :**
Vous trouverez dans votre dashboard le document de consentement à remplir 
pour formaliser les modalités de paiement et de sécurisation.

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

💰 **Avantages pour vous :**
- Offrir les frais pour rassurer vos clients
- Partager les frais pour un compromis équitable
- Sécuriser vos paiements et vos chantiers

📊 **Exemple concret à présenter :**

Projet rénovation : 10 000 €

| Description | Montant |
|-------------|---------|
| Montant projet | 10 000 € |
| Frais sécurisation (3,3%) | 325 € |
| Total | 10 325 € |

**Options à proposer au client :**

🎁 **Frais offerts par vous**
➡️ Client paie : 10 000 €
➡️ Vous payez : 325 € (frais)

🤝 **Frais partagés**
➡️ Client paie : 5 162,50 € (50%)
➡️ Vous payez : 5 162,50 € (50%)

💡 **Conseil :**
Proposer les frais offerts est un excellent argument commercial 
qui rassure le client et montre votre sérieux.

📄 **Document de consentement :**
Utilisez le document dans votre dashboard pour formaliser 
les modalités de paiement avec votre client.

Cordialement,
L'équipe SwipeTonPro
```

---

## 🎯 **POINTS CLÉS DE LA VERSION 2**

### **📄 Document simplifié**
- **Suppression des témoins** 
- **Informations pré-remplies** depuis le dashboard
- **Cases à cocher** claires pour les options
- **Paliers prédéfinis** avec montants personnalisables

### **💰 Frais de 3,3%**
- **Calcul automatique** dans l'interface
- **3 options de répartition** (partagé/client/artisan)
- **Exemple concret** affiché en temps réel
- **Présentation professionnelle** pour les clients

### **🖥️ Interface complète**
- **Formulaire interactif** dans le dashboard
- **Calculs automatiques** des frais
- **Prévisualisation** en temps réel
- **Génération PDF** automatique

### **📧 Emails d'explication**
- **Exemples concrets** pour les deux parties
- **Arguments commerciaux** pour les professionnels
- **Présentation simple** du système
- **Conseils pratiques** d'utilisation

---

## 🎉 **CONCLUSION V2**

**Ce document de consentement V2 offre :**
- **📄 Formulaire simplifié** et professionnel
- **💰 Frais clairs** de 3,3% avec options
- **🖥️ Interface complète** dans le dashboard
- **📧 Communication claire** avec les clients
- **🔒 Sécurisation totale** des transactions

**✨ Solution complète et professionnelle pour la sécurisation des paiements !**
