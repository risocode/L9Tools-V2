
"use client";

import { useMemo } from 'react';
import type { Boss } from '@/types';
import mapData from '@/lib/map-data.json';
import { motion } from 'framer-motion';

interface InteractiveMapProps {
  boss: Boss | null;
}

type MapInfo = {
  width: number;
  height: number;
  bosses: { [bossName: string]: { x: number; y: number } };
};

export function InteractiveMap({ boss }: InteractiveMapProps) {
  const mapInfo: MapInfo | undefined = (mapData as Record<string, MapInfo>)[boss?.location ?? ''];

  const viewBox = useMemo(() => {
    if (!mapInfo) return '0 0 800 600';
    return `0 0 ${mapInfo.width} ${mapInfo.height}`;
  }, [mapInfo]);

  if (!boss || !mapInfo || !boss.map) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-900/50 rounded-lg">
        <p className="text-gray-400 text-lg">Map data not available for {boss?.name || 'this boss'}.</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-[#0d1117] rounded-lg">
       <svg viewBox={viewBox} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        {/* Disclaimer Text */}
        <text
          x="50%"
          y="30"
          textAnchor="middle"
          fill="#FFFFFF"
          fontSize="16"
          fontWeight="bold"
          fontFamily="var(--font-roboto)"
          style={{ textShadow: '0px 1px 4px rgba(0,0,0,0.8)' }}
        >
          All in-game map assets © LORDNINE : INFINITE CLASS. Used for informational purposes only.
        </text>
        
        {/* Map Background Image */}
        <image href={boss.map} x="0" y="0" width="100%" height="100%" />
      </svg>
    </div>
  );
}
