"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Bot, 
  User, 
  CheckCircle, 
  Clock,
  MessageCircle,
  Phone,
  Calendar,
  Star
} from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
  options?: string[];
}

interface QualificationData {
  name: string;
  email: string;
  phone: string;
  projectType: string;
  budget: string;
  timeline: string;
  urgency: string;
  location: string;
  description: string;
}

export default function ChatbotQualification() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [qualificationData, setQualificationData] = useState<Partial<QualificationData>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const qualificationSteps = [
    {
      key: 'name',
      question: "Bonjour ! Je suis votre assistant virtuel pour qualifier votre projet. Quel est votre nom complet ?",
      type: 'text',
      validation: (value: string) => value.length >= 2,
    },
    {
      key: 'email',
      question: "Merci {name} ! Quelle est votre adresse email ?",
      type: 'email',
      validation: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    },
    {
      key: 'phone',
      question: "Parfait ! Quel est votre numéro de téléphone pour vous contacter ?",
      type: 'phone',
      validation: (value: string) => /^[\d\s\+\-\(\)]+$/.test(value) && value.length >= 10,
    },
    {
      key: 'projectType',
      question: "Quel type de travaux souhaitez-vous réaliser ?",
      type: 'options',
      options: [
        'Plomberie',
        'Électricité',
        'Chauffage/Climatisation',
        'Menuiserie',
        'Maçonnerie',
        'Peinture',
        'Rénovation complète',
        'Autre'
      ],
    },
    {
      key: 'location',
      question: "Dans quelle ville et code postal se situe le projet ?",
      type: 'text',
      validation: (value: string) => value.length >= 3,
    },
    {
      key: 'budget',
      question: "Quel est votre budget approximatif pour ces travaux ?",
      type: 'options',
      options: [
        'Moins de 5 000€',
        '5 000€ - 10 000€',
        '10 000€ - 20 000€',
        '20 000€ - 50 000€',
        'Plus de 50 000€'
      ],
    },
    {
      key: 'timeline',
      question: "Quand souhaitez-vous commencer ces travaux ?",
      type: 'options',
      options: [
        'Urgent (dès que possible)',
        'Dans 1 mois',
        'Dans 2-3 mois',
        'Dans 6 mois',
        'Cette année',
        'En planification'
      ],
    },
    {
      key: 'urgency',
      question: "Quel est le niveau d'urgence de ce projet ?",
      type: 'options',
      options: [
        'Urgent (problème sécurité)',
        'Élevé (inconfort majeur)',
        'Moyen (amélioration souhaitée)',
        'Faible (planification tranquille)'
      ],
    },
    {
      key: 'description',
      question: "Pouvez-vous décrire plus en détail votre projet ?",
      type: 'textarea',
      validation: (value: string) => value.length >= 10,
    },
  ];

  useEffect(() => {
    // Message de bienvenue initial
    const welcomeMessage: Message = {
      id: '1',
      type: 'bot',
      content: "Bonjour ! Je suis votre assistant virtuel EDSwipe. Je vais vous aider à qualifier votre projet de travaux en quelques minutes. Commençons !",
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    
    // Première question
    setTimeout(() => {
      askQuestion(0);
    }, 1000);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const askQuestion = (stepIndex: number) => {
    if (stepIndex >= qualificationSteps.length) {
      completeQualification();
      return;
    }

    const step = qualificationSteps[stepIndex];
    let question = step.question;
    
    // Remplacer les variables dans la question
    Object.entries(qualificationData).forEach(([key, value]) => {
      question = question.replace(`{${key}}`, value as string);
    });

    const botMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: question,
      timestamp: new Date(),
      options: step.options,
    };

    setMessages(prev => [...prev, botMessage]);
    setCurrentStep(stepIndex);
  };

  const handleUserInput = (input: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Valider et sauvegarder la réponse
    const step = qualificationSteps[currentStep];
    
    if (step.validation && step.validation(input)) {
      const newData = { ...qualificationData };
      newData[step.key as keyof QualificationData] = input;
      setQualificationData(newData);

      // Passer à l'étape suivante
      setTimeout(() => {
        setIsTyping(false);
        askQuestion(currentStep + 1);
      }, 1000);
    } else {
      // Message d'erreur
      setTimeout(() => {
        const errorMessage: Message = {
          id: Date.now().toString(),
          type: 'bot',
          content: "Je n'ai pas bien compris votre réponse. Pourriez-vous reformuler ?",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
      }, 1000);
    }
  };

  const handleOptionClick = (option: string) => {
    handleUserInput(option);
  };

  const completeQualification = () => {
    const completionMessage: Message = {
      id: Date.now().toString(),
      type: 'bot',
      content: `Excellent ! J'ai maintenant toutes les informations pour qualifier votre projet. Voici le résumé :\n\n• Nom : ${qualificationData.name}\n• Email : ${qualificationData.email}\n• Téléphone : ${qualificationData.phone}\n• Type de travaux : ${qualificationData.projectType}\n• Localisation : ${qualificationData.location}\n• Budget : ${qualificationData.budget}\n• Délai : ${qualificationData.timeline}\n• Urgence : ${qualificationData.urgency}\n\nVotre projet a été qualifié avec succès ! Un expert va vous contacter dans les plus brefs délais.`,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, completionMessage]);
    setIsCompleted(true);

    // Calculer le score de qualification
    const score = calculateQualificationScore();
    
    setTimeout(() => {
      const scoreMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `🎯 Score de qualification : ${score}/100\n\n${getScoreInterpretation(score)}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, scoreMessage]);
    }, 2000);
  };

  const calculateQualificationScore = (): number => {
    let score = 0;
    
    // Budget (30 points)
    const budget = qualificationData.budget;
    if (budget?.includes('50 000€')) score += 30;
    else if (budget?.includes('20 000€')) score += 25;
    else if (budget?.includes('10 000€')) score += 20;
    else if (budget?.includes('5 000€')) score += 15;
    else score += 10;

    // Urgence (25 points)
    const urgency = qualificationData.urgency;
    if (urgency?.includes('Urgent')) score += 25;
    else if (urgency?.includes('Élevé')) score += 20;
    else if (urgency?.includes('Moyen')) score += 15;
    else score += 10;

    // Délai (20 points)
    const timeline = qualificationData.timeline;
    if (timeline?.includes('Urgent')) score += 20;
    else if (timeline?.includes('1 mois')) score += 15;
    else if (timeline?.includes('2-3 mois')) score += 10;
    else score += 5;

    // Description (15 points)
    const description = qualificationData.description;
    if (description && description.length > 50) score += 15;
    else if (description && description.length > 20) score += 10;
    else if (description) score += 5;

    // Type de travaux (10 points)
    const projectType = qualificationData.projectType;
    if (projectType?.includes('Rénovation') || projectType?.includes('Chauffage')) score += 10;
    else if (projectType?.includes('Plomberie') || projectType?.includes('Électricité')) score += 8;
    else score += 5;

    return Math.min(score, 100);
  };

  const getScoreInterpretation = (score: number): string => {
    if (score >= 80) {
      return "🔥 **Lead Chaud** : Projet prioritaire avec forte probabilité de conversion !";
    } else if (score >= 60) {
      return "⚡ **Lead Tiède** : Bon potentiel, à traiter rapidement";
    } else if (score >= 40) {
      return "❄️ **Lead Froid** : Projet à suivre, potentiel moyen";
    } else {
      return "🌱 **Lead Nouveau** : Projet en phase de réflexion";
    }
  };

  const restartQualification = () => {
    setMessages([]);
    setQualificationData({});
    setCurrentStep(0);
    setIsCompleted(false);
    setInputValue('');
    
    // Recommencer
    setTimeout(() => {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        type: 'bot',
        content: "Recommençons ! Je vais vous aider à qualifier votre projet.",
        timestamp: new Date(),
      };
      setMessages([welcomeMessage]);
      
      setTimeout(() => {
        askQuestion(0);
      }, 1000);
    }, 500);
  };

  const exportLeadData = () => {
    const data = {
      ...qualificationData,
      qualificationScore: calculateQualificationScore(),
      createdAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lead-${qualificationData.name}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-3 rounded-full">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Assistant de Qualification
                </h1>
                <p className="text-gray-600">
                  Qualifiez vos projets de travaux en quelques minutes
                </p>
              </div>
            </div>
            {isCompleted && (
              <div className="flex space-x-2">
                <Button variant="outline" onClick={exportLeadData}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
                <Button onClick={restartQualification}>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Nouveau Lead
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Progression de la qualification
            </span>
            <span className="text-sm text-gray-500">
              {currentStep}/{qualificationSteps.length} étapes
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / qualificationSteps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md px-4 py-3 rounded-lg ${
                    message.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-2">
                    {message.type === 'bot' && (
                      <Bot className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    {message.type === 'user' && (
                      <User className="w-4 h-4 mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <p className="whitespace-pre-line">{message.content}</p>
                      {message.options && (
                        <div className="mt-3 space-y-2">
                          {message.options.map((option, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              onClick={() => handleOptionClick(option)}
                              className="w-full justify-start text-left h-auto py-2 px-3"
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center mt-2 space-x-1">
                    <Clock className="w-3 h-3 opacity-60" />
                    <span className="text-xs opacity-60">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-3 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4" />
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          {!isCompleted && (
            <div className="border-t p-4">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && inputValue.trim()) {
                      handleUserInput(inputValue);
                    }
                  }}
                  placeholder="Tapez votre réponse..."
                  disabled={isTyping}
                />
                <Button
                  onClick={() => inputValue.trim() && handleUserInput(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Qualification Summary */}
        {isCompleted && (
          <div className="mt-6 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Résumé de Qualification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Score de qualification</span>
                  <Badge className="bg-green-100 text-green-800">
                    {calculateQualificationScore()}/100
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Statut</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {getScoreInterpretation(calculateQualificationScore()).split('**')[1]?.split('**')[0] || 'Évalué'}
                  </Badge>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Priorité</span>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.ceil(calculateQualificationScore() / 20)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Action recommandée</span>
                  <span className="text-sm font-medium">
                    {calculateQualificationScore() >= 70 ? 'Contact immédiat' : 'Suivi dans 24h'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
