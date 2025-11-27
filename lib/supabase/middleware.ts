import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // CRITICAL: Only set cookies if they're actually different
          // This prevents Supabase from writing duplicate cookies
          const existingCookies = request.cookies.getAll();
          const cookiesToUpdate: typeof cookiesToSet = [];
          
          cookiesToSet.forEach(({ name, value, options }) => {
            const existing = existingCookies.find(c => c.name === name);
            // Only set if value changed or cookie doesn't exist
            if (!existing || existing.value !== value) {
              cookiesToUpdate.push({ name, value, options });
            }
          });
          
          // Only update if there are actual changes
          if (cookiesToUpdate.length > 0) {
            cookiesToUpdate.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToUpdate.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          }
        },
      },
    }
  );

  // Get user - but don't force refresh if session is valid
  // Only refresh if absolutely necessary to reduce cookie writes
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // Clean up duplicate/old Supabase cookies to prevent accumulation
  const allCookies = request.cookies.getAll();
  const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
  
  // Supabase should only have 2 cookies max:
  // 1. sb-{project}-auth-token
  // 2. sb-{project}-auth-token.0 (if using chunked storage)
  // If more exist, delete old ones
  if (supabaseCookies.length > 2) {
    // Sort by name to keep the most recent ones
    const sortedCookies = [...supabaseCookies].sort((a, b) => 
      b.name.localeCompare(a.name)
    );
    const cookiesToKeep = sortedCookies.slice(0, 2);
    const cookiesToDelete = sortedCookies.slice(2);
    
    cookiesToDelete.forEach(cookie => {
      supabaseResponse.cookies.delete(cookie.name);
      supabaseResponse.cookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
        maxAge: 0,
        domain: undefined,
      });
    });
  }

  // Auth routes that don't require authentication
  const authRoutes = [
    "/login",
    "/register",
    "/forgot-password",
    "/verify-email",
    "/verify-reset",
    "/new-password",
    "/set-password",
  ];

  // Protected routes that require authentication
  const protectedRoutes = ["/dashboard"];

  // Onboarding routes (require authentication but are part of setup flow)
  const onboardingRoutes = ["/onboarding"];

  const isAuthRoute = authRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const isProtectedRoute = protectedRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  const isOnboardingRoute = onboardingRoutes.some((route) =>
    request.nextUrl.pathname.startsWith(route)
  );

  // Redirect unauthenticated users away from protected routes
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect unauthenticated users away from onboarding
  if (!user && isOnboardingRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from basic auth routes (login/register)
  // but allow access to password/verification flows
  const basicAuthRoutes = ["/login", "/register"];
  const isBasicAuthRoute = basicAuthRoutes.some((route) =>
    request.nextUrl.pathname === route
  );

  if (user && isBasicAuthRoute) {
    // Redirect authenticated users to dashboard (they can access onboarding manually if needed)
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
