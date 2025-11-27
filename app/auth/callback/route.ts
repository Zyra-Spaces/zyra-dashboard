import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/onboarding/details";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Clean up metadata immediately after OAuth to reduce cookie size
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const metadata = user.user_metadata || {};
          const cleaned: Record<string, any> = {};
          
          // Only keep small fields
          const smallFields = ["first_name", "last_name", "username", "date_of_birth", "gender", "occupation", "referral_source"];
          for (const field of smallFields) {
            if (metadata[field] !== undefined) {
              const value = metadata[field];
              if (typeof value === "string" && value.length <= 100) {
                cleaned[field] = value;
              }
            }
          }
          
          // Update full_name
          if (cleaned.first_name || cleaned.last_name) {
            cleaned.full_name = cleaned.first_name && cleaned.last_name
              ? `${cleaned.first_name} ${cleaned.last_name}`
              : cleaned.first_name || cleaned.last_name;
          }
          
          // Remove all large data (images, arrays, objects)
          await supabase.auth.updateUser({ data: cleaned });
        }
      } catch (cleanupError) {
        // Silent fail - cleanup is optional
        console.warn("Could not cleanup metadata:", cleanupError);
      }
      
      // If this is a password recovery, redirect to new password page
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/new-password`);
      }
      // Always redirect to onboarding after OAuth (no checks)
      return NextResponse.redirect(`${origin}/onboarding/details`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
