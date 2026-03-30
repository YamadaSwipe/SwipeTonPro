export interface HomepageStatsConfig {
  projects: string;
  professionals: string;
  satisfaction: string;
  responseTime: string;
  steps: { title: string; description: string }[];
}

export const defaultHomepageStatsConfig: HomepageStatsConfig = {
  projects: "500+",
  professionals: "1200+",
  satisfaction: "98%",
  responseTime: "24h",
  steps: [
    { title: "1. Description", description: "Diagnostic conversationnel IA" },
    { title: "2. Photos", description: "Upload de la zone des travaux" },
    { title: "3. Estimation", description: "Budget IA haute sécurité" },
    { title: "4. Validation", description: "Confirmez votre budget" }
  ]
};
