'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Loading } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if auth has finished loading and user is not authenticated
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        // Use replace to avoid adding to history stack
        router.replace('/login');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  // Show loading while checking auth
  if (isLoading) {
    return <Loading fullScreen />;
  }

  // Don't render children if not authenticated (redirect will happen)
  if (!isAuthenticated || !user) {
    return <Loading fullScreen />;
  }

  return <>{children}</>;
}
