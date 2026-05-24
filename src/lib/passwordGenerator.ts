/**
 * @fileoverview Génération sécurisée de mots de passe
 * @author Security Team
 * @version 1.0.0
 */

import crypto from 'crypto';

/**
 * Génère un mot de passe sécurisé avec crypto
 * @param length - Longueur du mot de passe (défaut: 16)
 * @returns Mot de passe sécurisé
 */
export function generateSecurePassword(length: number = 16): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const randomBytes = crypto.randomBytes(length);
  let password = '';
  
  for (let i = 0; i < length; i++) {
    // Utiliser les bytes aléatoires pour sélectionner un caractère
    const randomIndex = randomBytes[i] % chars.length;
    password += chars.charAt(randomIndex);
  }
  
  return password;
}

/**
 * Génère un mot de passe temporaire pour reset
 * @returns Mot de passe temporaire sécurisé
 */
export function generateTemporaryPassword(): string {
  return generateSecurePassword(12);
}
