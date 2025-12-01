'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getProjectStarCount } from '@/lib/supabase/projects';
import type { ProjectComment, ProjectBoardItem } from '@/lib/supabase/projects';

/**
 * Real-time hook for project comments
 */
export function useRealtimeProjectComments(projectId: string) {
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
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
          setComments(prev => prev.map(c => 
            c.id === payload.new.id ? payload.new as ProjectComment : c
          ));
        } else if (payload.eventType === 'DELETE') {
          setComments(prev => prev.filter(c => c.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return comments;
}

/**
 * Real-time hook for project board items
 */
export function useRealtimeProjectBoard(projectId: string) {
  const [items, setItems] = useState<ProjectBoardItem[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`project-board-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_board_items',
        filter: `project_id=eq.${projectId}`,
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setItems(prev => [...prev, payload.new as ProjectBoardItem]);
        } else if (payload.eventType === 'UPDATE') {
          setItems(prev => prev.map(item => 
            item.id === payload.new.id ? payload.new as ProjectBoardItem : item
          ));
        } else if (payload.eventType === 'DELETE') {
          setItems(prev => prev.filter(item => item.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return items;
}

/**
 * Real-time hook for project stars count
 */
export function useRealtimeProjectStars(projectId: string) {
  const [starCount, setStarCount] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel(`project-stars-${projectId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'project_stars',
        filter: `project_id=eq.${projectId}`,
      }, () => {
        // Reload star count
        getProjectStarCount(projectId).then(setStarCount);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  return starCount;
}

