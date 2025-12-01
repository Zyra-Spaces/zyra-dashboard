import { createClient } from './client';
import { requireAuth, checkAuth } from './auth-guard';

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  source_idea_id?: string;
  cover_image_url?: string;
  status: 'active' | 'archived' | 'completed' | 'on-hold' | 'planning';
  is_public: boolean;
  share_token?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ProjectCollaborator {
  id: string;
  project_id: string;
  user_id?: string;
  email: string;
  role: 'owner' | 'collaborator' | 'viewer';
  status: 'pending' | 'accepted' | 'declined';
  invited_by: string;
  invited_at: string;
  accepted_at?: string;
}

export interface ProjectComment {
  id: string;
  project_id: string;
  user_id: string;
  comment: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectDocument {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  description?: string;
  created_at: string;
}

export interface ProjectLink {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  url: string;
  description?: string;
  link_type: 'external' | 'github' | 'demo' | 'docs' | 'other';
  created_at: string;
}

export interface ProjectBoardItem {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  position: number;
  assignee_id?: string;
  due_date?: string;
  tags?: string[];
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

/**
 * Save a project to Supabase
 */
export async function saveProject(project: Omit<Project, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<Project> {
  const { user, supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      title: project.title,
      description: project.description || null,
      source_idea_id: project.source_idea_id || null,
      cover_image_url: project.cover_image_url || null,
      status: project.status || 'active',
      is_public: project.is_public !== undefined ? project.is_public : false,
      tags: project.tags || [],
      metadata: project.metadata || {},
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error in saveProject:', error);
    throw new Error(error.message || 'Failed to save project');
  }

  return data;
}

/**
 * Get all projects for the current user
 */
export async function getUserProjects(): Promise<Project[]> {
  const { user, supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase error in getUserProjects:', error);
    throw new Error(error.message || 'Failed to load projects');
  }

  return data || [];
}

/**
 * Update a project
 */
export async function updateProject(id: string, updates: Partial<Project>): Promise<Project> {
  const { user, supabase } = await requireAuth();

  const { data, error } = await supabase
    .from('projects')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Supabase error in updateProject:', error);
    throw new Error(error.message || 'Failed to update project');
  }

  return data;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string): Promise<void> {
  const { user, supabase } = await requireAuth();

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) {
    console.error('Supabase error in deleteProject:', error);
    throw new Error(error.message || 'Failed to delete project');
  }
}

/**
 * Get project count for the current user
 */
export async function getProjectCount(): Promise<number> {
  const auth = await checkAuth();
  if (!auth) {
    return 0;
  }
  
  const { supabase, user } = auth;

  const { count, error } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error) {
    console.error('Error getting project count:', error);
    return 0;
  }

  return count || 0;
}

// ============================================
// PROJECT COLLABORATORS
// ============================================

/**
 * Invite a collaborator to a project
 */
export async function inviteProjectCollaborator(
  projectId: string,
  email: string,
  role: 'collaborator' | 'viewer' = 'collaborator'
): Promise<ProjectCollaborator> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('project_collaborators')
    .insert({
      project_id: projectId,
      email,
      role,
      invited_by: user.id,
    })
    .select()
    .single();

  if (error) {
    console.error('Error inviting collaborator:', error);
    throw new Error(error.message || 'Failed to invite collaborator');
  }

  return data;
}

/**
 * Get collaborators for a project
 */
export async function getProjectCollaborators(projectId: string): Promise<ProjectCollaborator[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_collaborators')
    .select('*')
    .eq('project_id', projectId)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error getting collaborators:', error);
    throw new Error(error.message || 'Failed to get collaborators');
  }

  return data || [];
}

// ============================================
// PROJECT STARS
// ============================================

/**
 * Star/favorite a project
 */
export async function starProject(projectId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('project_stars')
    .insert({
      project_id: projectId,
      user_id: user.id,
    });

  if (error) {
    console.error('Error starring project:', error);
    throw new Error(error.message || 'Failed to star project');
  }
}

/**
 * Unstar a project
 */
export async function unstarProject(projectId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('project_stars')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error unstarring project:', error);
    throw new Error(error.message || 'Failed to unstar project');
  }
}

/**
 * Check if project is starred by current user
 */
export async function isProjectStarred(projectId: string): Promise<boolean> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('project_stars')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error checking star status:', error);
    return false;
  }

  return !!data;
}

/**
 * Get star count for a project
 */
export async function getProjectStarCount(projectId: string): Promise<number> {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('project_stars')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (error) {
    console.error('Error getting star count:', error);
    return 0;
  }

  return count || 0;
}

// ============================================
// PROJECT COMMENTS
// ============================================

/**
 * Add a comment to a project
 */
