import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// Désactiver le body parser par défaut de Next.js
export const config = {
  api: {
    bodyParser: false,
  },
};

/**
 * API pour uploader une photo et obtenir une estimation
 * Accepte multipart/form-data avec une image
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    // Parser le formulaire multipart
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB max
      keepExtensions: true,
      filter: function ({ mimetype }) {
        // Accepter uniquement les images
        return mimetype ? mimetype.includes('image') : false;
      },
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    // Récupérer le fichier image
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;
    
    if (!imageFile) {
      return res.status(400).json({
        error: 'Aucune image fournie',
        success: false,
      });
    }

    // Lire le fichier et le convertir en base64
    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const imageBase64 = imageBuffer.toString('base64');

    // Nettoyer le fichier temporaire
    fs.unlinkSync(imageFile.filepath);

    // Extraire les autres champs du formulaire
    const category = Array.isArray(fields.category) ? fields.category[0] : fields.category;
    const city = Array.isArray(fields.city) ? fields.city[0] : fields.city;
    const postal_code = Array.isArray(fields.postal_code) ? fields.postal_code[0] : fields.postal_code;
    const description = Array.isArray(fields.description) ? fields.description[0] : fields.description;
    const surface = Array.isArray(fields.surface) ? fields.surface[0] : fields.surface;
    const type_bien = Array.isArray(fields.type_bien) ? fields.type_bien[0] : fields.type_bien;

    // Appeler l'API d'estimation avec l'image en base64
    const estimationResponse = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/ai-estimation`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_base64: imageBase64,
          category,
          city,
          postal_code,
          description,
          surface: surface ? parseFloat(surface) : undefined,
          type_bien,
        }),
      }
    );

    const estimationData = await estimationResponse.json();

    if (!estimationResponse.ok) {
      throw new Error(estimationData.error || 'Erreur lors de l\'estimation');
    }

    return res.status(200).json({
      success: true,
      ...estimationData,
      image_size: imageBuffer.length,
      image_type: imageFile.mimetype,
    });
  } catch (error: any) {
    console.error('❌ Erreur API estimation photo:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur lors du traitement de l\'image',
      details: error.message,
    });
  }
}
