import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { emails } = await request.json();

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "No emails provided" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const inviterName =
      user.user_metadata?.full_name ||
      user.user_metadata?.first_name ||
      user.email?.split("@")[0] ||
      "Someone";

    const results: { email: string; success: boolean; error?: string }[] = [];

    // For each email, send an invitation
    // Note: Supabase doesn't have a built-in team invite from client side
    // We'll use signInWithOtp to send a "join" email to each team member
    for (const email of emails) {
      try {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.push({ email, success: false, error: "Invalid email format" });
          continue;
        }

        // Send an OTP/magic link to the email
        // This will create the user if they don't exist
        const { error: inviteError } = await supabase.auth.signInWithOtp({
          email,
          options: {
            shouldCreateUser: true,
            emailRedirectTo: `${request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL}/auth/callback?invited_by=${user.id}`,
            data: {
              invited_by: user.id,
              invited_by_name: inviterName,
              invited_by_email: user.email,
            },
          },
        });

        if (inviteError) {
          results.push({ email, success: false, error: inviteError.message });
        } else {
          results.push({ email, success: true });
        }
      } catch (err: any) {
        results.push({ email, success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failedCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      message: `${successCount} invitation(s) sent${failedCount > 0 ? `, ${failedCount} failed` : ""}`,
      results,
    });
  } catch (error: any) {
    console.error("Error sending invitations:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send invitations" },
      { status: 500 }
    );
  }
}

