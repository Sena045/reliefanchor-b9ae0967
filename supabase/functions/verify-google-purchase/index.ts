import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function calculatePremiumExpiry(plan: string, currentPremiumUntil: string | null): string {
  const now = new Date();
  let baseDate = now;
  
  // If user already has premium, extend from their current expiry
  if (currentPremiumUntil) {
    const currentExpiry = new Date(currentPremiumUntil);
    if (currentExpiry > now) {
      baseDate = currentExpiry;
    }
  }
  
  // Add subscription duration
  if (plan === 'yearly') {
    baseDate.setFullYear(baseDate.getFullYear() + 1);
  } else {
    baseDate.setMonth(baseDate.getMonth() + 1);
  }
  
  return baseDate.toISOString();
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const { productId, transactionId, purchaseToken, userId, plan } = await req.json();

    console.log('[verify-google-purchase] Received:', { productId, transactionId, userId, plan });

    if (!productId || !purchaseToken || !userId || !plan) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get Google credentials from environment
    const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL');
    const serviceAccountPrivateKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY');
    const packageName = Deno.env.get('GOOGLE_PACKAGE_NAME');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If Google credentials not configured, skip verification (dev mode)
    if (!serviceAccountEmail || !serviceAccountPrivateKey || !packageName) {
      console.log('[verify-google-purchase] Google credentials not configured, granting premium (dev mode)');
      
      // Get current profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('premium_until')
        .eq('id', userId)
        .single();

      const newPremiumUntil = calculatePremiumExpiry(plan, profile?.premium_until);

      // Update user's premium status
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          premium_until: newPremiumUntil,
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[verify-google-purchase] Failed to update profile:', updateError);
        return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ success: true, devMode: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate JWT for Google API
    const header = { alg: 'RS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    };

    // Base64url encode
    const base64urlEncode = (obj: object) => {
      const json = JSON.stringify(obj);
      const base64 = btoa(json);
      return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    };

    const headerEncoded = base64urlEncode(header);
    const claimEncoded = base64urlEncode(claim);
    const signatureInput = `${headerEncoded}.${claimEncoded}`;

    // Import the private key and sign
    const privateKeyPem = serviceAccountPrivateKey.replace(/\\n/g, '\n');
    const pemContent = privateKeyPem
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const binaryKey = Uint8Array.from(atob(pemContent), c => c.charCodeAt(0));
    
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      binaryKey,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signatureInput)
    );

    const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const jwt = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('[verify-google-purchase] Token exchange failed:', tokenError);
      return new Response(JSON.stringify({ error: 'Failed to authenticate with Google' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verify the subscription with Google Play API
    const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/subscriptions/${productId}/tokens/${purchaseToken}`;
    
    const verifyResponse = await fetch(verifyUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!verifyResponse.ok) {
      const verifyError = await verifyResponse.text();
      console.error('[verify-google-purchase] Verification failed:', verifyError);
      return new Response(JSON.stringify({ error: 'Purchase verification failed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const purchaseData = await verifyResponse.json();
    console.log('[verify-google-purchase] Purchase data:', purchaseData);

    // Check if purchase is valid
    // paymentState: 0 = pending, 1 = received, 2 = free trial, 3 = pending deferred
    if (purchaseData.paymentState !== 1 && purchaseData.paymentState !== 2) {
      return new Response(JSON.stringify({ error: 'Payment not completed' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('premium_until')
      .eq('id', userId)
      .single();

    const newPremiumUntil = calculatePremiumExpiry(plan, profile?.premium_until);

    // Update user's premium status
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        is_premium: true,
        premium_until: newPremiumUntil,
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[verify-google-purchase] Failed to update profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update subscription' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[verify-google-purchase] Success! User premium until:', newPremiumUntil);

    return new Response(JSON.stringify({ 
      success: true, 
      premiumUntil: newPremiumUntil,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[verify-google-purchase] Error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
