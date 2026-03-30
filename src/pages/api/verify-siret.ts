import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const { siret } = req.query;

  if (!siret || typeof siret !== 'string' || !/^\d{14}$/.test(siret)) {
    return res.status(400).json({ valid: false, message: 'SIRET invalide (14 chiffres requis)' });
  }

  try {
    // Obtenir un token INSEE (OAuth2 client_credentials)
    const tokenRes = await fetch('https://api.insee.fr/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.INSEE_CONSUMER_KEY}:${process.env.INSEE_CONSUMER_SECRET}`
        ).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    });

    if (!tokenRes.ok) {
      // Si pas de clé INSEE configurée → vérification format uniquement
      return res.status(200).json({
        valid: true,
        company_name: null,
        source: 'format_only',
        message: 'Vérification format OK — validation complète à la soumission',
      });
    }

    const { access_token } = await tokenRes.json();

    // Appel API Sirene v3
    const sireneRes = await fetch(
      `https://api.insee.fr/entreprises/sirene/V3.11/siret/${siret}`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
          Accept: 'application/json',
        },
      }
    );

    if (sireneRes.status === 404) {
      return res.status(200).json({ valid: false, message: 'SIRET introuvable dans le registre INSEE' });
    }

    if (sireneRes.status === 403) {
      // Établissement non diffusible (protégé)
      return res.status(200).json({
        valid: true,
        company_name: null,
        message: 'Établissement non diffusible — sera vérifié manuellement',
      });
    }

    if (!sireneRes.ok) {
      return res.status(200).json({ valid: true, source: 'fallback', message: 'Service INSEE indisponible' });
    }

    const data = await sireneRes.json();
    const etablissement = data?.etablissement;

    if (!etablissement) {
      return res.status(200).json({ valid: false, message: 'Établissement introuvable' });
    }

    // Vérifier si l'établissement est actif
    const etatAdmin = etablissement?.periodeEtablissement?.[0]?.etatAdministratifEtablissement;
    if (etatAdmin === 'F') {
      return res.status(200).json({ valid: false, message: 'Cet établissement est fermé' });
    }

    // Récupérer le nom de l'entreprise
    const uniteLegale = etablissement?.uniteLegale;
    const denomination = uniteLegale?.denominationUniteLegale;
    const prenom = uniteLegale?.prénomUsuelUniteLegale || uniteLegale?.prenomUsuelUniteLegale || '';
    const nom = uniteLegale?.nomUniteLegale || '';
    const company_name = denomination || `${prenom} ${nom}`.trim() || null;

    // Récupérer l'adresse
    const adresse = etablissement?.adresseEtablissement;
    const city = adresse?.libelleCommuneEtablissement || null;
    const postal_code = adresse?.codePostalEtablissement || null;

    return res.status(200).json({
      valid: true,
      company_name,
      city,
      postal_code,
      siret,
      message: 'SIRET valide',
    });

  } catch (error) {
    console.error('Erreur vérification SIRET:', error);
    // En cas d'erreur réseau → on accepte avec avertissement
    return res.status(200).json({
      valid: true,
      company_name: null,
      source: 'error_fallback',
      message: 'Vérification impossible — sera contrôlé manuellement',
    });
  }
}
