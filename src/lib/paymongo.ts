/**
 * PayMongo utility functions
 * Note: We use direct API calls instead of the PayMongo SDK to avoid TypeScript issues
 */

/**
 * Get PayMongo public key (for client-side use)
 */
export function getPayMongoPublicKey(): string {
  const publicKey = process.env.NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY;
  
  if (!publicKey) {
    throw new Error('NEXT_PUBLIC_PAYMONGO_PUBLIC_KEY environment variable is not set.');
  }

  return publicKey;
}

/**
 * Payment method types supported by PayMongo
 */
export type PaymentMethodType = 'gcash' | 'paymaya' | 'grab_pay' | 'card';

/**
 * Note: 'paymaya' uses QRPh which works with:
 * - GCash
 * - PayMaya
 * - Other QRPh-compatible e-wallets in the Philippines
 */

/**
 * Create a payment intent for GCash
 */
export interface CreatePaymentIntentParams {
  amount: number; // Amount in cents (PHP: multiply by 100)
  currency?: string; // Default: 'php'
  description?: string;
  metadata?: Record<string, string>;
}

/**
 * Payment intent response
 */
export interface PaymentIntentResponse {
  id: string;
  client_key: string;
  status: string;
  amount: number;
  currency: string;
  payment_method_allowed: string[];
  next_action?: {
    type: string;
    redirect?: {
      url: string;
    };
  };
}
