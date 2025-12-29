'use client';

import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface LazyLoadListProps<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  renderItem: (item: T, index: number) => ReactNode;
  renderSkeleton: () => ReactNode;
  skeletonCount?: number;
  emptyMessage?: string;
  sentinelRef: React.RefObject<HTMLDivElement>;
  className?: string;
}

export function LazyLoadList<T>({
  items,
  isLoading,
  isLoadingMore,
  hasMore,
  renderItem,
  renderSkeleton,
  skeletonCount = 3,
  emptyMessage = 'No items found',
  sentinelRef,
  className = '',
}: LazyLoadListProps<T>) {
  if (isLoading) {
    return (
      <div className={className}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <div key={`skeleton-${index}`}>{renderSkeleton()}</div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
      
      {/* Sentinel element for intersection observer */}
      <div ref={sentinelRef} className="h-1" />
      
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-[#4780C6]" />
          <span className="ml-2 text-sm text-gray-500">Loading more...</span>
        </div>
      )}
      
      {/* End of list indicator */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-400">You've reached the end</p>
        </div>
      )}
    </div>
  );
}

// Loading overlay component for refreshing data
export function LoadingOverlay({ isLoading, children }: { isLoading: boolean; children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] flex items-center justify-center z-10">
          <Loader2 className="w-6 h-6 animate-spin text-[#4780C6]" />
        </div>
      )}
    </div>
  );
}







