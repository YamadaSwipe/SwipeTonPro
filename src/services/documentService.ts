import { supabase } from '@/integrations/supabase/client';

export interface ConsentementData {
  projetId: string;
  projetInfo: {
    titre: string;
    description: string;
    localisation: string;
  };
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
  budgetTotal: number;
  fraisSwipeTonPro: number;
  montantReelTravaux: number;
  optionsFrais: 'partage' | 'client' | 'artisan';
  montantArtisan: number;
  montantClient: number;
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

export class DocumentService {
  /**
   * Génère un PDF de consentement
   */
  static async generateConsentementPDF(data: ConsentementData): Promise<Blob> {
    // Importer jsPDF dynamiquement pour éviter les problèmes SSR
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    // Configuration des polices et couleurs
    const primaryColor = [234, 88, 12]; // Orange SwipeTonPro
    const textColor = [51, 51, 51]; // Gris foncé
    const lightColor = [248, 249, 250]; // Gris clair

    // En-tête
    doc.setFillColor(...(primaryColor as [number, number, number]));
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('CONSENTEMENT MUTUEL', 105, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('DE SÉCURISATION ET VERSEMENT', 105, 32, { align: 'center' });

    // Informations générales
    doc.setTextColor(...(textColor as [number, number, number]));
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS GÉNÉRALES', 20, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const date = new Date().toLocaleDateString('fr-FR');
    doc.text(`Date : ${date}`, 20, 65);
    doc.text(`Référence projet : ${data.projetId}`, 20, 72);
    doc.text('SwipeTonPro : Intermédiaire technologique (non établissement bancaire)', 20, 79);

    // Parties concernées
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PARTIES CONCERNÉES', 20, 95);

    // Particulier
    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 100, 170, 35, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Particulier client', 25, 108);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom : ${data.particulierInfo.nom}`, 25, 115);
    doc.text(`Adresse : ${data.particulierInfo.adresse}`, 25, 122);
    doc.text(`Email : ${data.particulierInfo.email}`, 25, 129);
    doc.text(`Téléphone : ${data.particulierInfo.telephone}`, 100, 129);

    // Professionnel
    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 140, 170, 45, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Professionnel / Gérant société', 25, 148);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Nom : ${data.professionnelInfo.nom}`, 25, 155);
    doc.text(`Entreprise : ${data.professionnelInfo.entreprise}`, 25, 162);
    doc.text(`Forme juridique : ${data.professionnelInfo.formeJuridique}`, 25, 169);
    doc.text(`SIRET : ${data.professionnelInfo.siret}`, 25, 176);
    doc.text(`Adresse : ${data.professionnelInfo.adresse}`, 25, 183);
    doc.text(`Email : ${data.professionnelInfo.email}`, 100, 183);
    doc.text(`Téléphone : ${data.professionnelInfo.telephone}`, 25, 190);

    // Détails du projet
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('DÉTAILS DU PROJET', 20, 205);

    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 210, 170, 25, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Titre : ${data.projetInfo.titre}`, 25, 218);
    doc.text(`Description : ${data.projetInfo.description}`, 25, 225);
    doc.text(`Localisation : ${data.projetInfo.localisation}`, 25, 232);

    // Paiement sécurisé
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('PAIEMENT SÉCURISÉ SWIPETONPRO', 20, 245);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Frais de sécurisation : 3,3%', 20, 255);
    doc.text('Ces frais couvrent : Sécurisation du paiement, Gestion des versements, Protection client et artisan', 20, 262);

    // Budget du projet
    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 268, 170, 30, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Budget du projet (frais comprises) : ${data.budgetTotal.toLocaleString('fr-FR')} €`, 25, 278);
    
    doc.setFont('helvetica', 'normal');
    doc.text(`Budget total : ${data.budgetTotal.toLocaleString('fr-FR')} € (frais déjà inclus)`, 25, 285);
    doc.text(`Frais SwipeTonPro (3,3%) : ${data.fraisSwipeTonPro.toLocaleString('fr-FR')} €`, 25, 292);
    doc.text(`Montant réel des travaux : ${data.montantReelTravaux.toLocaleString('fr-FR')} €`, 25, 299);

    // Options de répartition
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('OPTIONS DE RÉPARTITION DES FRAIS', 20, 315);

    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 320, 170, 25, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const optionText = data.optionsFrais === 'artisan' ? 'Frais offerts par l\'artisan' :
                      data.optionsFrais === 'partage' ? 'Frais partagés (50% client / 50% artisan)' :
                      'Frais pris en charge par le client';
    doc.text(`Option choisie : ${optionText}`, 25, 330);

    // Répartition des montants
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('RÉPARTITION DES MONTANTS', 20, 355);

    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 360, 170, 25, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Montant pour l'artisan : ${data.montantArtisan.toLocaleString('fr-FR')} €`, 25, 370);
    doc.text(`Montant pour le client : ${data.montantClient.toLocaleString('fr-FR')} €`, 25, 377);

    // Modalités de sécurisation
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('MODALITÉS DE SÉCURISATION', 20, 395);

    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 400, 170, 35, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const options = [];
    if (data.optionsSecurisation.acompte) options.push('Acompte uniquement');
    if (data.optionsSecurisation.total) options.push('Totalité du projet');
    if (data.optionsSecurisation.paliers) options.push('Versement par paliers');
    
    doc.text(`Options choisies : ${options.join(', ')}`, 25, 410);
    doc.text(`Mode de versement : ${data.modeVersement === 'unique' ? 'Versement en une seule fois' : 'Versement par paliers'}`, 25, 417);
    doc.text(`Montant à sécuriser : ${data.budgetTotal.toLocaleString('fr-FR')} €`, 25, 424);

    // Paliers de versement
    if (data.optionsSecurisation.acompte || data.optionsSecurisation.total || data.optionsSecurisation.paliers) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('PALIERS DE VERSEMENT', 20, 440);

      doc.setFillColor(...(lightColor as [number, number, number]));
      doc.rect(20, 445, 170, 35, 'F');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      let yPos = 455;
      
      if (data.optionsSecurisation.acompte) {
        doc.text('Si acompte uniquement :', 25, yPos);
        yPos += 5;
        if (data.paliersVersement.signature > 0) {
          doc.text(`Acompte signature : ${data.paliersVersement.signature.toLocaleString('fr-FR')} €`, 30, yPos);
          yPos += 5;
        }
        if (data.paliersVersement.debutChantier > 0) {
          doc.text(`Acompte début chantier : ${data.paliersVersement.debutChantier.toLocaleString('fr-FR')} €`, 30, yPos);
          yPos += 5;
        }
      }
      
      if (data.optionsSecurisation.total || data.optionsSecurisation.paliers) {
        doc.text('Si totalité ou par paliers :', 25, yPos);
        yPos += 5;
        if (data.paliersVersement.signature > 0) {
          doc.text(`Signature du devis : ${data.paliersVersement.signature.toLocaleString('fr-FR')} €`, 30, yPos);
          yPos += 5;
        }
        if (data.paliersVersement.debutChantier > 0) {
          doc.text(`Début chantier : ${data.paliersVersement.debutChantier.toLocaleString('fr-FR')} €`, 30, yPos);
          yPos += 5;
        }
        if (data.paliersVersement.milieuChantier > 0) {
          doc.text(`Milieu chantier : ${data.paliersVersement.milieuChantier.toLocaleString('fr-FR')} €`, 30, yPos);
          yPos += 5;
        }
        if (data.paliersVersement.receptionFin > 0) {
          doc.text(`Réception fin de chantier : ${data.paliersVersement.receptionFin.toLocaleString('fr-FR')} €`, 30, yPos);
          yPos += 5;
        }
        if (data.paliersVersement.finChantier > 0) {
          doc.text(`Fin de chantier (montant total) : ${data.paliersVersement.finChantier.toLocaleString('fr-FR')} €`, 30, yPos);
          yPos += 5;
        }
      }
    }

