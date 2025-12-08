'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

// Base skeleton with shimmer animation
export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-shimmer rounded',
        className
      )}
    />
  );
}

// Card skeleton for project/idea cards
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl overflow-hidden', className)}>
      {/* Cover image skeleton */}
      <Skeleton className="h-32 w-full rounded-none" />
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}

// Idea card skeleton (note-style)
export function IdeaCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-gray-50 border border-gray-200 rounded-xl p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between mb-3">
        <Skeleton className="h-4 w-4 rounded" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="mt-4 pt-3 border-t border-gray-100">
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

// Large project card skeleton
export function ProjectCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-6', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-16 w-full mb-6" />
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Skeleton className="aspect-video rounded-lg" />
        <Skeleton className="aspect-video rounded-lg" />
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

// Stats card skeleton
export function StatsSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-xl p-5', className)}>
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-8" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity item skeleton
export function ActivitySkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-start gap-3', className)}>
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

// Profile card skeleton
export function ProfileCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6', className)}>
      <div className="flex items-start gap-3 mb-4">
        <Skeleton className="w-16 h-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
      <Skeleton className="h-4 w-full mb-4" />
      <Skeleton className="h-4 w-20 ml-auto" />
    </div>
  );
}

// Topic/Tag skeleton
export function TopicSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Skeleton className="h-4 w-16" />
      <Skeleton className="h-4 w-10" />
    </div>
  );
}

// Collaborator skeleton
export function CollaboratorSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('flex items-center gap-3 p-3 rounded-lg bg-gray-50', className)}>
      <Skeleton className="w-8 h-8 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

// Conversation message skeleton
export function MessageSkeleton({ isOwn = false, className }: SkeletonProps & { isOwn?: boolean }) {
  return (
    <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start', className)}>
      <div className={cn(
        'max-w-[80%] p-3 rounded-lg space-y-2',
        isOwn ? 'bg-blue-100' : 'bg-gray-100'
      )}>
        {!isOwn && <Skeleton className="h-3 w-20 mb-2" />}
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}

// Idea detail skeleton
export function IdeaDetailSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
      
      {/* Cover image */}
      <Skeleton className="h-48 w-full rounded-xl" />
      
      {/* Content */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Skeleton className="h-10 w-32 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// Small project card skeleton for sidebar
export function SmallProjectCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white border border-gray-200 rounded-lg overflow-hidden', className)}>
      <Skeleton className="h-24 w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
  );
}


