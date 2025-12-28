import { createBrowserClient } from "@supabase/ssr";

// CRITICAL: Create a SINGLETON client to prevent cookie accumulation
// Creating multiple clients causes Supabase to write new cookies each time
let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  // Return existing client if already created
  if (browserClient) {
    return browserClient;
  }

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missingVars = [];
    if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseAnonKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}. Please check your .env.local file.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (error) {
    const errorMessage = `Invalid NEXT_PUBLIC_SUPABASE_URL: "${supabaseUrl}". Please provide a valid URL.`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }

  // Create client following official Supabase SSR pattern
  // Keep it simple - let middleware handle cookie management
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);

  return browserClient;
}

