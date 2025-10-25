
"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Future-proof the ad object to allow for different types of ads
interface Ad {
  type: 'video' | 'banner' | 'interstitial';
  // Add other ad-related properties here in the future
}

interface AdContextState {
  ad: { isOpen: boolean; type: Ad['type'] | null };
  openAdDialog: (type?: Ad['type']) => void;
  closeAdDialog: () => void;
}

const AdContext = createContext<AdContextState | undefined>(undefined);

export function AdProvider({ children }: { children: ReactNode }) {
  const [ad, setAd] = useState<AdContextState['ad']>({ isOpen: false, type: null });

  const openAdDialog = (type: Ad['type'] = 'video') => {
    setAd({ isOpen: true, type });
  };

  const closeAdDialog = () => {
    setAd({ isOpen: false, type: null });
  };

  const value: AdContextState = {
    ad,
    openAdDialog,
    closeAdDialog,
  };

  return <AdContext.Provider value={value}>{children}</AdContext.Provider>;
}

export function useAd() {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAd must be used within an AdProvider');
  }
  return context;
}

    