    // Cadre réglementaire
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('CADRE RÉGLEMENTAIRE', 20, 500);

    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 505, 170, 25, 'F');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Statut de SwipeTonPro : Plateforme technologique qui facilite la mise en relation entre particuliers et professionnels.', 25, 515);
    doc.text('Partenaire de paiement : Toutes les transactions sont traitées par Stripe, entreprise agréée et régulée dans l\'UE.', 25, 522);
    doc.text('Protection des fonds : Les fonds sont conservés dans un compte séquestre jusqu\'à validation des conditions.', 25, 529);

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('SIGNATURES', 20, 550);

    doc.setFillColor(...(lightColor as [number, number, number]));
    doc.rect(20, 555, 80, 40, 'F');
    doc.rect(110, 555, 80, 40, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Particulier', 25, 565);
    doc.text('Professionnel', 115, 565);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Signature : ___________________', 25, 575);
    doc.text('Signature : ___________________', 115, 575);
    doc.text('Date : ___________________', 25, 585);
    doc.text('Date : ___________________', 115, 585);
    doc.text(`Nom : ${data.particulierInfo.nom}`, 25, 595);
    doc.text(`Nom : ${data.professionnelInfo.nom}`, 115, 595);

    // Filigrane
    doc.setFillColor(200, 200, 200);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(50);
    doc.saveGraphicsState();
    doc.setGState({ opacity: 0.1 } as any);
    doc.text('SwipeTonPro', 105, 150, { align: 'center', angle: 45 });
    doc.restoreGraphicsState();

    return new Blob([doc.output('blob')], { type: 'application/pdf' });
  }

