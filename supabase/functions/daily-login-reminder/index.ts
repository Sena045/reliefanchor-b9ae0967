import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const testEmail = body.test_email;

    console.log("Starting daily login reminder job...", testEmail ? `(TEST MODE: ${testEmail})` : "");

    // Helper function to send the email
    const sendReminderEmail = async (email: string) => {
      console.log(`Sending reminder to: ${email}`);
      
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "SukoonSphere <onboarding@resend.dev>",
          to: [email],
          subject: "We miss you! 💙 Take a moment for yourself today",
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc;">
              <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); border-radius: 16px; padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; font-size: 28px; margin: 0 0 16px 0;">
                    🌟 Your Peaceful Moment Awaits
                  </h1>
                  <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
                    We noticed you have not visited SukoonSphere in a while. Taking a few minutes for yourself each day can make a big difference. We are here to support you every step of the way.
                  </p>
                  <a href="https://sukoonsphere.com" style="display: inline-block; background: linear-gradient(135deg, #38bdf8 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                    Continue Your Journey
                  </a>
                  <p style="color: #64748b; font-size: 14px; margin-top: 32px;">
                    💬 Chat with our caring AI companion<br>
                    📝 Track how you are feeling<br>
                    🧘 Practice calming breathing exercises
                  </p>
                </div>
                <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 24px;">
                  You are receiving this because you signed up for SukoonSphere.<br>
                  <a href="https://sukoonsphere.com/settings" style="color: #64748b;">Manage preferences</a>
                </p>
              </div>
            </body>
            </html>
          `,
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

    // TEST MODE: Send to specific email only
    if (testEmail) {
      const result = await sendReminderEmail(testEmail);
      return new Response(
        JSON.stringify({ 
          success: result.success, 
          message: result.success ? `Test email sent to ${testEmail}` : `Failed to send test email`,
          details: result
        }),
        {
          status: result.success ? 200 : 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // PRODUCTION MODE: Send to all inactive users
    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get inactive users (haven't been active in the last 3 days)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get users from auth.users table and join with profiles
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error("Error fetching users:", authError);
      throw authError;
    }

    // Get profiles with last_active_at
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, last_active_at, email")
      .or(`last_active_at.is.null,last_active_at.lt.${threeDaysAgo.toISOString()}`);

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    console.log(`Found ${profiles?.length || 0} inactive users`);

    // Create a map of profile IDs to auth user emails
    const profileToEmail = new Map<string, string>();
    for (const user of authUsers.users) {
      if (user.email) {
        profileToEmail.set(user.id, user.email);
      }
    }

    // Send emails to inactive users
    const emailPromises = [];
    let sentCount = 0;

    for (const profile of profiles || []) {
      const email = profile.email || profileToEmail.get(profile.id);
      
      if (!email) {
        console.log(`No email found for user ${profile.id}, skipping`);
        continue;
      }

      const emailPromise = sendReminderEmail(email).then((result) => {
        if (result.success) sentCount++;
        return result;
      });

      emailPromises.push(emailPromise);
    }

    await Promise.all(emailPromises);

    console.log(`Daily reminder job completed. Sent ${sentCount} emails.`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} reminder emails to inactive users` 
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in daily-login-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