export async function addProjectComment(
  projectId: string,
  comment: string,
  parentCommentId?: string
): Promise<ProjectComment> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('project_comments')
    .insert({
      project_id: projectId,
      user_id: user.id,
      comment,
      parent_comment_id: parentCommentId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error(error.message || 'Failed to add comment');
  }

  return data;
}

/**
 * Get comments for a project
 */
export async function getProjectComments(projectId: string): Promise<ProjectComment[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_comments')
    .select('*')
    .eq('project_id', projectId)
    .is('parent_comment_id', null) // Only top-level comments
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting comments:', error);
    throw new Error(error.message || 'Failed to get comments');
  }

  return data || [];
}

/**
 * Update a comment
 */
export async function updateProjectComment(
  commentId: string,
  comment: string
): Promise<ProjectComment> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('project_comments')
    .update({ comment, updated_at: new Date().toISOString() })
    .eq('id', commentId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating comment:', error);
    throw new Error(error.message || 'Failed to update comment');
  }

  return data;
}

/**
 * Delete a comment
 */
export async function deleteProjectComment(commentId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('project_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting comment:', error);
    throw new Error(error.message || 'Failed to delete comment');
  }
}

// ============================================
// PROJECT DOCUMENTS
// ============================================

/**
 * Add a document to a project
 */
export async function addProjectDocument(
  projectId: string,
  document: Omit<ProjectDocument, 'id' | 'project_id' | 'user_id' | 'created_at'>
): Promise<ProjectDocument> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('project_documents')
    .insert({
      project_id: projectId,
      user_id: user.id,
      ...document,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding document:', error);
    throw new Error(error.message || 'Failed to add document');
  }

  return data;
}

/**
 * Get documents for a project
 */
export async function getProjectDocuments(projectId: string): Promise<ProjectDocument[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_documents')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting documents:', error);
    throw new Error(error.message || 'Failed to get documents');
  }

  return data || [];
}

/**
 * Delete a document
 */
export async function deleteProjectDocument(documentId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('project_documents')
    .delete()
    .eq('id', documentId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting document:', error);
    throw new Error(error.message || 'Failed to delete document');
  }
}

// ============================================
// PROJECT LINKS
// ============================================

/**
 * Add a link to a project
 */
export async function addProjectLink(
  projectId: string,
  link: Omit<ProjectLink, 'id' | 'project_id' | 'user_id' | 'created_at'>
): Promise<ProjectLink> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('project_links')
    .insert({
      project_id: projectId,
      user_id: user.id,
      ...link,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding link:', error);
    throw new Error(error.message || 'Failed to add link');
  }

  return data;
}

/**
 * Get links for a project
 */
export async function getProjectLinks(projectId: string): Promise<ProjectLink[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_links')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting links:', error);
    throw new Error(error.message || 'Failed to get links');
  }

  return data || [];
}

/**
 * Update a link
 */
export async function updateProjectLink(
  linkId: string,
  updates: Partial<Omit<ProjectLink, 'id' | 'project_id' | 'user_id' | 'created_at'>>
): Promise<ProjectLink> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('project_links')
    .update(updates)
    .eq('id', linkId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating link:', error);
    throw new Error(error.message || 'Failed to update link');
  }

  return data;
}

/**
 * Delete a link
 */
export async function deleteProjectLink(linkId: string): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('project_links')
    .delete()
    .eq('id', linkId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting link:', error);
    throw new Error(error.message || 'Failed to delete link');
  }
}

// ============================================
// PROJECT BOARD ITEMS
// ============================================

/**
 * Add a board item to a project
 */
export async function addProjectBoardItem(
  projectId: string,
  item: Omit<ProjectBoardItem, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>
): Promise<ProjectBoardItem> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('project_board_items')
    .insert({
      project_id: projectId,
      user_id: user.id,
      ...item,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding board item:', error);
    throw new Error(error.message || 'Failed to add board item');
  }

  return data;
}

/**
 * Get board items for a project
 */
export async function getProjectBoardItems(projectId: string): Promise<ProjectBoardItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_board_items')
    .select('*')
    .eq('project_id', projectId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error getting board items:', error);
    throw new Error(error.message || 'Failed to get board items');
  }

  return data || [];
}

/**
 * Update a board item
 */
export async function updateProjectBoardItem(
  itemId: string,
  updates: Partial<Omit<ProjectBoardItem, 'id' | 'project_id' | 'user_id' | 'created_at' | 'updated_at'>>
): Promise<ProjectBoardItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_board_items')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single();

  if (error) {
    console.error('Error updating board item:', error);
    throw new Error(error.message || 'Failed to update board item');
  }

  return data;
}

/**
 * Delete a board item
 */
