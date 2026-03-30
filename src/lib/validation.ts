// Fonctions de validation pour formulaires et données

export function validateSIRET(siret: string): { valid: boolean; error?: string } {
  // Supprimer espaces et caractères non numériques
  const cleanSiret = siret.replace(/\s/g, "");
  
  if (cleanSiret.length !== 14) {
    return { valid: false, error: "Le SIRET doit contenir 14 chiffres" };
  }
  
  if (!/^\d+$/.test(cleanSiret)) {
    return { valid: false, error: "Le SIRET ne doit contenir que des chiffres" };
  }
  
  // TODO: Implémenter algorithme de Luhn pour validation réelle
  
  return { valid: true };
}

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email)) {
    return { valid: false, error: "Format d'email invalide" };
  }
  
  return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  // Accepter formats: 0612345678, +33612345678, 06 12 34 56 78
  const cleanPhone = phone.replace(/\s/g, "");
  const phoneRegex = /^(\+33|0)[1-9]\d{8}$/;
  
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: "Format de téléphone invalide" };
  }
  
  return { valid: true };
}

export function validateBudget(budget: number, minEstimation: number): { valid: boolean; warning?: string } {
  if (budget < minEstimation * 0.8) {
    return { 
      valid: false, 
      warning: "Votre budget est très inférieur à l'estimation. Les professionnels pourraient ne pas postuler." 
    };
  }
  
  if (budget < minEstimation) {
    return { 
      valid: true, 
      warning: "Attention : votre budget est inférieur à l'estimation basse." 
    };
  }
  
  return { valid: true };
}

export function validateFileSize(file: File, maxSizeMB: number = 10): { valid: boolean; error?: string } {
  const maxBytes = maxSizeMB * 1024 * 1024;
  
  if (file.size > maxBytes) {
    return { valid: false, error: `Le fichier doit faire moins de ${maxSizeMB}MB` };
  }
  
  return { valid: true };
}

export function validateFileType(file: File, allowedTypes: string[]): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `Format non autorisé. Formats acceptés: ${allowedTypes.join(", ")}` 
    };
  }
  
  return { valid: true };
}