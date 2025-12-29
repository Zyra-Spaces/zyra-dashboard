'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyLoadOptions<T> {
  initialData?: T[];
  pageSize?: number;
  loadMore: (page: number, pageSize: number) => Promise<T[]>;
  threshold?: number;
  rootMargin?: string;
}

interface UseLazyLoadReturn<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: Error | null;
  sentinelRef: React.RefObject<HTMLDivElement>;
  reset: () => void;
  refresh: () => Promise<void>;
}

export function useLazyLoad<T>({
  initialData = [],
  pageSize = 10,
  loadMore,
  threshold = 0.1,
  rootMargin = '100px',
}: UseLazyLoadOptions<T>): UseLazyLoadReturn<T> {
  const [items, setItems] = useState<T[]>(initialData);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(initialData.length === 0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Initial load
  useEffect(() => {
    if (initialData.length === 0) {
      loadInitial();
    }
  }, []);

  const loadInitial = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await loadMore(1, pageSize);
      setItems(data);
      setHasMore(data.length === pageSize);
      setPage(2);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load data'));
    } finally {
      setIsLoading(false);
    }
  };

  const loadNextPage = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;

    try {
      setIsLoadingMore(true);
      setError(null);
      const data = await loadMore(page, pageSize);
      
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setItems(prev => [...prev, ...data]);
        setHasMore(data.length === pageSize);
        setPage(prev => prev + 1);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load more data'));
    } finally {
      setIsLoadingMore(false);
    }
  }, [page, pageSize, loadMore, isLoadingMore, hasMore]);

  // Setup intersection observer
  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadNextPage();
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, isLoading, loadNextPage, threshold, rootMargin]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    loadInitial();
  }, []);

  const refresh = useCallback(async () => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    await loadInitial();
  }, []);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    sentinelRef,
    reset,
    refresh,
  };
}

// Hook for observing single element visibility (for lazy loading individual components)
interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useInView({
  threshold = 0,
  rootMargin = '0px',
  triggerOnce = false,
}: UseInViewOptions = {}) {
  const [isInView, setIsInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || (triggerOnce && hasTriggered)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const inView = entry.isIntersecting;
        setIsInView(inView);
        
        if (inView && triggerOnce) {
          setHasTriggered(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  return { ref, isInView };
}







