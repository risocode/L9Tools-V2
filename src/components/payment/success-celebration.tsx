"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GamingConfetti } from "@/components/ui/gaming-confetti";
import { Award, Home, User, Star } from "lucide-react";
import { getSuccessPlanTitle } from "@/lib/subscription-plans";

interface SuccessCelebrationProps {
  plan: string;
  months?: number;
}

const proFeatures = [
  "Save boss timers across all devices",
  "Send unlimited boss reports to Discord",
  "Completely Ad-Free experience",
  "Access to future Pro features"
];

export function SuccessCelebration({ plan, months = 1 }: SuccessCelebrationProps) {
  const router = useRouter();
  
  const planDisplayName = getSuccessPlanTitle(plan, months);

  return (
    <>
      <GamingConfetti isActive={true} duration={8000} />
      <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 flex flex-col items-center justify-center z-50">
        {/* Background glow effects */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
        }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center justify-center gap-3 sm:gap-4 px-4 max-w-4xl mx-auto">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
              <Image
                src="/l9logo.png"
                alt="L9 Tools Logo"
                width={180}
                height={180}
                className="relative z-10 drop-shadow-2xl"
                priority
              />
            </div>
          </motion.div>

          {/* Star Icon */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2, type: "spring", stiffness: 200 }}
            className="flex justify-center"
          >
            <Star 
              className="h-7 w-7 sm:h-8 sm:w-8" 
              style={{
                color: '#FFD700',
                filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.4))',
                fill: 'rgba(255, 215, 0, 0.2)'
              }}
            />
          </motion.div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-center space-y-2"
          >
            <div className="relative">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-cinzel font-bold tracking-wide">
                <span className="text-white">SUBSCRIPTION </span>
                <span style={{
                  color: '#FFD700',
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.6), 0 0 20px rgba(255, 215, 0, 0.4), 0 0 30px rgba(255, 215, 0, 0.3)'
                }}>ACTIVATED!</span>
              </h1>
              <div className="absolute inset-0 text-2xl sm:text-3xl lg:text-4xl font-cinzel font-bold text-yellow-500/20 blur-sm">
                SUBSCRIPTION ACTIVATED!
              </div>
            </div>
            <p className="text-sm sm:text-base text-gray-300 font-orbitron">
              {planDisplayName}
            </p>
          </motion.div>

          {/* Pro Tier Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="w-full max-w-md mx-auto"
          >
            <div className="bg-black/40 backdrop-blur-sm rounded-lg p-4 sm:p-5 border border-gray-700/50 shadow-lg">
              <h3 className="text-sm sm:text-base font-cinzel font-semibold mb-3 tracking-wide text-center" style={{
                color: '#FFD700',
                textShadow: '0 0 8px rgba(255, 215, 0, 0.5)'
              }}>Pro Tier Benefits</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-200 font-orbitron text-left">
                {proFeatures.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0" style={{ color: '#FFD700' }}>▸</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Pro Tier Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6, type: "spring", stiffness: 200 }}
            className="flex items-center gap-2 bg-purple-800/50 border border-purple-700 rounded-full px-4 py-2 shadow-xl backdrop-blur-sm"
          >
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
            <span className="text-xs sm:text-sm font-cinzel font-semibold text-amber-300 uppercase tracking-wide">Pro Tier Unlocked</span>
          </motion.div>

          {/* Navigation Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full max-w-md mt-2"
          >
            <Button
              onClick={() => router.push('/boss-hunt')}
              className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-6 py-3 text-sm sm:text-base font-cinzel font-semibold shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 transition-all border border-purple-400/30 h-auto"
            >
              <Home className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              Go to Boss Hunt
            </Button>
            <Button
              onClick={() => router.push('/profile')}
              variant="outline"
              className="flex-1 border-2 border-purple-400/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-400 px-6 py-3 text-sm sm:text-base font-cinzel font-semibold h-auto"
            >
              <User className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              View Profile
            </Button>
          </motion.div>
        </div>
      </div>
    </>
  );
}
