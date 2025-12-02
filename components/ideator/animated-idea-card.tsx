'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Edit3 } from 'lucide-react';

interface AnimatedIdeaCardProps {
  isGenerating: boolean;
  generatedText?: string;
  parsedIdea?: {
    title?: string;
    description?: string;
    features?: string[];
    useCases?: string[];
    tags?: string[];
  };
  onSelectText?: (text: string) => void;
  onEdit?: (ideaId: string, content: string) => void;
  ideaId?: string | null;
  rawContent?: string;
}

export function AnimatedIdeaCard({ isGenerating, generatedText = '', parsedIdea, onSelectText, onEdit, ideaId, rawContent }: AnimatedIdeaCardProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (generatedText && generatedText.length > 0) {
      // Reset when new text arrives
      setDisplayedText('');
      setCurrentIndex(0);
    }
  }, [generatedText]);

  useEffect(() => {
    if (generatedText && currentIndex < generatedText.length) {
      const timer = setTimeout(() => {
        setDisplayedText(generatedText.slice(0, currentIndex + 1));
        setCurrentIndex(currentIndex + 1);
      }, 15); // Typing speed: 15ms per character

      return () => clearTimeout(timer);
    }
  }, [currentIndex, generatedText]);

  if (!isGenerating && !generatedText && !parsedIdea) {
    return null;
  }

  // If we have a parsed idea, show it as a card
  if (parsedIdea && !isGenerating) {
    return (
      <div className="relative w-full mb-6">
        {/* Fog Effect Layers */}
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/15 via-blue-500/10 to-pink-500/15 rounded-xl blur-2xl animate-fog-float"></div>
        </div>

        {/* Idea Card */}
        <div 
          className="relative bg-white border-2 border-purple-200/50 rounded-xl shadow-lg p-6 animate-in fade-in duration-300 hover:shadow-xl transition-shadow cursor-move"
          draggable
          onDragStart={(e) => {
            const ideaData = JSON.stringify(parsedIdea);
            e.dataTransfer.setData('application/json', ideaData);
            e.dataTransfer.effectAllowed = 'move';
          }}
        >
          {/* Edit Button */}
          {onEdit && ideaId && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                // Use rawContent if available, otherwise reconstruct from parsedIdea
                const contentToEdit = rawContent || [
                  parsedIdea.title ? `**Title:** ${parsedIdea.title}` : '',
                  parsedIdea.description ? `**Description:**\n${parsedIdea.description}` : '',
                  parsedIdea.features?.length ? `**Key Features:**\n${parsedIdea.features.map(f => `- ${f}`).join('\n')}` : '',
                  parsedIdea.tags?.length ? `**Tags:** ${parsedIdea.tags.join(', ')}` : '',
                ].filter(Boolean).join('\n\n');
                onEdit(ideaId, contentToEdit);
              }}
              className="absolute top-4 right-4 p-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg transition-colors z-10"
              title="Edit idea"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          )}
          {parsedIdea.title && (
            <h3 
              className="text-xl font-bold text-gray-900 mb-3 cursor-pointer hover:text-purple-600 transition-colors"
              onClick={() => onSelectText?.(parsedIdea.title!)}
            >
              {parsedIdea.title}
            </h3>
          )}
          {parsedIdea.description && (
            <p 
              className="text-gray-600 mb-4 leading-relaxed cursor-pointer hover:bg-purple-50 p-2 rounded transition-colors"
              onClick={() => onSelectText?.(parsedIdea.description!)}
            >
              {parsedIdea.description}
            </p>
          )}
          {parsedIdea.features && parsedIdea.features.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Key Features</h4>
              <ul className="space-y-1">
                {parsedIdea.features.slice(0, 3).map((feature, idx) => (
                  <li 
                    key={idx} 
                    className="text-sm text-gray-600 flex items-start gap-2 cursor-pointer hover:bg-purple-50 p-1 rounded transition-colors"
                    onClick={() => onSelectText?.(feature)}
                  >
                    <span className="text-purple-500 mt-1">•</span>
                    <span className="line-clamp-1">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {parsedIdea.tags && parsedIdea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {parsedIdea.tags.slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium cursor-pointer hover:bg-purple-200 transition-colors"
                  onClick={() => onSelectText?.(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full mb-6">
      {/* Fog Effect Layers */}
      <div className="absolute inset-0 -z-10 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-blue-500/15 to-pink-500/20 rounded-xl blur-3xl animate-fog-float"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/15 via-purple-500/15 to-pink-500/15 rounded-xl blur-2xl animate-fog-float-reverse"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-pink-500/10 via-purple-500/10 to-blue-500/10 rounded-xl blur-xl animate-fog-float-slow"></div>
      </div>

      {/* Main Skeleton Card */}
      <div className="relative bg-white/90 backdrop-blur-sm border-2 border-purple-200/50 rounded-xl shadow-lg p-6 animate-in fade-in duration-300">
        {/* Header with Sparkle Icon */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-lg animate-pulse"></div>
            <div className="relative bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-2.5">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              {isGenerating ? 'Generating Your Idea...' : 'Your Idea'}
            </h3>
            <p className="text-xs text-gray-500">
              {isGenerating ? 'AI is crafting something amazing...' : 'Preview'}
            </p>
          </div>
        </div>

        {/* Content Area with Typing Effect */}
        <div className="relative min-h-[150px] max-h-[300px] overflow-y-auto">
          <div className="prose prose-sm max-w-none">
            <div className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
              {displayedText || (isGenerating ? 'Thinking...' : '')}
              {(isGenerating || (generatedText && currentIndex < generatedText.length)) && (
                <span className="inline-block w-1.5 h-4 bg-gradient-to-b from-purple-500 to-blue-500 ml-1 animate-blink">|</span>
              )}
            </div>
          </div>

          {/* Fog Overlay Effect - Gradient fade on edges */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-white/90 via-white/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white/90 via-white/40 to-transparent"></div>
            <div className="absolute top-0 bottom-0 left-0 w-16 bg-gradient-to-r from-white/90 via-white/40 to-transparent"></div>
            <div className="absolute top-0 bottom-0 right-0 w-16 bg-gradient-to-l from-white/90 via-white/40 to-transparent"></div>
          </div>
        </div>

        {/* Animated Dots */}
        {isGenerating && (
          <div className="flex items-center gap-2 mt-4">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
            <span className="text-xs text-gray-500">Thinking...</span>
          </div>
        )}
      </div>

      {/* Additional Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-float-particle"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              backgroundColor: i % 3 === 0 ? 'rgba(168, 85, 247, 0.3)' : i % 3 === 1 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(236, 72, 153, 0.3)',
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>
    </div>
  );
}

