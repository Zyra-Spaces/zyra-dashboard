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

    // Remove ALL metadata - keep cookies minimal (only auth tokens)
    // All profile data should be in localStorage only
    const metadata = user.user_metadata || {};
    const cleaned: Record<string, any> = {};

    // Only update if there are changes (if metadata has any data)
    const hasChanges = Object.keys(metadata).length > 0;
    
    if (hasChanges) {
      const { error } = await supabase.auth.updateUser({
        data: cleaned, // Empty metadata
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

