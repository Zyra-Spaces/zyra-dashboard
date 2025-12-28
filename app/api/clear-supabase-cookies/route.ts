import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * Emergency route to clear ALL Supabase cookies
 * Supabase creates multiple large cookies (sb-*) that can cause 431 errors
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    const response = NextResponse.json({ 
      success: true, 
      message: "Supabase cookies cleared. Please refresh the page." 
    });

    // Get all cookies
    const allCookies = cookieStore.getAll();
    
    // Find all Supabase cookies (sb-*), including chunked cookies
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.startsWith('sb-') || 
      cookie.name.includes('supabase')
    );

    // Count chunked cookies for logging
    const chunkedCookies = supabaseCookies.filter(c => /\.\d+$/.test(c.name));
    if (chunkedCookies.length > 0) {
      console.log(`Clearing ${chunkedCookies.length} chunked cookies and ${supabaseCookies.length - chunkedCookies.length} base cookies`);
    }

    // Delete all Supabase cookies (including chunked ones)
    supabaseCookies.forEach(cookie => {
      // Delete with various path/domain combinations to ensure removal
      response.cookies.delete(cookie.name);
      response.cookies.set(cookie.name, "", { 
        expires: new Date(0),
        path: "/",
        maxAge: 0,
      });
      response.cookies.set(cookie.name, "", { 
        expires: new Date(0),
        path: "/",
        domain: undefined,
        maxAge: 0,
      });
      // Also try with empty domain explicitly
      response.cookies.set(cookie.name, "", { 
        expires: new Date(0),
        path: "/",
        domain: "",
        maxAge: 0,
      });
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clear cookies" },
      { status: 500 }
    );
  }
}




