import type { NextApiRequest, NextApiResponse } from "next";
import { createClient } from "@supabase/supabase-js";

/**
 * API Route pour créer le compte Super Admin
 * Cette route utilise la clé SERVICE_ROLE pour créer un utilisateur directement
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Sécurité : Vérifier la méthode
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Sécurité : Vérifier le secret (optionnel mais recommandé)
  const { secret } = req.body;
  const SETUP_SECRET = process.env.SETUP_SECRET || "swipetonpro-setup-2026";
  
  if (secret !== SETUP_SECRET) {
    return res.status(403).json({ error: "Invalid secret" });
  }

  try {
    // Récupérer les variables d'environnement
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: "Missing Supabase credentials",
        details: "NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found"
      });
    }

    // Créer un client Supabase avec la clé SERVICE_ROLE
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const email = "admin@swipetonpro.fr";
    const password = "Red1980";

    console.log("🔍 Vérification si l'utilisateur existe déjà...");

    // Vérifier si l'utilisateur existe déjà
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error("❌ Erreur lors de la vérification:", listError);
      return res.status(500).json({ 
        error: "Failed to check existing users",
        details: listError.message 
      });
    }

    const users = existingUsers?.users || [];
    const existingUser = users.find((u: any) => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log("✅ Utilisateur existe déjà:", existingUser.id);
      userId = existingUser.id;

      // Mettre à jour le mot de passe et confirmer l'email
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          password: password,
          email_confirm: true
        }
      );

      if (updateError) {
        console.error("❌ Erreur mise à jour:", updateError);
        return res.status(500).json({ 
          error: "Failed to update user",
          details: updateError.message 
        });
      }

      console.log("✅ Mot de passe et email mis à jour");
    } else {
      console.log("🔍 Création d'un nouvel utilisateur...");

      // Créer l'utilisateur avec email confirmé
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: "Super Administrateur"
        }
      });

      if (createError) {
        console.error("❌ Erreur création:", createError);
        return res.status(500).json({ 
          error: "Failed to create user",
          details: createError.message 
        });
      }

      if (!newUser.user) {
        return res.status(500).json({ error: "User creation failed - no user returned" });
      }

      userId = newUser.user.id;
      console.log("✅ Utilisateur créé:", userId);
    }

    // Vérifier si le profil existe
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (existingProfile) {
      console.log("✅ Profil existe déjà, mise à jour du rôle...");
      
      // Mettre à jour le rôle
      const { error: updateProfileError } = await supabaseAdmin
        .from("profiles")
        .update({
          role: "super_admin",
          updated_at: new Date().toISOString()
        })
        .eq("id", userId);

      if (updateProfileError) {
        console.error("❌ Erreur mise à jour profil:", updateProfileError);
        return res.status(500).json({ 
          error: "Failed to update profile",
          details: updateProfileError.message 
        });
      }
    } else {
      console.log("🔍 Création du profil...");
      
      // Créer le profil
      const { error: createProfileError } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: userId,
          email: email,
          full_name: "Super Administrateur",
          role: "super_admin",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (createProfileError) {
        console.error("❌ Erreur création profil:", createProfileError);
        return res.status(500).json({ 
          error: "Failed to create profile",
          details: createProfileError.message 
        });
      }
    }

    console.log("🎉 Compte Super Admin créé/mis à jour avec succès!");

    return res.status(200).json({
      success: true,
      message: "Super Admin account created successfully",
      userId: userId,
      email: email
    });

  } catch (error: any) {
    console.error("❌ Erreur inattendue:", error);
    return res.status(500).json({ 
      error: "Unexpected error",
      details: error.message 
    });
  }
}