import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

// HMAC-SHA256 verification for Razorpay webhooks
async function verifyRazorpaySignature(body: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return signature === expectedSignature;
}

function calculatePremiumExpiry(plan: string, currentPremiumUntil: string | null): string {
  const now = new Date();
  let baseDate = now;
  
  // If user already has premium, extend from their current expiry
  if (currentPremiumUntil && new Date(currentPremiumUntil) > now) {
    baseDate = new Date(currentPremiumUntil);
  }
  
  if (plan === 'monthly') {
    baseDate.setMonth(baseDate.getMonth() + 1);
  } else {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  }
  
  return baseDate.toISOString();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { 
        status: 500, 
        headers: corsHeaders 
      });
    }

    const signature = req.headers.get('x-razorpay-signature');
    const body = await req.text();

    if (!signature) {
      console.error('Missing Razorpay signature');
      return new Response('Missing signature', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    // Verify webhook signature
    const isValid = await verifyRazorpaySignature(body, signature, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid Razorpay signature');
      return new Response('Invalid signature', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const event = JSON.parse(body);
    console.log('Razorpay webhook event:', event.event);

    // Handle payment.captured event
    if (event.event === 'payment.captured') {
      const payment = event.payload?.payment?.entity;
      
      if (!payment) {
        console.error('No payment entity in webhook');
        return new Response('Invalid payload', { 
          status: 400, 
          headers: corsHeaders 
        });
      }

      const userId = payment.notes?.user_id;
      const plan = payment.notes?.plan || 'yearly';

      if (!userId) {
        console.error('No user_id in payment notes');
        return new Response('Missing user_id', { 
          status: 400, 
          headers: corsHeaders 
        });
      }

      // Create Supabase client with service role for admin access
      const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      );

      // Get current profile to check existing premium status
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('premium_until')
        .eq('id', userId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return new Response('Profile not found', { 
          status: 404, 
          headers: corsHeaders 
        });
      }

      const newPremiumUntil = calculatePremiumExpiry(plan, profile?.premium_until);

      // Update user's premium status
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update({
          is_premium: true,
          premium_until: newPremiumUntil,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating premium status:', updateError);
        return new Response('Failed to update premium status', { 
          status: 500, 
          headers: corsHeaders 
        });
      }

      console.log(`Premium activated for user ${userId}, plan: ${plan}, until: ${newPremiumUntil}`);
    }

    // Acknowledge webhook
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
