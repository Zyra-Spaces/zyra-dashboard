'use client';

import { useAuth } from '@/contexts/auth-context';
import { Loading } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading } = useAuth();

  // Middleware handles the redirect, we just show loading state
  if (isLoading) {
    return <Loading fullScreen />;
  }

  return <>{children}</>;
}
