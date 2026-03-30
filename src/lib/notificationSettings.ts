// Paramètres de notifications administrables
export type NotificationType = 'welcome' | 'matching';

export interface NotificationSettings {
  welcome: boolean;
  matching: boolean;
}

// Valeurs par défaut (toutes activées)
export const defaultNotificationSettings: NotificationSettings = {
  welcome: true,
  matching: true,
};
