import { createBrowserClient } from "@supabase/ssr";

// CRITICAL: Create a SINGLETON client to prevent cookie accumulation
// Creating multiple clients causes Supabase to write new cookies each time
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return existing client if already created
  if (browserClient) {
    return browserClient;
  }

  // Create client following official Supabase SSR pattern
  // Keep it simple - let middleware handle cookie management
  browserClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return browserClient;
}

