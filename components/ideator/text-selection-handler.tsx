'use client';

import { useEffect, useState, useRef } from 'react';
import { MessageSquare } from 'lucide-react';

interface TextSelectionHandlerProps {
  onQuote: (text: string) => void;
  enabled?: boolean;
  containerRef?: React.RefObject<HTMLElement>;
}

export function TextSelectionHandler({ 
  onQuote, 
  enabled = true,
  containerRef 
}: TextSelectionHandlerProps) {
  const [popupPos, setPopupPos] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const popupRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enabled) {
      setPopupPos(null);
      return;
    }

    const handleMouseUp = () => {
      const selection = window.getSelection();
      if (!selection) return;

      const text = selection.toString().trim();

      if (text.length > 0) {
        // Check if selection is within the container (if provided)
        if (containerRef?.current) {
          const range = selection.getRangeAt(0);
          const container = containerRef.current;
          
          if (!container.contains(range.commonAncestorContainer)) {
            setPopupPos(null);
            return;
          }
        }

        try {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          
          // Position popup above the selection
          setSelectedText(text);
          setPopupPos({
            x: rect.left + rect.width / 2 - 60, // Center the button
            y: rect.top - 40,
          });
        } catch (error) {
          // Selection might be invalid
          setPopupPos(null);
        }
      } else {
        setPopupPos(null);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        // Clear selection if clicking outside
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
        setPopupPos(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [enabled, containerRef]);

  if (!popupPos || !selectedText) return null;

  return (
    <button
      ref={popupRef}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onQuote(selectedText);
        setPopupPos(null);
        setSelectedText('');
        
        // Clear selection
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
        }
      }}
      className="fixed z-50 bg-[#4780C6] text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-lg hover:bg-[#4780C6]/90 transition-all flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2"
      style={{ 
        top: `${popupPos.y}px`, 
        left: `${popupPos.x}px`,
        transform: 'translateX(-50%)',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <MessageSquare className="w-3 h-3" />
      Add to Chat
    </button>
  );
}



