import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Button } from '@/components/ui/button';
import { HardHat, Mail, MessageSquare } from 'lucide-react';

interface NavigationProps {
  showContact?: boolean;
  contactType?: 'general' | 'support' | 'team';
}

export default function Navigation({ showContact = true, contactType = 'general' }: NavigationProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getContactLink = () => {
    switch (contactType) {
      case 'support':
        return '/contact?subject=support';
      case 'team':
        return '/contact?subject=team';
      default:
        return '/contact';
    }
  };

  const getContactLabel = () => {
    switch (contactType) {
      case 'support':
        return 'Support';
      case 'team':
        return 'Team';
      default:
        return 'Contact';
    }
  };

  return (
    <nav className="bg-card border-b border-border sticky top-0 z-50 backdrop-blur-sm bg-card/90">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <HardHat className="h-6 w-6 text-primary" />
            <span className="font-heading font-bold text-lg">
              SwipeTonPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="/projets"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Projets
            </Link>
            <Link
              href="/particulier/comment-ca-marche"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Comment ça marche
            </Link>
            <Link
              href="/professionnel"
              className="text-muted-foreground hover:text-primary transition-colors font-medium"
            >
              Devenir Pro
            </Link>
            {showContact && (
              <Link href={getContactLink()}>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {getContactLabel()}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              <div className="space-y-1">
                <div className="w-6 h-0.5 bg-current"></div>
                <div className="w-6 h-0.5 bg-current"></div>
                <div className="w-6 h-0.5 bg-current"></div>
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="py-4 space-y-4">
              <Link
                href="/projets"
                className="block text-muted-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Projets
              </Link>
              <Link
                href="/particulier/comment-ca-marche"
                className="block text-muted-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Comment ça marche
              </Link>
              <Link
                href="/professionnel"
                className="block text-muted-foreground hover:text-primary transition-colors font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Devenir Pro
              </Link>
              {showContact && (
                <Link href={getContactLink()} onClick={() => setIsMenuOpen(false)}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 w-full justify-start"
                  >
                    <Mail className="h-4 w-4" />
                    {getContactLabel()}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
