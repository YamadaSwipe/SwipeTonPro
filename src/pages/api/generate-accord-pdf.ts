import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { projectId, formData, date_signature } = req.body;

    if (!projectId || !formData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Générer le HTML du contrat
    const contractHTML = generateContractHTML(formData, date_signature);

    // Lancer Puppeteer pour générer le PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    
    // Définir le contenu HTML
    await page.setContent(contractHTML, {
      waitUntil: 'networkidle0'
    });

    // Générer le PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    });

    await browser.close();

    // Uploader le PDF vers Supabase Storage
    const fileName = `accord-mutuel-${projectId}-${Date.now()}.pdf`;
    const filePath = `accords/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Error uploading PDF:', uploadError);
      return res.status(500).json({ error: 'Failed to upload PDF' });
    }

    // Obtenir l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Mettre à jour le projet avec les informations de l'accord
    await supabase
      .from('projects')
      .update({
        accord_pdf_url: publicUrl,
        accord_pdf_path: filePath,
        accord_generated_at: new Date().toISOString(),
        accord_status: 'generated',
        accord_data: formData
      })
      .eq('id', projectId);

    res.status(200).json({ 
      success: true, 
      pdfUrl: publicUrl,
      filePath,
      message: 'PDF generated successfully' 
    });

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

function generateContractHTML(data: any, dateSignature: string): string {
  const etapesHTML = data.etapes.map((etape: any) => `
    <tr>
      <td style="border: 1px solid #ddd; padding: 8px;">${etape.label}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${etape.pourcentage}%</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${etape.condition}</td>
      <td style="border: 1px solid #ddd; padding: 8px;">${etape.montant} €</td>
    </tr>
  `).join('');

  return `
    <div id="contract-template" style="font-family: Arial, sans-serif; padding: 40px; color: #333;">
    
    <div style="text-align: center; border-bottom: 2px solid #0052cc; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #0052cc; margin: 0; font-size: 28px;">SWIPE TON PRO</h1>
        <div style="display: inline-block; background: #e6f0ff; color: #0052cc; padding: 5px 15px; border-radius: 20px; font-weight: bold; margin-top: 10px;">
            ACCORD DE RÉALISATION & SÉQUESTRE STRIPE
        </div>
    </div>

    <h2 style="text-align: center; text-transform: uppercase;">Accord Mutuel et Plan de Paiement</h2>

    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee;">
        <h3 style="color: #0052cc; border-bottom: 1px solid #0052cc; font-size: 14px; text-transform: uppercase;">1. Les Parties</h3>
        <p><strong>LE CLIENT :</strong> ${data.nom_client} <br> <strong>Adresse du chantier :</strong> ${data.adresse_travaux}</p>
        <p><strong>L'ARTISAN :</strong> ${data.nom_entreprise} <br> <strong>SIRET :</strong> ${data.siret_pro} | <strong>Assurance :</strong> Vérifiée par la plateforme</p>
    </div>

    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee;">
        <h3 style="color: #0052cc; border-bottom: 1px solid #0052cc; font-size: 14px; text-transform: uppercase;">2. Détails de la prestation</h3>
        <p><strong>Nature :</strong> ${data.nature_travaux}</p>
        <p><strong>Calendrier :</strong> Début prévu le ${data.date_debut} | Durée estimée : ${data.duree_travaux}</p>
    </div>

    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #eee;">
        <h3 style="color: #0052cc; border-bottom: 1px solid #0052cc; font-size: 14px; text-transform: uppercase;">3. Échéancier Séquestre (Via Stripe)</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
                <tr style="background: #eee;">
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Étape</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">%</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Condition</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Montant</th>
                </tr>
            </thead>
            <tbody>
                ${etapesHTML}
            </tbody>
        </table>
        <p style="text-align: right; font-weight: bold; font-size: 18px; margin-top: 10px;">TOTAL TTC : ${data.total_projet} €</p>
    </div>

    <div style="font-size: 11px; color: #666; margin-top: 30px; border: 1px dashed #ccc; padding: 10px;">
        <strong>NOTE JURIDIQUE :</strong> Swipe Ton Pro est un intermédiaire technique. Les fonds sont gérés par Stripe. La plateforme décline toute responsabilité quant à l'exécution technique des travaux. Ce document vaut contrat entre les parties.
    </div>

    <div style="margin-top: 50px; display: flex; justify-content: space-between;">
        <div style="width: 40%; border-top: 1px solid #000; padding-top: 10px;">
            <strong>Signature Client</strong><br>
            <small>Signé numériquement le ${dateSignature}</small>
        </div>
        <div style="width: 40%; border-top: 1px solid #000; padding-top: 10px; text-align: right;">
            <strong>Signature Artisan</strong><br>
            <small>Signé numériquement le ${dateSignature}</small>
        </div>
    </div>
</div>
  `;
}
