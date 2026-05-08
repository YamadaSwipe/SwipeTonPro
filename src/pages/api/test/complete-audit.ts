import { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

// Données de test pour simulation complète
const TEST_DATA = {
  // Comptes professionnels à créer
  professionals: [
    {
      email: 'pro.plomberie.test@swipetonpro.com',
      password: 'Test123456!',
      company_name: 'Plomberie Express Paris',
      siret: '12345678901234',
      phone: '0612345678',
      address: '15 Rue de la Plomberie',
      city: 'Paris',
      postal_code: '75001',
      work_type: ['Plomberie', 'Chauffage', 'Climatisation'],
      description: 'Artisan plombier expérimenté depuis 10 ans',
      certifications: ['qualibat', 'rge'],
    },
    {
      email: 'pro.electricite.test@swipetonpro.com',
      password: 'Test123456!',
      company_name: 'Électricité Pro Services',
      siret: '98765432109876',
      phone: '0623456789',
      address: "25 Avenue de l'Électricité",
      city: 'Lyon',
      postal_code: '69001',
      work_type: ['Électricité', 'Domotique', 'Sécurité'],
      description: "Électricien certifié pour tous types d'installations",
      certifications: ['qualifelec'],
    },
    {
      email: 'pro.menuiserie.test@swipetonpro.com',
      password: 'Test123456!',
      company_name: 'Menuiserie Premium',
      siret: '45678901234567',
      phone: '0634567890',
      address: '8 Boulevard du Bois',
      city: 'Marseille',
      postal_code: '13001',
      work_type: ['Menuiserie', 'Fenêtres', 'Portes', 'Volets'],
      description: 'Menuisier spécialisé dans les travaux sur mesure',
      certifications: ['qualibat'],
    },
  ],

  // Comptes clients à créer
  clients: [
    {
      email: 'client.dupont.test@swipetonpro.com',
      password: 'Test123456!',
      first_name: 'Jean',
      last_name: 'Dupont',
      phone: '0645678901',
      address: '123 Rue du Client',
      city: 'Paris',
      postal_code: '75002',
    },
    {
      email: 'client.martin.test@swipetonpro.com',
      password: 'Test123456!',
      first_name: 'Marie',
      last_name: 'Martin',
      phone: '0656789012',
      address: '45 Avenue du Particulier',
      city: 'Lyon',
      postal_code: '69002',
    },
    {
      email: 'client.bernard.test@swipetonpro.com',
      password: 'Test123456!',
      first_name: 'Pierre',
      last_name: 'Bernard',
      phone: '0667890123',
      address: '78 Rue Particulière',
      city: 'Marseille',
      postal_code: '13002',
    },
  ],

  // Projets à créer
  projects: [
    {
      title: 'Rénovation salle de bain complète',
      description:
        "Je souhaite rénover complètement ma salle de bain de 8m². Installation d'une douche italienne, remplacement des carrelages, installation d'un nouveau meuble vasque et miroir.",
      category: 'salle_de_bain',
      work_type: ['Plomberie', 'Carrelage', 'Électricité'],
      location: 'Appartement 3ème étage avec ascenseur',
      city: 'Paris',
      postal_code: '75002',
      property_type: 'appartement',
      property_surface: '8',
      budget_min: 3000,
      budget_max: 5000,
      urgency: 'medium',
      desired_deadline: '2-3 mois',
      photos: [],
      required_certifications: ['qualibat'],
    },
    {
      title: 'Installation climatisation réversible',
      description:
        "Installation d'une climatisation réversible dans le salon de 35m². Travaux de passage des gaines et installation de l'unité extérieure.",
      category: 'climatisation',
      work_type: ['Climatisation', 'Électricité'],
      location: 'Maison individuelle',
      city: 'Lyon',
      postal_code: '69002',
      property_type: 'maison',
      property_surface: '35',
      budget_min: 2500,
      budget_max: 4000,
      urgency: 'high',
      desired_deadline: '1 mois',
      photos: [],
      required_certifications: ['qualiPAC'],
    },
    {
      title: 'Remplacement fenêtres et volets',
      description:
        'Remplacement de 5 fenêtres en PVC double vitrage et installation de 3 volets roulants électriques.',
      category: 'menuiserie',
      work_type: ['Menuiserie', 'Fenêtres', 'Électricité'],
      location: 'Appartement 2ème étage',
      city: 'Marseille',
      postal_code: '13002',
      property_type: 'appartement',
      property_surface: '75',
      budget_min: 8000,
      budget_max: 12000,
      urgency: 'low',
      desired_deadline: '3-6 mois',
      photos: [],
      required_certifications: ['qualibat'],
    },
  ],
};

// API Route pour créer les comptes de test
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Missing Supabase credentials' });
    }

    // Utiliser la clé admin si disponible, sinon la clé anon
    const keyToUse = adminServiceKey || supabaseServiceKey;
    const supabase = createClient(supabaseUrl, keyToUse);

    const { action } = req.body;

    switch (action) {
      case 'create_professionals':
        return await createProfessionals(supabase, res);
      case 'create_clients':
        return await createClients(supabase, res);
      case 'create_projects':
        return await createProjects(supabase, res);
      case 'simulate_matching':
        return await simulateMatching(supabase, res);
      case 'simulate_dialogue':
        return await simulateDialogue(supabase, res);
      case 'simulate_payment':
        return await simulatePayment(supabase, res);
      case 'simulate_planning':
        return await simulatePlanning(supabase, res);
      case 'validate_admin':
        return await validateAdmin(supabase, res);
      case 'run_complete_test':
        return await runCompleteTest(supabase, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('❌ Error in test API:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function createProfessionals(supabase: any, res: NextApiResponse) {
  console.log('🔧 Création des comptes professionnels de test...');

  const results = [];

  for (const pro of TEST_DATA.professionals) {
    try {
      // 1. Créer le compte utilisateur
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: pro.email,
          password: pro.password,
          email_confirm: true,
          user_metadata: {
            role: 'professional',
            company_name: pro.company_name,
          },
        });

      if (authError) {
        console.error(`❌ Erreur création auth pour ${pro.email}:`, authError);
        results.push({
          email: pro.email,
          success: false,
          error: authError.message,
        });
        continue;
      }

      // 2. Créer le profil professionnel
      const { data: profileData, error: profileError } = await supabase
        .from('professionals')
        .insert({
          user_id: authData.user.id,
          company_name: pro.company_name,
          siret: pro.siret,
          phone: pro.phone,
          address: pro.address,
          city: pro.city,
          postal_code: pro.postal_code,
          work_types: pro.work_types,
          description: pro.description,
          certifications: pro.certifications,
          is_verified: true, // Forcé pour test
          is_active: true,
        })
        .select()
        .single();

      if (profileError) {
        console.error(
          `❌ Erreur création profil pour ${pro.email}:`,
          profileError
        );
        results.push({
          email: pro.email,
          success: false,
          error: profileError.message,
        });
        continue;
      }

      // 3. Créer le profil utilisateur
      await supabase.from('profiles').insert({
        id: authData.user.id,
        email: pro.email,
        full_name: pro.company_name,
        role: 'professional',
        created_at: new Date().toISOString(),
      });

      console.log(`✅ Compte pro créé: ${pro.company_name} (${pro.email})`);
      results.push({ email: pro.email, success: true, data: profileData });
    } catch (error: any) {
      console.error(`❌ Erreur création compte pro ${pro.email}:`, error);
      results.push({ email: pro.email, success: false, error: error.message });
    }
  }

  return res.status(200).json({
    message: 'Création comptes professionnels terminée',
    results,
  });
}

