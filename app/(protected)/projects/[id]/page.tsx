'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { 
  ArrowLeft, 
  Star, 
  MessageCircle, 
  Share2, 
  Settings, 
  Plus,
  ExternalLink,
  FileText,
  Link as LinkIcon,
  Tag,
  Users,
  Eye,
  Lock,
  Globe
} from 'lucide-react';
import { 
  starProject, 
  unstarProject, 
  isProjectStarred, 
  getProjectStarCount,
  getProjectComments,
  addProjectComment,
  getProjectCollaborators,
  getProjectDocuments,
  getProjectLinks,
  addProjectTags,
  getProjectTags,
  type Project,
  type ProjectComment,
  type ProjectDocument,
  type ProjectLink
} from '@/lib/supabase/projects';
import { createClient } from '@/lib/supabase/client';
import { InlineNotification, notify } from '@/components/ui/inline-notification';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const projectId = params.id as string;
  
  const [project, setProject] = useState<Project | null>(null);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [links, setLinks] = useState<ProjectLink[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [isStarred, setIsStarred] = useState(false);
  const [starCount, setStarCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadProject();
      setupRealtime();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const supabase = createClient();
      
      // Get project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData as Project);

      // Load all related data
      const [commentsData, documentsData, linksData, tagsData, starred, stars] = await Promise.all([
        getProjectComments(projectId),
        getProjectDocuments(projectId),
        getProjectLinks(projectId),
        getProjectTags(projectId),
        isProjectStarred(projectId),
        getProjectStarCount(projectId),
      ]);

      setComments(commentsData);
      setDocuments(documentsData);
      setLinks(linksData);
      setTags(tagsData);
      setIsStarred(starred);
      setStarCount(stars);
    } catch (error: any) {
      console.error('Error loading project:', error);
      notify.error(error.message || 'Failed to load project');
    } finally {
      setIsLoading(false);
    }
  };

  const setupRealtime = () => {
    const supabase = createClient();
    
    // Real-time subscriptions
    const commentsChannel = supabase
      .channel(`project-comments-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_comments',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setComments(prev => [payload.new as ProjectComment, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setComments(prev => prev.map(c => c.id === payload.new.id ? payload.new as ProjectComment : c));
        } else if (payload.eventType === 'DELETE') {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    const starsChannel = supabase
      .channel(`project-stars-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_stars',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        getProjectStarCount(projectId).then(setStarCount);
        isProjectStarred(projectId).then(setIsStarred);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(starsChannel);
    };
  };

  const handleStar = async () => {
    try {
      if (isStarred) {
        await unstarProject(projectId);
        setIsStarred(false);
        setStarCount(prev => Math.max(0, prev - 1));
      } else {
        await starProject(projectId);
        setIsStarred(true);
        setStarCount(prev => prev + 1);
      }
    } catch (error: any) {
      notify.error(error.message || 'Failed to update star');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    try {
      setIsAddingComment(true);
      const comment = await addProjectComment(projectId, newComment.trim());
      setComments(prev => [comment, ...prev]);
      setNewComment('');
      notify.success('Comment added');
    } catch (error: any) {
      notify.error(error.message || 'Failed to add comment');
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    try {
      await addProjectTags(projectId, [...tags, newTag.trim()]);
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
      notify.success('Tag added');
    } catch (error: any) {
      notify.error(error.message || 'Failed to add tag');
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4780C6] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Project not found</h2>
            <Link href="/dashboard" className="text-[#4780C6] hover:underline">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <InlineNotification className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50" />
        
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                  <div className="flex items-center gap-3 mt-1">
                    {project.is_public ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(project.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStar}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isStarred
                      ? 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                      : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <Star className={`w-4 h-4 ${isStarred ? 'fill-current' : ''}`} />
                  <span>{starCount}</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
                <Link
                  href={`/projects/${projectId}/board`}
                  className="flex items-center gap-2 px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Board
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - Main Content */}
            <div className="col-span-8 space-y-6">
              {/* Cover Image */}
              {project.cover_image_url && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <img
                    src={project.cover_image_url}
                    alt={project.title}
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Description */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {project.description || 'No description provided.'}
                </p>
              </div>

              {/* Tags */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    Tags
                  </h2>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      placeholder="Add tag"
                      className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6]"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-1.5 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                  {tags.length === 0 && (
                    <p className="text-sm text-gray-400">No tags yet</p>
                  )}
                </div>
              </div>

              {/* Comments */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  Comments ({comments.length})
                </h2>
                
                {/* Add Comment */}
                <div className="mb-6">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] resize-none"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={isAddingComment || !newComment.trim()}
                    className="mt-2 px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAddingComment ? 'Posting...' : 'Post Comment'}
                  </button>
                </div>

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <div key={comment.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <p className="text-gray-700">{comment.comment}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(comment.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-8">No comments yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="col-span-4 space-y-6">
              {/* Documents */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Documents
                </h3>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{doc.name}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  ))}
                  {documents.length === 0 && (
                    <p className="text-sm text-gray-400">No documents</p>
                  )}
                </div>
              </div>

              {/* Links */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <LinkIcon className="w-5 h-5" />
                  Links
                </h3>
                <div className="space-y-2">
                  {links.map((link) => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <LinkIcon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-700 flex-1 truncate">{link.title}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </a>
                  ))}
                  {links.length === 0 && (
                    <p className="text-sm text-gray-400">No links</p>
                  )}
                </div>
              </div>

              {/* Collaborators */}
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Collaborators
                </h3>
                <p className="text-sm text-gray-400">Coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

