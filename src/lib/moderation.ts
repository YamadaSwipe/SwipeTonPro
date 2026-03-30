// AI-powered content moderation system

interface ModerationResult {
  isApproved: boolean;
  confidence: number;
  issues: Array<{
    type: 'spam' | 'inappropriate' | 'hate_speech' | 'personal_info' | 'scam' | 'offensive' | 'duplicate';
    severity: 'low' | 'medium' | 'high';
    description: string;
    detectedAt: number;
  }>;
  suggestedAction?: 'approve' | 'reject' | 'review' | 'edit';
  editedContent?: string;
}

class ContentModerator {
  private bannedWords: Set<string>;
  private suspiciousPatterns: RegExp[];
  private personalInfoPatterns: RegExp[];
  private spamPatterns: RegExp[];
  private duplicateThreshold: number;

  constructor() {
    this.initializePatterns();
    this.loadBannedWords();
  }

  private initializePatterns() {
    // Personal information patterns
    this.personalInfoPatterns = [
      /\b\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}[-.\s]?\d{2}\b/g, // Phone numbers
      /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, // US phone numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email addresses
      /\b\d{5}\b/g, // ZIP codes
      /\b\d{4}\s?\d{3}\s?\d{2}\s?\d{2}\b/g, // Credit card numbers
      /\b\d{2}\/\d{2}\/\d{4}\b/g, // Dates
      /\b\d{1,2}\s?\w+\s?\d{4}\b/g, // Various date formats
    ];

    // Spam patterns
    this.spamPatterns = [
      /(?:click|visit|check|go|link|url|site)\s+(?:here|now|today|free)/gi,
      /(?:buy|order|purchase|shop|deal|offer|discount|sale|promo)/gi,
      /(?:urgent|immediate|quick|fast|instant|asap)/gi,
      /(?:limited|exclusive|special|only today|act now)/gi,
      /(?:money|cash|profit|income|earn|make \$)/gi,
      /(?:congratulations|winner|prize|lottery|reward)/gi,
      /(?:call|phone|contact|reach|message)/gi,
      /(?:\$\d+|\d+\$|\d+\s*(?:dollars?|bucks?))/gi,
      /(?:http|https|www\.|\.com|\.net|\.org)/gi,
    ];

    // Suspicious patterns
    this.suspiciousPatterns = [
      /\b(?:kill|die|murder|suicide|terror|bomb|weapon|gun|knife|shoot)\b/gi,
      /\b(?:hate|racist|nazi|fascist|extremist)\b/gi,
      /\b(?:drug|cocaine|heroin|weed|marijuana|pill|medication)\b/gi,
      /\b(?:porn|xxx|sex|nude|adult|escort)\b/gi,
      /\b(?:scam|fraud|fake|phishing|hack|crack)\b/gi,
      /\b(?:illegal|criminal|steal|rob|theft)\b/gi,
    ];

