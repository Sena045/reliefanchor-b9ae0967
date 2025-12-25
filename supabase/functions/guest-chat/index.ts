import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-session-id',
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const getSystemPrompt = () => {
  return `You are Anya, a compassionate and supportive mental health companion. 

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

This is a trial conversation. Be especially warm and helpful to show value.`;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate messages input - limit to 3 user messages for guests
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userMessages = messages.filter((m: { role: string }) => m.role === 'user');
    if (userMessages.length > 3) {
      return new Response(JSON.stringify({ 
        error: 'GUEST_LIMIT_REACHED',
        message: 'Sign up to continue chatting with Anya!'
      }), {
        status: 429,
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
      if (typeof msg.content !== 'string' || msg.content.length > 2000) {
        return new Response(JSON.stringify({ error: 'Message too long (max 2000 characters)' }), {
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

    console.log(`Guest chat request with ${userMessages.length} user messages`);

    // Track guest trial usage
    const sessionId = req.headers.get('x-session-id') || crypto.randomUUID();
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null;
    const userAgent = req.headers.get('user-agent') || null;

    try {
      // Check if session exists
      const { data: existing } = await supabase
        .from('guest_trials')
        .select('id, messages_sent')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (existing) {
        // Update existing session
        await supabase
          .from('guest_trials')
          .update({ 
            messages_sent: existing.messages_sent + 1,
            last_message_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        // Create new session
        await supabase
          .from('guest_trials')
          .insert({
            session_id: sessionId,
            messages_sent: 1,
            ip_address: ipAddress,
            user_agent: userAgent
          });
      }
    } catch (trackError) {
      console.error("Error tracking guest trial:", trackError);
      // Don't fail the request if tracking fails
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: getSystemPrompt() },
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
        return new Response(JSON.stringify({ error: "Service temporarily unavailable." }), {
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
    console.error("Guest chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
