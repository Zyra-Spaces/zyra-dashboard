import { createClient } from './client';
import { requireAuth, checkAuth } from './auth-guard';
import { extractErrorInfo, getErrorDebugInfo } from '../utils/error-extractor';

export interface Idea {
  id: string;
  user_id: string;
  prompt: string;
  idea: string;
  formatted_idea?: {
    title?: string;
    description?: string;
    features?: string[];
    useCases?: string[];
    tags?: string[];
  };
  context?: string;
  color?: string; // For pinned note color
  cover_image_url?: string;
  cover_image_type?: 'system' | 'uploaded';
  is_public?: boolean;
  share_token?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Save an idea to Supabase
 */
export async function saveIdea(idea: Omit<Idea, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Idea> {
  const { user, supabase } = await requireAuth();

  // Insert idea - simple approach without any joins
  // RLS policy will validate user_id matches auth.uid()
  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      prompt: idea.prompt,
      idea: idea.idea,
      formatted_idea: idea.formatted_idea || null,
      context: idea.context || null,
      color: idea.color || null,
      cover_image_url: idea.cover_image_url || null,
      cover_image_type: idea.cover_image_type || 'system',
      is_public: idea.is_public || false,
    })
    .select()
    .single();

  if (error) {
    // Extract error information using utility
    const errorInfo = extractErrorInfo(error);
    const debugInfo = getErrorDebugInfo(error);
    
    // Log full error details for debugging
    console.error('Supabase error in saveIdea:', {
      ...errorInfo,
      ...debugInfo,
    });
    
    // Create a proper Error object with all details
    const enhancedError = new Error(errorInfo.message);
    (enhancedError as any).code = errorInfo.code;
    (enhancedError as any).details = errorInfo.details;
    (enhancedError as any).hint = errorInfo.hint;
    (enhancedError as any).originalError = error;
    throw enhancedError;
  }

  return data;
}

/**
 * Get all ideas for the current user
 */
export async function getUserIdeas(): Promise<Idea[]> {
  const { user, supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    // Extract error information using utility
    const errorInfo = extractErrorInfo(error);
    const debugInfo = getErrorDebugInfo(error);
    
    console.error('Supabase error in getUserIdeas:', {
      ...errorInfo,
      ...debugInfo,
    });
    
    const enhancedError = new Error(errorInfo.message);
    (enhancedError as any).code = errorInfo.code;
    (enhancedError as any).details = errorInfo.details;
    (enhancedError as any).hint = errorInfo.hint;
    throw enhancedError;
  }

  return data || [];
}

/**
 * Get a single idea by ID
 */
export async function getIdeaById(id: string): Promise<Idea> {
  const { user, supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    const errorInfo = extractErrorInfo(error);
    const enhancedError = new Error(errorInfo.message);
    (enhancedError as any).code = errorInfo.code;
    throw enhancedError;
  }

  if (!data) {
    throw new Error('Idea not found');
  }

  return data;
}

/**
 * Update an idea
 */
export async function updateIdea(id: string, updates: Partial<Idea>): Promise<Idea> {
  const { user, supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('ideas')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    // Extract meaningful error message from Supabase error
    const errorMessage = error.message || error.details || error.hint || 'Database error occurred';
    const enhancedError = new Error(errorMessage);
    (enhancedError as any).code = error.code;
    (enhancedError as any).details = error.details;
    (enhancedError as any).hint = error.hint;
    throw enhancedError;
  }

  return data;
}

/**
 * Delete an idea
 */
export async function deleteIdea(id: string): Promise<void> {
  const { user, supabase } = await requireAuth();

  const { error } = await supabase
    .from('ideas')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    throw error;
  }
}

/**
 * Get idea count for the current user
 */
export async function getIdeaCount(): Promise<number> {
  const auth = await checkAuth();
  if (!auth) {
    return 0;
  }
  
  const { supabase, user } = auth;

  const { count, error } = await supabase
    .from('ideas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    const errorMessage = error.message || error.details || error.hint || 'Database error occurred';
    console.error('Error getting idea count:', errorMessage, error);
    return 0;
  }

  return count || 0;
}

