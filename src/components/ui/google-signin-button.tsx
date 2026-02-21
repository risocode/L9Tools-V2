
"use client";

import { cn } from "@/lib/utils";

interface GoogleSignInButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children?: React.ReactNode;
}

export function GoogleSignInButton({ children, className, onClick, disabled, ...props }: GoogleSignInButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log('[GoogleSignInButton] Button clicked:', {
      disabled,
      hasOnClick: !!onClick,
      timestamp: new Date().toISOString(),
    });
    
    if (disabled) {
      console.log('[GoogleSignInButton] Button is disabled, preventing click');
      e.preventDefault();
      return;
    }
    
    if (onClick) {
      console.log('[GoogleSignInButton] Calling onClick handler...');
      onClick(e);
    } else {
      console.warn('[GoogleSignInButton] ⚠️ No onClick handler provided');
    }
  };

  return (
    <button 
        className={cn(
            "w-full max-w-sm mx-auto", // Centering and max-width for the wrapper
            "button google flex py-2 px-4 text-sm font-bold text-center uppercase items-center justify-center",
            "rounded-lg border border-[rgba(50,50,80,0.25)] gap-3",
            "text-white bg-[rgb(50,50,80)] cursor-pointer transition-all duration-300 ease-in-out no-underline",
            "hover:scale-105 hover:bg-[rgb(70,70,100)] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500",
            "active:scale-95 active:opacity-80",
            "disabled:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100",
            className
        )}
        onClick={handleClick}
        disabled={disabled}
        {...props}
    >
      <svg className="h-6 w-6 shrink-0" viewBox="0 0 256 262" preserveAspectRatio="xMidYMid" xmlns="http://www.w3.org/2000/svg">
        <path d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027" fill="#4285F4" />
        <path d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1" fill="#34A853" />
        <path d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" fill="#FBBC05" />
        <path d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" fill="#EB4335" />
      </svg>
      {children || "Continue with Google"}
    </button>
  );
}
