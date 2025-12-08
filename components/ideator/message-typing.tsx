'use client';

import { useEffect, useState } from 'react';

interface MessageTypingProps {
  text: string;
  speed?: number; // milliseconds per character
  onComplete?: () => void;
  className?: string;
}

export function MessageTyping({ 
  text, 
  speed = 25, 
  onComplete,
  className = '' 
}: MessageTypingProps) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    if (!text) {
      setDisplayed('');
      return;
    }

    setDisplayed('');
    let i = 0;
    
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayed(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        if (onComplete) {
          onComplete();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, onComplete]);

  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {displayed}
      {displayed.length < text.length && (
        <span className="inline-block w-2 h-4 bg-current ml-0.5 animate-blink" />
      )}
    </div>
  );
}

