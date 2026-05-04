/**
 * Utilitaires de validation pour le BTP
 */

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Validation des montants de projet
export function validateProjectAmount(amount: number): ValidationResult {
  if (amount === undefined || amount === null) {
    return { isValid: false, error: 'Le montant est requis' };
  }

  if (amount <= 0) {
    return { isValid: false, error: 'Le montant doit être positif' };
  }

  if (amount < 1000) {
    return { isValid: false, error: 'Le montant minimum est de 10€ (1000 centimes)' };
  }

  if (amount > 100000000) {
    return { isValid: false, error: 'Le montant maximum est de 1 000 000€' };
  }

  return { isValid: true };
}

// Validation des messages
export function validateMessage(content: string): ValidationResult {
  if (!content || content.trim().length === 0) {
    return { isValid: false, error: 'Le message ne peut pas être vide' };
  }

  if (content.trim().length < 3) {
    return { isValid: false, error: 'Le message doit contenir au moins 3 caractères' };
  }

  if (content.length > 2000) {
    return { isValid: false, error: 'Le message ne peut pas dépasser 2000 caractères' };
  }

  return { isValid: true };
}

// Validation des IDs
export function validateId(id: string, fieldName: string = 'ID'): ValidationResult {
  if (!id || id.trim().length === 0) {
    return { isValid: false, error: `${fieldName} est requis` };
  }

  // UUID v4 regex
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return { isValid: false, error: `${fieldName} doit être un UUID valide` };
  }

  return { isValid: true };
}

// Validation des emails
export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'L\'email est requis' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Format d\'email invalide' };
  }

  return { isValid: true };
}

// Validation des téléphones (France)
export function validatePhone(phone: string): ValidationResult {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: 'Le numéro de téléphone est requis' };
  }

  // Format français: 0X XX XX XX XX ou +33 X XX XX XX XX
  const phoneRegex = /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/;
  if (!phoneRegex.test(phone)) {
    return { isValid: false, error: 'Format de téléphone invalide (ex: 06 12 34 56 78)' };
  }

  return { isValid: true };
}

// Validation des codes postaux (France)
export function validatePostalCode(code: string): ValidationResult {
  if (!code || code.trim().length === 0) {
    return { isValid: false, error: 'Le code postal est requis' };
  }

  const codeRegex = /^\d{5}$/;
  if (!codeRegex.test(code)) {
    return { isValid: false, error: 'Le code postal doit contenir 5 chiffres' };
  }

  return { isValid: true };
}

// Validation des noms de projets
export function validateProjectTitle(title: string): ValidationResult {
  if (!title || title.trim().length === 0) {
    return { isValid: false, error: 'Le titre du projet est requis' };
  }

  if (title.trim().length < 5) {
    return { isValid: false, error: 'Le titre doit contenir au moins 5 caractères' };
  }

  if (title.length > 100) {
    return { isValid: false, error: 'Le titre ne peut pas dépasser 100 caractères' };
  }

  return { isValid: true };
}

// Validation des descriptions
export function validateDescription(description: string, minLength: number = 20): ValidationResult {
  if (!description || description.trim().length === 0) {
    return { isValid: false, error: 'La description est requise' };
  }

  if (description.trim().length < minLength) {
    return { isValid: false, error: `La description doit contenir au moins ${minLength} caractères` };
  }

  if (description.length > 5000) {
    return { isValid: false, error: 'La description ne peut pas dépasser 5000 caractères' };
  }

  return { isValid: true };
}

// Validation des milestones
export function validateMilestone(
  name: string,
  percentage: number,
  amount: number
): ValidationResult {
  // Validation du nom
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Le nom de l\'étape est requis' };
  }

  if (name.trim().length < 3) {
    return { isValid: false, error: 'Le nom doit contenir au moins 3 caractères' };
  }

  // Validation du pourcentage
  if (percentage <= 0 || percentage > 100) {
    return { isValid: false, error: 'Le pourcentage doit être entre 1 et 100' };
  }

  // Validation du montant
  if (amount <= 0) {
    return { isValid: false, error: 'Le montant doit être positif' };
  }

  return { isValid: true };
}

// Validation des photos
export function validatePhotos(photos: string[], maxPhotos: number = 10): ValidationResult {
  if (!photos || photos.length === 0) {
    return { isValid: false, error: 'Au moins une photo est requise' };
  }

  if (photos.length > maxPhotos) {
    return { isValid: false, error: `Maximum ${maxPhotos} photos autorisées` };
  }

  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  for (const photo of photos) {
    const lowerPhoto = photo.toLowerCase();
    const isValid = validExtensions.some(ext => lowerPhoto.endsWith(ext));
    if (!isValid) {
      return { isValid: false, error: 'Formats acceptés: JPG, PNG, WEBP' };
    }
  }

  return { isValid: true };
}

// Validation combinée
export function validateMultiple(
  validations: ValidationResult[]
): ValidationResult {
  const errors = validations
    .filter(v => !v.isValid)
    .map(v => v.error);

  if (errors.length > 0) {
    return { isValid: false, error: errors.join(', ') };
  }

  return { isValid: true };
}

// Sanitization
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/\s+/g, ' '); // Normalize whitespace
}

export function sanitizeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
