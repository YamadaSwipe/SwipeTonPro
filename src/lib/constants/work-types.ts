// Liste complète des types de travaux BTP
export const WORK_TYPES = [
  // Gros œuvre
  "Terrassement",
  "Fondations",
  "Maçonnerie",
  "Béton armé",
  "Charpente",
  "Couverture",
  "Zinguerie",
  
  // Second œuvre
  "Plomberie",
  "Électricité",
  "Chauffage",
  "Climatisation",
  "Ventilation",
  "Isolation",
  "Plâtrerie",
  "Peinture",
  "Carrelage",
  "Parquet",
  "Revêtements sols",
  "Cloisons",
  "Faux plafonds",
  
  // Aménagements extérieurs
  "Terrasse",
  "Balcon",
  "Véranda",
  "Piscine",
  "Clôture",
  "Portail",
  "Allée jardin",
  "Aménagement paysager",
  "Mur de soutènement",
  
  // Menuiseries
  "Fenêtres",
  "Portes",
  "Volets",
  "Portes de garage",
  "Velux",
  "Vitrines",
  
  // Salle de bain
  "Salle de bain complète",
  "Douche",
  "Baignoire",
  "Meuble salle de bain",
  "Carrelage salle de bain",
  "Plomberie salle de bain",
  
  // Cuisine
  "Cuisine complète",
  "Meuble cuisine",
  "Électroménager",
  "Plans de travail",
  " crédence",
  "Siphon cuisine",
  
  // Rénovation énergétique
  "Isolation murs",
  "Isolation combles",
  "Isolation toiture",
  "Fenêtres double vitrage",
  "Chauffage basse température",
  "Pompe à chaleur",
  "Panneaux solaires",
  "VMC",
  
  // Déconstruction
  "Démolition",
  "Désamiantage",
  "Débarras",
  "Nettoyage chantier",
  
  // Finitions
  "Peinture intérieure",
  "Peinture extérieure",
  "Papier peint",
  "Enduit décoratif",
  "Faux marbre",
  "Staff",
  
  // Équipements techniques
  "Chauffe-eau",
  "Radiateurs",
  "Thermostat",
  "Tableau électrique",
  "Compteur",
  "Vidéophone",
  "Alarme",
  "Interphone",
  
  // Réseaux
  "Assainissement",
  "Adduction d'eau",
  "Électricité générale",
  "Téléphonie",
  "Internet",
  "Télévision",
  
  // Divers
  "Ascenseur",
  "Monte-charge",
  "Escalier",
  "Rampes",
  "Garage",
  "Cave",
  "Grenier",
  "Toiture végétale",
  "Ouvrages métalliques",
  "Bois",
  "Menuiserie extérieure",
  "Agencement intérieur",
  "Rangement",
  "Dressing",
  "Placard"
];

