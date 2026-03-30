import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Créer le client avec les variables d'environnement
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Variables d\'environnement Supabase manquantes');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { professionalId, documentType, fileName, fileData } = req.body;

    if (!professionalId || !documentType || !fileName || !fileData) {
      return res.status(400).json({ 
        error: 'professionalId, documentType, fileName et fileData requis' 
      });
    }

    // Vérifier si le bucket existe, sinon le créer
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const documentsBucket = buckets?.find(b => b.name === 'documents');
      
      if (!documentsBucket) {
        console.log('Création du bucket documents...');
        const { error: bucketError } = await supabase.storage.createBucket('documents', {
          public: true,
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['application/pdf', 'image/jpeg', 'image/png']
        });
        
        if (bucketError) {
          console.error('Erreur création bucket:', bucketError);
          return res.status(500).json({ error: 'Erreur création bucket storage' });
        }
      }
    } catch (bucketError) {
      console.error('Erreur vérification bucket:', bucketError);
    }

    // Convertir base64 en buffer
    let base64Data = fileData;
    if (fileData.includes(',')) {
      base64Data = fileData.split(',')[1];
    }
    
    const buffer = Buffer.from(base64Data, 'base64');

    // Upload vers Supabase Storage
    const filePath = `documents/${professionalId}/${Date.now()}-${fileName}`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.error('Erreur upload détaillée:', uploadError);
      return res.status(500).json({ 
        error: 'Erreur upload fichier', 
        details: uploadError.message 
      });
    }

    // Obtenir l'URL publique
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Récupérer l'ID du professionnel pour la vérification
    const { data: professional } = await supabase
      .from('professionals')
      .select('id')
      .eq('user_id', professionalId)
      .single();

    const actualProfessionalId = professional?.id || professionalId;

    // Insérer dans la table documents
    const { data: documentData, error: insertError } = await supabase
      .from('documents')
      .insert({
        professional_id: actualProfessionalId,
        type: documentType,
        file_name: fileName,
        file_url: urlData.publicUrl,
        status: 'verified', // Documents uploadés par admin sont automatiquement vérifiés
        verified_at: new Date().toISOString(),
        verified_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion document:', insertError);
      return res.status(500).json({ 
        error: 'Erreur sauvegarde document', 
        details: insertError.message 
      });
    }

    res.status(200).json({ 
      success: true, 
      document: documentData,
      message: 'Document uploadé avec succès'
    });

  } catch (error) {
    console.error('Erreur API upload document:', error);
    res.status(500).json({ 
      error: 'Erreur serveur', 
      message: error instanceof Error ? error.message : 'Erreur inconnue',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}
