"use client";

import { Loader as LucideLoader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoaderProps extends React.ComponentProps<typeof LucideLoader> {}

const Loader = ({ className, ...props }: LoaderProps) => {
  return (
    <LucideLoader
      className={cn('animate-spin text-current', className)}
      {...props}
    />
  );
};
Loader.displayName = 'Loader';

export default Loader;
