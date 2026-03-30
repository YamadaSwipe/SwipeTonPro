export function getWelcomeEmailHtml(userEmail: string) {
  return `
    <h1>Bienvenue sur SwipeTonPro !</h1>
    <p>Bonjour et bienvenue sur la plateforme SwipeTonPro.</p>
    <p>Votre compte a bien été créé (${userEmail}).</p>
    <ul>
      <li>Créez votre premier projet en quelques clics</li>
      <li>Recevez des estimations IA et des propositions de professionnels certifiés</li>
      <li>Accédez à votre espace personnel pour suivre vos projets</li>
    </ul>
    <p>
      <strong>Comment ça marche ?</strong><br/>
      1. Décrivez votre besoin<br/>
      2. Ajoutez des photos<br/>
      3. Recevez une estimation IA<br/>
      4. Recevez des offres de pros<br/>
      5. Échangez et validez en toute sécurité
    </p>
    <p>
      Pour toute question, notre équipe support est à votre écoute.<br/>
      Bonne expérience sur SwipeTonPro !
    </p>
    <p>L'équipe SwipeTonPro</p>
  `;
}
