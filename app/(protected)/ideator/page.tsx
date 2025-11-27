'use client';

import { useState } from 'react';
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
  TrendingUp,
  Target,
  Users
} from 'lucide-react';

interface GeneratedIdea {
  id: string;
  prompt: string;
  idea: string;
  timestamp: Date;
}

export default function IdeatorPage() {
  const [prompt, setPrompt] = useState('');
  const [context, setContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      notify.error('Please enter a prompt to generate an idea');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim(), context: context.trim() || undefined }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit errors with retry info
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

      const newIdea: GeneratedIdea = {
        id: Date.now().toString(),
        prompt: prompt.trim(),
        idea: data.idea,
        timestamp: new Date(),
      };

      setGeneratedIdeas([newIdea, ...generatedIdeas]);
      setPrompt('');
      notify.success('Idea generated successfully!');
    } catch (error: any) {
      console.error('Error generating idea:', error);
      notify.error(error.message || 'Failed to generate idea');
    } finally {
      setIsGenerating(false);
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

  const handleClear = () => {
    setPrompt('');
    setContext('');
  };

  const handleRegenerate = async (originalPrompt: string, originalContext: string) => {
    setPrompt(originalPrompt);
    setContext(originalContext);
    await handleGenerate();
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Ideator</h1>
                  <p className="text-xs text-gray-500">AI-Powered Idea Generation</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-6 py-8">
          <InlineNotification className="mb-6" />

          {/* Hero Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-4">
              <Lightbulb className="w-10 h-10 text-purple-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Generate Your Next Big Idea
            </h2>
            <p className="text-gray-600">
              Describe what you&apos;re looking for, and our AI will help you create innovative project ideas
            </p>
          </div>

          {/* Input Section */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="space-y-4">
              {/* Context Input (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Context (Optional)
                  <span className="text-gray-400 font-normal ml-1">- Provide background information</span>
                </label>
                <textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="E.g., I'm working on a healthcare startup focused on telemedicine..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                  rows={3}
                />
              </div>

              {/* Prompt Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What kind of idea are you looking for? *
                </label>
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        handleGenerate();
                      }
                    }}
                    placeholder="E.g., A mobile app for tracking fitness goals with social features..."
                    className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                    rows={4}
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {prompt.length} / 500
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Press <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl/Cmd + Enter</kbd> to generate
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Generate Idea
                    </>
                  )}
                </button>
                {(prompt || context) && (
                  <button
                    onClick={handleClear}
                    disabled={isGenerating}
                    className="px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Generated Ideas */}
          {generatedIdeas.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Generated Ideas ({generatedIdeas.length})
                </h3>
                {generatedIdeas.length > 0 && (
                  <button
                    onClick={() => setGeneratedIdeas([])}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear all
                  </button>
                )}
              </div>

              {generatedIdeas.map((idea) => (
                <div
                  key={idea.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-purple-500" />
                        <h4 className="font-semibold text-gray-900">Generated Idea</h4>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">
                        <span className="font-medium">Prompt:</span> {idea.prompt}
                      </p>
                      <p className="text-xs text-gray-400">
                        {idea.timestamp.toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRegenerate(idea.prompt, context)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(idea.idea, idea.id)}
                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="Copy idea"
                      >
                        {copiedId === idea.id ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Idea Content */}
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                      {idea.idea}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 pt-6 border-t border-gray-200 flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
                      <Target className="w-4 h-4" />
                      Use This Idea
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      <Users className="w-4 h-4" />
                      Share
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {generatedIdeas.length === 0 && !isGenerating && (
            <div className="text-center py-12 bg-white border border-gray-200 rounded-xl">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <Lightbulb className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No ideas generated yet
              </h3>
              <p className="text-gray-500 text-sm">
                Enter a prompt above to start generating creative project ideas
              </p>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}

