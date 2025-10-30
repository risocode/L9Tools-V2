
"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from "react";

interface LoadingContextState {
  isLoading: boolean;
  showLoader: (callback: () => void | Promise<void>) => Promise<void>;
  runAction: <T>(action: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextState | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [navigationCount, setNavigationCount] = useState(0);
  const [actionCount, setActionCount] = useState(0);

  const showLoader = useCallback(async (navigationCallback: () => void | Promise<void>) => {
    setNavigationCount((prev) => prev + 1);
    try {
      await Promise.resolve(navigationCallback());
    } catch (err) {
      console.error("Navigation callback failed:", err);
    } finally {
      // Use a timeout to ensure the UI has time to update before turning off the loader,
      // especially for very fast navigations.
      setTimeout(() => {
        setNavigationCount((prev) => Math.max(0, prev - 1));
      }, 50); 
    }
  }, []);

  const runAction = useCallback(
    async <T,>(action: () => Promise<T>): Promise<T> => {
      setActionCount((prev) => prev + 1);
      try {
        return await action();
      } finally {
        setActionCount((prev) => Math.max(0, prev - 1));
      }
    },
    []
  );

  const isLoading = navigationCount > 0 || actionCount > 0;

  const value: LoadingContextState = {
    isLoading,
    showLoader,
    runAction,
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
