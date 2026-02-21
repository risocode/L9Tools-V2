
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useTransition,
} from "react";

interface LoadingContextState {
  isLoading: boolean;
  showLoader: (navigationCallback: () => void | Promise<void>) => void;
}

const LoadingContext = createContext<LoadingContextState | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const showLoader = useCallback((navigationCallback: () => void | Promise<void>) => {
    startTransition(async () => {
      setIsLoading(true);
      try {
        await Promise.resolve(navigationCallback());
      } finally {
        // A small delay can help ensure the UI transition is smooth
        setTimeout(() => setIsLoading(false), 50);
      }
    });
  }, []);

  const finalIsLoading = isLoading || isPending;

  const value: LoadingContextState = {
    isLoading: finalIsLoading,
    showLoader,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