// Liste des métiers du BTP
export const PROFESSIONS = [
  // Gros œuvre
  "Maçon",
  "Tailleur de pierre",
  "Charpentier",
  "Couvreur",
  "Zingueur",
  "Bétonnier",
  "Terrassier",
  "Ferronnier",
  
  // Second œuvre
  "Plombier",
  "Électricien",
  "Chauffagiste",
  "Climaticien",
  "Ventiliste",
  "Isolateur",
  "Plâtrier",
  "Peintre",
  "Carreleur",
  "Parqueteur",
  "Poseur de revêtements",
  "Plaquiste",
  "Staffeur",
  
  // Menuiseries
  "Menuisier",
  "Carpentier",
  "Poseur de fenêtres",
  "Poseur de portes",
  "Poseur de volets",
  "Poseur de portes de garage",
  
  // Salle de bain
  "Installateur salle de bain",
  "Carreleur salle de bain",
  "Plombier salle de bain",
  
  // Cuisine
  "Installateur cuisine",
  "Ébéniste",
  "Poseur de cuisine",
  
  // Rénovation énergétique
  "Technicien isolation",
  "Installateur pompe à chaleur",
  "Installateur solaire",
  "Ventiliste VMC",
  
  // Déconstruction
  "Démolisseur",
  "Désamianteur",
  "Débarrasseur",
  "Nettoyeur de chantier",
  
  // Finitions
  "Peintre en bâtiment",
  "Décorateur",
  "Staffeur orneman",
  "Enduiseur",
  
  // Équipements techniques
  "Installateur chauffage",
  "Frigoriste",
  "Électricien du bâtiment",
  "Installateur alarme",
  "Installateur vidéophone",
  
  // Réseaux
  "Assainisseur",
  "Couvreur de réseaux",
  "Électricien réseaux",
  
  // Divers
  "Ascensoriste",
  "Monteur d'escalier",
  "Menuisier métal",
  "Serrurier",
  "Métallier",
  "Agenceur",
  "Architecte",
  "Maître d'œuvre",
  "Géomètre",
  "Ingénieur",
  "Technicien BTP",
  "Chef de chantier",
  "Conducteur de travaux",
  "Économiste de la construction",
  "Contrôleur technique",
  "Expert BTP",
  "Diagnostiqueur immobilier",
  "Thermicien",
  "Acousticien",
  "Photographe immobilier",
  "Agent immobilier",
  "Promoteur immobilier",
  "Constructeur de maisons",
  "Constructeur de piscines",
  "Paysagiste",
  "Jardinier",
  "Arboriste",
  "Elagueur",
  "Nettoyeur haute pression",
  "Artisan",
  "Entrepreneur",
  "Sous-traitant",
  "Fournisseur",
  "Conseiller BTP",
  "Formateur BTP"
];

// Liste des villes françaises principales
export const FRENCH_CITIES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", 
  "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne",
  "Toulon", "Grenoble", "Dijon", "Angers", "Villeurbanne", "Saint-Denis", "Le Mans",
  "Aix-en-Provence", "Clermont-Ferrand", "Brest", "Limoges", "Tours", "Amiens",
  "Nîmes", "Metz", "Besançon", "Orléans", "Mulhouse", "Rouen", "Boulogne-Billancourt",
  "Perpignan", "Nancy", "Argenteuil", "Saint-Paul", "Montreuil", "Roubaix",
  "Tourcoing", "Nanterre", "Avignon", "Créteil", "Dunkerque", "Versailles", "Courbevoie",
  "Asnières-sur-Seine", "Colombes", "Aulnay-sous-Bois", "Rueil-Malmaison", "Champigny-sur-Marne",
  "Antony", "Vitry-sur-Seine", "Levallois-Perret", "Issy-les-Moulineaux",
  "Saint-Quentin", "Cannes", "Calais", "Cergy", "Mantes-la-Jolie", "Aubervilliers",
  "Saint-Maur-des-Fossés", "Dreux", "Pau", "Coulommiers", "La Roche-sur-Yon",
  "Cherbourg-en-Cotentin", "Annecy", "Hyères", "Thonon-les-Bains", "Béziers", "Cahors",
  "Moulins", "Albi", "Bourges", "Arras", "Saint-Brieuc", "Sète", "Bar-le-Duc",
  "Laval", "Épinal", "Narbonne", "Mâcon", "Laon", "Lons-le-Saunier", "Saint-Jean-de-Maurienne",
  "Menton", "Bagnères-de-Bigorre", "Digne-les-Bains", "L'Isle-sur-la-Sorgue", "Brive-la-Gaillarde",
  "Bergerac", "Millau", "Montauban", "Alès", "Bagnols-sur-Cèze", "Vienne", "Aurillac", "Foix", "Tarbes", "Mont-de-Marsan",
  "Périgueux", "Angoulême", "Niort", "La Rochelle", "Saintes", "Royan",
  "Mérignac", "Pessac", "Talence", "Bègles", "Gradignan", "Villenave-d'Ornon",
  "Saint-Médard-en-Jalles", "Pauillac", "Libourne", "Arcachon", "Biscarosse", "Hossegor",
  "Biarritz", "Saint-Jean-de-Luz", "Bayonne", "Anglet", "Dax", "Lourdes",
  "Oloron-Sainte-Marie", "Saint-Jean-Pied-de-Port"
];
