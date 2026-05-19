"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GamingConfetti } from "@/components/ui/gaming-confetti";
import { SuccessCelebration } from "@/components/payment/success-celebration";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Shield,
  QrCode as QrCodeIcon,
  ArrowLeft,
  Star,
  Smartphone,
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  getCheckoutOriginalTotalPhp,
  getPlanConfig,
  getPlanLabel,
  isSubscriptionPlanId,
} from "@/lib/subscription-plans";

function QRPhPaymentContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  
  const planParam = searchParams.get('plan') || 'N/A';
  const plan = isSubscriptionPlanId(planParam) ? planParam : planParam;
  const planConfig = isSubscriptionPlanId(plan) ? getPlanConfig(plan) : null;
  const priceParam = searchParams.get('price');

  const initialMonths = parseInt(searchParams.get('months') || '1', 10) || 1;
  const unitSalePrice = priceParam
    ? parseFloat(priceParam)
    : planConfig?.pricePhp ?? null;
  const unitOriginalPrice = planConfig?.originalPricePhp ?? null;

  const [months, setMonths] = useState(
    plan === 'monthly' ? initialMonths : plan === 'yearly' ? 12 : 1
  );

  const price =
    plan === 'monthly' && unitSalePrice != null
      ? unitSalePrice * months
      : unitSalePrice;
  const originalTotal =
    isSubscriptionPlanId(plan) && unitOriginalPrice != null
      ? getCheckoutOriginalTotalPhp(plan, months)
      : null;
  const planLabel = planConfig?.label ?? getPlanLabel(plan);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'awaiting_scan' | 'polling' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [qrCodeImage, setQrCodeImage] = useState<string | null>(null);
  const [qrCodeExpiresAt, setQrCodeExpiresAt] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [pollCount, setPollCount] = useState(0);
  const [lastPollTime, setLastPollTime] = useState<Date | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [showCancelDialog, setShowCancelDialog] = useState(false); // For cancel confirmation
  const [showBackDialog, setShowBackDialog] = useState(false); // For back confirmation
  const isMobile = useIsMobile();
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!qrCodeExpiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((qrCodeExpiresAt.getTime() - Date.now()) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        setPaymentStatus('error');
        setErrorMessage('QR code expired. Please generate a new one.');
        stopPolling();
      }
    };

    updateTimer();
    timerIntervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [qrCodeExpiresAt]);

  // Don't auto-initialize payment - wait for Subscribe button click
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const initializePayment = async () => {
    if (!price) {
      console.log('[QRPh Payment] No price provided, skipping initialization');
      return;
    }

    console.log('[QRPh Payment] Initializing payment:', {
      price,
      plan,
      months,
    });

    setIsProcessing(true);
    setPaymentStatus('processing');
    setErrorMessage(null);

    try {
      const amount = price;
      console.log('[QRPh Payment] Creating payment intent with amount:', amount);
      
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, plan, months }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initialize payment');
      }

      if (result.success && result.payment_intent_id) {
        setPaymentIntentId(result.payment_intent_id);
        await generateQRCode(result.payment_intent_id);
      } else {
        throw new Error(result.error || 'Failed to initialize payment');
      }
    } catch (error: any) {
      console.error('[QRPh Payment] Initialization error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Failed to initialize payment');
      setIsProcessing(false);
    }
  };

  const generateQRCode = async (intentId: string) => {
    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      const response = await fetch('/api/payments/attach-method', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          payment_intent_id: intentId,
            return_url: `${window.location.origin}/subscribe/qrph?status=success&payment_intent_id=${intentId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate QR code');
      }

      if (data.next_action?.type === 'consume_qr' && data.qr_code) {
        setQrCodeImage(data.qr_code);
        const url = data.payment_url || null;
        setPaymentUrl(url);
        const expiryDate = new Date(Date.now() + 30 * 60 * 1000);
        setQrCodeExpiresAt(expiryDate);
        setTimeRemaining(30 * 60);
        setPaymentStatus('awaiting_scan');
        setIsProcessing(false);
        
        // On mobile: Automatically open payment link if available
        if (isMobile && url) {
          // Small delay to ensure state is updated
          setTimeout(() => {
            window.location.href = url;
          }, 500);
        }
        
        startPolling(intentId);
      } else {
        throw new Error('No QR code received from PayMongo');
      }
    } catch (error: any) {
      console.error('[QRPh Payment] QR generation error:', error);
      setPaymentStatus('error');
      setErrorMessage(error.message || 'Failed to generate QR code');
      setIsProcessing(false);
    }
  };

  const startPolling = useCallback((intentId: string) => {
    if (pollingIntervalRef.current) {
      return; // Already polling
    }
    
    setPaymentStatus('polling');
    
    const pollPaymentStatus = async () => {
      try {
        setPollCount(prev => prev + 1);
        setLastPollTime(new Date());
        
        console.log(`[QRPh Payment] Polling payment status (attempt ${pollCount + 1})...`);
        
        const response = await fetch('/api/payments/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ payment_intent_id: intentId }),
        });

        const result = await response.json();

        console.log('[QRPh Payment] Poll response:', {
          success: result.success,
          message: result.message,
          paymentStatus: result.paymentStatus,
          isPaid: result.isPaid,
        });

        if (response.ok && result.success) {
          // Payment confirmed!
          stopPolling();
          
          // Close the mobile popup by clearing QR code state
          if (isMobile) {
            setQrCodeImage(null);
            setPaymentUrl(null);
          }
          
          setPaymentStatus('success');
          
          // Refresh user data to get updated subscription
          await refreshUser();
          
          toast({
            title: "Payment Successful!",
            description: "Your subscription has been activated.",
            variant: "default",
          });
          
          // Don't auto-redirect - let user choose from success page
        } else if (result.canActivate === false) {
          // Payment not yet completed, continue polling
          console.log('[QRPh Payment] Payment not yet completed, continuing to poll...');
        } else {
          // Error or unknown status
          console.warn('[QRPh Payment] Poll returned non-success:', result);
        }
      } catch (error) {
        console.error('[QRPh Payment] Polling error:', error);
        // Don't stop polling on error, just log it
      }
    };

    // Poll immediately, then every 2 seconds
    pollPaymentStatus();
    pollingIntervalRef.current = setInterval(pollPaymentStatus, 2000);
  }, [pollCount, toast, refreshUser, isMobile]);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };


  // Show login required if not authenticated
  if (!user) {
    return (
      <div className="fixed inset-0 h-screen w-screen overflow-hidden bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-6 py-12 px-4">
          <div className="p-8 bg-amber-50 border-2 border-amber-200 rounded-xl max-w-md text-center shadow-sm">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-amber-100 rounded-full">
                <Shield className="h-8 w-8 text-amber-600" />
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

  // Show full-page success celebration
  if (paymentStatus === 'success') {
        return <SuccessCelebration plan={plan} months={months} />;
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
          <div className="relative z-10 flex flex-col h-full py-4 sm:py-5 px-6 sm:px-8 lg:px-12 justify-between">
            {/* Top Section */}
            <div className="flex-shrink-0">
              {/* Back Button */}
              <button
                onClick={() => {
                  // Show confirmation if payment is in progress (has QR code or is processing/polling)
                  if ((paymentStatus === 'processing' || paymentStatus === 'awaiting_scan' || paymentStatus === 'polling') && qrCodeImage) {
                    setShowBackDialog(true);
                  } else {
                    router.push('/subscribe');
                  }
                }}
                className="flex items-center gap-2 text-gray-200 hover:text-white mb-3 sm:mb-4 transition-colors w-fit drop-shadow-lg font-orbitron text-xs sm:text-sm"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium">Back to Plans</span>
              </button>

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
              Review your subscription details and complete payment
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
                      <p
                        className="text-xs sm:text-sm font-orbitron font-semibold text-white mb-3 uppercase tracking-widest text-center"
                        style={{ textShadow: '0 0 8px rgba(255, 255, 255, 0.3)' }}
                      >
                        SELECT DURATION
                      </p>
                      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-3">
                        <button
                          type="button"
                          onClick={() => setMonths(Math.max(1, months - 1))}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-purple-600/50 hover:bg-purple-600/70 border-2 border-purple-400/70 text-white font-bold text-lg sm:text-xl transition-all flex items-center justify-center shadow-lg"
                        >
                          −
                        </button>
                        <div className="text-center min-w-[70px]">
                          <div
                            className="text-2xl sm:text-3xl font-cinzel font-bold mb-1"
                            style={{
                              color: '#FFD700',
                              textShadow: '0 0 15px rgba(255, 215, 0, 0.8), 0 0 25px rgba(255, 215, 0, 0.5)',
                            }}
                          >
                            {months}
                          </div>
                          <p className="text-xs sm:text-sm font-orbitron font-semibold text-white uppercase tracking-wide">
                            {months === 1 ? 'Month' : 'Months'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMonths(Math.min(12, months + 1))}
                          className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-purple-600/50 hover:bg-purple-600/70 border-2 border-purple-400/70 text-white font-bold text-lg sm:text-xl transition-all flex items-center justify-center shadow-lg"
                        >
                          +
                        </button>
                      </div>
                      <div className="pt-2 border-t border-purple-500/30 text-center space-y-1">
                        <p className="text-xs sm:text-sm font-orbitron font-semibold text-white">
                          <span className="text-green-400">₱{unitSalePrice}</span>
                          <span className="text-gray-400 line-through ml-2">₱{unitOriginalPrice}</span>
                          <span className="text-gray-300"> / month</span>
                        </p>
                        <p className="text-xs text-gray-400 font-orbitron">50% off per month</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile: GCash Payment Method Selector */}
                {isMobile && (
                  <div className="mt-3 bg-black/60 backdrop-blur-sm rounded-lg p-4 border-2 border-purple-500/50 shadow-lg">
                    <p className="text-xs sm:text-sm font-orbitron font-semibold text-white mb-3 uppercase tracking-widest text-center" style={{
                      textShadow: '0 0 8px rgba(255, 255, 255, 0.3)'
                    }}>SELECT PAYMENT METHOD</p>
                    <button
                      onClick={() => setSelectedPaymentMethod(selectedPaymentMethod === 'gcash' ? '' : 'gcash')}
                      className={`w-full p-4 rounded-lg border-2 transition-all flex items-center justify-center gap-3 ${
                        selectedPaymentMethod === 'gcash'
                          ? 'bg-green-600/50 border-green-400/70 shadow-lg shadow-green-500/50'
                          : 'bg-purple-600/30 border-purple-500/50 hover:bg-purple-600/40'
                      }`}
                      style={{
                        boxShadow: selectedPaymentMethod === 'gcash' 
                          ? '0 0 15px rgba(34, 197, 94, 0.5), inset 0 0 10px rgba(34, 197, 94, 0.2)'
                          : '0 0 10px rgba(139, 92, 246, 0.3)'
                      }}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedPaymentMethod === 'gcash'
                          ? 'bg-green-500 border-green-400'
                          : 'border-purple-400'
                      }`}>
                        {selectedPaymentMethod === 'gcash' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        )}
                      </div>
                      <span className="text-base sm:text-lg font-cinzel font-semibold text-white">
                        GCash
                      </span>
                      {selectedPaymentMethod === 'gcash' && (
                        <div className="ml-auto">
                          <CheckCircle2 className="h-5 w-5 text-green-400" />
                        </div>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-2 font-orbitron">
                      Select GCash to proceed with payment
                    </p>
                  </div>
                )}

                {/* Subscribe Button */}
                <div className="mt-2 sm:mt-3">
                  <Button
                    onClick={() => {
                      if (!paymentIntentId || paymentStatus === 'idle' || paymentStatus === 'error') {
                        initializePayment();
                      }
                    }}
                    disabled={isProcessing || (paymentStatus !== 'idle' && paymentStatus !== 'error') || (isMobile && selectedPaymentMethod !== 'gcash')}
                    className="w-full h-11 sm:h-12 text-sm sm:text-base font-cinzel font-bold tracking-wide transition-all relative overflow-hidden group"
                    style={{
                      background: (isProcessing || paymentStatus === 'processing') 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.7) 0%, rgba(124, 58, 237, 0.7) 100%)'
                        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.9) 0%, rgba(124, 58, 237, 0.9) 100%)',
                      border: '2px solid rgba(167, 139, 250, 0.5)',
                      boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4), 0 0 20px rgba(139, 92, 246, 0.2)',
                      color: '#FFFFFF',
                      opacity: (isProcessing || paymentStatus === 'processing') ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isProcessing && paymentStatus === 'idle') {
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(139, 92, 246, 0.6), 0 0 30px rgba(139, 92, 246, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(139, 92, 246, 0.4), 0 0 20px rgba(139, 92, 246, 0.2)';
                    }}
                  >
                    {/* Animated background effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    {/* Content */}
                    <div className="relative z-10 flex items-center justify-center gap-3">
                      {isProcessing || paymentStatus === 'processing' ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))' }} />
                          <span style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>Processing...</span>
                        </>
                      ) : (
                        <>
                          <Shield className="h-5 w-5" style={{ filter: 'drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))' }} />
                          <span style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.5)' }}>Subscribe</span>
                        </>
                      )}
                    </div>
                  </Button>
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
                    ₱{price?.toFixed(2)}
                  </span>
                  {originalTotal != null && originalTotal > (price ?? 0) && (
                    <span className="text-sm text-gray-500 line-through font-orbitron block">
                      ₱{originalTotal.toFixed(2)}
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
          
        {/* Right Side - White Theme (QR Code) */}
        {/* On mobile: Never show */}
        {/* On desktop: Always show */}
        <div className={`${isMobile ? 'hidden' : 'flex'} w-full lg:w-1/2 bg-white flex-col items-center justify-center p-6 sm:p-8 overflow-y-auto`}>
          <div className="w-full max-w-lg space-y-6">
            {/* Waiting State - Before Subscribe */}
            {paymentStatus === 'idle' && !qrCodeImage && (
              <div className="flex flex-col items-center justify-center gap-6 py-12 px-6 w-full">
                <div className="bg-gradient-to-br from-purple-50 via-purple-100 to-purple-50 rounded-3xl p-10 sm:p-12 border-3 border-purple-300 shadow-2xl max-w-xl w-full">
                  <div className="text-center space-y-6">
                    <div className="flex justify-center">
                      <div className="p-6 bg-gradient-to-br from-purple-600/30 to-purple-700/20 rounded-full shadow-lg">
                        <QrCodeIcon className="h-16 w-16 sm:h-20 sm:w-20 text-purple-600" style={{
                          filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.4))'
                        }} />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-3xl sm:text-4xl font-cinzel font-bold text-gray-900 mb-3 tracking-wide" style={{
                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                      }}>
                        Ready to Subscribe
                      </h3>
                      <p className="text-base sm:text-lg text-gray-700 font-orbitron leading-relaxed max-w-md mx-auto">
                        Click the <span className="font-bold text-purple-600">Subscribe</span> button on the left to proceed with payment
                      </p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-200 shadow-lg mt-6">
                      <p className="text-sm font-orbitron text-gray-600 uppercase tracking-widest mb-3 font-semibold">Payment Method</p>
                      <p className="text-xl font-cinzel font-bold text-gray-900 mb-2">QRPh Payment</p>
                      <p className="text-sm text-gray-600 mt-3 font-orbitron">
                        Pay using GCash, PayMaya, or any QRPh-compatible e-wallet
                      </p>
                    </div>
                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-2 border-purple-200 shadow-lg">
                      <p className="text-sm font-orbitron text-gray-600 uppercase tracking-widest mb-3 font-semibold">Total Amount</p>
                      <p className="text-4xl sm:text-5xl font-cinzel font-bold text-purple-600 mb-2" style={{
                        textShadow: '0 0 15px rgba(139, 92, 246, 0.4), 0 0 25px rgba(139, 92, 246, 0.2)'
                      }}>
                        ₱{price?.toFixed(2)}
                      </p>
                      {plan === 'lifetime' && (
                        <p className="text-sm text-gray-600 mt-2 font-orbitron">
                          One-time payment
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
          )}
          
            {/* Processing State */}
            {paymentStatus === 'processing' && (
              <div className="flex flex-col items-center justify-center gap-6 py-16">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-100 rounded-full animate-ping opacity-75"></div>
                  <div className="relative bg-purple-50 rounded-full p-6">
                    <Loader2 className="h-16 w-16 animate-spin text-purple-600" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</p>
                  <p className="text-gray-600">Please wait while we prepare your payment...</p>
              </div>
              </div>
            )}

            {/* Error State */}
            {paymentStatus === 'error' && (
              <div className="flex flex-col items-center justify-center gap-6 py-16">
                <div className="bg-red-50 rounded-full p-6">
                  <XCircle className="h-20 w-20 text-red-600" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-2xl font-bold text-red-700">Payment Failed</p>
                  <p className="text-gray-600 max-w-md">{errorMessage || 'An error occurred during payment'}</p>
                </div>
                <Button 
                  onClick={initializePayment} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-base"
                >
                  Try Again
                </Button>
              </div>
            )}

            {/* Mobile: QR Code Popup Modal */}
            {isMobile && (paymentStatus === 'awaiting_scan' || paymentStatus === 'polling') && qrCodeImage && (
              <Dialog open={true} onOpenChange={() => {}}>
                <DialogContent 
                  className="sm:max-w-md bg-white border-2 border-gray-300 p-0 gap-0" 
                  hideCloseButton
                  preventClose
                >
                  <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-center font-cinzel text-xl font-bold text-gray-900">
                      Complete Payment
                    </DialogTitle>
                    <DialogDescription className="text-center text-sm text-gray-600 font-orbitron">
                      Scan the QR code or tap the link below
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="px-6 pb-6 space-y-4">
                    {/* Payment Link */}
                    {paymentUrl && (
                      <Button
                        onClick={() => {
                          window.location.href = paymentUrl;
                        }}
                        className="w-full h-14 text-base font-cinzel font-bold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg"
                      >
                        <Smartphone className="mr-2 h-5 w-5" />
                        Open in GCash App
                      </Button>
                    )}

                    {/* QR Code */}
                    <div className="relative flex justify-center">
                      <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-gray-200">
                        <Image 
                          src={qrCodeImage} 
                          alt="QRPh Payment QR Code" 
                          width={300}
                          height={300}
                          className="w-[280px] h-[280px] object-contain"
                          unoptimized
                        />
                      </div>
                      <div className="absolute -top-2 -right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                        <QrCodeIcon className="h-3 w-3" />
                        Scan Me
                      </div>
                    </div>

                    {/* Polling Status */}
                    {paymentStatus === 'polling' && (
                      <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-lg p-3 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                          <span className="text-blue-800 font-semibold text-xs">Checking payment status...</span>
                        </div>
                        <p className="text-xs text-blue-600">
                          Attempt {pollCount} {lastPollTime && `• ${lastPollTime.toLocaleTimeString()}`}
                        </p>
                      </div>
                    )}

                    {/* Cancel Button */}
                    <Button
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="w-full border-2 border-red-500 text-red-600 hover:bg-red-50 font-orbitron"
                    >
                      Cancel Payment
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}

            {/* Desktop: QR Code Display */}
            {!isMobile && (paymentStatus === 'awaiting_scan' || paymentStatus === 'polling') && qrCodeImage && (
              <div className="flex flex-col items-center gap-6">
                {/* QR Code */}
                <div className="relative">
                  <div className="p-4 bg-white rounded-xl shadow-lg border-2 border-gray-200">
                    <Image 
                      src={qrCodeImage} 
                      alt="QRPh Payment QR Code" 
                      width={400}
                      height={400}
                      className="w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] lg:w-[400px] lg:h-[400px] object-contain"
                      unoptimized
                    />
                  </div>
                  {paymentStatus === 'awaiting_scan' && (
                    <div className="absolute -top-2 -right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shadow-lg">
                      <QrCodeIcon className="h-3 w-3" />
                      Scan Me
                    </div>
                  )}
                </div>

                {/* Polling Status */}
                {(paymentStatus === 'polling' || paymentStatus === 'awaiting_scan') && (
                  <div className="w-full bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <span className="text-blue-800 font-semibold text-sm">Automatically checking payment status...</span>
                    </div>
                    <p className="text-xs text-blue-600">
                      Checking every 2 seconds • Attempt {pollCount} {lastPollTime && `• Last: ${lastPollTime.toLocaleTimeString()}`}
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Cancel Payment Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent className="bg-white border-2 border-red-200 shadow-xl max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center font-cinzel text-xl font-bold text-red-600">
              Cancel Payment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3 pt-2">
              <p className="text-sm font-orbitron text-gray-700">
                Are you sure you want to cancel this payment? This action will stop the payment process and you will need to start over.
              </p>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 mt-3">
                <p className="text-xs font-semibold text-amber-900 font-orbitron mb-1">⚠️ Warning:</p>
                <p className="text-xs text-amber-800 font-orbitron">
                  If you have already initiated the payment, canceling here will not refund your payment. Please complete the payment process or contact support if you need assistance.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 font-orbitron">
              Keep Payment Active
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                stopPolling();
                setPaymentStatus('idle');
                setQrCodeImage(null);
                setPaymentIntentId(null);
                setPaymentUrl(null);
                setShowCancelDialog(false);
              }}
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white font-orbitron font-semibold"
            >
              Yes, Cancel Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Back Confirmation Dialog */}
      <AlertDialog open={showBackDialog} onOpenChange={setShowBackDialog}>
        <AlertDialogContent className="bg-white border-2 border-amber-200 shadow-xl max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-amber-100 rounded-full">
                <AlertTriangle className="h-8 w-8 text-amber-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center font-cinzel text-xl font-bold text-amber-600">
              Leave Payment Page?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center space-y-3 pt-2">
              <p className="text-sm font-orbitron text-gray-700">
                You have a payment in progress. Are you sure you want to go back? This will stop the payment process.
              </p>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-3 mt-3">
                <p className="text-xs font-semibold text-amber-900 font-orbitron mb-1">⚠️ Warning:</p>
                <p className="text-xs text-amber-800 font-orbitron">
                  Leaving this page will stop the payment verification process. If you have already paid, your payment will still be processed, but you&apos;ll need to wait for manual verification or contact support.
                </p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 mt-2">
                <p className="text-xs font-semibold text-blue-900 font-orbitron mb-1">💡 Tip:</p>
                <p className="text-xs text-blue-800 font-orbitron">
                  The payment is automatically verified every 2 seconds. Please wait a moment for confirmation.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50 font-orbitron">
              Stay on Page
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                stopPolling();
                router.push('/subscribe');
              }}
              className="w-full sm:w-auto bg-amber-600 hover:bg-amber-700 text-white font-orbitron font-semibold"
            >
              Yes, Go Back
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function QRPhPaymentPage() {
  return <QRPhPaymentContent />;
}
