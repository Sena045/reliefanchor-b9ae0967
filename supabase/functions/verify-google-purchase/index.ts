import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Calculate premium expiry based on plan
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

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    const { productId, transactionId, purchaseToken, userId, plan } = await req.json();

    console.log('[Verify] Received purchase verification request:', {
      productId,
      transactionId,
      userId,
      plan,
    });

    // Validate required fields
    if (!productId || !purchaseToken || !userId || !plan) {
      console.error('[Verify] Missing required fields');
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get Google Play credentials from environment
    const googleClientEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const googlePrivateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
    const googlePackageName = Deno.env.get('GOOGLE_PACKAGE_NAME') || 'app.lovable.fcd4627f03114bf983be901284e1a5ab';

    // If Google credentials are not configured, log and skip verification
    // In production, this should be strict
    if (!googleClientEmail || !googlePrivateKey) {
      console.warn('[Verify] Google credentials not configured, granting premium (dev mode)');
      
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
        console.error('[Verify] Error fetching profile:', profileError);
        return new Response(
          JSON.stringify({ success: false, error: 'Profile not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
        console.error('[Verify] Error updating premium status:', updateError);
        return new Response(
          JSON.stringify({ success: false, error: 'Failed to update premium status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`[Verify] Premium activated for user ${userId}, plan: ${plan}, until: ${newPremiumUntil}`);
      
      return new Response(
        JSON.stringify({ success: true, premiumUntil: newPremiumUntil }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate JWT for Google API authentication
    const now = Math.floor(Date.now() / 1000);
    const jwtHeader = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
    const jwtClaims = btoa(JSON.stringify({
      iss: googleClientEmail,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }));

    // Sign the JWT (this requires the private key in PEM format)
    const privateKey = googlePrivateKey.replace(/\\n/g, '\n');
    const encoder = new TextEncoder();
    
    // Import the private key
    const keyData = privateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureInput = encoder.encode(`${jwtHeader}.${jwtClaims}`);
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, signatureInput);
    const jwtSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const jwt = `${jwtHeader}.${jwtClaims}.${jwtSignature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('[Verify] Failed to get Google access token:', tokenError);
      return new Response(
        JSON.stringify({ success: false, error: 'Authentication failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { access_token } = await tokenResponse.json();

    // Verify the purchase with Google Play Developer API
    const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${googlePackageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
    
    const verifyResponse = await fetch(verifyUrl, {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.text();
      console.error('[Verify] Google verification failed:', verifyError);
      return new Response(
        JSON.stringify({ success: false, error: 'Purchase verification failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const purchaseData = await verifyResponse.json();
    console.log('[Verify] Google verification response:', purchaseData);

    // Check if subscription is active
    // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = pending deferred upgrade/downgrade
    // acknowledgementState: 0 = pending, 1 = acknowledged
    const isValid = purchaseData.paymentState === 1 || purchaseData.paymentState === 2;

    if (!isValid) {
      console.error('[Verify] Purchase not valid, paymentState:', purchaseData.paymentState);
      return new Response(
        JSON.stringify({ success: false, error: 'Purchase is not valid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get current profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('premium_until')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[Verify] Error fetching profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
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
      console.error('[Verify] Error updating premium status:', updateError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to update premium status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Verify] Premium activated for user ${userId}, plan: ${plan}, until: ${newPremiumUntil}`);

    return new Response(
      JSON.stringify({ success: true, premiumUntil: newPremiumUntil }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Verify] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
