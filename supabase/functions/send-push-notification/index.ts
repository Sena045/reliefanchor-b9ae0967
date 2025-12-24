import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const VAPID_PUBLIC_KEY = Deno.env.get("VITE_VAPID_PUBLIC_KEY");
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Base64 URL encoding/decoding utilities
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(paddedBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

// Create VAPID JWT token
async function createVapidJwt(
  endpoint: string,
  vapidPrivateKey: string
): Promise<string> {
  const urlObj = new URL(endpoint);
  const audience = `${urlObj.protocol}//${urlObj.host}`;

  const header = { typ: "JWT", alg: "ES256" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: audience,
    exp: now + 12 * 60 * 60,
    sub: "mailto:support@reliefanchor.com",
  };

  const headerB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // For VAPID, we need to use the raw private key directly
  // Create a proper JWK for the private key
  const publicKeyBytes = base64UrlDecode(VAPID_PUBLIC_KEY!);
  
  const cryptoKey = await crypto.subtle.importKey(
    "jwk",
    {
      kty: "EC",
      crv: "P-256",
      d: vapidPrivateKey,
      x: base64UrlEncode(publicKeyBytes.slice(1, 33)),
      y: base64UrlEncode(publicKeyBytes.slice(33, 65)),
    },
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const signatureB64 = base64UrlEncode(new Uint8Array(signature));

  return `${unsignedToken}.${signatureB64}`;
}

// Encrypt the payload using ECDH and AES-GCM (Web Push encryption)
async function encryptPayload(
  payload: string,
  p256dhKey: string,
  authSecret: string
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  const encoder = new TextEncoder();
  
  // Generate local ECDH key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"]
  );

  // Export local public key as raw
  const localPublicKeyBuffer = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyBuffer);

  // Import subscriber's public key
  const subscriberPublicKeyBytes = base64UrlDecode(p256dhKey);
  const subscriberPublicKey = await crypto.subtle.importKey(
    "raw",
    subscriberPublicKeyBytes.buffer as ArrayBuffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    []
  );

  // Derive shared secret using ECDH
  const sharedSecretBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: subscriberPublicKey },
    localKeyPair.privateKey,
    256
  );
  const sharedSecret = new Uint8Array(sharedSecretBits);

  // Decode auth secret
  const authSecretBytes = base64UrlDecode(authSecret);

  // Generate random salt (16 bytes)
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // Build info for HKDF
  const prkInfo = new Uint8Array([
    ...encoder.encode("WebPush: info\0"),
    ...subscriberPublicKeyBytes,
    ...localPublicKey,
  ]);

  // Import shared secret for HKDF
  const sharedSecretKey = await crypto.subtle.importKey(
    "raw",
    sharedSecret.buffer as ArrayBuffer,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  // First HKDF: derive IKM from shared secret and auth
  const ikmBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: authSecretBytes.buffer as ArrayBuffer,
      info: prkInfo.buffer as ArrayBuffer,
    },
    sharedSecretKey,
    256
  );
  const ikm = new Uint8Array(ikmBits);

  // Import IKM for deriving CEK and nonce
  const ikmKey = await crypto.subtle.importKey(
    "raw",
    ikm.buffer as ArrayBuffer,
    { name: "HKDF" },
    false,
    ["deriveBits"]
  );

  // Derive CEK (Content Encryption Key) - 16 bytes
  const cekInfo = encoder.encode("Content-Encoding: aes128gcm\0");
  const cekBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt.buffer as ArrayBuffer,
      info: cekInfo.buffer as ArrayBuffer,
    },
    ikmKey,
    128
  );
  const cek = new Uint8Array(cekBits);

  // Derive nonce - 12 bytes
  const nonceInfo = encoder.encode("Content-Encoding: nonce\0");
  const nonceBits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: salt.buffer as ArrayBuffer,
      info: nonceInfo.buffer as ArrayBuffer,
    },
    ikmKey,
    96
  );
  const nonce = new Uint8Array(nonceBits);

  // Import CEK for AES-GCM encryption
  const aesKey = await crypto.subtle.importKey(
    "raw",
    cek.buffer as ArrayBuffer,
    { name: "AES-GCM" },
    false,
    ["encrypt"]
  );

  // Add padding delimiter (0x02) to payload
  const payloadBytes = encoder.encode(payload);
  const paddedPayload = new Uint8Array(payloadBytes.length + 1);
  paddedPayload.set(payloadBytes);
  paddedPayload[payloadBytes.length] = 0x02;

  // Encrypt with AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce },
    aesKey,
    paddedPayload.buffer as ArrayBuffer
  );

  return {
    ciphertext: new Uint8Array(ciphertext),
    salt,
    localPublicKey,
  };
}

