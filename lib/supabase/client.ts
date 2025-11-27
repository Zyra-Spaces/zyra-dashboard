import { createBrowserClient } from "@supabase/ssr";

// CRITICAL: Create a SINGLETON client to prevent cookie accumulation
// Creating multiple clients causes Supabase to write new cookies each time
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return existing client if already created
  if (browserClient) {
    return browserClient;
  }

  // Create client only once
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Use localStorage for session storage to reduce cookie size
        storage: typeof window !== "undefined" ? window.localStorage : undefined,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  );

  return browserClient;
}

