"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from "react";
import { usePathname } from "next/navigation";

interface LoadingContextState {
  isLoading: boolean;
  showLoader: (callback: () => void | Promise<void>) => void;
  runAction: <T>(action: () => Promise<T>) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextState | undefined>(undefined);

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [navigationCount, setNavigationCount] = useState(0);
  const [actionCount, setActionCount] = useState(0);
  const pathname = usePathname();

  // Reset navigation loader whenever the route changes
  useEffect(() => {
    if (navigationCount > 0) {
      setNavigationCount(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const showLoader = useCallback((navigationCallback: () => void | Promise<void>) => {
    setNavigationCount((prev) => prev + 1);

    // This immediately calls the navigation, which will trigger the
    // useEffect above to reset the counter upon path change.
    Promise.resolve(navigationCallback()).catch(err => {
      console.error("Navigation callback failed:", err);
      // Ensure loader gets turned off even if navigation fails
      setNavigationCount(prev => Math.max(0, prev - 1));
    });
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
