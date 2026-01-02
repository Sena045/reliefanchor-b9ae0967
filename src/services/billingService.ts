import { Capacitor } from '@capacitor/core';
import { razorpayService, PRICING, PlanType } from './razorpayService';

// Product IDs must match Google Play Console
export const PRODUCT_IDS = {
  monthly: 'premium_monthly',
  yearly: 'premium_yearly',
} as const;

// Check if running in native Android app
export const isNativeAndroid = (): boolean => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

// Google Play Billing types
interface Product {
  id: string;
  title: string;
  description: string;
  price: string;
  priceMicros: number;
  currency: string;
}

// In-memory store for products
let cachedProducts: Map<string, Product> = new Map();
let isInitialized = false;

// Initialize the billing service
export async function initializeBilling(): Promise<void> {
  if (!isNativeAndroid()) {
    console.log('[Billing] Not on Android, skipping initialization');
    return;
  }

  if (isInitialized) {
    console.log('[Billing] Already initialized');
    return;
  }

  try {
    // Dynamic import for cordova-plugin-purchase
    const CdvPurchase = (window as any).CdvPurchase;
    
    if (!CdvPurchase) {
      console.error('[Billing] CdvPurchase not available');
      return;
    }

    const { store, Platform, ProductType } = CdvPurchase;

    // Register products
    store.register([
      {
        id: PRODUCT_IDS.monthly,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY,
      },
      {
        id: PRODUCT_IDS.yearly,
        type: ProductType.PAID_SUBSCRIPTION,
        platform: Platform.GOOGLE_PLAY,
      },
    ]);

    // When products are loaded
    store.when().productUpdated((product: any) => {
      console.log('[Billing] Product updated:', product.id, product.pricing);
      if (product.pricing) {
        cachedProducts.set(product.id, {
          id: product.id,
          title: product.title,
          description: product.description,
          price: product.pricing.price,
          priceMicros: product.pricing.priceMicros,
          currency: product.pricing.currency,
        });
      }
    });

    // Initialize the store
    await store.initialize([Platform.GOOGLE_PLAY]);
    await store.update();
    
    isInitialized = true;
    console.log('[Billing] Initialized successfully');
  } catch (error) {
    console.error('[Billing] Initialization failed:', error);
  }
}

// Get product info
export function getProduct(plan: PlanType): Product | null {
  const productId = PRODUCT_IDS[plan];
  return cachedProducts.get(productId) || null;
}

// Get price display for a plan
export function getGooglePlayPrice(plan: PlanType): string | null {
  const product = getProduct(plan);
  return product?.price || null;
}

// Purchase a subscription via Google Play
export async function purchaseGooglePlay(
  plan: PlanType,
  userId: string,
  onSuccess: () => void,
  onError: (error: string) => void
): Promise<void> {
  const CdvPurchase = (window as any).CdvPurchase;
  
  if (!CdvPurchase) {
    onError('Google Play Billing not available');
    return;
  }

  const { store } = CdvPurchase;
  const productId = PRODUCT_IDS[plan];
  
  try {
    const product = store.get(productId);
    
    if (!product) {
      onError('Product not found. Please try again.');
      return;
    }

    const offer = product.getOffer();
    
    if (!offer) {
      onError('No offer available for this product.');
      return;
    }

    // Set up receipt verification handler
    store.when().approved(async (transaction: any) => {
      console.log('[Billing] Transaction approved:', transaction.transactionId);
      
      // Verify the purchase on our backend
      try {
        const verified = await verifyPurchase(
          transaction.products[0]?.id || productId,
          transaction.transactionId,
          transaction.receipt,
          userId,
          plan
        );

        if (verified) {
          // Acknowledge the purchase
          await transaction.finish();
          onSuccess();
        } else {
          onError('Purchase verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('[Billing] Verification error:', error);
        onError('Failed to verify purchase. Please contact support.');
      }
    });

    store.when().finished((transaction: any) => {
      console.log('[Billing] Transaction finished:', transaction.transactionId);
    });

    // Initiate purchase
    await offer.order();
  } catch (error: any) {
    console.error('[Billing] Purchase error:', error);
    onError(error.message || 'Purchase failed');
  }
}

// Verify purchase with backend
async function verifyPurchase(
  productId: string,
  transactionId: string,
  purchaseToken: string,
  userId: string,
  plan: PlanType
): Promise<boolean> {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-google-purchase`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          productId,
          transactionId,
          purchaseToken,
          userId,
          plan,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Billing] Verification failed:', errorData);
      return false;
    }

    const result = await response.json();
    return result.success === true;
  } catch (error) {
    console.error('[Billing] Verification request failed:', error);
    return false;
  }
}

// Unified payment function that uses Google Play on Android, Razorpay on web
export async function initiatePayment(
  plan: PlanType,
  currency: 'USD' | 'INR',
  userId: string,
  userEmail: string,
  onSuccess: () => void,
  onCancel: () => void,
  onError: (error: string) => void
): Promise<void> {
  if (isNativeAndroid()) {
    // Use Google Play Billing on Android
    console.log('[Billing] Using Google Play Billing');
    await purchaseGooglePlay(plan, userId, onSuccess, onError);
  } else {
    // Use Razorpay on web
    console.log('[Billing] Using Razorpay');
    await razorpayService.initiatePayment(
      plan,
      currency,
      userId,
      userEmail,
      onSuccess,
      onCancel,
      onError
    );
  }
}

// Re-export pricing for convenience
export { PRICING, type PlanType } from './razorpayService';
