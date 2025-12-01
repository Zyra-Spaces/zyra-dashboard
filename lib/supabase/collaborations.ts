import { createClient } from './client';

export interface IdeaCollaboration {
  id: string;
  idea_id: string;
  user_id?: string;
  email: string;
  role: 'owner' | 'collaborator' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
}

export interface IdeaConversation {
  id: string;
  idea_id: string;
  user_id: string;
  message: string;
  message_type: 'comment' | 'refinement' | 'suggestion';
  created_at: string;
  user?: {
    email?: string;
    user_metadata?: {
      firstName?: string;
      lastName?: string;
    };
  };
}

/**
 * Invite a user to collaborate on an idea
 */
export async function inviteCollaborator(
  ideaId: string,
  email: string,
  role: 'collaborator' | 'viewer' = 'collaborator'
): Promise<IdeaCollaboration> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('idea_collaborations')
    .insert({
      idea_id: ideaId,
      email: email.toLowerCase().trim(),
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get all collaborations for an idea
 */
export async function getIdeaCollaborations(ideaId: string): Promise<IdeaCollaboration[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('idea_collaborations')
    .select('*')
    .eq('idea_id', ideaId)
    .order('invited_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Accept a collaboration invitation
 */
export async function acceptCollaboration(collaborationId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Verify email matches (safety check)
  if (!user.email) {
    throw new Error('User email not available');
  }

  const { error } = await supabase
    .from('idea_collaborations')
    .update({
      user_id: user.id,
      status: 'accepted',
      accepted_at: new Date().toISOString(),
    })
    .eq('id', collaborationId)
    .eq('email', user.email.toLowerCase().trim());

  if (error) {
    throw error;
  }
}

/**
 * Add a conversation message to an idea
 */
export async function addConversationMessage(
  ideaId: string,
  message: string,
  messageType: 'comment' | 'refinement' | 'suggestion' = 'comment'
): Promise<IdeaConversation> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('idea_conversations')
    .insert({
      idea_id: ideaId,
      user_id: user.id,
      message,
      message_type: messageType,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Get conversation messages for an idea
 * Note: We don't join with auth.users to avoid permission errors
 * User info should be fetched separately using auth.getUser() if needed
 */
export async function getIdeaConversations(ideaId: string): Promise<IdeaConversation[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('idea_conversations')
    .select('*')
    .eq('idea_id', ideaId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  // Note: If you need user info (email, metadata), fetch it separately
  // using supabase.auth.getUser() for the current user, or create a profiles table
  return data || [];
}

/**
 * Update presence (who's viewing an idea)
 */
export async function updatePresence(ideaId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return;
  }

  await supabase
    .from('idea_presence')
    .upsert({
      idea_id: ideaId,
      user_id: user.id,
      last_seen: new Date().toISOString(),
    }, {
      onConflict: 'idea_id,user_id',
    });
}

/**
 * Get current viewers of an idea (real-time)
 */
export async function getIdeaViewers(ideaId: string): Promise<Array<{ user_id: string; last_seen: string }>> {
  const supabase = createClient();
  
  // Get viewers from last 30 seconds
  const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
  
  const { data, error } = await supabase
    .from('idea_presence')
    .select('user_id, last_seen')
    .eq('idea_id', ideaId)
    .gte('last_seen', thirtySecondsAgo)
    .order('last_seen', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