async function createClients(supabase: any, res: NextApiResponse) {
  console.log('👤 Création des comptes clients de test...');

  const results = [];

  for (const client of TEST_DATA.clients) {
    try {
      // 1. Créer le compte utilisateur
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: client.email,
          password: client.password,
          email_confirm: true,
          user_metadata: {
            role: 'client',
            first_name: client.first_name,
            last_name: client.last_name,
          },
        });

      if (authError) {
        console.error(
          `❌ Erreur création auth pour ${client.email}:`,
          authError
        );
        results.push({
          email: client.email,
          success: false,
          error: authError.message,
        });
        continue;
      }

      // 2. Créer le profil utilisateur
      await supabase.from('profiles').insert({
        id: authData.user.id,
        email: client.email,
        full_name: `${client.first_name} ${client.last_name}`,
        role: 'client',
        phone: client.phone,
        address: client.address,
        city: client.city,
        postal_code: client.postal_code,
        created_at: new Date().toISOString(),
      });

      console.log(
        `✅ Compte client créé: ${client.first_name} ${client.last_name} (${client.email})`
      );
      results.push({
        email: client.email,
        success: true,
        userId: authData.user.id,
      });
    } catch (error: any) {
      console.error(`❌ Erreur création compte client ${client.email}:`, error);
      results.push({
        email: client.email,
        success: false,
        error: error.message,
      });
    }
  }

  return res.status(200).json({
    message: 'Création comptes clients terminée',
    results,
  });
}

