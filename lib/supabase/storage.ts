import { createClient } from "./client";

/**
 * Upload an image to Supabase Storage
 * @param file - The file to upload (File object or base64 data URL)
 * @param path - The storage path (e.g., 'profile-pics/user-id.jpg')
 * @returns The public URL of the uploaded image
 */
export async function uploadImage(
  file: File | string,
  path: string
): Promise<string> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Convert base64 data URL to Blob if needed
  let blob: Blob;
  let fileName: string;

  if (typeof file === "string") {
    // It's a base64 data URL
    const response = await fetch(file);
    blob = await response.blob();
    // Extract file extension from data URL or use default
    const match = file.match(/data:image\/(\w+);base64,/);
    const ext = match ? match[1] : "jpg";
    // Use path as-is if it already has extension, otherwise add it
    fileName = path.includes(".") ? path : `${path}.${ext}`;
  } else {
    // It's a File object
    blob = file;
    const ext = file.name.split(".").pop() || "jpg";
    // Use path as-is if it already has extension, otherwise add it
    fileName = path.includes(".") ? path : `${path}.${ext}`;
  }

  // Upload to Supabase Storage
  // Use user-specific folder structure: {userId}/filename
  // This makes RLS policies easier to manage
  const userFolder = `${user.id}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from("avatars")
    .upload(userFolder, blob, {
      cacheControl: "3600",
      upsert: true, // Replace if exists
    });

  if (error) {
    // If bucket doesn't exist, try creating it or use a different approach
    if (error.message.includes("Bucket not found")) {
      throw new Error(
        "Storage bucket 'avatars' not found. Please create it in Supabase Dashboard > Storage."
      );
    }
    throw error;
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(data.path);

  return publicUrl;
}

/**
 * Instructions for setting up RLS policies in Supabase:
 * 
 * 1. Go to Supabase Dashboard > Storage > Policies
 * 2. Select the 'avatars' bucket
 * 3. Click "New Policy" and create these policies:
 * 
 * Policy 1: Allow authenticated users to upload to their own folder
 * - Policy name: "Users can upload to own folder"
 * - Allowed operation: INSERT
 * - Policy definition:
 *   (bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
 * 
 * Policy 2: Allow authenticated users to update their own files
 * - Policy name: "Users can update own files"
 * - Allowed operation: UPDATE
 * - Policy definition:
 *   (bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
 * 
 * Policy 3: Allow authenticated users to delete their own files
 * - Policy name: "Users can delete own files"
 * - Allowed operation: DELETE
 * - Policy definition:
 *   (bucket_id = 'avatars'::text) AND ((auth.uid())::text = (storage.foldername(name))[1])
 * 
 * Policy 4: Allow public read access (for displaying images)
 * - Policy name: "Public read access"
 * - Allowed operation: SELECT
 * - Policy definition:
 *   bucket_id = 'avatars'::text
 * 
 * OR, if you want to make the bucket public (simpler but less secure):
 * 1. Go to Storage > avatars bucket
 * 2. Click "Make Public" button
 * 3. This will allow all operations for authenticated users
}

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(path: string): Promise<void> {
  const supabase = createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Extract path from URL if it's a full URL
  let filePath = path;
  if (path.includes("/storage/v1/object/public/avatars/")) {
    // Extract the path after /avatars/
    filePath = path.split("/avatars/")[1];
  } else if (path.includes("/")) {
    // It's already a path, use as-is
    filePath = path;
  } else {
    // Just filename, prepend user ID
    filePath = `${user.id}/${path}`;
  }

  const { error } = await supabase.storage
    .from("avatars")
    .remove([filePath]);

  if (error && !error.message.includes("not found")) {
    throw error;
  }
}

