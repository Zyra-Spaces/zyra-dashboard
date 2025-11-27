'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { InlineNotification, notify } from '@/components/ui/inline-notification';
import { 
  Sparkles, 
  Send, 
  Loader2, 
  Lightbulb, 
  RefreshCw,
  Copy,
  Check,
  Zap,
  Target,
  Users,
  FileText,
  History,
  X,
  Plus,
  Rocket,
  ChevronRight,
  MessageSquare,
  Edit3
} from 'lucide-react';

interface GeneratedIdea {
  id: string;
  prompt: string;
  idea: string;
  formattedIdea?: {
    title?: string;
    description?: string;
    features?: string[];
    useCases?: string[];
    tags?: string[];
  };
  context?: string;
  timestamp: Date;
}

const DEFAULT_CONTEXT = `You are helping a user generate innovative project ideas. The user wants creative, feasible, and well-structured project concepts that can be turned into real products or services. Focus on practical solutions with clear value propositions.`;

export default function IdeatorPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<GeneratedIdea | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [refinePrompt, setRefinePrompt] = useState('');

  // Load ideas from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('zyra_ideas');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setGeneratedIdeas(parsed.map((idea: any) => ({
          ...idea,
          timestamp: new Date(idea.timestamp),
        })));
      } catch (e) {
        console.error('Error loading ideas:', e);
      }
    }
  }, []);

  // Save ideas to localStorage whenever they change
  useEffect(() => {
    if (generatedIdeas.length > 0) {
      localStorage.setItem('zyra_ideas', JSON.stringify(generatedIdeas));
    }
  }, [generatedIdeas]);

  // Get context from previous chat history
  const getContext = useMemo(() => {
    if (generatedIdeas.length === 0) {
      return DEFAULT_CONTEXT;
    }
    // Use the last 3 ideas as context
    const recentIdeas = generatedIdeas.slice(0, 3);
    const contextParts = recentIdeas.map(idea => 
      `Previous idea: ${idea.prompt} - ${idea.idea.substring(0, 200)}...`
    );
    return `${DEFAULT_CONTEXT}\n\nRecent conversation context:\n${contextParts.join('\n\n')}`;
  }, [generatedIdeas]);

  // Parse idea text into structured format
  const parseIdea = (text: string) => {
    const parsed: any = {};
    
    // Extract title (usually after **Title:** or first line)
    const titleMatch = text.match(/\*\*Title:\*\*\s*(.+?)(?:\n|$)/i) || text.match(/^(.+?)(?:\n|$)/);
    if (titleMatch) parsed.title = titleMatch[1].trim();
    
    // Extract description
    const descMatch = text.match(/\*\*Description:\*\*\s*(.+?)(?:\n\n|\*\*)/is);
    if (descMatch) parsed.description = descMatch[1].trim();
    
    // Extract features
    const featuresMatch = text.match(/\*\*Key Features[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
    if (featuresMatch) {
      const featuresText = featuresMatch[1];
      parsed.features = featuresText
        .split(/\n[-•*]\s*/)
        .filter(f => f.trim().length > 0)
        .map(f => f.trim().replace(/^[-•*]\s*/, ''));
    }
    
    // Extract use cases
    const useCasesMatch = text.match(/\*\*Potential Use Cases[^:]*:\*\*\s*([\s\S]+?)(?:\n\n\*\*|$)/i);
    if (useCasesMatch) {
      const useCasesText = useCasesMatch[1];
      parsed.useCases = useCasesText
        .split(/\n[-•*]\s*/)
        .filter(u => u.trim().length > 0)
        .map(u => u.trim().replace(/^[-•*]\s*/, ''));
    }
    
    // Extract tags
    const tagsMatch = text.match(/\*\*Suggested Tags[^:]*:\*\*\s*(.+?)(?:\n\n|$)/i);
    if (tagsMatch) {
      parsed.tags = tagsMatch[1]
        .split(/[,•]/)
        .map(t => t.trim())
        .filter(t => t.length > 0);
    }
    
    return parsed;
  };

  const handleGenerate = async (refineIdea?: GeneratedIdea) => {
    const currentPrompt = refineIdea ? refinePrompt : prompt;
    if (!currentPrompt.trim()) {
      notify.error('Please enter a prompt to generate an idea');
      return;
    }

    setIsGenerating(true);
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
          const retryAfter = data.retryAfter;
          throw new Error(
            retryAfter 
              ? `Rate limit exceeded. Please wait ${Math.ceil(retryAfter)} seconds before trying again.`
              : data.error || 'Rate limit exceeded. Please try again later.'
          );
        }
        throw new Error(data.error || 'Failed to generate idea');
      }

      const formattedIdea = parseIdea(data.idea);
      const newIdea: GeneratedIdea = {
        id: Date.now().toString(),
        prompt: currentPrompt.trim(),
        idea: data.idea,
        formattedIdea,
        context: refineIdea ? refinePrompt : undefined,
        timestamp: new Date(),
      };

      setGeneratedIdeas([newIdea, ...generatedIdeas]);
      setPrompt('');
      setRefinePrompt('');
      setSelectedIdea(null);
      notify.success('Idea generated successfully!');
    } catch (error: any) {
      console.error('Error generating idea:', error);
      notify.error(error.message || 'Failed to generate idea');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRefine = () => {
    if (!selectedIdea) return;
    handleGenerate(selectedIdea);
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

  const handleCreateProject = async (title: string, description: string) => {
    // Save project data to localStorage for now
    const projectData = {
      title: title || selectedIdea?.formattedIdea?.title || 'New Project',
      description: description || selectedIdea?.formattedIdea?.description || selectedIdea?.idea,
      sourceIdea: selectedIdea?.id,
      createdAt: new Date().toISOString(),
    };
    
    const existingProjects = JSON.parse(localStorage.getItem('zyra_projects') || '[]');
    existingProjects.push(projectData);
    localStorage.setItem('zyra_projects', JSON.stringify(existingProjects));
    
    notify.success('Project created successfully!');
    setShowProjectModal(false);
    setSelectedIdea(null);
    
    // Navigate to project creation page or dashboard
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white flex">
        <InlineNotification className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-auto max-w-md" />
        
        {/* Sidebar */}
        <aside className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 border-r border-gray-200 bg-white overflow-hidden flex flex-col`}>
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <History className="w-5 h-5 text-[#4780C6]" />
              Recent Ideas
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {generatedIdeas.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <Lightbulb className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No ideas yet</p>
                <p className="text-xs mt-1">Generate your first idea to see it here</p>
              </div>
            ) : (
              generatedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  onClick={() => setSelectedIdea(idea)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedIdea?.id === idea.id
                      ? 'border-[#4780C6] bg-[#4780C6]/5'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-medium text-sm text-gray-900 line-clamp-1">
                      {idea.formattedIdea?.title || idea.prompt.substring(0, 40) + '...'}
                    </h3>
                    {selectedIdea?.id === idea.id && (
                      <Check className="w-4 h-4 text-[#4780C6] flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">
                    {idea.formattedIdea?.description || idea.idea.substring(0, 100) + '...'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {idea.timestamp.toLocaleDateString()} {idea.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))
            )}
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="border-b border-gray-200 bg-white sticky top-0 z-40">
            <div className="px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {!sidebarOpen && (
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <History className="w-5 h-5 text-gray-600" />
                  </button>
                )}
                <div className="w-10 h-10 bg-[#4780C6] rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Ideator</h1>
                  <p className="text-xs text-gray-500">AI-Powered Idea Generation</p>
                </div>
              </div>
            </div>
          </header>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto bg-gray-50">
            {selectedIdea ? (
              // Selected Idea View
              <div className="max-w-4xl mx-auto p-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-[#4780C6]" />
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedIdea.formattedIdea?.title || 'Generated Idea'}
                        </h2>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        <span className="font-medium">Prompt:</span> {selectedIdea.prompt}
                      </p>
                      <p className="text-xs text-gray-400">
                        {selectedIdea.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedIdea(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Close"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Formatted Idea Display */}
                  {selectedIdea.formattedIdea?.title && (
                    <div className="space-y-6">
                      {selectedIdea.formattedIdea.description && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Description</h3>
                          <p className="text-gray-600 leading-relaxed">{selectedIdea.formattedIdea.description}</p>
                        </div>
                      )}

                      {selectedIdea.formattedIdea.features && selectedIdea.formattedIdea.features.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Key Features</h3>
                          <ul className="space-y-2">
                            {selectedIdea.formattedIdea.features.map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-600">
                                <span className="text-[#4780C6] mt-1">•</span>
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedIdea.formattedIdea.useCases && selectedIdea.formattedIdea.useCases.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Use Cases</h3>
                          <ul className="space-y-2">
                            {selectedIdea.formattedIdea.useCases.map((useCase, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-600">
                                <span className="text-[#4780C6] mt-1">•</span>
                                <span>{useCase}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {selectedIdea.formattedIdea.tags && selectedIdea.formattedIdea.tags.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">Tags</h3>
                          <div className="flex flex-wrap gap-2">
                            {selectedIdea.formattedIdea.tags.map((tag, idx) => (
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

                  {/* Raw Idea Text (fallback) */}
                  {!selectedIdea.formattedIdea?.title && (
                    <div className="prose prose-sm max-w-none">
                      <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                        {selectedIdea.idea}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-8 pt-6 border-t border-gray-200 flex items-center gap-3 flex-wrap">
                    <button
                      onClick={handleConvertToProject}
                      className="flex items-center gap-2 px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors text-sm font-medium"
                    >
                      <Rocket className="w-4 h-4" />
                      Convert to Project
                    </button>
                    <button
                      onClick={() => handleCopy(selectedIdea.idea, selectedIdea.id)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      {copiedId === selectedIdea.id ? (
                        <>
                          <Check className="w-4 h-4 text-green-500" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          Copy
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setRefinePrompt('');
                        setSelectedIdea(selectedIdea);
                      }}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      Refine
                    </button>
                  </div>

                  {/* Refine Section */}
                  {selectedIdea && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                              handleRefine();
                            }
                          }}
                        />
                        <button
                          onClick={handleRefine}
                          disabled={!refinePrompt.trim() || isGenerating}
                          className="px-4 py-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {isGenerating ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Welcome/Empty State
              <div className="max-w-4xl mx-auto p-6">
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-[#4780C6]/20 to-purple-500/20 rounded-full mb-6">
                    <Lightbulb className="w-10 h-10 text-[#4780C6]" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome to Ideator
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-md mx-auto">
                    Get started by describing what you&apos;re looking for, and our AI will help you create innovative project ideas. Not sure where to start?
                  </p>

                  {/* Feature Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                      <div className="w-10 h-10 bg-[#4780C6]/10 rounded-lg flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5 text-[#4780C6]" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Structured Ideas</h3>
                      <p className="text-sm text-gray-600">Get well-organized project ideas with titles, descriptions, features, and tags.</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                      <div className="w-10 h-10 bg-[#4780C6]/10 rounded-lg flex items-center justify-center mb-3">
                        <Edit3 className="w-5 h-5 text-[#4780C6]" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Refine & Iterate</h3>
                      <p className="text-sm text-gray-600">Select any idea to refine it further based on your specific needs.</p>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-left">
                      <div className="w-10 h-10 bg-[#4780C6]/10 rounded-lg flex items-center justify-center mb-3">
                        <Rocket className="w-5 h-5 text-[#4780C6]" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Convert to Project</h3>
                      <p className="text-sm text-gray-600">Turn your favorite ideas into real projects and invite collaborators.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 bg-white p-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-2 px-2">
                <span className="text-xs text-gray-500">Context managed automatically from your conversation history</span>
                <span className="text-xs text-gray-400">{prompt.length}/3000</span>
              </div>
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
                  placeholder="Ask Anything... Describe what kind of project idea you're looking for"
                  className="w-full px-4 py-3 pr-12 border-2 border-[#4780C6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4780C6]/20 resize-none text-sm"
                  rows={3}
                />
                <button
                  onClick={() => handleGenerate()}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute bottom-3 right-3 p-2 bg-[#4780C6] text-white rounded-lg hover:bg-[#4780C6]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 px-2">
                Press <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs">Ctrl/Cmd + Enter</kbd> to generate
              </p>
            </div>
          </div>
        </div>

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
  idea: GeneratedIdea; 
  onClose: () => void; 
  onCreate: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState(idea.formattedIdea?.title || '');
  const [description, setDescription] = useState(idea.formattedIdea?.description || idea.idea.substring(0, 500));

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

          <div className="flex items-center gap-3 pt-4">
            <button
              onClick={() => onCreate(title, description)}
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
  );
}
