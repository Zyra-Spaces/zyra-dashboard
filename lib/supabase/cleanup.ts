import { createClient } from "./client";

/**
 * Clean up user metadata to reduce cookie size
 * Removes ALL large data (images, arrays, objects) from metadata
 * These should be stored in localStorage only
 */
export async function cleanupUserMetadata() {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Remove ALL metadata - keep cookies minimal (only auth tokens)
  // All profile data should be in localStorage only
  const cleaned: Record<string, any> = {};

  // Only update if there are changes
  const hasChanges = JSON.stringify(cleaned) !== JSON.stringify(metadata);
  
  if (hasChanges) {
    const { error } = await supabase.auth.updateUser({
      data: cleaned,
    });
    
    if (error) throw error;
    return { cleaned: true };
  }

  return { cleaned: false };
}

