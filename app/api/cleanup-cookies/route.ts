import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * API route to clean up user metadata and reduce cookie size
 * Call this after login to remove large data from cookies
 */
export async function POST() {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const metadata = user.user_metadata || {};
    const cleaned: Record<string, any> = {};

    // Only keep essential, small fields (max 100 chars each)
    const allowedFields = [
      "first_name",
      "last_name",
      "username",
      "date_of_birth",
      "gender",
      "occupation",
      "referral_source",
    ];

    // Copy allowed small fields only
    for (const field of allowedFields) {
      if (metadata[field] !== undefined) {
        const value = metadata[field];
        if (typeof value === "string" && value.length <= 100) {
          cleaned[field] = value;
        } else if (value === null || value === "") {
          cleaned[field] = null;
        }
      }
    }

    // Bio - only if very short
    if (metadata.bio && typeof metadata.bio === "string" && metadata.bio.length <= 50) {
      cleaned.bio = metadata.bio;
    }

    // Remove all large data from metadata:
    // - Images (profile_pic, banner_pic)
    // - Arrays (team_emails)
    // - Objects (socials)
    // These should be in localStorage only

    // Update full_name
    if (cleaned.first_name || cleaned.last_name) {
      if (cleaned.first_name && cleaned.last_name) {
        cleaned.full_name = `${cleaned.first_name} ${cleaned.last_name}`;
      } else {
        cleaned.full_name = cleaned.first_name || cleaned.last_name;
      }
    }

    // Only update if there are changes
    const hasChanges = JSON.stringify(cleaned) !== JSON.stringify(metadata);
    
    if (hasChanges) {
      const { error } = await supabase.auth.updateUser({
        data: cleaned,
      });
      
      if (error) {
        console.error("Error cleaning metadata:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      
      return NextResponse.json({ 
        success: true, 
        cleaned: true,
        message: "Metadata cleaned successfully" 
      });
    }

    return NextResponse.json({ 
      success: true, 
      cleaned: false,
      message: "No cleanup needed" 
    });
  } catch (error: any) {
    console.error("Error in cleanup:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cleanup" },
      { status: 500 }
    );
  }
}