  /**
   * Sauvegarde un document dans Supabase Storage
   */
  static async saveDocument(projetId: string, blob: Blob): Promise<string> {
    const fileName = `consentements/${projetId}/${Date.now()}.pdf`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur sauvegarde document:', error);
      throw new Error('Impossible de sauvegarder le document');
    }

    // Mettre à jour le projet avec l'URL du document
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    await (supabase as any)
      .from('projets')
      .update({ 
        consentement_url: publicUrl,
        consentement_generated_at: new Date().toISOString()
      })
      .eq('id', projetId);

    return data.path;
  }

  /**
   * Récupère l'URL publique d'un document
   */
  static async getDocumentUrl(projetId: string): Promise<string | null> {
    try {
      const { data } = await (supabase as any)
        .from('projets')
        .select('consentement_url')
        .eq('id', projetId)
        .single();

      return data?.consentement_url || null;
    } catch (error) {
      console.error('Erreur récupération URL document:', error);
      return null;
    }
  }

  /**
   * Vérifie si un document de consentement existe pour un projet
   */
  static async documentExists(projetId: string): Promise<boolean> {
    const url = await this.getDocumentUrl(projetId);
    return url !== null;
  }

  /**
   * Supprime un document de consentement
   */
  static async deleteDocument(projetId: string): Promise<void> {
    try {
      // Récupérer l'URL du document
      const url = await this.getDocumentUrl(projetId);
      
      if (url) {
        // Extraire le chemin du fichier de l'URL
        const urlParts = url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `consentements/${projetId}/${fileName}`;
        
        // Supprimer le fichier du storage
        await supabase.storage
          .from('documents')
          .remove([filePath]);
      }

      // Mettre à jour le projet
      await (supabase as any)
        .from('projets')
        .update({ 
          consentement_url: null,
          consentement_generated_at: null
        })
        .eq('id', projetId);
    } catch (error) {
      console.error('Erreur suppression document:', error);
      throw new Error('Impossible de supprimer le document');
    }
  }

  /**
   * Formate une date en français
   */
  static formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  /**
   * Formate un montant en euros
   */
  static formatMontant(montant: number): string {
    return montant.toLocaleString('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    });
  }
}
