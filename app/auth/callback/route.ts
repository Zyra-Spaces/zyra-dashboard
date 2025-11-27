import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(`${origin}/login?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  try {
    const supabase = await createClient();
    
    // Exchange code for session - this should only happen ONCE
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error("Exchange error:", exchangeError);
      return NextResponse.redirect(`${origin}/login?error=exchange_failed`);
    }

    // Success - redirect immediately to prevent any refresh loops
    // DO NOT call getUser() or updateUser() here - it can cause cookie accumulation
    
    // If this is a password recovery, redirect to new password page
    if (type === "recovery") {
      return NextResponse.redirect(`${origin}/new-password`);
    }
    
    // Redirect to dashboard (user can access onboarding manually if needed)
    return NextResponse.redirect(`${origin}/dashboard`);
  } catch (error: any) {
    console.error("Callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=callback_error`);
  }
}
