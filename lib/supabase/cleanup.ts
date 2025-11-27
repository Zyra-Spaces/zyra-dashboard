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

  const metadata = user.user_metadata || {};
  const cleaned: Record<string, any> = {};

  // Only keep essential, small fields (max 100 chars each)
  const allowedFields = [
    "first_name",
    "last_name",
    "username",
    "date_of_birth",
    "gender",
    "occupation",
    "referral_source",
  ];

  // Copy allowed small fields only
  for (const field of allowedFields) {
    if (metadata[field] !== undefined) {
      const value = metadata[field];
      if (typeof value === "string" && value.length <= 100) {
        cleaned[field] = value;
      } else if (value === null || value === "") {
        cleaned[field] = null;
      }
    }
  }

  // Bio - only if very short (max 50 chars)
  if (metadata.bio && typeof metadata.bio === "string" && metadata.bio.length <= 50) {
    cleaned.bio = metadata.bio;
  }

  // REMOVE all large data from metadata:
  // - Images (profile_pic, banner_pic) - store in localStorage only
  // - Arrays (team_emails) - store in localStorage only
  // - Objects (socials) - store in localStorage only

  // Update full_name
  if (cleaned.first_name || cleaned.last_name) {
    if (cleaned.first_name && cleaned.last_name) {
      cleaned.full_name = `${cleaned.first_name} ${cleaned.last_name}`;
    } else {
      cleaned.full_name = cleaned.first_name || cleaned.last_name;
    }
  }

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