async function createProjects(supabase: any, res: NextApiResponse) {
  console.log('📋 Création des projets de test...');

  // Récupérer les clients créés
  const { data: clients } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('role', 'client')
    .limit(3);

  if (!clients || clients.length === 0) {
    return res
      .status(400)
      .json({ error: 'Aucun client trouvé pour créer des projets' });
  }

  const results = [];

  for (let i = 0; i < TEST_DATA.projects.length && i < clients.length; i++) {
    const project = TEST_DATA.projects[i];
    const client = clients[i];

    try {
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .insert({
          client_id: client.id,
          title: project.title,
          description: project.description,
          category: project.category,
          work_types: project.work_types,
          location: project.location,
          city: project.city,
          postal_code: project.postal_code,
          property_type: project.property_type,
          property_surface: project.property_surface,
          budget_min: project.budget_min,
          budget_max: project.budget_max,
          urgency: project.urgency,
          desired_deadline: project.desired_deadline,
          status: 'published',
          validation_status: 'validated',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (projectError) {
        console.error(
          `❌ Erreur création projet ${project.title}:`,
          projectError
        );
        results.push({
          title: project.title,
          success: false,
          error: projectError.message,
        });
        continue;
      }

      console.log(`✅ Projet créé: ${project.title} (client: ${client.email})`);
      results.push({ title: project.title, success: true, data: projectData });
    } catch (error: any) {
      console.error(`❌ Erreur création projet ${project.title}:`, error);
      results.push({
        title: project.title,
        success: false,
        error: error.message,
      });
    }
  }

  return res.status(200).json({
    message: 'Création projets terminée',
    results,
  });
}

async function simulateMatching(supabase: any, res: NextApiResponse) {
  console.log('🤝 Simulation du processus de matching...');

  // Récupérer les projets et professionnels
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title, work_types, city, postal_code')
    .eq('status', 'published');

  const { data: professionals } = await supabase
    .from('professionals')
    .select('id, company_name, work_types, city, postal_code, user_id')
    .eq('is_active', true);

  if (!projects || !professionals) {
    return res
      .status(400)
      .json({ error: 'Aucun projet ou professionnel trouvé' });
  }

  const results = [];

  for (const project of projects) {
    // Trouver les professionnels compatibles
    const compatiblePros = professionals.filter(
      (pro) =>
        pro.work_types.some((wt) => project.work_types.includes(wt)) &&
        (pro.city === project.city || pro.postal_code === project.postal_code)
    );

    for (const pro of compatiblePros.slice(0, 2)) {
      // Max 2 pros par projet
      try {
        const { data: interestData, error: interestError } = await supabase
          .from('project_interests')
          .insert({
            project_id: project.id,
            professional_id: pro.id,
            message:
              'Bonjour, je suis intéressé par votre projet et disponible pour le réaliser.',
            status: 'pending',
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (interestError) {
          console.error(
            `❌ Erreur création intérêt: ${pro.company_name} -> ${project.title}`
          );
          continue;
        }

        console.log(`💼 ${pro.company_name} postulé à ${project.title}`);
        results.push({
          project: project.title,
          professional: pro.company_name,
          success: true,
          interestId: interestData.id,
        });
      } catch (error: any) {
        console.error(
          `❌ Erreur postulation: ${pro.company_name} -> ${project.title}`,
          error
        );
      }
    }
  }

  return res.status(200).json({
    message: 'Simulation matching terminée',
    results,
  });
}

async function simulateDialogue(supabase: any, res: NextApiResponse) {
  console.log('💬 Simulation des dialogues pré-match...');

  // Récupérer les intérêts en attente
  const { data: interests } = await supabase
    .from('project_interests')
    .select('id, project_id, professional_id')
    .eq('status', 'pending')
    .limit(5);

  if (!interests || interests.length === 0) {
    return res.status(400).json({ error: 'Aucun intérêt en attente trouvé' });
  }

  const results = [];

  for (const interest of interests) {
    try {
      // Simuler dialogue entre client et pro
      const messages = [
        {
          project_id: interest.project_id,
          professional_id: interest.professional_id,
          sender: 'client',
          content:
            'Bonjour, je suis intéressé par votre profil. Quand pouvez-vous commencer ?',
          created_at: new Date().toISOString(),
        },
        {
          project_id: interest.project_id,
          professional_id: interest.professional_id,
          sender: 'professional',
          content:
            'Bonjour ! Je suis disponible dès la semaine prochaine. Je peux vous faire un devis.',
          created_at: new Date(Date.now() + 3600000).toISOString(), // +1h
        },
      ];

      for (const message of messages) {
        const { data: messageData, error: messageError } = await supabase
          .from('project_messages')
          .insert(message)
          .select()
          .single();

        if (messageError) {
          console.error(`❌ Erreur création message: ${message.sender}`);
          continue;
        }

        results.push({
          interestId: interest.id,
          sender: message.sender,
          success: true,
          messageId: messageData.id,
        });
      }

      // Mettre à jour le statut de l'intérêt
      await supabase
        .from('project_interests')
        .update({ status: 'in_discussion' })
        .eq('id', interest.id);

      console.log(`💬 Dialogue initié pour intérêt ${interest.id}`);
    } catch (error: any) {
      console.error(`❌ Erreur dialogue pour intérêt ${interest.id}:`, error);
      results.push({
        interestId: interest.id,
        success: false,
        error: error.message,
      });
    }
  }

  return res.status(200).json({
    message: 'Simulation dialogue terminée',
    results,
  });
}

async function simulatePayment(supabase: any, res: NextApiResponse) {
  console.log('💳 Simulation des paiements de matching...');

  // Récupérer les intérêts en discussion
  const { data: interests } = await supabase
    .from('project_interests')
    .select('id, project_id, professional_id')
    .eq('status', 'in_discussion')
    .limit(3);

  if (!interests || interests.length === 0) {
    return res
      .status(400)
      .json({ error: 'Aucun intérêt en discussion trouvé' });
  }

  const results = [];

  for (const interest of interests) {
    try {
      // Simuler acceptation par le client
      const { data: updatedInterest, error: updateError } = await supabase
        .from('project_interests')
        .update({
          status: 'accepted',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', interest.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          `❌ Erreur acceptation intérêt ${interest.id}:`,
          updateError
        );
        continue;
      }

      // Simuler paiement (en réalité, ce serait via Stripe)
      const paymentAmount = 3900; // Simulation

      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .insert({
          project_id: interest.project_id,
          professional_id: interest.professional_id,
          amount: paymentAmount,
          status: 'completed',
          payment_method: 'card',
          stripe_payment_intent_id: `pi_test_${Date.now()}`,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (paymentError) {
        console.error(
          `❌ Erreur paiement intérêt ${interest.id}:`,
          paymentError
        );
        continue;
      }

      // Mettre à jour le statut du projet
      await supabase
        .from('projects')
        .update({ status: 'in_progress' })
        .eq('id', interest.project_id);

      console.log(
        `💳 Paiement simulé pour intérêt ${interest.id} (${paymentAmount}€)`
      );
      results.push({
        interestId: interest.id,
        success: true,
        amount: paymentAmount,
        paymentId: paymentData.id,
      });
    } catch (error: any) {
      console.error(`❌ Erreur paiement pour intérêt ${interest.id}:`, error);
      results.push({
        interestId: interest.id,
        success: false,
        error: error.message,
      });
    }
  }

  return res.status(200).json({
    message: 'Simulation paiement terminée',
    results,
  });
}

async function simulatePlanning(supabase: any, res: NextApiResponse) {
  console.log('📅 Simulation du planning...');

  // Récupérer les projets en cours
  const { data: projects } = await supabase
    .from('projects')
    .select('id, title')
    .eq('status', 'in_progress')
    .limit(3);

  if (!projects || projects.length === 0) {
    return res.status(400).json({ error: 'Aucun projet en cours trouvé' });
  }

  const results = [];

  for (const project of projects) {
    try {
      // Créer événements de planning
      const planningEvents = [
        {
          project_id: project.id,
          date: '2024-03-15',
          time: '09:00',
          type: 'devis',
          description: 'Visite technique pour devis',
          status: 'scheduled',
        },
        {
          project_id: project.id,
          date: '2024-03-20',
          time: '14:00',
          type: 'travaux',
          description: 'Début des travaux',
          status: 'scheduled',
        },
        {
          project_id: project.id,
          date: '2024-03-25',
          time: '17:00',
          type: 'fin_travaux',
          description: 'Fin des travaux et réception',
          status: 'scheduled',
        },
      ];

      for (const event of planningEvents) {
        const { data: eventData, error: eventError } = await supabase
          .from('project_planning')
          .insert({
            ...event,
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (eventError) {
          console.error(`❌ Erreur création planning: ${event.type}`);
          continue;
        }

        results.push({
          projectId: project.id,
          eventType: event.type,
          success: true,
          eventId: eventData.id,
        });
      }

      console.log(`📅 Planning créé pour projet ${project.title}`);
    } catch (error: any) {
      console.error(`❌ Erreur planning pour projet ${project.id}:`, error);
      results.push({
        projectId: project.id,
        success: false,
        error: error.message,
      });
    }
  }

  return res.status(200).json({
    message: 'Simulation planning terminée',
    results,
  });
}

async function validateAdmin(supabase: any, res: NextApiResponse) {
  console.log('👮 Simulation validation admin...');

  // Créer un compte admin si nécessaire
  const adminEmail = 'admin.test@swipetonpro.com';

  try {
    // Vérifier si l'admin existe
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (!existingAdmin) {
      // Créer le compte admin
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: adminEmail,
          password: 'AdminTest123456!',
          email_confirm: true,
          user_metadata: {
            role: 'admin',
          },
        });

      if (authError) {
        return res.status(500).json({ error: 'Erreur création compte admin' });
      }

      // Créer le profil admin
      await supabase.from('profiles').insert({
        id: authData.user.id,
        email: adminEmail,
        full_name: 'Admin Test',
        role: 'admin',
        created_at: new Date().toISOString(),
      });
    }

    // Valider tous les projets en attente
    const { data: pendingProjects } = await supabase
      .from('projects')
      .select('id, title')
      .eq('validation_status', 'pending');

    if (!pendingProjects || pendingProjects.length === 0) {
      return res
        .status(200)
        .json({ message: 'Aucun projet en attente de validation' });
    }

    const results = [];

    for (const project of pendingProjects) {
      const { data: updatedProject, error: updateError } = await supabase
        .from('projects')
        .update({
          validation_status: 'validated',
          validated_at: new Date().toISOString(),
          validation_notes: 'Validé automatiquement pour test',
        })
        .eq('id', project.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          `❌ Erreur validation projet ${project.id}:`,
          updateError
        );
        continue;
      }

      console.log(`✅ Projet validé par admin: ${project.title}`);
      results.push({ projectId: project.id, success: true });
    }

    return res.status(200).json({
      message: 'Validation admin terminée',
      results,
    });
  } catch (error: any) {
    console.error('❌ Erreur validation admin:', error);
    return res.status(500).json({ error: error.message });
  }
}

async function runCompleteTest(supabase: any, res: NextApiResponse) {
  console.log('🚀 DÉMARRAGE DU TEST COMPLET A-Z');
  console.log('================================');

  const results = {
    professionals: null,
    clients: null,
    projects: null,
    matching: null,
    dialogue: null,
    payment: null,
    planning: null,
    validation: null,
  };

  try {
    // 1. Création comptes professionnels
    const proResponse = await createProfessionals(supabase, res);
    results.professionals = proResponse;

    // 2. Création comptes clients
    const clientResponse = await createClients(supabase, res);
    results.clients = clientResponse;

    // 3. Création projets
    const projectResponse = await createProjects(supabase, res);
    results.projects = projectResponse;

    // 4. Simulation matching
    const matchingResponse = await simulateMatching(supabase, res);
    results.matching = matchingResponse;

    // 5. Simulation dialogue
    const dialogueResponse = await simulateDialogue(supabase, res);
    results.dialogue = dialogueResponse;

    // 6. Simulation paiement
    const paymentResponse = await simulatePayment(supabase, res);
    results.payment = paymentResponse;

    // 7. Simulation planning
    const planningResponse = await simulatePlanning(supabase, res);
    results.planning = planningResponse;

    // 8. Validation admin
    const validationResponse = await validateAdmin(supabase, res);
    results.validation = validationResponse;

    console.log('✅ TEST COMPLET TERMINÉ AVEC SUCCÈS !');
    console.log('================================');

    return res.status(200).json({
      message: 'Test complet A-Z terminé avec succès',
      results,
    });
  } catch (error: any) {
    console.error('❌ ERREUR LORS DU TEST COMPLET:', error);
    return res.status(500).json({
      error: 'Erreur lors du test complet',
      details: error.message,
      results,
    });
  }
}
