'use client';

import { useState } from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
  showValue?: boolean;
}

export default function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  readonly = false,
  onChange,
  className,
  showValue = false
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(rating);

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleStarClick = (starRating: number) => {
    if (readonly) return;
    
    const newRating = starRating;
    setCurrentRating(newRating);
    onChange?.(newRating);
  };

  const handleMouseEnter = (starRating: number) => {
    if (readonly) return;
    setHoverRating(starRating);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverRating(0);
  };

  const renderStar = (starIndex: number) => {
    const starValue = starIndex + 1;
    const filled = starValue <= (hoverRating || currentRating);
    const half = !filled && starValue - 0.5 <= (hoverRating || currentRating);

    return (
      <button
        key={starIndex}
        type="button"
        onClick={() => handleStarClick(starValue)}
        onMouseEnter={() => handleMouseEnter(starValue)}
        onMouseLeave={handleMouseLeave}
        disabled={readonly}
        className={cn(
          'transition-colors duration-200',
          readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110',
          !readonly && 'transform'
        )}
      >
        {filled ? (
          <Star
            className={cn(
              sizeClasses[size],
              'fill-yellow-400 text-yellow-400',
              readonly && 'fill-yellow-300 text-yellow-300'
            )}
          />
        ) : half ? (
          <div className="relative">
            <Star
              className={cn(
                sizeClasses[size],
                'fill-gray-200 text-gray-300'
              )}
            />
            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
              <Star
                className={cn(
                  sizeClasses[size],
                  'fill-yellow-400 text-yellow-400',
                  readonly && 'fill-yellow-300 text-yellow-300'
                )}
              />
            </div>
          </div>
        ) : (
          <Star
            className={cn(
              sizeClasses[size],
              'fill-gray-200 text-gray-300',
              !readonly && 'hover:fill-yellow-200 hover:text-yellow-200'
            )}
          />
        )}
      </button>
    );
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </div>
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600">
          {currentRating.toFixed(1)}/{maxRating}
        </span>
      )}
    </div>
  );
}
