import { createClient } from "./client";

/**
 * User record from the custom users table
 */
export interface User {
  id: string;
  email: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get current user's record from the custom users table
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    return null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, email, email_verified, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Error getting user from users table:", error);
    return null;
  }

  return data;
}

/**
 * Get user by ID from the custom users table
 */
export async function getUserById(userId: string): Promise<User | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, email, email_verified, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error getting user by ID:", error);
    return null;
  }

  return data;
}

/**
 * Get user by email from the custom users table
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id, email, email_verified, created_at, updated_at")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("Error getting user by email:", error);
    return null;
  }

  return data;
}

/**
 * Update user's email verification status
 */
export async function updateUserEmailVerification(verified: boolean): Promise<boolean> {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase
    .from("users")
    .update({
      email_verified: verified,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Error updating email verification:", error);
    throw new Error(`Failed to update email verification: ${error.message}`);
  }

  return true;
}

/**
 * Check if user exists in the custom users table
 */
export async function userExists(userId: string): Promise<boolean> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error("Error checking if user exists:", error);
    return false;
  }

  return !!data;
}














