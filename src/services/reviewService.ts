import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Review = Database["public"]["Tables"]["reviews"]["Row"];
type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];

/**
 * Create a review for a completed project
 */
export async function createReview(review: ReviewInsert): Promise<Review> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert(review)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating review:", error);
    throw error;
  }
}

/**
 * Get reviews for a professional
 */
export async function getProfessionalReviews(professionalId: string) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        projects:project_id(title, category),
        helpful_count:review_helpful(count)
      `)
      .eq("professional_id", professionalId)
      .eq("is_verified", true)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching professional reviews:", error);
    return [];
  }
}

/**
 * Get average rating and count for a professional
 */
export async function getProfessionalRating(professionalId: string) {
  try {
    const { data: avgData, error: avgError } = await supabase
      .rpc("get_professional_average_rating", { prof_id: professionalId });

    const { data: countData, error: countError } = await supabase
      .rpc("get_professional_review_count", { prof_id: professionalId });

    if (avgError) throw avgError;
    if (countError) throw countError;

    return {
      averageRating: avgData || 0,
      reviewCount: countData || 0
    };
  } catch (error) {
    console.error("Error fetching professional rating:", error);
    return { averageRating: 0, reviewCount: 0 };
  }
}

/**
 * Update a review (client can edit their review)
 */
export async function updateReview(reviewId: string, updates: ReviewUpdate): Promise<Review> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating review:", error);
    throw error;
  }
}

/**
 * Add professional response to a review
 */
export async function addProfessionalResponse(reviewId: string, response: string): Promise<Review> {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .update({ professional_response: response, updated_at: new Date().toISOString() })
      .eq("id", reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error adding professional response:", error);
    throw error;
  }
}

/**
 * Mark a review as helpful
 */
export async function markReviewHelpful(reviewId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("review_helpful")
      .insert({ review_id: reviewId, user_id: userId });

    if (error) throw error;
  } catch (error) {
    console.error("Error marking review as helpful:", error);
    throw error;
  }
}

/**
 * Remove helpful mark from a review
 */
export async function removeReviewHelpful(reviewId: string, userId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("review_helpful")
      .delete()
      .eq("review_id", reviewId)
      .eq("user_id", userId);

    if (error) throw error;
  } catch (error) {
    console.error("Error removing helpful mark:", error);
    throw error;
  }
}

/**
 * Check if user has marked a review as helpful
 */
export async function hasUserMarkedHelpful(reviewId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("review_helpful")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return !!data;
  } catch (error) {
    console.error("Error checking helpful status:", error);
    return false;
  }
}

/**
 * Get reviews that can be written by a client
 */
export async function getPendingReviews(clientId: string) {
  try {
    // Get completed projects where client hasn't written a review yet
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        category,
        project_interests!inner(
          professional_id,
          professionals(id, company_name, specialties)
        )
      `)
      .eq("client_id", clientId)
      .eq("status", "completed")
      .eq("project_interests.status", "accepted");

    if (error) throw error;

    // Filter out projects that already have reviews
    const projectsWithoutReviews = [];
    for (const project of data || []) {
      const { data: existingReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("project_id", project.id)
        .eq("client_id", clientId)
        .single();

      if (!existingReview) {
        projectsWithoutReviews.push(project);
      }
    }

    return projectsWithoutReviews;
  } catch (error) {
    console.error("Error fetching pending reviews:", error);
    return [];
  }
}