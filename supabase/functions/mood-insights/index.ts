import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LANGUAGE_PROMPTS: Record<string, string> = {
  en: 'Respond in English.',
  hi: 'Respond in Hindi.',
  es: 'Respond in Spanish.',
  fr: 'Respond in French.',
  de: 'Respond in German.',
  pt: 'Respond in Portuguese.',
  zh: 'Respond in Chinese.',
  ja: 'Respond in Japanese.',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { moods, language = 'en' } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    if (!moods || moods.length < 3) {
      return new Response(
        JSON.stringify({ error: 'Need at least 3 mood entries for insights' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const moodSummary = moods.map((m: any) => 
      `- ${m.date}: ${m.mood}${m.note ? ` (note: ${m.note})` : ''}`
    ).join('\n');

    const systemPrompt = `You are a compassionate mental wellness assistant analyzing mood patterns. 
Provide a brief, supportive analysis of the user's emotional week.

Guidelines:
- Be warm and encouraging, not clinical
- Identify patterns if any exist
- Offer 1-2 gentle, actionable suggestions
- Keep response under 150 words
- ${LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.en}

Remember: You are NOT a therapist. If you notice concerning patterns, gently encourage professional support.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here are my mood entries from this week:\n\n${moodSummary}\n\nPlease provide a brief analysis of my emotional patterns and any suggestions.` }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Service unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI service error: ${response.status}`);
    }

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content || 'Unable to generate insights at this time.';

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Mood insights error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});