    this.duplicateThreshold = 3;
  }

  private async loadBannedWords() {
    // Load banned words from database or file
    this.bannedWords = new Set([
      // Profanity and offensive words
      'fuck', 'shit', 'damn', 'hell', 'bitch', 'bastard', 'asshole',
      'crap', 'suck', 'idiot', 'stupid', 'dumb', 'moron', 'loser',
      // Additional inappropriate terms
      'nazi', 'racist', 'terrorist', 'killer', 'murderer',
      // Spam keywords
      'viagra', 'cialis', 'lottery', 'winner', 'congratulations',
      'clickbait', 'fake', 'scam', 'phishing'
    ]);
  }

  async moderateContent(content: string, contentType: 'message' | 'project' | 'review' | 'profile'): Promise<ModerationResult> {
    const issues: ModerationResult['issues'] = [];
    let confidence = 0;

    // Check for banned words
    const bannedWordsFound = this.checkBannedWords(content);
    if (bannedWordsFound.length > 0) {
      issues.push({
        type: 'inappropriate',
        severity: 'high',
        description: `Contains inappropriate language: ${bannedWordsFound.join(', ')}`,
        detectedAt: Date.now()
      });
      confidence += 0.8;
    }

    // Check for personal information
    const personalInfoFound = this.checkPersonalInfo(content);
    if (personalInfoFound.length > 0) {
      issues.push({
        type: 'personal_info',
        severity: 'high',
        description: `Contains personal information: ${personalInfoFound.join(', ')}`,
        detectedAt: Date.now()
      });
      confidence += 0.7;
    }

    // Check for spam patterns
    const spamScore = this.checkSpam(content);
    if (spamScore > 0.5) {
      issues.push({
        type: 'spam',
        severity: spamScore > 0.8 ? 'high' : spamScore > 0.6 ? 'medium' : 'low',
        description: `Likely spam content (score: ${Math.round(spamScore * 100)}%)`,
        detectedAt: Date.now()
      });
      confidence += spamScore * 0.6;
    }

    // Check for suspicious content
    const suspiciousScore = this.checkSuspicious(content);
    if (suspiciousScore > 0.3) {
      issues.push({
        type: 'inappropriate',
        severity: suspiciousScore > 0.7 ? 'high' : suspiciousScore > 0.5 ? 'medium' : 'low',
        description: `Suspicious content detected (score: ${Math.round(suspiciousScore * 100)}%)`,
        detectedAt: Date.now()
      });
      confidence += suspiciousScore * 0.5;
    }

    // Check for duplicates (for projects)
    if (contentType === 'project') {
      const duplicateScore = await this.checkDuplicates(content);
      if (duplicateScore > 0.6) {
        issues.push({
          type: 'duplicate',
          severity: 'medium',
          description: `Similar content already exists (score: ${Math.round(duplicateScore * 100)}%)`,
          detectedAt: Date.now()
        });
        confidence += duplicateScore * 0.4;
      }
    }

    // Check content length and quality
    const qualityIssues = this.checkContentQuality(content, contentType);
    issues.push(...qualityIssues);

    // Determine overall result
    const isApproved = confidence < 0.6 && !issues.some(issue => issue.severity === 'high');
    const suggestedAction = this.getSuggestedAction(issues, confidence);

    // Auto-edit minor issues
    const editedContent = this.autoEditContent(content, issues);

    return {
      isApproved,
      confidence: Math.min(confidence, 1),
      issues,
      suggestedAction,
      editedContent: editedContent !== content ? editedContent : undefined
    };
  }

  private checkBannedWords(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const found: string[] = [];

    for (const word of words) {
      if (this.bannedWords.has(word)) {
        found.push(word);
      }
    }

    return found;
  }

  private checkPersonalInfo(content: string): string[] {
    const found: string[] = [];

    for (const pattern of this.personalInfoPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    }

    return found;
  }

  private checkSpam(content: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();

    for (const pattern of this.spamPatterns) {
      if (pattern.test(lowerContent)) {
        score += 0.2;
      }
    }

    // Check for excessive capitalization
    const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
    if (capsRatio > 0.3) {
      score += 0.1;
    }

    // Check for excessive punctuation
    const punctuationRatio = (content.match(/[!?.,]/g) || []).length / content.length;
    if (punctuationRatio > 0.1) {
      score += 0.1;
    }

    // Check for repeated characters
    if (/(.)\1{3,}/.test(content)) {
      score += 0.2;
    }

    return Math.min(score, 1);
  }

  private checkSuspicious(content: string): number {
    let score = 0;
    const lowerContent = content.toLowerCase();

    for (const pattern of this.suspiciousPatterns) {
      if (pattern.test(lowerContent)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1);
  }

  private async checkDuplicates(content: string): Promise<number> {
    // This would check against existing content in the database
    // For now, return 0 (no duplicates)
    return 0;
  }

  private checkContentQuality(content: string, contentType: string): ModerationResult['issues'] {
    const issues: ModerationResult['issues'] = [];

    // Check minimum length
    const minLength = contentType === 'message' ? 10 : contentType === 'project' ? 50 : 20;
    if (content.length < minLength) {
      issues.push({
        type: 'inappropriate',
        severity: 'low',
        description: `Content too short (minimum ${minLength} characters)`,
        detectedAt: Date.now()
      });
    }

    // Check for excessive whitespace
    const whitespaceRatio = (content.match(/\s/g) || []).length / content.length;
    if (whitespaceRatio > 0.5) {
      issues.push({
        type: 'inappropriate',
        severity: 'low',
        description: 'Excessive whitespace detected',
        detectedAt: Date.now()
      });
    }

    // Check for only uppercase
    if (content === content.toUpperCase() && content.length > 20) {
      issues.push({
        type: 'inappropriate',
        severity: 'low',
        description: 'Excessive use of uppercase',
        detectedAt: Date.now()
      });
    }

    return issues;
  }

  private getSuggestedAction(issues: ModerationResult['issues'], confidence: number): 'approve' | 'reject' | 'review' | 'edit' {
    const hasHighSeverity = issues.some(issue => issue.severity === 'high');
    const hasMediumSeverity = issues.some(issue => issue.severity === 'medium');

    if (hasHighSeverity || confidence > 0.8) {
      return 'reject';
    }

    if (hasMediumSeverity || confidence > 0.6) {
      return 'review';
    }

    if (issues.length > 0 && confidence > 0.3) {
      return 'edit';
    }

    return 'approve';
  }

  private autoEditContent(content: string, issues: ModerationResult['issues']): string {
    let editedContent = content;

    // Remove excessive whitespace
    editedContent = editedContent.replace(/\s+/g, ' ').trim();

    // Remove excessive punctuation
    editedContent = editedContent.replace(/[!?]{3,}/g, '!!');

    // Convert excessive uppercase to normal case
    if (editedContent === editedContent.toUpperCase() && editedContent.length > 20) {
      editedContent = editedContent.charAt(0) + editedContent.slice(1).toLowerCase();
    }

    // Filter out banned words (replace with asterisks)
    for (const word of this.checkBannedWords(editedContent)) {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      editedContent = editedContent.replace(regex, '*'.repeat(word.length));
    }

    return editedContent;
  }

  // AI-powered content analysis (placeholder for future integration)
  async analyzeWithAI(content: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    toxicity: number;
    categories: string[];
    confidence: number;
  }> {
    // This would integrate with OpenAI GPT, Google AI, or similar
    // For now, return basic analysis
    
    const toxicity = this.checkSuspicious(content);
    const sentiment = content.includes('good') || content.includes('great') || content.includes('excellent') 
      ? 'positive' 
      : content.includes('bad') || content.includes('terrible') || content.includes('awful')
      ? 'negative'
      : 'neutral';

    return {
      sentiment,
      toxicity,
      categories: ['general'],
      confidence: 0.7
    };
  }

  // Batch moderation for multiple content items
  async moderateBatch(items: Array<{ content: string; type: string; id: string }>): Promise<Array<{
    id: string;
    result: ModerationResult;
  }>> {
    const results = await Promise.all(
      items.map(async (item) => ({
        id: item.id,
        result: await this.moderateContent(item.content, item.type as any)
      }))
    );

    return results;
  }

  // Learn from moderation decisions
  async learnFromDecision(content: string, result: ModerationResult, humanDecision: 'approve' | 'reject'): Promise<void> {
    // This would implement machine learning to improve future moderation
    // For now, just log the decision
    console.log('Learning from moderation decision:', {
      content: content.substring(0, 100),
      result,
      humanDecision
    });
  }
}

export const contentModerator = new ContentModerator();

// React hook for content moderation
import { useState } from 'react';

export function useContentModeration() {
  const [isModerating, setIsModerating] = useState(false);
  const [lastResult, setLastResult] = useState<ModerationResult | null>(null);

  const moderateContent = async (content: string, contentType: 'message' | 'project' | 'review' | 'profile') => {
    setIsModerating(true);
    try {
      const result = await contentModerator.moderateContent(content, contentType);
      setLastResult(result);
      return result;
    } finally {
      setIsModerating(false);
    }
  };

  return {
    isModerating,
    lastResult,
    moderateContent
  };
}

// Middleware for API routes
export function withModeration(handler: Function) {
  return async (req: any, res: any) => {
    const { content, contentType } = req.body;

    if (content && contentType) {
      const result = await contentModerator.moderateContent(content, contentType);
      
      if (!result.isApproved) {
        return res.status(400).json({
          error: 'Content not approved',
          issues: result.issues,
          suggestedAction: result.suggestedAction
        });
      }

      // Auto-edit content if suggested
      if (result.editedContent && result.editedContent !== content) {
        req.body.content = result.editedContent;
      }
    }

    return handler(req, res);
  };
}
