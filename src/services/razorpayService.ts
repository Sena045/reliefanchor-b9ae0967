import { PRICING, Region } from '@/types';

// Razorpay Test Keys
const RAZORPAY_KEY_ID = 'rzp_test_RsET8c7WDOT3UM';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayInstance {
  open: () => void;
  close: () => void;
}

let razorpayLoaded = false;

export const razorpayService = {
  async loadScript(): Promise<boolean> {
    if (razorpayLoaded) return true;
    
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        razorpayLoaded = true;
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  },

  async initiatePayment(
    region: Region,
    onSuccess: () => void,
    onCancel: () => void,
    onError: (error: string) => void
  ): Promise<void> {
    const loaded = await this.loadScript();
    if (!loaded) {
      onError('Failed to load payment gateway. Please try again.');
      return;
    }

    const pricing = PRICING[region];
    const amountInSmallestUnit = region === 'india' 
      ? pricing.amount * 100 // Paise
      : pricing.amount * 100; // Cents

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID,
      amount: amountInSmallestUnit,
      currency: pricing.currency,
      name: 'ReliefAnchor',
      description: 'Premium Membership - 1 Year',
      handler: (response) => {
        if (response.razorpay_payment_id) {
          onSuccess();
        } else {
          onError('Payment verification failed');
        }
      },
      prefill: {
        name: '',
        email: '',
      },
      theme: {
        color: '#14b8a6',
      },
      modal: {
        ondismiss: () => {
          onCancel();
        },
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      onError('Payment initialization failed. Please try again.');
    }
  },
};
