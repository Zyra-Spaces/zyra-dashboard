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
          // CRITICAL: Filter out chunked cookies BEFORE setting them
          // This prevents Supabase from creating hundreds of chunked cookies
          const filteredCookies = cookiesToSet.filter(({ name, value }) => {
            // Reject ALL chunked cookies (anything with .293, .294, etc. suffix)
            if (name.startsWith('sb-') && /\.\d+$/.test(name)) {
              return false; // Don't set chunked cookies
            }
            // Reject cookies that are too large (over 4KB per cookie)
            if (value && value.length > 4096) {
              console.warn(`Rejecting large cookie: ${name} (${value.length} bytes)`);
              return false;
            }
            return true;
          });
          
          // Only allow ONE base Supabase cookie (the main auth cookie)
          const supabaseCookies = filteredCookies.filter(c => c.name.startsWith('sb-'));
          if (supabaseCookies.length > 1) {
            // Keep only the first base cookie (no chunk suffix), prefer the main auth cookie
            const baseCookie = supabaseCookies.find(c => 
              !/\.\d+$/.test(c.name) && c.name.includes('auth-token')
            ) || supabaseCookies.find(c => !/\.\d+$/.test(c.name)) || supabaseCookies[0];
            
            const finalCookies = [
              ...filteredCookies.filter(c => !c.name.startsWith('sb-')),
              baseCookie
            ];
            
            // Set only the filtered cookies
            finalCookies.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
            });
            supabaseResponse = NextResponse.next({
              request,
            });
            finalCookies.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          } else {
            // Normal flow - set all cookies
            filteredCookies.forEach(({ name, value, options }) => {
              request.cookies.set(name, value);
            });
            supabaseResponse = NextResponse.next({
              request,
            });
            filteredCookies.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          }
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  
  // CRITICAL: Clean up chunked cookies AFTER getUser() to prevent 431 errors
  // This must happen after getUser() to avoid breaking session management
  const allCookies = request.cookies.getAll();
  const supabaseCookies = allCookies.filter(c => c.name.startsWith('sb-'));
  const chunkedCookies = supabaseCookies.filter(c => /\.\d+$/.test(c.name));
  
  if (chunkedCookies.length > 0) {
    // Delete ALL chunked cookies - they cause 431 errors
    chunkedCookies.forEach(cookie => {
      supabaseResponse.cookies.delete(cookie.name);
      supabaseResponse.cookies.set(cookie.name, "", {
        expires: new Date(0),
        path: "/",
        maxAge: 0,
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

