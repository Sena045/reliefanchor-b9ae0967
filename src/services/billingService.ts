import { razorpayService, PRICING, PlanType } from './razorpayService';

// Unified payment function - uses Razorpay for web payments
export async function initiatePayment(
  plan: PlanType,
  currency: 'USD' | 'INR',
  userId: string,
  userEmail: string,
  onSuccess: () => void,
  onCancel: () => void,
  onError: (error: string) => void
): Promise<void> {
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

// Re-export pricing for convenience
export { PRICING, type PlanType } from './razorpayService';
