'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { InlineNotification, notify } from '@/components/ui/inline-notification';
import { updateIdea, type Idea } from '@/lib/supabase/ideas';
import { 
  getIdeaCollaborations, 
  inviteCollaborator, 
  addConversationMessage, 
  getIdeaConversations,
  updatePresence,
  type IdeaConversation,
  type IdeaCollaboration
} from '@/lib/supabase/collaborations';
import { createClient } from '@/lib/supabase/client';
import {
  Sparkles,
  X,
  Copy,
  Check,
  Rocket,
  Edit3,
  Trash2,
  Users,
  UserPlus,
  Share2,
  MessageSquare,
  Send,
  Loader2,
  Image as ImageIcon,
  Upload,
  Eye,
  Twitter,
  Link as LinkIcon,
  CheckCircle2,
  Maximize2,
  Menu,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface EnhancedIdeaDetailProps {
  idea: Idea;
  onClose: () => void;
  onDelete: (id: string) => void;
  onRefine: (prompt: string) => void;
  onConvertToProject: () => void;
  isRefining?: boolean;
}

// System cover images
const SYSTEM_COVERS = [
  '/images/covers/tech.jpg',
  '/images/covers/design.jpg',
  '/images/covers/business.jpg',
  '/images/covers/health.jpg',
  '/images/covers/education.jpg',
  '/images/covers/finance.jpg',
];

export function EnhancedIdeaDetail({
  idea,
  onClose,
  onDelete,
  onRefine,
  onConvertToProject,
  isRefining = false,
}: EnhancedIdeaDetailProps) {
  const { user } = useAuth();
  const { profile } = useProfile();
  const router = useRouter();
  const [collaborations, setCollaborations] = useState<IdeaCollaboration[]>([]);
  const [conversations, setConversations] = useState<IdeaConversation[]>([]);
  const [viewers, setViewers] = useState<Array<{ user_id: string; last_seen: string }>>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'collaborator' | 'viewer'>('collaborator');
  const [isInviting, setIsInviting] = useState(false);
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCoverSelector, setShowCoverSelector] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const presenceIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  const isOwner = idea.user_id === user?.id;

  // Load collaborations and conversations
  useEffect(() => {
    if (idea.id) {
      loadCollaborations();
      loadConversations();
      startPresenceTracking();
      
      // Subscribe to real-time updates
      const supabase = createClient();
      
      // Subscribe to conversation updates
      const conversationChannel = supabase
        .channel(`idea-conversations-${idea.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'idea_conversations',
            filter: `idea_id=eq.${idea.id}`,
          },
          (_payload: any) => {
            loadConversations();
          }
        )
        .subscribe();

      // Subscribe to presence updates
      const presenceChannel = supabase
        .channel(`idea-presence-${idea.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'idea_presence',
            filter: `idea_id=eq.${idea.id}`,
          },
          () => {
            loadViewers();
          }
        )
        .subscribe();

      return () => {
        conversationChannel.unsubscribe();
        presenceChannel.unsubscribe();
        if (presenceIntervalRef.current) {
          clearInterval(presenceIntervalRef.current);
        }
      };
    }
  }, [idea.id]);

  // Auto-scroll to bottom of conversations
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  const loadCollaborations = async () => {
    try {
      const data = await getIdeaCollaborations(idea.id);
      setCollaborations(data);
    } catch (error: any) {
      console.error('Error loading collaborations:', error);
    }
  };

  const loadConversations = async () => {
    try {
      const data = await getIdeaConversations(idea.id);
      setConversations(data);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    }
  };

  const loadViewers = async () => {
    try {
      const supabase = createClient();
      const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
      const { data } = await supabase
        .from('idea_presence')
        .select('user_id, last_seen')
        .eq('idea_id', idea.id)
        .gte('last_seen', thirtySecondsAgo)
        .neq('user_id', user?.id || '');
      
      setViewers(data || []);
    } catch (error) {
      console.error('Error loading viewers:', error);
    }
  };

  const startPresenceTracking = () => {
    // Update presence immediately
    updatePresence(idea.id);
    
    // Update presence every 10 seconds
    presenceIntervalRef.current = setInterval(() => {
      updatePresence(idea.id);
      loadViewers();
    }, 10000);
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      notify.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      const response = await fetch('/api/invite-collaborator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      notify.success('Invitation sent successfully!');
      setInviteEmail('');
      loadCollaborations();
    } catch (error: any) {
      notify.error(error.message || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      await addConversationMessage(idea.id, message.trim());
      setMessage('');
      loadConversations();
    } catch (error: any) {
      notify.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const response = await fetch('/api/share-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: idea.id,
          makePublic: true,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setShareUrl(data.shareUrl);
      notify.success('Idea is now shareable!');
    } catch (error: any) {
      notify.error(error.message || 'Failed to share idea');
    } finally {
      setIsSharing(false);
    }
  };

  const handleCoverSelect = async (coverUrl: string) => {
    try {
      await updateIdea(idea.id, {
        cover_image_url: coverUrl,
        cover_image_type: 'system',
      });
      notify.success('Cover updated!');
      setShowCoverSelector(false);
      window.location.reload(); // Refresh to show new cover
    } catch (error: any) {
      notify.error('Failed to update cover');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.error('File size must be less than 5MB');
      return;
    }

    setIsUploadingCover(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ideaId', idea.id);

      const response = await fetch('/api/upload-cover', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      notify.success('Cover uploaded successfully!');
      setShowCoverSelector(false);
      window.location.reload();
    } catch (error: any) {
      notify.error(error.message || 'Failed to upload cover');
    } finally {
      setIsUploadingCover(false);
    }
  };

  const copyShareUrl = async () => {
    if (!shareUrl) {
      await handleShare();
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    notify.success('Link copied to clipboard!');
  };

  const twitterShareUrl = shareUrl 
    ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(idea.formatted_idea?.title || 'Check out this idea!')}&url=${encodeURIComponent(shareUrl)}`
    : null;

  const [aiChatMessage, setAiChatMessage] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiChatHistory, setAiChatHistory] = useState<Array<{type: 'user' | 'ai', content: string, idea?: any}>>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [selectedText, setSelectedText] = useState<string>('');
  const [selectionPosition, setSelectionPosition] = useState<{x: number, y: number} | null>(null);
  const [pendingRefinement, setPendingRefinement] = useState<{content: string, originalIdea: Idea} | null>(null);

  const handleAiChatSend = async () => {
    if (!aiChatMessage.trim() || isAiGenerating) return;
    
    const userMessage = aiChatMessage.trim();
    setAiChatMessage('');
    setAiChatHistory(prev => [...prev, { type: 'user', content: userMessage }]);
    setIsAiGenerating(true);

    try {
      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          context: `Refining this idea: ${idea.idea.substring(0, 500)}...\n\nUser request: ${userMessage}`,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      // Parse the idea
      const parseIdea = (text: string) => {
        const parsed: any = {};
        const titleMatch = text.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i) || text.match(/^(.+?)(?:\n|$)/);
        if (titleMatch) parsed.title = titleMatch[1].trim();
        const descMatch = text.match(/\*\*Description:\*\*\s*([\s\S]+?)(?:\n\n|\*\*)/i);
        if (descMatch) parsed.description = descMatch[1].trim();
        const featuresMatch = text.match(/\*\*Key Features[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
        if (featuresMatch) {
          parsed.features = featuresMatch[1]
            .split(/\n[-•*]\s*/)
            .filter(f => f.trim().length > 0)
            .map(f => f.trim().replace(/^[-•*]\s*/, ''));
        }
        const useCasesMatch = text.match(/\*\*Potential Use Cases[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
        if (useCasesMatch) {
          parsed.useCases = useCasesMatch[1]
            .split(/\n[-•*]\s*/)
            .filter(u => u.trim().length > 0)
            .map(u => u.trim().replace(/^[-•*]\s*/, ''));
        }
        const tagsMatch = text.match(/\*\*Suggested Tags[^:]*:\*\*\s*(.+?)(?:\n\n|$)/i);
        if (tagsMatch) {
          parsed.tags = tagsMatch[1]
            .split(/[,•]/)
            .map(t => t.trim())
            .filter(t => t.length > 0);
        }
        return parsed;
      };

      const parsedIdea = parseIdea(data.idea);
      setAiChatHistory(prev => [...prev, { type: 'ai', content: data.idea, idea: parsedIdea }]);
      setPendingRefinement({ content: data.idea, originalIdea: idea });
    } catch (error: any) {
      notify.error(error.message || 'Failed to get AI response');
    } finally {
      setIsAiGenerating(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden bg-white">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between p-6 pb-4 flex-shrink-0 border-b border-gray-200">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5 text-[#4780C6]" />
            <h2 className="text-2xl font-bold text-gray-900">
              {idea.formatted_idea?.title || 'Generated Idea'}
            </h2>
          </div>
          <p className="text-sm text-gray-500 mb-1">
            <span className="font-medium">Prompt:</span> {idea.prompt}
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>{new Date(idea.created_at).toLocaleString()}</span>
            {viewers.length > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {viewers.length} {viewers.length === 1 ? 'viewer' : 'viewers'}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={actionsMenuRef}>
            <button
              onClick={() => setShowActionsMenu(!showActionsMenu)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Actions menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            {showActionsMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-2">
                <button
                  onClick={() => {
                    onConvertToProject();
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                >
                  <Rocket className="w-4 h-4 text-[#4780C6]" />
                  <span>Convert to Project</span>
                </button>
                <button
                  onClick={() => {
                    copyShareUrl();
                    setShowActionsMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                >
                  {shareUrl ? (
                    <>
                      <Check className="w-4 h-4 text-green-500" />
                      <span>Link Copied</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </>
                  )}
                </button>
                {twitterShareUrl && (
                  <a
                    href={twitterShareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowActionsMenu(false)}
                    className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>Share on X</span>
                  </a>
                )}
                {isOwner && (
                  <>
                    <div className="border-t border-gray-200 my-1" />
                    <button
                      onClick={() => {
                        setShowCoverSelector(true);
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-gray-50 transition-colors text-sm"
                    >
                      <ImageIcon className="w-4 h-4" />
                      <span>Cover</span>
                    </button>
                    <button
                      onClick={() => {
                        onDelete(idea.id);
                        setShowActionsMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 text-red-600 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              router.push(`/ideator/idea/${idea.id}`);
              onClose();
            }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Open in full view"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content - Scrollable (includes cover image) */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="px-6 pb-6">
          {/* Cover Image */}
          {idea.cover_image_url && (
            <div className="mb-6 pt-6">
              <div className="relative h-48 rounded-lg overflow-hidden border border-gray-200">
                <img
                  src={idea.cover_image_url}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                {isOwner && (
                  <button
                    onClick={() => setShowCoverSelector(true)}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 text-white rounded-lg transition-colors"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}
        {idea.formatted_idea?.title && (
          <div className="space-y-6">
            {idea.formatted_idea.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                <p className="text-gray-600 leading-relaxed">{idea.formatted_idea.description}</p>
              </div>
            )}

            {idea.formatted_idea.features && idea.formatted_idea.features.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Features</h3>
                <ul className="space-y-2">
                  {idea.formatted_idea.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <span className="text-[#4780C6] mt-1">•</span>
                      <span className="select-text">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {idea.formatted_idea.useCases && idea.formatted_idea.useCases.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Use Cases</h3>
                <ul className="space-y-2">
                  {idea.formatted_idea.useCases.map((useCase, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-gray-600">
                      <span className="text-[#4780C6] mt-1">•</span>
                      <span className="select-text">{useCase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {idea.formatted_idea.tags && idea.formatted_idea.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {idea.formatted_idea.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-[#4780C6]/10 text-[#4780C6] rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!idea.formatted_idea?.title && (
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed select-text">
              {idea.idea}
            </div>
          </div>
        )}

        {/* Text Selection Tooltip */}
        {selectedText && selectionPosition && (
          <div
            className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2"
            style={{
              left: `${selectionPosition.x}px`,
              top: `${selectionPosition.y}px`,
              transform: 'translateX(-50%) translateY(-100%)',
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <button
              onClick={() => {
                setAiChatMessage(prev => prev ? `${prev}\n\n"${selectedText}"` : `"${selectedText}"`);
                setSelectedText('');
                setSelectionPosition(null);
                notify.success('Text added to chat');
              }}
              className="hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              Add to chat
            </button>
            <button
              onClick={() => {
                setSelectedText('');
                setSelectionPosition(null);
              }}
              className="hover:bg-gray-700 px-2 py-1 rounded transition-colors"
            >
              ✕
            </button>
          </div>
        )}

        {/* Conversations */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Conversation ({conversations.length})
          </h3>
          <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
            {conversations.map((conv) => (
              <div key={conv.id} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                  {conv.user?.user_metadata?.firstName?.charAt(0) || conv.user?.email?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900">
                      {conv.user?.user_metadata?.firstName || conv.user?.email?.split('@')[0] || 'User'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(conv.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{conv.message}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Add a comment or suggestion..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-sm"
            />
            <button
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
              className="px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        </div>
      </div>

      {/* Actions - Fixed at bottom */}
      <div className="flex-shrink-0 pt-6 px-6 pb-6 border-t border-gray-200 space-y-4 bg-white">
        {/* Collaboration Section */}
        {isOwner && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Collaborators ({collaborations.length})
              </h3>
              <button
                onClick={() => {
                  if (inviteEmail && inviteEmail.trim()) {
                    setInviteEmail('');
                  } else {
                    setInviteEmail('');
                    // Trigger input to show by setting a space then clearing it
                    setTimeout(() => {
                      const input = document.querySelector('input[type="email"][placeholder="Enter email address"]') as HTMLInputElement;
                      if (input) {
                        input.focus();
                      }
                    }, 0);
                  }
                }}
                className="text-xs text-[#4780C6] hover:text-[#4780C6]/80 transition-colors"
              >
                {inviteEmail && inviteEmail.trim() ? 'Cancel' : 'Invite'}
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && inviteEmail.trim()) {
                    handleInvite();
                  }
                }}
              />
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'collaborator' | 'viewer')}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-sm"
              >
                <option value="collaborator">Collaborator</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={handleInvite}
                disabled={isInviting || !inviteEmail.trim()}
                className="px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 active:bg-[#4780C6]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {isInviting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
              </button>
            </div>
            {collaborations.length > 0 ? (
              <div className="space-y-2">
                {collaborations.map((collab) => (
                  <div key={collab.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm text-gray-900">{collab.email}</span>
                      <span className="text-xs text-gray-500 ml-2">({collab.role})</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${collab.status === 'accepted' ? 'bg-green-100 text-green-700' : collab.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                      {collab.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}


        {/* Refine Section */}
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            How would you like to refine this idea?
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={refinePrompt}
              onChange={(e) => setRefinePrompt(e.target.value)}
              placeholder="E.g., Make it more focused on mobile users..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onRefine(refinePrompt);
                }
              }}
            />
            <button
              onClick={() => onRefine(refinePrompt)}
              disabled={!refinePrompt.trim() || isRefining}
              className="px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 active:bg-[#4780C6]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isRefining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* AI Chat Panel - Right Side */}
      <div className="w-80 border-l border-gray-200 flex flex-col bg-gray-50 flex-shrink-0 h-full">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#4780C6]" />
            AI Refinement Chat
          </h3>
          <p className="text-xs text-gray-500 mt-1">Ask AI to refine or improve this idea</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
          {aiChatHistory.length === 0 && (
            <div className="text-center text-sm text-gray-500 py-8">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Start a conversation to refine your idea</p>
            </div>
          )}
          {aiChatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                msg.type === 'user'
                  ? 'bg-[#4780C6] text-white'
                  : 'bg-white border border-gray-200 text-gray-800'
              }`}>
                {msg.type === 'ai' && msg.idea ? (
                  <div>
                    <p className="whitespace-pre-wrap mb-3">{msg.content}</p>
                    {idx === aiChatHistory.length - 1 && pendingRefinement && (
                      <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={async () => {
                            try {
                              const parseIdea = (text: string) => {
                                const parsed: any = {};
                                const titleMatch = text.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i) || text.match(/^(.+?)(?:\n|$)/);
                                if (titleMatch) parsed.title = titleMatch[1].trim();
                                const descMatch = text.match(/\*\*Description:\*\*\s*([\s\S]+?)(?:\n\n|\*\*)/i);
                                if (descMatch) parsed.description = descMatch[1].trim();
                                const featuresMatch = text.match(/\*\*Key Features[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
                                if (featuresMatch) {
                                  parsed.features = featuresMatch[1]
                                    .split(/\n[-•*]\s*/)
                                    .filter(f => f.trim().length > 0)
                                    .map(f => f.trim().replace(/^[-•*]\s*/, ''));
                                }
                                const useCasesMatch = text.match(/\*\*Potential Use Cases[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
                                if (useCasesMatch) {
                                  parsed.useCases = useCasesMatch[1]
                                    .split(/\n[-•*]\s*/)
                                    .filter(u => u.trim().length > 0)
                                    .map(u => u.trim().replace(/^[-•*]\s*/, ''));
                                }
                                const tagsMatch = text.match(/\*\*Suggested Tags[^:]*:\*\*\s*(.+?)(?:\n\n|$)/i);
                                if (tagsMatch) {
                                  parsed.tags = tagsMatch[1]
                                    .split(/[,•]/)
                                    .map(t => t.trim())
                                    .filter(t => t.length > 0);
                                }
                                return parsed;
                              };
                              const formattedIdea = parseIdea(pendingRefinement.content);
                              await updateIdea(idea.id, {
                                idea: pendingRefinement.content,
                                formatted_idea: formattedIdea,
                              });
                              notify.success('Refinement accepted! Idea updated.');
                              setPendingRefinement(null);
                              window.location.reload();
                            } catch (error: any) {
                              notify.error('Failed to accept refinement');
                            }
                          }}
                          className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-xs font-medium hover:bg-green-600 transition-colors"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => {
                            setPendingRefinement(null);
                            notify.info('Refinement rejected');
                          }}
                          className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-medium hover:bg-gray-300 transition-colors"
                        >
                          ✕ Reject
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}
          {isAiGenerating && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin text-[#4780C6]" />
              </div>
            </div>
          )}
        </div>

        {/* Drop Zone Above Input */}
        <div 
          className={`mx-4 mb-2 p-3 border-2 border-dashed rounded-lg transition-all ${
            isDraggingOver 
              ? 'border-purple-400 bg-purple-50 scale-105' 
              : 'border-transparent bg-transparent'
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOver(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDraggingOver(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDraggingOver(false);
            try {
              const ideaData = e.dataTransfer.getData('application/json');
              if (ideaData) {
                const idea = JSON.parse(ideaData);
                const ideaText = idea.description || idea.title || idea.fullIdea || '';
                if (ideaText) {
                  setAiChatMessage(`Continue refining: "${ideaText.substring(0, 200)}${ideaText.length > 200 ? '...' : ''}"`);
                  notify.success('Idea card dropped! Continue the conversation below.');
                }
              }
            } catch (err) {
              console.error('Error handling drop:', err);
            }
          }}
        >
          {isDraggingOver && (
            <p className="text-xs text-center text-purple-600 font-medium">
              Drop idea here to continue conversation
            </p>
          )}
        </div>

        <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
          {aiChatHistory.length === 0 && (
            <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-700">
                💡 <strong>Tip:</strong> Describe how you'd like to improve this idea. You can also drag idea cards from the sidebar into the drop zone above to continue refining them.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={aiChatMessage}
              onChange={(e) => setAiChatMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAiChatSend();
                }
              }}
              placeholder="Ask AI to refine..."
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-sm"
              disabled={isAiGenerating}
            />
            <button
              onClick={handleAiChatSend}
              disabled={!aiChatMessage.trim() || isAiGenerating}
              className="px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 active:bg-[#4780C6]/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              {isAiGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Cover Selector Modal */}
      {showCoverSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Select Cover Image</h2>
              <button
                onClick={() => setShowCoverSelector(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">System Covers</h3>
                <div className="grid grid-cols-3 gap-4">
                  {SYSTEM_COVERS.map((cover) => (
                    <button
                      key={cover}
                      onClick={() => handleCoverSelect(cover)}
                      className="relative aspect-video rounded-lg overflow-hidden border-2 border-gray-200 hover:border-[#4780C6] transition-colors group"
                    >
                      <img
                        src={cover}
                        alt="Cover"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image doesn't exist
                          e.currentTarget.src = `https://via.placeholder.com/400x300/4780C6/ffffff?text=${cover.split('/').pop()?.replace('.jpg', '')}`;
                        }}
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Upload Your Own</h3>
                <label className="flex items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#4780C6] transition-colors">
                  {isUploadingCover ? (
                    <Loader2 className="w-8 h-8 animate-spin text-[#4780C6]" />
                  ) : (
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                      <span className="text-xs text-gray-400 block mt-1">PNG, JPG up to 5MB</span>
                    </div>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    disabled={isUploadingCover}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