export async function deleteProjectBoardItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('project_board_items')
    .delete()
    .eq('id', itemId);

  if (error) {
    console.error('Error deleting board item:', error);
    throw new Error(error.message || 'Failed to delete board item');
  }
}

// ============================================
// PROJECT TAGS
// ============================================

/**
 * Add tags to a project
 */
export async function addProjectTags(projectId: string, tags: string[]): Promise<void> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Insert tags into project_tags table
  const tagInserts = tags.map(tag => ({
    project_id: projectId,
    tag: tag.toLowerCase().trim(),
  }));

  const { error: tagsError } = await supabase
    .from('project_tags')
    .upsert(tagInserts, { onConflict: 'project_id,tag' });

  if (tagsError) {
    console.error('Error adding tags:', tagsError);
    throw new Error(tagsError.message || 'Failed to add tags');
  }

  // Also update the tags JSONB column in projects table for quick access
  const { error: projectError } = await supabase
    .from('projects')
    .update({ tags })
    .eq('id', projectId);

  if (projectError) {
    console.error('Error updating project tags:', projectError);
    // Don't throw - tags are already in project_tags table
  }
}

/**
 * Get tags for a project
 */
export async function getProjectTags(projectId: string): Promise<string[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('project_tags')
    .select('tag')
    .eq('project_id', projectId)
    .order('tag', { ascending: true });

  if (error) {
    console.error('Error getting tags:', error);
    throw new Error(error.message || 'Failed to get tags');
  }

  return data?.map(row => row.tag) || [];
}

/**
 * Remove a tag from a project
 */
export async function removeProjectTag(projectId: string, tag: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('project_tags')
    .delete()
    .eq('project_id', projectId)
    .eq('tag', tag.toLowerCase().trim());

  if (error) {
    console.error('Error removing tag:', error);
    throw new Error(error.message || 'Failed to remove tag');
  }

  // Update project tags array
  const currentTags = await getProjectTags(projectId);
  const { error: projectError } = await supabase
    .from('projects')
    .update({ tags: currentTags })
    .eq('id', projectId);

  if (projectError) {
    console.error('Error updating project tags:', projectError);
  }
}

/**
 * Get trending tags
 */
export async function getTrendingTags(limit: number = 10, daysBack: number = 7): Promise<Array<{ tag: string; count: number; recent_count: number }>> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('get_trending_tags', {
    limit_count: limit,
    days_back: daysBack,
  });

  if (error) {
    console.error('Error getting trending tags:', error);
    // Fallback to simple query if function doesn't exist
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('project_tags')
      .select('tag')
      .limit(limit * 10);

    if (fallbackError) {
      throw new Error(error.message || 'Failed to get trending tags');
    }

    // Count tags manually
    const tagCounts: Record<string, number> = {};
    fallbackData?.forEach(row => {
      tagCounts[row.tag] = (tagCounts[row.tag] || 0) + 1;
    });

    return Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count, recent_count: count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  return data || [];
}

/**
 * Get trending projects
 */
export async function getTrendingProjects(limit: number = 20, daysBack: number = 7): Promise<Project[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Try to use the function first
  const { data: trendingData, error: functionError } = await supabase.rpc('get_trending_projects', {
    limit_count: limit,
    days_back: daysBack,
  });

  if (!functionError && trendingData) {
    // Fetch full project details
    const projectIds = trendingData.map((row: any) => row.project_id);
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds);

    if (!projectsError && projects) {
      // Sort by trend_score
      return projects.sort((a, b) => {
        const aScore = trendingData.find((t: any) => t.project_id === a.id)?.trend_score || 0;
        const bScore = trendingData.find((t: any) => t.project_id === b.id)?.trend_score || 0;
        return bScore - aScore;
      });
    }
  }

  // Fallback: Get public projects sorted by stars and comments
  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error getting trending projects:', error);
    throw new Error(error.message || 'Failed to get trending projects');
  }

  return projects || [];
}

/**
 * Get projects by tag
 */
export async function getProjectsByTag(tag: string, limit: number = 50): Promise<Project[]> {
  const supabase = createClient();
  const { data: tagData, error: tagError } = await supabase
    .from('project_tags')
    .select('project_id')
    .eq('tag', tag.toLowerCase().trim())
    .limit(limit);

  if (tagError) {
    console.error('Error getting projects by tag:', tagError);
    throw new Error(tagError.message || 'Failed to get projects by tag');
  }

  if (!tagData || tagData.length === 0) {
    return [];
  }

  const projectIds = tagData.map(row => row.project_id);
  const { data: projects, error: projectsError } = await supabase
    .from('projects')
    .select('*')
    .in('id', projectIds)
    .order('created_at', { ascending: false });

  if (projectsError) {
    console.error('Error getting projects:', projectsError);
    throw new Error(projectsError.message || 'Failed to get projects');
  }

  return projects || [];
}

