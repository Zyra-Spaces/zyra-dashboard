'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useAuth } from '@/contexts/auth-context';
import { useProfile } from '@/hooks/use-profile';
import { InlineNotification, notify } from '@/components/ui/inline-notification';
import { saveIdea, getUserIdeas, getUserIdeasPaginated, deleteIdea, getIdeaCount, updateIdea, type Idea } from '@/lib/supabase/ideas';
import { saveProject } from '@/lib/supabase/projects';
import { extractErrorInfo, getErrorDebugInfo } from '@/lib/utils/error-extractor';
import { EnhancedIdeaDetail } from '@/components/ideator/enhanced-idea-detail';
import { AnimatedIdeaCard } from '@/components/ideator/animated-idea-card';
import { EditorJSEditor } from '@/components/ideator/editorjs-editor';
import { OutputData } from '@editorjs/editorjs';
import { convertTextToEditorBlocks, convertEditorBlocksToText } from '@/lib/utils/editorjs-helpers';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Lightbulb, 
  Copy,
  Check,
  Zap,
  Rocket,
  X,
  Edit3,
  Trash2,
  Home,
  Briefcase,
  Settings,
  Bell,
  Search,
  MoreVertical,
  CheckCircle2,
  Pin,
  Save
} from 'lucide-react';
import { IdeaCardSkeleton, Skeleton } from '@/components/ui/skeleton';

const DEFAULT_CONTEXT = `You are helping a user generate innovative project ideas. The user wants creative, feasible, and well-structured project concepts that can be turned into real products or services. Focus on practical solutions with clear value propositions.`;

