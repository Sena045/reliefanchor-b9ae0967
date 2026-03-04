import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserContext {
  email: string;
  daysSinceActive: number;
  hadStreak: boolean;
  moodCount: number;
  chatCount: number;
}

const getEmailContent = (ctx: UserContext) => {
  // Personalized subject lines based on inactivity
  let subject: string;
  let heroText: string;
  let bodyText: string;
  let ctaText: string;

  if (ctx.daysSinceActive <= 3) {
    subject = ctx.hadStreak
      ? "⚡ Your streak is about to break!"
      : "💙 Quick check-in — how are you today?";
    heroText = ctx.hadStreak
      ? "Don't Lose Your Streak!"
      : "A Moment for You";
    bodyText = ctx.hadStreak
      ? "You've been building a great habit. Just a quick visit today keeps your streak alive and your wellness journey on track."
      : "Taking even 30 seconds to check in with yourself can shift your entire day. Anya is here whenever you're ready.";
    ctaText = ctx.hadStreak ? "Save My Streak" : "Check In Now";
  } else if (ctx.daysSinceActive <= 7) {
    subject = "🌿 It's been a few days — we saved your spot";
    heroText = "Welcome Back Anytime";
    bodyText = `It's been ${ctx.daysSinceActive} days since your last visit. ${ctx.moodCount > 0 ? `You've logged ${ctx.moodCount} moods so far — let's keep that going.` : "Your private space is exactly how you left it."} No pressure, no judgment.`;
    ctaText = "Continue My Journey";
  } else {
    subject = "🕊️ Your peaceful space is waiting";
    heroText = "We've Missed You";
    bodyText = `It's been ${ctx.daysSinceActive} days. ${ctx.chatCount > 0 ? "Anya remembers your conversations and is ready to pick up where you left off." : "Anya is here to listen whenever you need someone to talk to."} Everything is private, always.`;
    ctaText = "Come Back";
  }

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); border-radius: 16px; padding: 40px; text-align: center;">
          <h1 style="color: #ffffff; font-size: 26px; margin: 0 0 16px 0;">
            ${heroText}
          </h1>
          <p style="color: #cbd5e1; font-size: 15px; line-height: 1.7; margin: 0 0 28px 0;">
            ${bodyText}
          </p>
          <a href="https://reliefanchor.lovable.app" style="display: inline-block; background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 8px; font-weight: 600; font-size: 16px;">
            ${ctaText}
          </a>
          ${ctx.hadStreak && ctx.daysSinceActive <= 3 ? `
          <div style="margin-top: 24px; padding: 12px 20px; background: rgba(251, 191, 36, 0.15); border-radius: 8px; display: inline-block;">
            <span style="color: #fbbf24; font-size: 14px; font-weight: 500;">🔥 Your streak resets tomorrow!</span>
          </div>
          ` : ''}
        </div>
        <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
          You're receiving this because you signed up for ReliefAnchor.<br>
          <a href="https://reliefanchor.lovable.app/settings" style="color: #64748b;">Unsubscribe</a>
        </p>
      </div>
    </body>
    </html>
  `;

  return { subject, html };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const testEmail = body.test_email;

    console.log("Starting daily login reminder job...", testEmail ? `(TEST MODE: ${testEmail})` : "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const sendReminderEmail = async (email: string, ctx: UserContext) => {
      const { subject, html } = getEmailContent(ctx);
      console.log(`Sending "${subject}" to: ${email}`);

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ReliefAnchor <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        }),
      });

      const result = await res.json();
      if (!res.ok) {
        console.error(`Failed to send to ${email}:`, result);
        return { success: false, error: result };
      }
      console.log(`Successfully sent to ${email}`);
      return { success: true, result };
    };

    // TEST MODE
    if (testEmail) {
      const ctx: UserContext = {
        email: testEmail,
        daysSinceActive: 2,
        hadStreak: true,
        moodCount: 5,
        chatCount: 12,
      };
      const result = await sendReminderEmail(testEmail, ctx);
      return new Response(JSON.stringify({ success: result.success, details: result }), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // PRODUCTION MODE
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, last_active_at, email")
      .or(`last_active_at.is.null,last_active_at.lt.${twoDaysAgo.toISOString()}`);

    if (profilesError) throw profilesError;

    console.log(`Found ${profiles?.length || 0} inactive users`);

    const profileToEmail = new Map<string, string>();
    for (const user of authUsers.users) {
      if (user.email) profileToEmail.set(user.id, user.email);
    }

    let sentCount = 0;
    const emailPromises = [];

    for (const profile of profiles || []) {
      const email = profile.email || profileToEmail.get(profile.id);
      if (!email) continue;

      // Calculate days since active
      const lastActive = profile.last_active_at ? new Date(profile.last_active_at) : null;
      const daysSinceActive = lastActive
        ? Math.floor((Date.now() - lastActive.getTime()) / (24 * 60 * 60 * 1000))
        : 30;

      // Get user's mood and chat counts for personalization
      const [moodResult, chatResult] = await Promise.all([
        supabase.from("mood_entries").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
        supabase.from("chat_history").select("id", { count: "exact", head: true }).eq("user_id", profile.id),
      ]);

      const ctx: UserContext = {
        email,
        daysSinceActive,
        hadStreak: daysSinceActive <= 3 && lastActive !== null,
        moodCount: moodResult.count || 0,
        chatCount: chatResult.count || 0,
      };

      emailPromises.push(
        sendReminderEmail(email, ctx).then(r => { if (r.success) sentCount++; return r; })
      );
    }

    await Promise.all(emailPromises);

    console.log(`Done. Sent ${sentCount} emails.`);
    return new Response(
      JSON.stringify({ success: true, message: `Sent ${sentCount} personalized reminder emails` }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
