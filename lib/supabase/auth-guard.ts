import { createClient } from './client';

/**
 * Check if user is authenticated before making requests
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<{ user: any; supabase: ReturnType<typeof createClient> }> {
  const supabase = createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new Error('User not authenticated. Please log in again.');
  }

  // Verify session is still valid
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('Session expired. Please log in again.');
  }

  return { user, supabase };
}

/**
 * Check if user is authenticated (non-throwing)
 * Returns null if not authenticated
 */
export async function checkAuth(): Promise<{ user: any; supabase: ReturnType<typeof createClient> } | null> {
  try {
    return await requireAuth();
  } catch {
    return null;
  }
}

/**
 * Wrapper for Supabase queries that require authentication
 * Automatically checks auth before executing the query
 */
export async function withAuth<T>(
  queryFn: (supabase: ReturnType<typeof createClient>, user: any) => Promise<T>
): Promise<T> {
  const { user, supabase } = await requireAuth();
  return queryFn(supabase, user);
}














