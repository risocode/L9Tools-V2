'use client';

import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminErrorBannerProps {
  message: string | null;
  onDismiss: () => void;
}

export function AdminErrorBanner({ message, onDismiss }: AdminErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p className="flex-1">{message}</p>
      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onDismiss}>
        <X className="h-4 w-4" />
        <span className="sr-only">Dismiss</span>
      </Button>
    </div>
  );
}

