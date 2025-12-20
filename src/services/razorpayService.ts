export type PlanType = 'monthly' | 'yearly';

export const PRICING = {
  monthly: {
    USD: { amount: 799, currency: 'USD', symbol: '$', display: '7.99' },
    INR: { amount: 24900, currency: 'INR', symbol: '₹', display: '249' },
  },
  yearly: {
    USD: { amount: 6999, currency: 'USD', symbol: '$', display: '69.99' },
    INR: { amount: 199900, currency: 'INR', symbol: '₹', display: '1,999' },
  },
};

declare global {
  interface Window {
    Razorpay: any;
  }
}

const RAZORPAY_KEY = 'rzp_live_RttA4Sjyxmu0lV';

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay'));
    document.body.appendChild(script);
  });
}

export const razorpayService = {
  async initiatePayment(
    plan: PlanType,
    currency: 'USD' | 'INR',
    onSuccess: () => void,
    onCancel: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      await loadRazorpayScript();
      
      const pricing = PRICING[plan][currency];
      const description = plan === 'monthly' 
        ? 'Premium Subscription - 1 Month' 
        : 'Premium Subscription - 1 Year';
      
      const options = {
        key: RAZORPAY_KEY,
        amount: pricing.amount,
        currency: pricing.currency,
        name: 'ReliefAnchor',
        description,
        handler: () => onSuccess(),
        modal: { ondismiss: () => onCancel() },
        prefill: { email: '' },
        theme: { color: '#0d9488' },
      };
      
      const razorpay = new window.Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        onError(response.error?.description || 'Payment failed');
      });
      razorpay.open();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment initialization failed');
    }
  },
};
