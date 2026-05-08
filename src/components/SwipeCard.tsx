'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Euro, Calendar, Heart, X, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

interface Project {
  id: string;
  title: string;
  city: string;
  category: string;
  estimated_budget_min: number;
  estimated_budget_max: number;
  description: string;
  urgency: string;
  created_at: string;
  work_type: string[];
}

interface SwipeCardProps {
  project: Project;
  onSwipe: (direction: 'left' | 'right' | 'up') => void;
  isActive: boolean;
}

export default function SwipeCard({
  project,
  onSwipe,
  isActive,
}: SwipeCardProps) {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (!isDragging) return;

    const threshold = 100;
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);

    if (absY > threshold && absY > absX) {
      // Swipe vertical (up for interested)
      onSwipe('up');
    } else if (absX > threshold) {
      // Swipe horizontal
      onSwipe(dragOffset.x > 0 ? 'right' : 'left');
    }

    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  };

  const getRotation = () => {
    if (!isDragging) return 0;
    return dragOffset.x * 0.1;
  };

  const getOpacity = () => {
    if (!isDragging) return 1;
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);
    const maxOffset = Math.max(absX, absY);
    return Math.max(0.3, 1 - maxOffset / 300);
  };

  const getSwipeIndicator = () => {
    if (!isDragging) return null;

    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);

    if (absY > absX && absY > 100) {
      return dragOffset.y < 0 ? (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20">
          <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <ArrowUp className="w-5 h-5" />
            <span className="font-semibold">Intéressé !</span>
          </div>
        </div>
      ) : null;
    }

    if (absX > 100) {
      return dragOffset.x > 0 ? (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-blue-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <Heart className="w-5 h-5" />
            <span className="font-semibold">Peut-être</span>
          </div>
        </div>
      ) : (
        <div className="absolute top-4 left-4 z-20">
          <div className="bg-red-500 text-white px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
            <X className="w-5 h-5" />
            <span className="font-semibold">Passer</span>
          </div>
        </div>
      );
    }

    return null;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'normal':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="relative w-full h-full">
      {getSwipeIndicator()}

      <motion.div
        ref={cardRef}
        className={`absolute inset-0 cursor-grab active:cursor-grabbing ${!isActive ? 'pointer-events-none' : ''}`}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${getRotation()}deg)`,
          opacity: getOpacity(),
          transition: isDragging ? 'none' : 'all 0.3s ease-out',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        whileTap={{ scale: 0.98 }}
      >
        <Card className="h-full shadow-xl hover:shadow-2xl transition-shadow duration-300">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                    {project.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    <span>{project.city}</span>
                  </div>
                </div>
                <Badge className={getUrgencyColor(project.urgency)}>
                  {project.urgency === 'urgent'
                    ? 'Urgent'
                    : project.urgency === 'normal'
                      ? 'Normal'
                      : 'Peu urgent'}
                </Badge>
              </div>

              {/* Budget */}
              <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                <Euro className="w-4 h-4" />
                <span>
                  {project.estimated_budget_min?.toLocaleString('fr-FR')}€ -{' '}
                  {project.estimated_budget_max?.toLocaleString('fr-FR')}€
                </span>
              </div>
            </div>

            {/* Description */}
            <div className="flex-1 px-6 pb-4">
              <p className="text-gray-700 text-sm line-clamp-4 leading-relaxed">
                {project.description}
              </p>
            </div>

            {/* Footer */}
            <div className="p-6 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2 mb-4">
                {project.work_type?.slice(0, 3).map((type, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {type}
                  </Badge>
                ))}
                {project.work_type?.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{project.work_type.length - 3}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(project.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </span>
                <span>•</span>
                <span>{project.category}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
