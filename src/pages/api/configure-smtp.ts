import type { NextApiRequest, NextApiResponse } from "next";

/**
 * API pour configurer le SMTP Supabase automatiquement
 * Cette API utilise l'API Management de Supabase pour configurer le SMTP OVH
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Sécurité : Cette route ne devrait être accessible qu'aux admins
  // Pour une première configuration, on peut l'appeler manuellement
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: "Configuration manquante",
        details: "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non définis" 
      });
    }

    // Extraire le project ref depuis l'URL
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];

    // Configuration SMTP OVH
    const smtpConfig = {
      enable_smtp: true,
      smtp_admin_email: "noreply@swipetonpro.fr",
      smtp_host: "ssl0.ovh.net",
      smtp_port: 465,
      smtp_user: "noreply@swipetonpro.fr",
      smtp_pass: process.env.SMTP_PASSWORD || "Swipe@Ton@Pro123@",
      smtp_sender_name: "SwipeTonPro",
      smtp_max_frequency: 1
    };

    // Appel à l'API Management de Supabase
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/config/auth`;
    
    const response = await fetch(managementApiUrl, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${supabaseServiceKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(smtpConfig)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur configuration SMTP:", errorData);
      
      return res.status(response.status).json({
        error: "Échec de la configuration SMTP",
        details: errorData,
        suggestion: "Utilisez la configuration manuelle via le dashboard Supabase"
      });
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      message: "SMTP configuré avec succès !",
      config: {
        host: "ssl0.ovh.net",
        port: 465,
        sender: "noreply@swipetonpro.fr",
        sender_name: "SwipeTonPro"
      },
      data
    });

  } catch (error: any) {
    console.error("Erreur lors de la configuration SMTP:", error);
    
    return res.status(500).json({
      error: "Erreur serveur",
      details: error.message,
      suggestion: "Contactez le support ou configurez manuellement via le dashboard Supabase"
    });
  }
}