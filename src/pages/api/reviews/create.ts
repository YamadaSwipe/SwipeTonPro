import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  try {
    const { professional_id, project_id, rating, comment } = req.body;

    // Validation des données
    if (!professional_id || !project_id || !rating || !comment) {
      return res.status(400).json({ 
        error: 'Données manquantes' 
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        error: 'La note doit être entre 1 et 5' 
      });
    }

    if (comment.length < 10 || comment.length > 1000) {
      return res.status(400).json({ 
        error: 'Le commentaire doit faire entre 10 et 1000 caractères' 
      });
    }

    // Vérifier l'authentification
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Token invalide' });
    }

    // Vérifier que l'utilisateur est bien le client du projet
    const { data: project, error: projectError } = await (supabase as any)
      .from('projects')
      .select('user_id, status')
      .eq('id', project_id)
      .single();

    if (projectError || !project) {
      return res.status(404).json({ error: 'Projet non trouvé' });
    }

    if (project.user_id !== user.id) {
      return res.status(403).json({ 
        error: 'Vous n\'êtes pas autorisé à noter ce projet' 
      });
    }

    if (project.status !== 'completed') {
      return res.status(400).json({ 
        error: 'Le projet doit être terminé pour être noté' 
      });
    }

    // Vérifier que le professionnel a bien travaillé sur ce projet
    const { data: match, error: matchError } = await (supabase as any)
      .from('project_interests')
      .select('professional_id, status')
      .eq('project_id', project_id)
      .eq('professional_id', professional_id)
      .eq('status', 'paid')
      .single();

    if (matchError || !match) {
      return res.status(404).json({ 
        error: 'Aucune collaboration trouvée pour ce projet' 
      });
    }

    // Vérifier qu'une review n'existe pas déjà
    const { data: existingReview, error: checkError } = await (supabase as any)
      .from('reviews')
      .select('id')
      .eq('project_id', project_id)
      .eq('client_id', user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Erreur vérification review' });
    }

    if (existingReview) {
      return res.status(400).json({ 
        error: 'Vous avez déjà noté ce professionnel pour ce projet' 
      });
    }

    // Créer la review
    const { data: review, error: insertError } = await (supabase as any)
      .from('reviews')
      .insert({
        professional_id,
        project_id,
        client_id: user.id,
        rating,
        comment: comment.trim(),
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erreur insertion review:', insertError);
      return res.status(500).json({ 
        error: 'Erreur lors de la création de la review' 
      });
    }

    // Mettre à jour la note moyenne du professionnel
    const { data: allReviews } = await (supabase as any)
      .from('reviews')
      .select('rating')
      .eq('professional_id', professional_id)
      .eq('status', 'published');

    if (allReviews) {
      const averageRating = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;
      
      await (supabase as any)
        .from('professionals')
        .update({
          average_rating: Math.round(averageRating * 10) / 10, // Arrondi à 1 décimale
          total_reviews: allReviews.length,
          updated_at: new Date().toISOString()
        })
        .eq('id', professional_id);
    }

    // Notifier le professionnel
    await (supabase as any)
      .from('notifications')
      .insert({
        user_id: professional_id,
        type: 'new_review',
        title: 'Nouvel avis reçu',
        message: `Vous avez reçu un avis de ${rating}/5 étoiles pour votre travail`,
        data: {
          project_id,
          review_id: review.id,
          rating
        },
        created_at: new Date().toISOString(),
        read: false
      });

    res.status(201).json({ 
      success: true,
      review: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        created_at: review.created_at
      }
    });

  } catch (error: any) {
    console.error('Erreur API review:', error);
    res.status(500).json({ 
      error: 'Erreur serveur interne' 
    });
  }
}
