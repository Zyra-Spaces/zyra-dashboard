import { createClient } from './client';

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
  created_at: string;
  updated_at: string;
}

/**
 * Save an idea to Supabase
 */
export async function saveIdea(idea: Omit<Idea, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Idea> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      prompt: idea.prompt,
      idea: idea.idea,
      formatted_idea: idea.formatted_idea || null,
      context: idea.context || null,
      color: idea.color || null,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get all ideas for the current user
 */
export async function getUserIdeas(): Promise<Idea[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Update an idea
 */
export async function updateIdea(id: string, updates: Partial<Idea>): Promise<Idea> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

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
    throw error;
  }

  return data;
}

/**
 * Delete an idea
 */
export async function deleteIdea(id: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

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
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return 0;
  }

  const { count, error } = await supabase
    .from('ideas')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error getting idea count:', error);
    return 0;
  }

  return count || 0;
}