// Color palette for pinned notes
const NOTE_COLORS = [
  { name: 'yellow', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-900', accent: 'bg-yellow-100' },
  { name: 'pink', bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-900', accent: 'bg-pink-100' },
  { name: 'blue', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', accent: 'bg-blue-100' },
  { name: 'green', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-900', accent: 'bg-green-100' },
  { name: 'purple', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-900', accent: 'bg-purple-100' },
  { name: 'orange', bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-900', accent: 'bg-orange-100' },
];

function getRandomColor() {
  return NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)];
}

export default function IdeatorPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [refinePrompt, setRefinePrompt] = useState('');
  const [ideaCount, setIdeaCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingText, setGeneratingText] = useState('');
  const [parsedGeneratedIdea, setParsedGeneratedIdea] = useState<any>(null);
  const [conversationHistory, setConversationHistory] = useState<Array<{type: 'user' | 'ai', content: string, idea?: any}>>([]);
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<OutputData | null>(null);
  const editorRef = useRef<any>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  const [showIdeasSidebar, setShowIdeasSidebar] = useState(true);
  const [showAiPanel, setShowAiPanel] = useState(true);
  const [editorContent, setEditorContent] = useState<OutputData | null>(null);
  const [isSavingEditorIdea, setIsSavingEditorIdea] = useState(false);

  const displayName = profile?.firstName && profile?.lastName
    ? `${profile.firstName} ${profile.lastName}`
    : profile?.firstName || profile?.lastName || user?.email?.split('@')[0] || 'User';

  const mainColSpan = useMemo(() => {
    if (showIdeasSidebar && showAiPanel) return 'lg:col-span-6';
    if (showIdeasSidebar || showAiPanel) return 'lg:col-span-9';
    return 'lg:col-span-12';
  }, [showIdeasSidebar, showAiPanel]);

  // Default sidebar visibility: collapse on mobile
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isMobile = window.innerWidth < 1024;
    setShowIdeasSidebar(!isMobile);
    setShowAiPanel(!isMobile);
    // Reset editor content on load
    setEditorContent(null);
  }, []);

  // Load ideas from Supabase
  useEffect(() => {
    loadIdeas();
  }, []);

  // Rate limit countdown timer
  useEffect(() => {
    if (rateLimitCountdown === null || rateLimitCountdown <= 0) {
      if (rateLimitCountdown === 0) {
        setRateLimitCountdown(null);
        notify.success('You can generate ideas again!');
      }
      return;
    }

    const timer = setInterval(() => {
      setRateLimitCountdown(prev => {
        if (prev === null || prev <= 1) {
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [rateLimitCountdown]);

  const loadIdeas = async () => {
    try {
      setIsLoading(true);
      setCurrentPage(1);
      setHasMore(true);
      const userIdeas = await getUserIdeasPaginated(1, PAGE_SIZE);
      setIdeas(userIdeas);
      setHasMore(userIdeas.length === PAGE_SIZE);
      const count = await getIdeaCount();
      setIdeaCount(count);
    } catch (error: any) {
      // Extract error information using utility
      const errorInfo = extractErrorInfo(error);
      const debugInfo = getErrorDebugInfo(error);
      
      console.error('Error loading ideas:', {
        message: errorInfo.message,
        code: errorInfo.code,
        details: errorInfo.details,
        hint: errorInfo.hint,
        errorString: String(error),
        errorType: typeof error,
        fullError: error,
        ...debugInfo,
      });
      
      // Provide helpful error message
      if (errorInfo.code === 'PGRST116' || errorInfo.message.includes('relation') || errorInfo.message.includes('does not exist')) {
        notify.error('Database table not found. Please run the SQL setup script in Supabase.');
      } else if (errorInfo.code === '42501' || errorInfo.message.includes('permission denied') || errorInfo.message.includes('policy')) {
        notify.error('Permission denied. Please check Row Level Security policies in Supabase.');
      } else {
        notify.error(errorInfo.message || 'Failed to load ideas. Please check if the database tables are set up correctly.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load more ideas when sentinel is visible
  const loadMoreIdeas = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const moreIdeas = await getUserIdeasPaginated(nextPage, PAGE_SIZE);
      
      if (moreIdeas.length === 0) {
        setHasMore(false);
      } else {
        setIdeas(prev => [...prev, ...moreIdeas]);
        setCurrentPage(nextPage);
        setHasMore(moreIdeas.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error loading more ideas:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [currentPage, isLoadingMore, hasMore]);

  // Intersection observer for lazy loading
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadMoreIdeas();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observer.observe(sentinelRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, isLoading, loadMoreIdeas]);

  // Get context from previous chat history
  const getContext = useMemo(() => {
    if (ideas.length === 0) {
      return DEFAULT_CONTEXT;
    }
    const recentIdeas = ideas.slice(0, 3);
    const contextParts = recentIdeas.map(idea => 
      `Previous idea: ${idea.prompt} - ${idea.idea.substring(0, 200)}...`
    );
    return `${DEFAULT_CONTEXT}\n\nRecent conversation context:\n${contextParts.join('\n\n')}`;
  }, [ideas]);

  // Parse idea text into structured format
  const parseIdea = (text: string) => {
    const parsed: any = {};
    
    const titleMatch = text.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i) || text.match(/^(.+?)(?:\n|$)/);
    if (titleMatch) parsed.title = titleMatch[1].trim();
    
    const descMatch = text.match(/\*\*Description:\*\*\s*([\s\S]+?)(?:\n\n|\*\*)/i);
    if (descMatch) parsed.description = descMatch[1].trim();
    
    const featuresMatch = text.match(/\*\*Key Features[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
    if (featuresMatch) {
      const featuresText = featuresMatch[1];
      parsed.features = featuresText
        .split(/\n[-•*]\s*/)
        .filter(f => f.trim().length > 0)
        .map(f => f.trim().replace(/^[-•*]\s*/, ''));
    }
    
    const useCasesMatch = text.match(/\*\*Potential Use Cases[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
    if (useCasesMatch) {
      const useCasesText = useCasesMatch[1];
      parsed.useCases = useCasesText
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

  const handleGenerate = async (refineIdea?: Idea) => {
    const currentPrompt = refineIdea ? refinePrompt : prompt;
    if (!currentPrompt.trim()) {
      notify.error('Please enter a prompt to generate an idea');
      return;
    }

    setIsGenerating(true);
    setGeneratingText(''); // Reset generating text
    try {
      const context = refineIdea 
        ? `${getContext}\n\nUser wants to refine this idea: ${refineIdea.idea.substring(0, 500)}...\n\nRefinement request: ${refinePrompt}`
        : getContext;

      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: currentPrompt.trim(), 
          context: context 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = data.retryAfter || 30;
          setRateLimitCountdown(Math.ceil(retryAfter));
          notify.error(
            `Rate limit exceeded. Please wait ${Math.ceil(retryAfter)} seconds.`
          );
          throw new Error(
            `Rate limit exceeded. Please wait ${Math.ceil(retryAfter)} seconds before trying again.`
          );
        }
        throw new Error(data.error || 'Failed to generate idea');
      }

      // Set the generated text for the animated card
      setGeneratingText(data.idea);

      const formattedIdea = parseIdea(data.idea);
      setParsedGeneratedIdea(formattedIdea);
      
      // Add to conversation history
      setConversationHistory(prev => [
        ...prev,
        { type: 'user', content: currentPrompt.trim() },
        { type: 'ai', content: data.idea, idea: formattedIdea }
      ]);
      
      const color = getRandomColor();
      
      try {
        // Convert AI-generated text to Editor.js format
        const editorContent = convertTextToEditorBlocks(data.idea);
        
        const newIdea = await saveIdea({
          prompt: currentPrompt.trim(),
          idea: data.idea,
          editor_content: editorContent,
          formatted_idea: formattedIdea,
          context: refineIdea ? refinePrompt : undefined,
          color: color.name,
        });

        await loadIdeas();
        if (!refineIdea) {
          setPrompt('');
        }
        setRefinePrompt('');
        
        // Clear parsed idea after a delay to show it briefly
        setTimeout(() => {
          setParsedGeneratedIdea(null);
          setGeneratingText('');
        }, 3000);
        
        // If refining, select the new refined idea; otherwise close modal
        if (refineIdea) {
          // Find and select the newly created refined idea
          const updatedIdeas = await getUserIdeas();
          const newRefinedIdea = updatedIdeas.find(i => 
            i.prompt === currentPrompt.trim() && 
            i.created_at > new Date(Date.now() - 5000).toISOString()
          );
          if (newRefinedIdea) {
            setSelectedIdea(newRefinedIdea);
            notify.success('Idea refined and saved!');
          } else {
            setSelectedIdea(null);
            notify.success('Idea refined and saved!');
          }
        } else {
          setSelectedIdea(null);
          notify.success('Idea generated and saved!');
        }
      } catch (saveError: any) {
        // Error saving to database - extract properly
        const errorInfo = extractErrorInfo(saveError);
        const debugInfo = getErrorDebugInfo(saveError);
        
        console.error('Error saving idea to database:', {
          ...errorInfo,
          ...debugInfo,
        });
        
        if (errorInfo.code === 'PGRST116' || errorInfo.message.includes('relation') || errorInfo.message.includes('does not exist')) {
          notify.error('Database table not found. Please run the SQL setup script in Supabase.');
        } else if (errorInfo.code === '42501' || errorInfo.message.includes('permission denied') || errorInfo.message.includes('policy')) {
          notify.error('Permission denied. Please check Row Level Security policies in Supabase.');
        } else if (errorInfo.code === '42P17' || errorInfo.message.includes('infinite recursion')) {
          notify.error('Database policy error. Please run the updated SQL script to fix RLS policies.');
        } else {
          notify.error(errorInfo.message || 'Failed to save idea. The idea was generated but could not be saved.');
        }
        throw saveError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      // Error from API call or saving - extract properly
      const errorInfo = extractErrorInfo(error);
      const debugInfo = getErrorDebugInfo(error);
      
      console.error('Error generating idea:', {
        ...errorInfo,
        ...debugInfo,
      });
      
      // Provide more helpful error messages
      if (errorInfo.code === 'PGRST116' || errorInfo.message.includes('relation') || errorInfo.message.includes('does not exist')) {
        notify.error('Database table not found. Please run the SQL setup script in Supabase.');
      } else if (errorInfo.code === '42501' || errorInfo.message.includes('permission denied') || errorInfo.message.includes('policy')) {
        notify.error('Permission denied. Please check Row Level Security policies in Supabase.');
      } else if (errorInfo.code === '42P17' || errorInfo.message.includes('infinite recursion')) {
        notify.error('Database policy error. Please run the updated SQL script to fix RLS policies.');
      } else {
        notify.error(errorInfo.message || 'Failed to generate idea. Please try again.');
      }
    } finally {
      // Keep the text visible for a moment after generation completes
      setTimeout(() => {
        setIsGenerating(false);
        // Clear generating text after animation completes
        setTimeout(() => setGeneratingText(''), 1000);
      }, 500);
    }
  };

  const handleRefine = (refinePrompt: string) => {
    if (!selectedIdea) return;
    if (!refinePrompt.trim()) {
      notify.error('Please enter a refinement prompt');
      return;
    }
    setRefinePrompt(refinePrompt);
    handleGenerate(selectedIdea);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this idea?')) return;
    
    try {
      await deleteIdea(id);
      await loadIdeas();
      if (selectedIdea?.id === id) {
        setSelectedIdea(null);
        setEditorContent(null);
      }
      notify.success('Idea deleted');
    } catch (error: any) {
      console.error('Error deleting idea:', error);
      notify.error('Failed to delete idea');
    }
  };

  // Load selected idea into editor
  useEffect(() => {
    if (selectedIdea?.editor_content) {
      setEditorContent(selectedIdea.editor_content);
    } else if (selectedIdea?.idea) {
      const blocks = convertTextToEditorBlocks(selectedIdea.idea);
      setEditorContent(blocks);
    } else {
      setEditorContent(null);
    }
  }, [selectedIdea]);

  const handleSaveEditorIdea = async (content: OutputData) => {
    if (isSavingEditorIdea) return;
    setIsSavingEditorIdea(true);
    try {
      const plain = convertEditorBlocksToText(content);
      if (selectedIdea) {
        await updateIdea(selectedIdea.id, {
          editor_content: content,
          idea: plain.substring(0, 500),
        });
        await loadIdeas();
        notify.success('Idea updated');
      } else {
        const color = getRandomColor();
        const newIdea = await saveIdea({
          prompt: plain.substring(0, 80) || 'Untitled idea',
          idea: plain.substring(0, 500),
          editor_content: content,
          color: color.name,
        });
        await loadIdeas();
        setSelectedIdea(newIdea);
        notify.success('Idea saved');
      }
    } catch (error) {
      console.error('Error saving editor content:', error);
      notify.error('Failed to save idea');
    } finally {
      setIsSavingEditorIdea(false);
    }
  };

  const handleCopy = async (idea: string, id: string) => {
    try {
      await navigator.clipboard.writeText(idea);
      setCopiedId(id);
      notify.success('Idea copied to clipboard!');
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      notify.error('Failed to copy idea');
    }
  };

  const handleConvertToProject = () => {
    if (!selectedIdea) return;
    setShowProjectModal(true);
  };

  const handleCreateProject = async (title: string, description: string, isPublic: boolean) => {
    try {
      await saveProject({
        title: title || selectedIdea?.formatted_idea?.title || 'New Project',
        description: description || selectedIdea?.formatted_idea?.description || selectedIdea?.idea,
        source_idea_id: selectedIdea?.id,
        status: 'active',
        is_public: isPublic,
      });
      
      notify.success('Project created successfully!');
      setShowProjectModal(false);
      setSelectedIdea(null);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Error creating project:', error);
      notify.error(error.message || 'Failed to create project');
    }
  };

  const getColorClass = (colorName?: string | null) => {
    const color = NOTE_COLORS.find(c => c.name === colorName) || getRandomColor();
    return color;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        <InlineNotification className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-md" />
        
        {/* Top Header - Same as Dashboard */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-[1920px] mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              {/* Left: Logo + Navigation */}
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-[#4780C6] rounded flex items-center justify-center">
                    <span className="text-white font-bold text-lg">Z</span>
                  </div>
                  <span className="text-xl font-semibold text-gray-900">Zyra</span>
                </div>
                
                <nav className="flex items-center gap-6">
                  <Link 
                    href="/dashboard" 
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </Link>
                  <Link 
                    href="/workspaces" 
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <Briefcase className="w-4 h-4" />
                    Workspaces
                  </Link>
                  <Link 
                    href="/ideator" 
                    className="flex items-center gap-2 text-sm font-medium text-[#4780C6] hover:text-[#4780C6]/80 transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    ideator
                    {ideaCount > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{ideaCount}</span>
                    )}
                  </Link>
                </nav>
              </div>

              {/* Right: Actions + Profile */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all text-sm font-medium">
                  <Zap className="w-4 h-4" />
                  Upgrade now
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                  <Settings className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                <Link href="/profile" className="flex items-center">
                  {profile?.profilePic ? (
                    <img 
                      src={profile.profilePic} 
                      alt="Profile" 
                      className="w-10 h-10 rounded-full object-cover border-2 border-gray-200 cursor-pointer hover:border-[#4780C6] transition-colors"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold cursor-pointer hover:ring-2 hover:ring-[#4780C6] transition-all">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Three Column Layout */}
        <div className="max-w-[1920px] mx-auto px-6 py-6 h-[calc(100vh-4rem)] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowIdeasSidebar(prev => !prev)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showIdeasSidebar ? 'Hide ideas' : 'Show ideas'}
              </button>
              <button
                onClick={() => setShowAiPanel(prev => !prev)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {showAiPanel ? 'Hide AI' : 'Show AI'}
              </button>
            </div>
            <p className="text-xs text-gray-500">Editor-first workflow • AI assist on the right</p>
          </div>
          <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
            {/* Left Sidebar - Ideas List */}
            {showIdeasSidebar && (
            <aside className="col-span-12 lg:col-span-3 flex flex-col min-h-0">
              {/* Search Bar */}
              <div className="relative mb-4 flex-shrink-0">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Find the next idea"
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent text-sm"
                />
              </div>

              {/* Ideas List - Scrollable */}
              <div className="bg-white border border-gray-200 rounded-xl flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
                  <h3 className="font-semibold text-gray-900">Your Ideas</h3>
                  <span className="text-xs text-gray-500">{ideaCount} {ideaCount === 1 ? 'idea' : 'ideas'}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {isLoading ? (
                    <>
                      <IdeaCardSkeleton />
                      <IdeaCardSkeleton />
                      <IdeaCardSkeleton />
                      <IdeaCardSkeleton />
                    </>
                  ) : ideas.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">No ideas yet. Start creating!</p>
                  ) : (
                    <>
                      {ideas.map((idea) => {
                        const colorClass = getColorClass(idea.color);
                        return (
                          <div
                            key={idea.id}
                            onClick={() => setSelectedIdea(idea)}
                            draggable
                            onDragStart={(e) => {
                              const ideaData = JSON.stringify({
                                title: idea.formatted_idea?.title,
                                description: idea.formatted_idea?.description,
                                features: idea.formatted_idea?.features,
                                tags: idea.formatted_idea?.tags,
                                fullIdea: idea.idea,
                              });
                              e.dataTransfer.setData('application/json', ideaData);
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                            className={`${colorClass.bg} ${colorClass.border} border-2 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-all relative ${
                              selectedIdea?.id === idea.id ? 'ring-2 ring-[#4780C6] ring-offset-2' : ''
                            }`}
                          >
                            <div className="absolute top-2 right-2">
                              <Pin className={`w-3.5 h-3.5 ${colorClass.text} opacity-50`} />
                            </div>
                            <h4 className={`font-bold text-base mb-2 ${colorClass.text} line-clamp-2`}>
                              {idea.formatted_idea?.title || idea.prompt.substring(0, 50) + '...'}
                            </h4>
                            <p className={`text-xs mb-3 ${colorClass.text} opacity-80 line-clamp-2`}>
                              {idea.formatted_idea?.description || idea.idea.substring(0, 100) + '...'}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className={`text-xs ${colorClass.text} opacity-60`}>
                                {new Date(idea.created_at).toLocaleDateString()}
                              </span>
                              {idea.formatted_idea?.tags && idea.formatted_idea.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {idea.formatted_idea.tags.slice(0, 2).map((tag, idx) => (
                                    <span
                                      key={idx}
                                      className={`px-2 py-0.5 ${colorClass.accent} ${colorClass.text} rounded text-xs font-medium`}
                                    >
                                      {tag.substring(0, 8)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                      {/* Sentinel for lazy loading */}
                      <div ref={sentinelRef} className="h-1" />
                      
                      {/* Loading more indicator */}
                      {isLoadingMore && (
                        <div className="flex items-center justify-center py-3">
                          <Loader2 className="w-4 h-4 animate-spin text-[#4780C6]" />
                          <span className="ml-2 text-xs text-gray-500">Loading more...</span>
                        </div>
                      )}
                      
                      {/* End of list indicator */}
                      {!hasMore && ideas.length > 0 && (
                        <div className="text-center py-2">
                          <p className="text-xs text-gray-400">All ideas loaded</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </aside>
            )}

            {/* Center Content - Skeleton Card + Input */}
            <main className={`col-span-12 ${mainColSpan} flex flex-col min-h-0`}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-[#4780C6]" />
                </div>
              ) : (
                <>
                  {/* Empty State or Welcome Message */}
                  {ideas.length === 0 && !isGenerating && (
                    <div className="text-center py-12 bg-white border border-gray-200 rounded-xl mb-6">
                      <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#4780C6]/20 to-purple-500/20 rounded-full mb-6">
                        <Lightbulb className="w-10 h-10 text-[#4780C6]" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Ideator</h2>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Get started by describing what you&apos;re looking for, and our AI will help you create innovative project ideas.
                      </p>
                    </div>
                  )}

                  {/* Conversation History */}
                  {conversationHistory.length > 0 && (
                    <div className="space-y-4 mb-6">
                      {conversationHistory.map((item, idx) => (
                        <div key={idx} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                          {item.type === 'ai' && item.idea ? (
                            <AnimatedIdeaCard 
                              isGenerating={false}
                              parsedIdea={item.idea}
                              onSelectText={(text) => {
                                setPrompt(prev => prev ? `${prev}\n\nReference: "${text}"` : `Reference: "${text}"`);
                              }}
                            />
                          ) : (
                            <div className={`max-w-[80%] p-3 rounded-lg ${
                              item.type === 'user' 
                                ? 'bg-[#4780C6] text-white' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              <p className="text-sm">{item.content}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Animated Idea Skeleton Card - Above Input */}
                  {!editingIdeaId && (
                    <AnimatedIdeaCard 
                      isGenerating={isGenerating} 
                      generatedText={generatingText}
                      parsedIdea={parsedGeneratedIdea}
                      onSelectText={(text) => {
                        setPrompt(prev => prev ? `${prev}\n\nReference: "${text}"` : `Reference: "${text}"`);
                      }}
                      onEdit={async (ideaId, content) => {
                        setEditingIdeaId(ideaId);
                        // If editing an existing idea, try to load editor_content first
                        if (ideaId && ideaId !== 'generated') {
                          const idea = ideas.find(i => i.id === ideaId);
                          if (idea?.editor_content) {
                            setEditContent(idea.editor_content);
                          } else {
                            // Convert text to Editor.js format
                            const blocks = content.split('\n\n').filter(Boolean).map(text => ({
                              type: 'paragraph',
                              data: { text: text.trim() }
                            }));
                            setEditContent({
                              time: Date.now(),
                              blocks,
                              version: '2.28.0'
                            });
                          }
                        } else {
                          // For generated ideas, convert text to Editor.js format
                          const blocks = content.split('\n\n').filter(Boolean).map(text => {
                            if (text.startsWith('**') && text.includes(':**')) {
                              return {
                                type: 'header',
                                data: { 
                                  text: text.replace(/\*\*/g, '').split(':')[0].trim(),
                                  level: 2
                                }
                              };
                            }
                            return {
                              type: 'paragraph',
                              data: { text: text.trim() }
                            };
                          });
                          setEditContent({
                            time: Date.now(),
                            blocks,
                            version: '2.28.0'
                          });
                        }
                      }}
                      ideaId={parsedGeneratedIdea ? 'generated' : null}
                      rawContent={generatingText}
                    />
                  )}

                  {/* Rich Text Editor for Editing */}
                  {editingIdeaId && (
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-gray-700">Editing Idea</h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async () => {
                              if (editingIdeaId && editingIdeaId !== 'generated' && editContent) {
                                try {
                                  await updateIdea(editingIdeaId, { 
                                    editor_content: editContent,
                                    idea: editContent.blocks.map(b => {
                                      if (b.type === 'paragraph') return (b.data as any).text;
                                      if (b.type === 'header') return (b.data as any).text;
                                      return '';
                                    }).join('\n').substring(0, 500)
                                  });
                                  await loadIdeas();
                                  notify.success('Idea updated!');
                                } catch (error) {
                                  notify.error('Failed to update idea');
                                }
                              } else if (editingIdeaId === 'generated' && parsedGeneratedIdea && editContent) {
                                // Save as new idea
                                const color = getRandomColor();
                                await saveIdea({
                                  prompt: prompt.replace(/<[^>]*>/g, ''),
                                  idea: editContent.blocks.map(b => {
                                    if (b.type === 'paragraph') return (b.data as any).text;
                                    if (b.type === 'header') return (b.data as any).text;
                                    return '';
                                  }).join('\n').substring(0, 500),
                                  editor_content: editContent,
                                  formatted_idea: parsedGeneratedIdea,
                                  color: color.name,
                                });
                                await loadIdeas();
                                notify.success('Idea saved!');
                                setParsedGeneratedIdea(null);
                                setGeneratingText('');
                              }
                              setEditingIdeaId(null);
                              setEditContent(null);
                            }}
                            className="px-3 py-1.5 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors text-xs font-medium"
                          >
                            Save Changes
                          </button>
                          <button
                            onClick={() => {
                              setEditingIdeaId(null);
                              setEditContent('');
                            }}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-xs font-medium"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                      <EditorJSEditor
                        initialData={editContent}
                        onChange={setEditContent}
                        onSave={async (content) => {
                          if (editingIdeaId && editingIdeaId !== 'generated') {
                            try {
                              await updateIdea(editingIdeaId, { 
                                editor_content: content,
                                idea: content.blocks.map(b => {
                                  if (b.type === 'paragraph') return (b.data as any).text;
                                  if (b.type === 'header') return (b.data as any).text;
                                  return '';
                                }).join('\n').substring(0, 500) // Keep legacy field for compatibility
                              });
                              await loadIdeas();
                              notify.success('Idea updated!');
                              setEditingIdeaId(null);
                            } catch (error) {
                              notify.error('Failed to update idea');
                            }
                          }
                        }}
                        placeholder="Edit your idea..."
                        editable={true}
                        autoSave={true}
                        ideaId={editingIdeaId !== 'generated' ? editingIdeaId : undefined}
                      />
                    </div>
                  )}

                  {/* Prompt Helper Text */}
                  {!isGenerating && conversationHistory.length === 0 && (
                    <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <p className="text-xs text-purple-700">
                        💡 <strong>Get started:</strong> Describe what kind of project idea you're looking for. You can drag idea cards from the sidebar into the input area to continue refining them.
                      </p>
                    </div>
                  )}
                  
                  {/* Rate Limit Warning */}
                  {rateLimitCountdown !== null && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700 flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        <strong>Rate limit:</strong> Please wait <strong>{rateLimitCountdown} seconds</strong> before generating another idea. The free tier allows 15 requests per minute.
                      </p>
                    </div>
                  )}

                  {/* Editor-first writing area */}
                  <div className="bg-white border border-gray-200 rounded-xl p-4 flex-shrink-0 mt-auto transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800">Idea canvas</h3>
                        <p className="text-xs text-gray-500">Rich text editor with images. Drag cards here to refine.</p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!editorContent) {
                            notify.error('Nothing to save yet');
                            return;
                          }
                          await handleSaveEditorIdea(editorContent);
                        }}
                        disabled={isSavingEditorIdea || !editorContent}
                        className="px-3 py-1.5 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {isSavingEditorIdea ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        <span>{selectedIdea ? 'Update' : 'Save'}</span>
                      </button>
                    </div>

                    <div
                      className="border border-gray-200 rounded-lg p-2"
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-purple-400', 'bg-purple-50');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-purple-400', 'bg-purple-50');
                        try {
                          const ideaData = e.dataTransfer.getData('application/json');
                          if (ideaData) {
                            const idea = JSON.parse(ideaData);
                            const ideaText = idea.description || idea.title || idea.fullIdea || '';
                            if (ideaText) {
                              const blocks = convertTextToEditorBlocks(ideaText);
                              setEditorContent(blocks);
                              notify.success('Idea card dropped into the editor.');
                            }
                          }
                        } catch (err) {
                          console.error('Error handling drop:', err);
                        }
                      }}
                    >
                      <EditorJSEditor
                        initialData={editorContent}
                        onChange={setEditorContent}
                        onSave={setEditorContent}
                        placeholder="Start writing your idea..."
                        editable
                        autoSave={false}
                        className="min-h-[420px]"
                      />
                    </div>
                  </div>
                </>
              )}
            </main>

            {/* Right Sidebar - AI assistant */}
            {showAiPanel && (
            <aside className="col-span-12 lg:col-span-3 flex flex-col min-h-0 space-y-6">
              {/* AI Assist Panel */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col flex-1 min-h-0">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <div>
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#4780C6]" />
                      AI Assist
                    </h3>
                    <p className="text-xs text-gray-500">Generate snippets and paste into the editor.</p>
                  </div>
                </div>

                {/* Conversation History (AI) */}
                {conversationHistory.length > 0 && (
                  <div className="space-y-4 mb-4 max-h-56 overflow-y-auto pr-1">
                    {conversationHistory.map((item, idx) => (
                      <div key={idx} className={`flex ${item.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {item.type === 'ai' && item.idea ? (
                          <AnimatedIdeaCard 
                            isGenerating={false}
                            parsedIdea={item.idea}
                            onSelectText={(text) => {
                              setPrompt(prev => prev ? `${prev}\n\nReference: "${text}"` : `Reference: "${text}"`);
                            }}
                          />
                        ) : (
                          <div className={`max-w-[80%] p-3 rounded-lg ${
                            item.type === 'user' 
                              ? 'bg-[#4780C6] text-white' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            <p className="text-sm">{item.content}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Animated Idea Skeleton Card */}
                <AnimatedIdeaCard 
                  isGenerating={isGenerating} 
                  generatedText={generatingText}
                  parsedIdea={parsedGeneratedIdea}
                  onSelectText={(text) => {
                    setPrompt(prev => prev ? `${prev}\n\nReference: "${text}"` : `Reference: "${text}"`);
                  }}
                  ideaId={parsedGeneratedIdea ? 'generated' : null}
                  rawContent={generatingText}
                />

                {/* Prompt Input */}
                <div className="mt-4">
                  {rateLimitCountdown !== null && (
                    <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-700 flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        <strong>Rate limit:</strong> Wait <strong>{rateLimitCountdown} s</strong> before generating again.
                      </p>
                    </div>
                  )}
                  <div className="relative">
                    <textarea
                      value={prompt}
                      onChange={(e) => {
                        if (e.target.value.length <= 3000) setPrompt(e.target.value);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          handleGenerate();
                        }
                      }}
                      placeholder="Ask AI…"
                      className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6]/20 resize-none text-sm"
                      rows={3}
                    />
                    <button
                      onClick={() => handleGenerate()}
                      disabled={isGenerating || !prompt.trim() || rateLimitCountdown !== null}
                      className="absolute bottom-3 right-3 p-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={rateLimitCountdown !== null ? `Rate limited. Wait ${rateLimitCountdown}s` : undefined}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : rateLimitCountdown !== null ? (
                        <span className="text-xs font-medium">{rateLimitCountdown}s</span>
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 px-1">
                    Use AI to draft text, then paste into the editor.
                  </p>
                </div>
              </div>
            </aside>
            )}

          </div>
        </div>

        {/* Idea Detail Overlay Modal */}
        {selectedIdea && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" 
            onClick={() => setSelectedIdea(null)}
          >
            <div 
              className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col" 
              onClick={(e) => e.stopPropagation()}
            >
              <EnhancedIdeaDetail
                idea={selectedIdea}
                onClose={() => {
                  setSelectedIdea(null);
                  setRefinePrompt('');
                }}
                onDelete={handleDelete}
                onRefine={handleRefine}
                onConvertToProject={handleConvertToProject}
                isRefining={isGenerating && !!refinePrompt}
              />
            </div>
          </div>
        )}

        {/* Project Creation Modal */}
        {showProjectModal && selectedIdea && (
          <ProjectModal
            idea={selectedIdea}
            onClose={() => setShowProjectModal(false)}
            onCreate={handleCreateProject}
          />
        )}

      </div>
    </ProtectedRoute>
  );
}

// Project Creation Modal Component
function ProjectModal({ 
  idea, 
  onClose, 
  onCreate 
}: { 
  idea: Idea; 
  onClose: () => void; 
  onCreate: (title: string, description: string, isPublic: boolean) => void;
}) {
  const [title, setTitle] = useState(idea.formatted_idea?.title || '');
  const [description, setDescription] = useState(idea.formatted_idea?.description || idea.idea.substring(0, 500));
  const [isPublic, setIsPublic] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Convert to Project</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter project title"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter project description"
              rows={6}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6] focus:border-transparent resize-none"
            />
          </div>

          <div className="space-y-4">
            {/* Privacy Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Visibility
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="privacy"
                    value="public"
                    checked={isPublic}
                    onChange={() => setIsPublic(true)}
                    className="w-4 h-4 text-[#4780C6] focus:ring-[#4780C6]"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Public</div>
                    <div className="text-xs text-gray-500">Anyone can view this project</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input
                    type="radio"
                    name="privacy"
                    value="private"
                    checked={!isPublic}
                    onChange={() => setIsPublic(false)}
                    className="w-4 h-4 text-[#4780C6] focus:ring-[#4780C6]"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">Private</div>
                    <div className="text-xs text-gray-500">Only you and invited collaborators can access</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => onCreate(title, description, isPublic)}
                disabled={!title.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <Rocket className="w-4 h-4" />
                Create Project
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
