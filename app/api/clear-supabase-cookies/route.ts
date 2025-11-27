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
    
    // Find all Supabase cookies (sb-*)
    const supabaseCookies = allCookies.filter(cookie => 
      cookie.name.startsWith('sb-') || 
      cookie.name.includes('supabase')
    );

    // Delete all Supabase cookies
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
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to clear cookies" },
      { status: 500 }
    );
  }
}




