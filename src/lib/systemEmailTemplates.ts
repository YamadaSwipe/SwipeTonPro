// Templates d'emails système éditables
export interface SystemEmailTemplates {
  welcome: { subject: string; body: string };
  matching: { subject: string; body: string };
}

export const defaultSystemEmailTemplates: SystemEmailTemplates = {
  welcome: {
    subject: "Bienvenue sur SwipeTonPro !",
    body: `<h1>Bienvenue sur SwipeTonPro !</h1>
<p>Nous sommes ravis de vous accueillir sur notre plateforme.</p>
<p>Commencez dès maintenant à explorer les opportunités qui s'offrent à vous.</p>
<p>Cordialement,<br>L'équipe SwipeTonPro</p>`
  },
  matching: {
    subject: "Un professionnel est intéressé par votre projet !",
    body: `<h1>Bonne nouvelle !</h1>
<p>Un professionnel a manifesté son intérêt pour votre projet.</p>
<p>Connectez-vous à votre espace pour découvrir son offre et échanger en toute sécurité.</p>
<p>Cordialement,<br>L'équipe SwipeTonPro</p>`
  }
};
