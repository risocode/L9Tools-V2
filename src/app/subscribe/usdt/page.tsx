"use client";

import { useState } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { Copy, Mail, ArrowLeft, Star, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import Link from "next/link";
import {
  getCheckoutOriginalTotalPhp,
  getPlanConfig,
  getPlanLabel,
  isSubscriptionPlanId,
} from "@/lib/subscription-plans";

const usdtWalletAddress = "0xdc6852d5f99844142cfef79e28cb4bf4b7bcc1b0";

function UsdtPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const planParam = searchParams.get('plan') || 'N/A';
  const plan = isSubscriptionPlanId(planParam) ? planParam : planParam;
  const planConfig = isSubscriptionPlanId(plan) ? getPlanConfig(plan) : null;
  const priceParam = searchParams.get('price');
  const usdtParam = searchParams.get('usdt');

  const initialMonths = parseInt(searchParams.get('months') || '1', 10) || 1;
  const unitSalePrice = priceParam ? parseFloat(priceParam) : planConfig?.pricePhp ?? null;
  const unitOriginalPrice = planConfig?.originalPricePhp ?? null;
  const unitUsdt = usdtParam ? parseFloat(usdtParam) : planConfig?.usdtPrice ?? null;

  const [months, setMonths] = useState(
    plan === 'monthly' ? initialMonths : plan === 'yearly' ? 12 : 1
  );

  const totalPhp =
    plan === 'monthly' && unitSalePrice != null ? unitSalePrice * months : unitSalePrice;
  const totalUsdt =
    plan === 'monthly' && unitUsdt != null ? unitUsdt * months : unitUsdt;
  const originalTotal =
    isSubscriptionPlanId(plan) && unitOriginalPrice != null
      ? getCheckoutOriginalTotalPhp(plan, months)
      : null;
  const planLabel = planConfig?.label ?? getPlanLabel(plan);

  const updateMonthlyMonths = (newMonths: number) => {
    if (!isSubscriptionPlanId(plan) || plan !== 'monthly' || !unitSalePrice || !unitUsdt) return;
    setMonths(newMonths);
    router.replace(
      `/subscribe/usdt?plan=${plan}&price=${unitSalePrice}&months=${newMonths}&usdt=${(unitUsdt * newMonths).toFixed(2)}`
    );
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(usdtWalletAddress).then(() => {
      toast({
        title: "Copied!",
        description: "USDT wallet address copied to clipboard.",
        variant: "default",
      });
    });
  };

  const handleDiscordClick = () => {
    window.open('https://discord.gg/qFUAMc3b6n', '_blank');
  };

  // Show login required if not authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 py-12 px-4">
          <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded-xl max-w-md text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <p className="text-amber-900 font-semibold text-xl mb-2">Login Required</p>
            <p className="text-amber-800">
              You must be logged in to access the payment system.
            </p>
          </div>
          <Button 
            onClick={() => router.push('/subscribe')} 
            variant="outline" 
            className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
          >
            Return to Plans
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-white">
      {/* Split Layout */}
      <div className="flex flex-col lg:flex-row h-full">
        {/* Left Side - Dark Theme (Subscription Details) */}
        <div className={`relative ${isMobile ? 'w-full' : 'w-full lg:w-1/2'} flex flex-col overflow-hidden`}>
          {/* Background Image with Blur */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url(/l9rs/bg_page.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(3px)',
            }}
          />
          {/* Dark Overlay for Readability */}
          <div className="absolute inset-0 z-0 bg-black/60" />
          
          {/* Content with Top and Bottom Margins */}
          <div className="relative z-10 flex flex-col h-full py-3 sm:py-4 px-6 sm:px-8 lg:px-12 justify-between">
            {/* Top Section */}
            <div className="flex-shrink-0">
              {/* Back Button */}
              <Link 
                href="/subscribe"
                className="flex items-center gap-2 text-gray-200 hover:text-white mb-2 sm:mb-3 transition-colors w-fit drop-shadow-lg font-orbitron text-xs sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium">Back to Plans</span>
              </Link>

              {/* Star Icon - Premium Feature Style */}
              <div className="flex justify-center mb-2">
                <Star 
                  className="h-6 w-6 sm:h-7 sm:w-7" 
                  style={{
                    color: '#FFD700',
                    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.6)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.4))',
                    fill: 'rgba(255, 215, 0, 0.2)'
                  }}
                />
              </div>

              {/* Heading */}
              <h1 className="text-2xl sm:text-3xl font-cinzel font-bold text-center mb-1 tracking-wide" style={{
                color: '#FFD700',
                textShadow: '0 0 10px rgba(255, 215, 0, 0.5), 0 0 20px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.2)'
              }}>
                Complete Payment
              </h1>
              <p className="text-gray-300 mb-3 sm:mb-4 drop-shadow-md font-orbitron text-xs sm:text-sm text-center">
                Manual verification required for USDT payments
              </p>

              {/* Subscription Plan Details */}
              <div className="space-y-2 sm:space-y-3">
                <div className="text-center">
                  <p className="text-xs font-orbitron font-medium uppercase tracking-widest mb-1" style={{
                    color: '#FFD700',
                    textShadow: '0 0 8px rgba(255, 215, 0, 0.4)'
                  }}>Subscription Plan</p>
                  <p className="text-xl sm:text-2xl font-cinzel font-bold capitalize mb-1 tracking-wide" style={{
                    color: '#FFD700',
                    textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 0 0 25px rgba(255, 215, 0, 0.4)'
                  }}>{planLabel}</p>
                  <p className="text-gray-300 font-orbitron text-xs mb-2">
                    {plan === 'lifetime'
                      ? 'One-time payment'
                      : plan === 'yearly'
                        ? '12 months of Pro access'
                        : 'Add more months below'}
                  </p>

                  {plan === 'monthly' && unitSalePrice != null && (
                    <div className="mt-2 bg-black/60 backdrop-blur-sm rounded-lg p-3 border-2 border-purple-500/50 shadow-lg">
                      <p className="text-xs sm:text-sm font-orbitron font-semibold text-white mb-3 uppercase tracking-widest text-center">
                        SELECT DURATION
                      </p>
                      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3">
                        <button
                          type="button"
                          onClick={() => updateMonthlyMonths(Math.max(1, months - 1))}
                          className="w-10 h-10 rounded-lg bg-purple-600/50 border-2 border-purple-400/70 text-white font-bold text-xl"
                        >
                          −
                        </button>
                        <div className="text-center min-w-[70px]">
                          <div className="text-2xl font-cinzel font-bold text-[#FFD700]">{months}</div>
                          <p className="text-xs font-orbitron text-white uppercase">
                            {months === 1 ? 'Month' : 'Months'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => updateMonthlyMonths(Math.min(12, months + 1))}
                          className="w-10 h-10 rounded-lg bg-purple-600/50 border-2 border-purple-400/70 text-white font-bold text-xl"
                        >
                          +
                        </button>
                      </div>
                      <p className="text-xs font-orbitron text-center text-white pt-2 border-t border-purple-500/30">
                        <span className="text-green-400">₱{unitSalePrice}</span>
                        <span className="text-gray-400 line-through ml-2">₱{unitOriginalPrice}</span>
                        <span className="text-gray-300"> / month · 50% off</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Charge Breakdown - Bottom Section */}
            <div className="flex-shrink-0 space-y-1 pt-2 border-t border-gray-600/50">
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-orbitron text-xs">Price</span>
                <span className="text-sm font-cinzel font-semibold text-gray-400">
                  {plan === 'monthly' ? (
                    <>
                      ₱{unitSalePrice?.toFixed(2)}
                      {unitOriginalPrice != null && (
                        <span className="text-gray-500 line-through ml-1">₱{unitOriginalPrice.toFixed(2)}</span>
                      )}
                      <span className="text-gray-500"> /mo</span>
                    </>
                  ) : (
                    <>
                      ₱{unitSalePrice?.toFixed(2)}
                      {unitOriginalPrice != null && (
                        <span className="text-gray-500 line-through ml-1">₱{unitOriginalPrice.toFixed(2)}</span>
                      )}
                    </>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300 font-orbitron text-xs">
                  {plan === 'monthly' ? 'Months' : 'Duration'}
                </span>
                <span
                  className={
                    plan === 'lifetime'
                      ? 'text-lg font-bold text-red-400'
                      : 'text-sm font-cinzel font-semibold text-gray-400'
                  }
                >
                  {plan === 'lifetime'
                    ? '∞'
                    : plan === 'monthly'
                      ? `${months} ${months === 1 ? 'month' : 'months'}`
                      : planLabel}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-gray-600/50">
                <span className="text-sm sm:text-base font-cinzel font-semibold tracking-wide" style={{
                  color: '#FFD700',
                  textShadow: '0 0 10px rgba(255, 215, 0, 0.5)'
                }}
                >
                  Total
                </span>
                <span className="text-right">
                  <span
                    className="text-xl sm:text-2xl font-cinzel font-bold tracking-wide block"
                    style={{
                      color: '#FFD700',
                      textShadow: '0 0 15px rgba(255, 215, 0, 0.6), 0 0 25px rgba(255, 215, 0, 0.4)',
                    }}
                  >
                    ₱{totalPhp?.toFixed(2)}
                  </span>
                  {originalTotal != null && totalPhp != null && originalTotal > totalPhp && (
                    <span className="text-sm text-gray-500 line-through font-orbitron block">
                      ₱{originalTotal.toFixed(2)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-gray-600/50">
                <span className="text-xs font-orbitron text-gray-300">USDT Amount</span>
                <span className="text-base font-cinzel font-semibold" style={{
                  color: '#FFD700',
                  textShadow: '0 0 8px rgba(255, 215, 0, 0.4)'
                }}>{totalUsdt?.toFixed(2)} USDT</span>
              </div>
            </div>
          </div>
        </div>
          
        {/* Right Side - White Theme (Payment Instructions) */}
        {/* On mobile: Never show */}
        {/* On desktop: Always show */}
        <div className={`${isMobile ? 'hidden' : 'flex'} w-full lg:w-1/2 bg-white flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto`}>
          <div className="w-full max-w-lg space-y-6">
            {/* Payment Instructions */}
            <div className="flex flex-col items-center justify-center gap-6 py-8 px-6 w-full">
              <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 rounded-2xl p-6 sm:p-8 border-2 border-purple-300 shadow-xl max-w-md w-full">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-purple-600/30 to-purple-700/20 rounded-full shadow-lg">
                      <AlertCircle className="h-12 w-12 sm:h-14 sm:w-14 text-purple-600" style={{
                        filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))'
                      }} />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl sm:text-3xl font-cinzel font-bold text-gray-900 mb-2 tracking-wide" style={{
                      textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                    }}>
                      Manual Verification Required
                    </h3>
                    <p className="text-sm sm:text-base text-gray-700 font-orbitron leading-relaxed">
                      USDT payments require manual verification. Please follow the steps below.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 1: Wallet Address */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-purple-200 shadow-lg w-full">
                <p className="text-sm font-orbitron text-gray-600 uppercase tracking-widest mb-3 font-semibold">Step 1: Send Payment</p>
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-gray-200 flex justify-center">
                    <Image 
                      src="/wallet/dappqr.png" 
                      alt="USDT Wallet QR Code" 
                      width={250}
                      height={250}
                      className="w-[250px] h-[250px] object-contain"
                    />
                  </div>
                  <button 
                    onClick={handleCopy} 
                    className="w-full group flex items-center justify-center gap-2 rounded-lg bg-purple-50 border-2 border-purple-200 px-4 py-3 text-sm text-gray-700 hover:text-purple-600 hover:border-purple-400 transition-colors font-orbitron"
                  >
                    <span className="truncate">{usdtWalletAddress}</span>
                    <Copy className="h-4 w-4 opacity-70 group-hover:opacity-100 flex-shrink-0" />
                  </button>
                  <p className="text-xs text-gray-600 text-center font-orbitron">
                    Send exactly <span className="font-bold text-purple-600">{totalUsdt?.toFixed(2)} USDT (BEP20)</span> to this address
                  </p>
                </div>
              </div>

              {/* Step 2: Verification Instructions */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-purple-200 shadow-lg w-full">
                <p className="text-sm font-orbitron text-gray-600 uppercase tracking-widest mb-3 font-semibold">Step 2: Submit Proof</p>
                <p className="text-xs sm:text-sm text-gray-700 font-orbitron mb-4">
                  After payment, join our Discord and submit a screenshot of your payment proof in the{" "}
                  <a href="https://discord.gg/qFUAMc3b6n" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline font-semibold">#proof-of-payment</a>{" "}
                  channel along with your User ID.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2 border-t border-purple-200">
                  <Mail className="h-4 w-4 text-gray-600" />
                  <p className="text-xs text-gray-600 font-orbitron">Or email to:</p>
                  <Link href="mailto:payment@l9tools.online" className="text-xs text-purple-600 hover:underline font-semibold">payment@l9tools.online</Link>
                </div>
              </div>

              {/* Step 3: Activation Notice */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 border-2 border-purple-200 shadow-lg w-full">
                <p className="text-sm font-orbitron text-gray-600 uppercase tracking-widest mb-3 font-semibold">Step 3: Activation</p>
                <p className="text-xs sm:text-sm text-gray-700 font-orbitron">
                  Your subscription will be activated manually once payment is verified. Please allow 24-48 hours for processing.
                </p>
              </div>

              {/* Discord Button */}
              <Button
                onClick={handleDiscordClick}
                className="w-full h-14 text-base font-cinzel font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 640 512"
                    className="w-5 h-5 fill-current"
                  >
                    <path d="M524.531 69.836a1.5 1.5 0 0 0-.764-.7A485.065 485.065 0 0 0 404.081 32.03a1.816 1.816 0 0 0-1.923.91 337.461 337.461 0 0 0-14.9 30.6 447.848 447.848 0 0 0-134.426 0 309.541 309.541 0 0 0-15.135-30.6 1.89 1.89 0 0 0-1.924-.91 483.689 483.689 0 0 0-119.688 37.107 1.712 1.712 0 0 0-.788.676C39.068 183.651 18.186 294.69 28.43 404.354a2.016 2.016 0 0 0 .765 1.375 487.666 487.666 0 0 0 146.825 74.189 1.9 1.9 0 0 0 2.063-.676A348.2 348.2 0 0 0 208.12 430.4a1.86 1.86 0 0 0-1.019-2.588 321.173 321.173 0 0 1-45.868-21.853 1.885 1.885 0 0 1-.185-3.126 251.047 251.047 0 0 0 9.109-7.137 1.819 1.819 0 0 1 1.9-.256c96.229 43.917 200.41 43.917 295.5 0a1.812 1.812 0 0 1 1.924.233 234.533 234.533 0 0 0 9.132 7.16 1.884 1.884 0 0 1-.162 3.126 301.407 301.407 0 0 1-45.89 21.83 1.875 1.875 0 0 0-1 2.611 391.055 391.055 0 0 0 30.014 48.815 1.864 1.864 0 0 0 2.063.7A486.048 486.048 0 0 0 610.7 405.729a1.882 1.882 0 0 0 .765-1.352c12.264-126.783-20.532-236.912-86.934-334.541zM222.491 337.58c-28.972 0-52.844-26.587-52.844-59.239s23.409-59.241 52.844-59.241c29.665 0 53.306 26.82 52.843 59.239 0 32.654-23.41 59.241-52.843 59.241zm195.38 0c-28.971 0-52.843-26.587-52.843-59.239s23.409-59.241 52.843-59.241c29.667 0 53.307 26.820 52.844 59.239 0 32.654-23.177 59.241-52.844 59.241z"></path>
                  </svg>
                  Join Discord for Support
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile: Payment Instructions on Left Side */}
        {isMobile && (
          <div className="w-full flex flex-col items-center gap-4 mt-4 pt-4 px-6 border-t border-gray-600/50 pb-6">
            {/* Manual Verification Notice */}
            <div className="w-full bg-purple-900/50 border-2 border-purple-700/50 rounded-lg p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-semibold text-sm font-orbitron">Manual Verification Required</span>
              </div>
              <p className="text-xs text-purple-400 font-orbitron">
                USDT payments require manual verification
              </p>
            </div>

            {/* Step 1: Wallet Address */}
            <div className="w-full bg-black/60 backdrop-blur-sm rounded-lg p-4 border-2 border-purple-500/50 shadow-lg">
              <p className="text-xs font-orbitron font-semibold text-white mb-3 uppercase tracking-widest text-center" style={{
                textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
              }}>Step 1: Send Payment</p>
              <div className="space-y-3">
                <div className="p-3 bg-white rounded-xl shadow-lg border-2 border-gray-200 flex justify-center">
                  <Image 
                    src="/wallet/dappqr.png" 
                    alt="USDT Wallet QR Code" 
                    width={200}
                    height={200}
                    className="w-[200px] h-[200px] object-contain"
                  />
                </div>
                <button 
                  onClick={handleCopy} 
                  className="w-full group flex items-center justify-center gap-2 rounded-lg bg-purple-600/30 border-2 border-purple-500/50 px-3 py-2 text-xs text-white hover:bg-purple-600/50 transition-colors font-orbitron"
                >
                  <span className="truncate text-xs">{usdtWalletAddress}</span>
                  <Copy className="h-3 w-3 opacity-70 group-hover:opacity-100 flex-shrink-0" />
                </button>
                <p className="text-xs text-gray-300 text-center font-orbitron">
                  Send exactly <span className="font-bold text-yellow-400">{totalUsdt?.toFixed(2)} USDT (BEP20)</span>
                </p>
              </div>
            </div>

            {/* Step 2: Verification Instructions */}
            <div className="w-full bg-black/60 backdrop-blur-sm rounded-lg p-4 border-2 border-purple-500/50 shadow-lg">
              <p className="text-xs font-orbitron font-semibold text-white mb-3 uppercase tracking-widest text-center" style={{
                textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
              }}>Step 2: Submit Proof</p>
              <p className="text-xs text-gray-300 font-orbitron mb-3 text-center leading-relaxed">
                Join Discord and submit payment proof in{" "}
                <a href="https://discord.gg/qFUAMc3b6n" target="_blank" rel="noopener noreferrer" className="text-yellow-400 hover:underline font-semibold">#proof-of-payment</a>{" "}
                with your User ID
              </p>
              <div className="flex items-center justify-center gap-2 pt-2 border-t border-purple-500/30">
                <Mail className="h-3 w-3 text-gray-400" />
                <p className="text-xs text-gray-400 font-orbitron">Or email:</p>
                <Link href="mailto:payment@l9tools.online" className="text-xs text-yellow-400 hover:underline font-semibold">payment@l9tools.online</Link>
              </div>
            </div>

            {/* Step 3: Activation Notice */}
            <div className="w-full bg-black/60 backdrop-blur-sm rounded-lg p-4 border-2 border-purple-500/50 shadow-lg">
              <p className="text-xs font-orbitron font-semibold text-white mb-2 uppercase tracking-widest text-center" style={{
                textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
              }}>Step 3: Activation</p>
              <p className="text-xs text-gray-300 font-orbitron text-center">
                Activated manually within 24-48 hours after verification
              </p>
            </div>

            {/* Discord Button */}
            <Button
              onClick={handleDiscordClick}
              className="w-full h-12 text-sm font-cinzel font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg"
            >
              <div className="flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 512"
                  className="w-4 h-4 fill-current"
                >
                  <path d="M524.531 69.836a1.5 1.5 0 0 0-.764-.7A485.065 485.065 0 0 0 404.081 32.03a1.816 1.816 0 0 0-1.923.91 337.461 337.461 0 0 0-14.9 30.6 447.848 447.848 0 0 0-134.426 0 309.541 309.541 0 0 0-15.135-30.6 1.89 1.89 0 0 0-1.924-.91 483.689 483.689 0 0 0-119.688 37.107 1.712 1.712 0 0 0-.788.676C39.068 183.651 18.186 294.69 28.43 404.354a2.016 2.016 0 0 0 .765 1.375 487.666 487.666 0 0 0 146.825 74.189 1.9 1.9 0 0 0 2.063-.676A348.2 348.2 0 0 0 208.12 430.4a1.86 1.86 0 0 0-1.019-2.588 321.173 321.173 0 0 1-45.868-21.853 1.885 1.885 0 0 1-.185-3.126 251.047 251.047 0 0 0 9.109-7.137 1.819 1.819 0 0 1 1.9-.256c96.229 43.917 200.41 43.917 295.5 0a1.812 1.812 0 0 1 1.924.233 234.533 234.533 0 0 0 9.132 7.16 1.884 1.884 0 0 1-.162 3.126 301.407 301.407 0 0 1-45.89 21.83 1.875 1.875 0 0 0-1 2.611 391.055 391.055 0 0 0 30.014 48.815 1.864 1.864 0 0 0 2.063.7A486.048 486.048 0 0 0 610.7 405.729a1.882 1.882 0 0 0 .765-1.352c12.264-126.783-20.532-236.912-86.934-334.541zM222.491 337.58c-28.972 0-52.844-26.587-52.844-59.239s23.409-59.241 52.844-59.241c29.665 0 53.306 26.82 52.843 59.239 0 32.654-23.41 59.241-52.843 59.241zm195.38 0c-28.971 0-52.843-26.587-52.843-59.239s23.409-59.241 52.843-59.241c29.667 0 53.307 26.820 52.844 59.239 0 32.654-23.177 59.241-52.844 59.241z"></path>
                </svg>
                Join Discord
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsdtPaymentPage() {
  return <UsdtPaymentContent />;
}
