import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface PhotoUploadZoneProps {
  photos: File[];
  onPhotosChange: (photos: File[]) => void;
  maxPhotos?: number;
  className?: string;
}

export function PhotoUploadZone({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  className,
}: PhotoUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files).filter((file) =>
        file.type.startsWith('image/')
      );

      if (files.length > 0) {
        const remainingSlots = maxPhotos - photos.length;
        const filesToAdd = files.slice(0, remainingSlots);
        onPhotosChange([...photos, ...filesToAdd]);
      }
    },
    [photos, maxPhotos, onPhotosChange]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        const files = Array.from(e.target.files);
        const remainingSlots = maxPhotos - photos.length;
        const filesToAdd = files.slice(0, remainingSlots);
        onPhotosChange([...photos, ...filesToAdd]);
      }
    },
    [photos, maxPhotos, onPhotosChange]
  );

  const removePhoto = useCallback(
    (index: number) => {
      const newPhotos = photos.filter((_, i) => i !== index);
      onPhotosChange(newPhotos);
    },
    [photos, onPhotosChange]
  );

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
          isDragging
            ? 'border-primary bg-primary/5 scale-105'
            : 'border-border hover:border-primary',
          photos.length >= maxPhotos && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          className="hidden"
          id="photo-upload"
          disabled={photos.length >= maxPhotos}
        />
        <label
          htmlFor="photo-upload"
          className={cn(
            'cursor-pointer',
            photos.length >= maxPhotos && 'cursor-not-allowed'
          )}
        >
          <Upload
            className={cn(
              'w-12 h-12 mx-auto mb-4 transition-colors',
              isDragging ? 'text-primary' : 'text-text-muted'
            )}
          />
          <p className="font-semibold mb-2">
            {isDragging
              ? 'Déposez vos photos ici'
              : 'Glissez-déposez vos photos ou cliquez pour sélectionner'}
          </p>
          <p className="text-sm text-text-secondary">
            Format: JPG, PNG - Maximum {maxPhotos} photos
          </p>
          {photos.length > 0 && (
            <p className="text-sm text-primary mt-2 font-medium">
              {photos.length}/{maxPhotos} photo{photos.length > 1 ? 's' : ''}{' '}
              ajoutée{photos.length > 1 ? 's' : ''}
            </p>
          )}
        </label>
      </div>

      {/* Photos Preview */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {photos.map((file, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border-2 border-success group"
            >
              <Image
                src={URL.createObjectURL(file)}
                alt={`Photo ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <button
                onClick={() => removePhoto(index)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-sm font-semibold"
                type="button"
              >
                <X className="w-6 h-6 mb-1" />
                <span>Supprimer</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
