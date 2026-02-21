"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Star, Sparkles, Award } from "lucide-react";

interface Particle {
  id: number;
  type: "coin" | "star" | "orb" | "badge";
  x: number;
  y: number;
  rotation: number;
  delay: number;
}

interface GamingConfettiProps {
  isActive: boolean;
  duration?: number;
}

export function GamingConfetti({ isActive, duration = 5000 }: GamingConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!isActive) {
      setParticles([]);
      return;
    }

    // Generate particles
    const newParticles: Particle[] = [];
    const particleCount = 60;
    const centerX = 50; // Percentage from left
    const centerY = 20; // Percentage from top

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
      const speed = 0.3 + Math.random() * 0.4;
      const distance = 20 + Math.random() * 30;
      
      const types: ("coin" | "star" | "orb" | "badge")[] = ["coin", "star", "orb", "badge"];
      const type = types[Math.floor(Math.random() * types.length)];

      newParticles.push({
        id: i,
        type,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance * 0.5,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.3,
      });
    }

    setParticles(newParticles);

    // Cleanup after duration
    const timer = setTimeout(() => {
      setParticles([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, duration]);

  if (!isActive || particles.length === 0) {
    return null;
  }

  const getParticleIcon = (type: string, size: number = 20) => {
    switch (type) {
      case "coin":
        return <Coins size={size} className="text-yellow-400" />;
      case "star":
        return <Star size={size} className="text-yellow-300 fill-yellow-300" />;
      case "orb":
        return (
          <div className="relative">
            <div className="w-4 h-4 rounded-full bg-purple-500 shadow-lg shadow-purple-500/50 animate-pulse" />
            <Sparkles size={size} className="absolute inset-0 text-purple-400" />
          </div>
        );
      case "badge":
        return <Award size={size} className="text-amber-400" />;
      default:
        return null;
    }
  };

  const getParticleAnimation = (particle: Particle) => {
    const endY = 100 + Math.random() * 20;
    const endX = particle.x + (Math.random() - 0.5) * 30;
    const rotation = particle.rotation + (Math.random() > 0.5 ? 360 : -360);

    return {
      initial: {
        x: `${particle.x}%`,
        y: `${particle.y}%`,
        opacity: 0,
        scale: 0,
        rotate: particle.rotation,
      },
      animate: {
        x: `${endX}%`,
        y: `${endY}%`,
        opacity: [0, 1, 1, 0],
        scale: [0, 1.2, 1, 0.8],
        rotate: rotation,
      },
      transition: {
        duration: 2 + Math.random(),
        delay: particle.delay,
        ease: "easeOut",
      },
    };
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute"
            style={{
              left: 0,
              top: 0,
            }}
            {...getParticleAnimation(particle)}
          >
            {getParticleIcon(particle.type)}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
