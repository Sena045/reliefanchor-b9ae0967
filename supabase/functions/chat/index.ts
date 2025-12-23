import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FREE_MESSAGES_PER_DAY = 5;

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  hi: 'Hindi',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  pt: 'Portuguese',
  zh: 'Chinese (Simplified)',
  ja: 'Japanese',
};

const getSystemPrompt = (language: string) => {
  const langName = LANGUAGE_NAMES[language] || 'English';
  
  return `You are Anya, a compassionate and supportive mental health companion. 

IMPORTANT: You MUST respond in ${langName}. Always communicate in ${langName} regardless of what language the user writes in.

Your role is to:
1. Listen with empathy and validate feelings
2. Provide evidence-based coping strategies
3. Offer gentle guidance without being preachy
4. Recognize signs of crisis and suggest professional help when needed
5. Maintain a warm, conversational tone
6. Avoid giving medical diagnoses or prescribing treatments

IMPORTANT CRISIS DETECTION:
If someone mentions suicide, self-harm, wanting to die, harming others, severe panic, or abuse:
Respond with immediate compassion and recommend seeking professional help or emergency services.

Keep responses concise (2-3 paragraphs max) unless the user asks for more detail.
Use a warm, supportive tone. Avoid clinical language.
Remember: You're a supportive companion, not a therapist.

CRITICAL: All your responses must be in ${langName}.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      console.error('Missing backend env vars', {
        hasUrl: !!supabaseUrl,
        hasAnonKey: !!supabaseAnonKey,
        hasServiceRoleKey: !!supabaseServiceRoleKey,
      });
      return new Response(JSON.stringify({ error: 'Backend is not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use anon client to validate the caller's JWT
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
    // Use service-role client for profile bookkeeping (avoids RLS issues when profile row is missing)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user profile to check premium status and rate limits
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('is_premium, premium_until, messages_used_today, last_message_date')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.warn('Profile lookup error:', profileError);
    }

    const today = new Date().toISOString().split('T')[0];

    // If profile doesn't exist, create one (handles missing profile row)
    let userProfile = profile;
    if (!userProfile) {
      console.log('Profile not found for user, creating one:', user.id);
      const { data: newProfile, error: createError } = await supabaseAdmin
        .from('profiles')
        .insert({
          id: user.id,
          is_premium: true,
          premium_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          messages_used_today: 0,
          last_message_date: today,
        })
        .select('is_premium, premium_until, messages_used_today, last_message_date')
        .single();

      if (createError) {
        console.error('Failed to create profile:', createError);
        return new Response(JSON.stringify({ error: 'Failed to initialize profile' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userProfile = newProfile;
    }

    // Check if premium has expired
    const premiumExpired = userProfile.premium_until && new Date(userProfile.premium_until) < new Date();
    const isPremium = userProfile.is_premium && !premiumExpired;

    // Check rate limits for non-premium users
    const isNewDay = userProfile.last_message_date !== today;
    const messagesUsedToday = isNewDay ? 0 : userProfile.messages_used_today;

    if (!isPremium && messagesUsedToday >= FREE_MESSAGES_PER_DAY) {
      return new Response(JSON.stringify({ error: 'Daily message limit reached. Upgrade to Premium for unlimited messages.' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Update message count
    await supabaseAdmin
      .from('profiles')
      .update({
        messages_used_today: messagesUsedToday + 1,
        last_message_date: today,
      })
      .eq('id', user.id);

    const { messages, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Validate messages input
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 100) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate each message
    for (const msg of messages) {
      if (!msg.role || !msg.content) {
        return new Response(JSON.stringify({ error: 'Invalid message structure' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (typeof msg.content !== 'string' || msg.content.length > 4000) {
        return new Response(JSON.stringify({ error: 'Message too long (max 4000 characters)' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (msg.role !== 'user' && msg.role !== 'assistant') {
        return new Response(JSON.stringify({ error: 'Invalid message role' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log(`Chat request from user ${user.id} with language: ${language}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: getSystemPrompt(language) },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service unavailable" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