// Build the encrypted body in aes128gcm format
function buildEncryptedBody(
  ciphertext: Uint8Array,
  salt: Uint8Array,
  localPublicKey: Uint8Array
): Uint8Array {
  // aes128gcm header: salt (16) + rs (4) + idlen (1) + keyid (65 for P-256)
  const rs = 4096; // Record size
  const rsBytes = new Uint8Array(4);
  new DataView(rsBytes.buffer).setUint32(0, rs, false);

  const headerLength = 16 + 4 + 1 + localPublicKey.length;
  const totalLength = headerLength + ciphertext.length;
  const body = new Uint8Array(totalLength);

  let offset = 0;
  body.set(salt, offset);
  offset += 16;
  body.set(rsBytes, offset);
  offset += 4;
  body[offset] = localPublicKey.length;
  offset += 1;
  body.set(localPublicKey, offset);
  offset += localPublicKey.length;
  body.set(ciphertext, offset);

  return body;
}

async function sendPushNotification(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  payload: { title: string; body: string; icon?: string; data?: Record<string, unknown> }
): Promise<boolean> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.error("VAPID keys not configured");
    return false;
  }

  try {
    const payloadString = JSON.stringify(payload);
    console.log(`Encrypting payload for endpoint: ${subscription.endpoint.substring(0, 50)}...`);

    // Encrypt the payload
    const { ciphertext, salt, localPublicKey } = await encryptPayload(
      payloadString,
      subscription.keys.p256dh,
      subscription.keys.auth
    );

    // Build the encrypted body
    const encryptedBody = buildEncryptedBody(ciphertext, salt, localPublicKey);

    // Create VAPID JWT
    const jwt = await createVapidJwt(subscription.endpoint, VAPID_PRIVATE_KEY);

    // Build VAPID Authorization header
    const authorization = `vapid t=${jwt}, k=${VAPID_PUBLIC_KEY}`;

    console.log(`Sending encrypted push to: ${subscription.endpoint.substring(0, 50)}...`);

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Encoding": "aes128gcm",
        "Authorization": authorization,
        "TTL": "86400",
        "Urgency": "normal",
      },
      body: encryptedBody.buffer as ArrayBuffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Push failed: ${response.status} ${response.statusText} - ${errorText}`);
      
      // If subscription is expired (410 Gone), we should remove it
      if (response.status === 410) {
        console.log("Subscription expired, should be removed");
      }
      return false;
    }

    console.log(`Push notification sent successfully: ${response.status}`);
    return true;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, title, body, icon, data } = await req.json();

    console.log(`Processing push notification request for user: ${user_id}`);
    console.log(`VAPID public key configured: ${!!VAPID_PUBLIC_KEY}`);
    console.log(`VAPID private key configured: ${!!VAPID_PRIVATE_KEY}`);

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "VAPID keys not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user's push subscription from database
    const { data: subscriptions, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("user_id", user_id);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log("No push subscriptions found for user");
      return new Response(
        JSON.stringify({ success: false, message: "No subscriptions found" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${subscriptions.length} subscription(s) for user`);

    const notificationPayload = {
      title: title || "ReliefAnchor",
      body: body || "You have a new notification",
      icon: icon || "/icon-192.png",
      data: data || {},
    };

    let successCount = 0;
    const errors: string[] = [];

    for (const sub of subscriptions) {
      const subscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        const success = await sendPushNotification(subscription, notificationPayload);
        if (success) {
          successCount++;
        } else {
          errors.push(`Failed for endpoint: ${sub.endpoint.substring(0, 30)}...`);
        }
      } catch (err) {
        console.error(`Error for subscription ${sub.id}:`, err);
        errors.push(`Error for ${sub.id}: ${err}`);
      }
    }

    console.log(`Sent ${successCount}/${subscriptions.length} push notifications`);

    return new Response(
      JSON.stringify({
        success: successCount > 0,
        sent: successCount,
        total: subscriptions.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-push-notification:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
