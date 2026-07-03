export type PayMongoPaymentIntent = {
  id: string;
  attributes: {
    amount: number;
    status: string;
    metadata?: Record<string, string>;
    description?: string;
  };
};

export async function fetchPayMongoPaymentIntent(
  paymentIntentId: string,
  secretKey: string
): Promise<PayMongoPaymentIntent | null> {
  const response = await fetch(`https://api.paymongo.com/v1/payment_intents/${paymentIntentId}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload.data as PayMongoPaymentIntent;
}
