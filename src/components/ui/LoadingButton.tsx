import { Button } from './button';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
}

const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children, 
    loading = false, 
    loadingText,
    disabled,
    className,
    variant = 'default',
    size = 'default',
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        disabled={disabled || loading}
        className={cn(
          'relative transition-all duration-200',
          loading && 'cursor-not-allowed',
          className
        )}
        {...props}
      >
        {/* Loading spinner overlay */}
        <span
          className={cn(
            'flex items-center justify-center transition-all duration-200',
            loading ? 'opacity-100' : 'opacity-0 absolute inset-0'
          )}
          aria-hidden={!loading}
        >
          <Loader2 className="h-4 w-4 animate-spin" />
          {loadingText && (
            <span className="ml-2">{loadingText}</span>
          )}
        </span>
        
        {/* Button content */}
        <span
          className={cn(
            'flex items-center justify-center transition-all duration-200',
            loading ? 'opacity-0' : 'opacity-100'
          )}
          aria-hidden={loading}
        >
          {children}
        </span>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };
