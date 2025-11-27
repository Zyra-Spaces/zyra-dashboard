import { NextResponse } from "next/server";

/**
 * Emergency route to clear all cookies
 * Use this if you're stuck with ERR_HTTP_RESPONSE_CODE_FAILURE 431
 */
export async function POST() {
  const response = NextResponse.json({ 
    success: true, 
    message: "Cookies cleared. Please refresh the page." 
  });

  // Clear all Supabase auth cookies
  const cookieNames = [
    "sb-access-token",
    "sb-refresh-token",
    "sb-provider-token",
    "sb-provider-refresh-token",
  ];

  cookieNames.forEach(name => {
    response.cookies.delete(name);
    // Also try with different paths
    response.cookies.set(name, "", { 
      expires: new Date(0),
      path: "/",
      domain: undefined,
    });
  });

  return response;
}

