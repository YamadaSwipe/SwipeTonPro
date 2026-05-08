// Données de test pour simulation complète SwipeTonPro
export const TEST_DATA = {
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

  // Messages pré-match pour simulation
  preMatchMessages: [
    {
      sender: 'client',
      content:
        'Bonjour, je suis intéressé par votre profil pour mon projet. Avez-vous disponible ?',
    },
    {
      sender: 'pro',
      content:
        'Bonjour ! Oui je suis disponible. Pourriez-vous me donner plus de détails sur le projet ?',
    },
    {
      sender: 'client',
      content: "C'est une rénovation complète. Le budget est de 4000€ environ.",
    },
    {
      sender: 'pro',
      content:
        'Parfait. Je peux commencer dans 2 semaines. Je vous envoie un devis détaillé.',
    },
  ],

  // Planning pour simulation
  planningEvents: [
    {
      date: '2024-03-15',
      time: '09:00',
      type: 'devis',
      description: 'Visite technique pour devis',
    },
    {
      date: '2024-03-20',
      time: '14:00',
      type: 'travaux',
      description: 'Début des travaux',
    },
    {
      date: '2024-03-25',
      time: '17:00',
      type: 'fin_travaux',
      description: 'Fin des travaux et réception',
    },
  ],
};

// Scripts de test automatisés
export const TEST_SCRIPTS = {
  // Création comptes professionnels
  createProfessionals: async () => {
    console.log('🔧 Création des comptes professionnels...');
    for (const pro of TEST_DATA.professionals) {
      try {
        // Appel API création compte pro
        const response = await fetch('/api/auth/professional-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(pro),
        });

        if (response.ok) {
          console.log(`✅ Compte pro créé: ${pro.company_name}`);
        } else {
          console.error(`❌ Erreur création compte pro: ${pro.company_name}`);
        }
      } catch (error) {
        console.error(
          `❌ Erreur création compte pro: ${pro.company_name}`,
          error
        );
      }
    }
  },

  // Création comptes clients
  createClients: async () => {
    console.log('👤 Création des comptes clients...');
    for (const client of TEST_DATA.clients) {
      try {
        const response = await fetch('/api/auth/client-signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(client),
        });

        if (response.ok) {
          console.log(
            `✅ Compte client créé: ${client.first_name} ${client.last_name}`
          );
        } else {
          console.error(
            `❌ Erreur création compte client: ${client.first_name} ${client.last_name}`
          );
        }
      } catch (error) {
        console.error(
          `❌ Erreur création compte client: ${client.first_name} ${client.last_name}`,
          error
        );
      }
    }
  },

  // Création projets
  createProjects: async () => {
    console.log('📋 Création des projets...');
    for (const project of TEST_DATA.projects) {
      try {
        const response = await fetch('/api/projects/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(project),
        });

        if (response.ok) {
          console.log(`✅ Projet créé: ${project.title}`);
        } else {
          console.error(`❌ Erreur création projet: ${project.title}`);
        }
      } catch (error) {
        console.error(`❌ Erreur création projet: ${project.title}`, error);
      }
    }
  },

  // Simulation matching
  simulateMatching: async () => {
    console.log('🤝 Simulation du processus de matching...');

    // 1. Pros postulent aux projets
    const projects = await fetch('/api/projects/available').then((r) =>
      r.json()
    );
    const professionals = await fetch('/api/professionals/list').then((r) =>
      r.json()
    );

    for (const project of projects.data) {
      for (const pro of professionals.data) {
        if (pro.work_types.some((wt) => project.work_types.includes(wt))) {
          try {
            await fetch('/api/projects/interest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: project.id,
                professional_id: pro.id,
                message: 'Bonjour, je suis intéressé par votre projet.',
              }),
            });
            console.log(`💼 ${pro.company_name} postulé à ${project.title}`);
          } catch (error) {
            console.error(
              `❌ Erreur postulation: ${pro.company_name} -> ${project.title}`
            );
          }
        }
      }
    }
  },

  // Simulation dialogue pré-match
  simulatePreMatchDialogue: async () => {
    console.log('💬 Simulation des dialogues pré-match...');

    const interests = await fetch('/api/projects/interests').then((r) =>
      r.json()
    );

    for (const interest of interests.data) {
      for (const message of TEST_DATA.preMatchMessages) {
        try {
          await fetch('/api/projects/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: interest.project_id,
              professional_id: interest.professional_id,
              sender: message.sender,
              content: message.content,
            }),
          });
          console.log(`💬 Message ${message.sender} envoyé`);
        } catch (error) {
          console.error(`❌ Erreur envoi message: ${message.sender}`);
        }
      }
    }
  },

  // Simulation paiement matching
  simulatePayment: async () => {
    console.log('💳 Simulation des paiements de matching...');

    const acceptedInterests = await fetch(
      '/api/projects/interests?status=accepted'
    ).then((r) => r.json());

    for (const interest of acceptedInterests.data) {
      try {
        // Simulation paiement Stripe
        const paymentResponse = await fetch(
          '/api/stripe/create-payment-intent',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: interest.project_id,
              professional_id: interest.professional_id,
              amount: 3900, // Simulation prix
            }),
          }
        );

        if (paymentResponse.ok) {
          console.log(`💳 Paiement simulé pour projet ${interest.project_id}`);
        }
      } catch (error) {
        console.error(`❌ Erreur paiement projet ${interest.project_id}`);
      }
    }
  },

  // Simulation planning
  simulatePlanning: async () => {
    console.log('📅 Simulation du planning...');

    const matchedProjects = await fetch('/api/projects/matched').then((r) =>
      r.json()
    );

    for (const project of matchedProjects.data) {
      for (const event of TEST_DATA.planningEvents) {
        try {
          await fetch('/api/projects/planning', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              project_id: project.id,
              date: event.date,
              time: event.time,
              type: event.type,
              description: event.description,
            }),
          });
          console.log(
            `📅 Événement planning créé: ${event.type} le ${event.date}`
          );
        } catch (error) {
          console.error(`❌ Erreur création planning: ${event.type}`);
        }
      }
    }
  },

  // Simulation validation admin
  simulateAdminValidation: async () => {
    console.log('👮 Simulation validation admin...');

    // Connexion admin
    const adminLogin = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@swipetonpro.com',
        password: 'Admin123456!',
      }),
    });

    if (adminLogin.ok) {
      const { token } = await adminLogin.json();

      // Validation projets en attente
      const pendingProjects = await fetch('/api/projects/pending', {
        headers: { Authorization: `Bearer ${token}` },
      }).then((r) => r.json());

      for (const project of pendingProjects.data) {
        try {
          await fetch('/api/admin/validate-project', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              project_id: project.id,
              action: 'validate',
              validation_notes: 'Projet validé automatiquement pour test',
            }),
          });
          console.log(`✅ Projet validé par admin: ${project.title}`);
        } catch (error) {
          console.error(`❌ Erreur validation projet: ${project.title}`);
        }
      }
    }
  },

  // Simulation notifications
  simulateNotifications: async () => {
    console.log('🔔 Simulation des notifications...');

    const notifications = [
      {
        type: 'new_project',
        title: 'Nouveau projet disponible',
        message:
          'Un nouveau projet correspondant à votre profil est disponible',
      },
      {
        type: 'matching_completed',
        title: 'Matching réussi',
        message: 'Félicitations ! Un client vous a choisi pour son projet',
      },
      {
        type: 'payment_required',
        title: 'Paiement requis',
        message: 'Veuillez procéder au paiement pour débloquer les coordonnées',
      },
    ];

    for (const notification of notifications) {
      try {
        await fetch('/api/notifications/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(notification),
        });
        console.log(`🔔 Notification envoyée: ${notification.title}`);
      } catch (error) {
        console.error(`❌ Erreur notification: ${notification.title}`);
      }
    }
  },

  // Test complet A-Z
  runCompleteTest: async () => {
    console.log('🚀 DÉMARRAGE DU TEST COMPLET A-Z');
    console.log('================================');

    try {
      await TEST_SCRIPTS.createProfessionals();
      await TEST_SCRIPTS.createClients();
      await TEST_SCRIPTS.createProjects();
      await TEST_SCRIPTS.simulateMatching();
      await TEST_SCRIPTS.simulatePreMatchDialogue();
      await TEST_SCRIPTS.simulatePayment();
      await TEST_SCRIPTS.simulatePlanning();
      await TEST_SCRIPTS.simulateAdminValidation();
      await TEST_SCRIPTS.simulateNotifications();

      console.log('✅ TEST COMPLET TERMINÉ AVEC SUCCÈS !');
      console.log('================================');
    } catch (error) {
      console.error('❌ ERREUR LORS DU TEST COMPLET:', error);
    }
  },
};

export default TEST_SCRIPTS;
