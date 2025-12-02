'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { isOnboardingComplete } from '@/lib/onboarding';
import type { User } from '@supabase/supabase-js';

type AuthStep = 
  | 'idle'
  | 'signing_up'
  | 'verifying_email'
  | 'setting_password'
  | 'signing_in'
  | 'resetting_password'
  | 'verifying_reset_otp'
  | 'creating_new_password';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  step: AuthStep;
  email: string | null;
  error: string | null;
}

interface AuthContextType extends AuthState {
  // Sign Up Flow (email only -> OTP -> set password)
  signUpWithEmail: (email: string) => Promise<void>;
  verifyEmailOTP: (token: string) => Promise<void>;
  setPassword: (password: string) => Promise<void>;
  
  // Sign In Flow
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  
  // Password Reset Flow
  requestPasswordReset: (email: string) => Promise<void>;
  verifyResetOTP: (token: string) => Promise<void>;
  resetPassword: (newPassword: string) => Promise<void>;
  
  // General
  signOut: () => Promise<void>;
  resendOTP: () => Promise<void>;
  clearError: () => void;
  setStep: (step: AuthStep) => void;
  setEmail: (email: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  step: 'idle',
  email: null,
  error: null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState);
  const router = useRouter();
  
  // CRITICAL: Use useMemo to ensure client is created only once
  // Creating client on every render causes cookie accumulation
  const supabase = useMemo(() => createClient(), []);

  // Helper to update state
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // If there's an error or no user, clear auth state
        if (error || !user) {
          updateState({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          return;
        }

        // Verify user session is still valid
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          updateState({ 
            user: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          return;
        }

        updateState({ 
          user, 
          isAuthenticated: true, 
          isLoading: false 
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        updateState({ 
          user: null,
          isAuthenticated: false, 
          isLoading: false 
        });
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        // Verify session is valid
        if (event === 'SIGNED_OUT' || !session) {
          updateState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        // Verify user exists in session
        if (!session.user) {
          updateState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        updateState({
          user: session.user,
          isAuthenticated: true,
          isLoading: false,
        });

        // CRITICAL: Clean up metadata immediately on sign in to reduce cookie size
        // This prevents 431 errors by removing large data from JWT/cookies
        if (event === "SIGNED_IN" && session?.user) {
          try {
            // Clear all Supabase cookies first to remove chunked cookies
            fetch("/api/clear-supabase-cookies", { method: "POST" })
              .then(() => {
                // Then clean up metadata to reduce JWT size
                return fetch("/api/cleanup-cookies", { method: "POST" });
              })
              .then(() => {
                // After cleanup, refresh the session to get the cleaned JWT
                // This will create a new, smaller JWT without chunked cookies
                supabase.auth.refreshSession();
              })
              .catch(() => {
                // Silent fail - cleanup is optional but recommended
              });
          } catch {
            // Ignore errors
          }
        }

        // Don't auto-redirect on SIGNED_IN - let users stay where they are
        // Users will be redirected to onboarding from the auth flows (signIn, setPassword, etc.)
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, updateState]);

  // Sign Up with Email (sends OTP, no password yet)
  // Uses signInWithOtp() to ensure OTP codes are sent for both new and existing users
  // This ensures consistent behavior regardless of user existence
  const signUpWithEmail = async (email: string) => {
    updateState({ isLoading: true, error: null, step: 'signing_up' });
    
    try {
      // Use signInWithOtp() which always sends OTP codes
      // For new users, we'll create them during OTP verification
      // For existing users, they'll receive the OTP code to verify
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // Create user if they don't exist
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // OTP sent successfully
      updateState({ 
        email, 
        step: 'verifying_email', 
        isLoading: false 
      });
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Failed to send verification code', 
        isLoading: false,
        step: 'idle'
      });
      throw error;
    }
  };

  // Verify Email OTP
  // When using signInWithOtp(), we use 'email' type which works for both new and existing users
  const verifyEmailOTP = async (token: string) => {
    if (!state.email) {
      updateState({ error: 'Email not found. Please start over.' });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      // Try 'email' type first (works for OTP sent via signInWithOtp)
      let { data, error } = await supabase.auth.verifyOtp({
        email: state.email,
        token: token,
        type: 'email',
      });

      // If 'email' type fails, try 'signup' type (for new users created via signUp)
      if (error) {
        const retry = await supabase.auth.verifyOtp({
          email: state.email,
          token: token,
          type: 'signup',
        });
        if (!retry.error) {
          data = retry.data;
          error = null;
        } else {
          throw error; // Use original error if retry also fails
        }
      }

      // User verified, now needs to set password (if new user) or proceed to dashboard
      if (data?.user) {
        const { data: sessionData } = await supabase.auth.getSession();
        const hasSession = !!sessionData?.session;
        
        // Check if this is a new user by checking created_at timestamp
        // If user was created within the last 15 minutes, they're a new user from signup
        const userCreatedAt = new Date(data.user.created_at);
        const now = new Date();
        const minutesSinceCreation = (now.getTime() - userCreatedAt.getTime()) / (1000 * 60);
        const isNewUser = minutesSinceCreation < 15;
        
        // Since verifyEmailOTP is called from the signup flow (verify-email page),
        // new users should always set a password
        // For existing users who somehow use signup, we'll still redirect them to set password
        // as a safety measure (they can update it if needed)
        const needsPassword = isNewUser || !hasSession;
        
        updateState({ 
          user: data.user, 
          step: needsPassword ? 'setting_password' : 'idle', 
          isAuthenticated: hasSession,
          isLoading: false 
        });

        // Redirect based on whether password is needed
        if (needsPassword) {
          // New user or no session - redirect to set password
          router.push('/set-password');
        } else {
          // Existing user - check if they have onboarding data
          try {
            const { isOnboardingComplete } = await import('@/lib/onboarding');
            const isComplete = await isOnboardingComplete();
            router.push(isComplete ? '/dashboard' : '/onboarding/details');
          } catch (error) {
            console.error('Error checking onboarding status:', error);
            // Default to onboarding if check fails
            router.push('/onboarding/details');
          }
        }
      } else {
        throw new Error('Verification failed');
      }
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Invalid verification code', 
        isLoading: false 
      });
      throw error;
    }
  };

  // Set Password (after email verification)
  const setPassword = async (password: string) => {
    updateState({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      updateState({ 
        isAuthenticated: true, 
        step: 'idle', 
        isLoading: false,
        email: null
      });
      
      // Clean up metadata to reduce cookie size
      try {
        fetch("/api/cleanup-cookies", { method: "POST" }).catch(() => {
          // Silent fail
        });
      } catch {
        // Ignore
      }
      
      // After password setup, go to onboarding (new user flow)
      router.push('/onboarding/details');
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Failed to set password', 
        isLoading: false 
      });
      throw error;
    }
  };

  // Sign In with Email & Password
  const signIn = async (email: string, password: string) => {
    updateState({ isLoading: true, error: null, step: 'signing_in' });

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      updateState({ 
        user: data.user, 
        isAuthenticated: true, 
        step: 'idle', 
        isLoading: false 
      });
      
      // Clean up metadata to reduce cookie size
      try {
        fetch("/api/cleanup-cookies", { method: "POST" }).catch(() => {
          // Silent fail
        });
      } catch {
        // Ignore
      }
      
      // Check if user has onboarding data - if yes, go to dashboard
      try {
        const { isOnboardingComplete } = await import('@/lib/onboarding');
        const isComplete = await isOnboardingComplete();
        if (isComplete) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding/details');
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        // Fallback to localStorage check
        if (typeof window !== "undefined") {
          // Check onboarding status from database
          try {
            const { isOnboardingComplete } = await import('@/lib/onboarding');
            const isComplete = await isOnboardingComplete();
            router.push(isComplete ? '/dashboard' : '/onboarding/details');
          } catch (error) {
            console.error('Error checking onboarding status:', error);
            router.push('/onboarding/details');
          }
        } else {
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Invalid email or password', 
        isLoading: false,
        step: 'idle'
      });
      throw error;
    }
  };

  // Sign In with Google
  const signInWithGoogle = async () => {
    updateState({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Google sign-in failed', 
        isLoading: false 
      });
      throw error;
    }
  };

  // Request Password Reset
  const requestPasswordReset = async (email: string) => {
    updateState({ isLoading: true, error: null, step: 'resetting_password' });

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
        },
      });

      if (error) throw error;

      updateState({ 
        email, 
        step: 'verifying_reset_otp', 
        isLoading: false 
      });
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Failed to send reset code', 
        isLoading: false,
        step: 'idle'
      });
      throw error;
    }
  };

  // Verify Reset OTP
  const verifyResetOTP = async (token: string) => {
    if (!state.email) {
      updateState({ error: 'Email not found. Please start over.' });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: state.email,
        token: token,
        type: 'email',
      });

      if (error) throw error;

      updateState({ 
        user: data.user, 
        step: 'creating_new_password', 
        isLoading: false 
      });
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Invalid verification code', 
        isLoading: false 
      });
      throw error;
    }
  };

  // Reset Password (set new password)
  const resetPassword = async (newPassword: string) => {
    updateState({ isLoading: true, error: null });

    try {
      const { error } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (error) throw error;

      updateState({ 
        isAuthenticated: true, 
        step: 'idle', 
        isLoading: false,
        email: null
      });
      
      // Redirect to login after successful password reset
      router.push('/login');
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Failed to reset password', 
        isLoading: false 
      });
      throw error;
    }
  };

  // Resend OTP
  const resendOTP = async () => {
    if (!state.email) {
      updateState({ error: 'Email not found. Please start over.' });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      // Use signInWithOtp() to resend OTP code
      const { error } = await supabase.auth.signInWithOtp({
        email: state.email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      updateState({ isLoading: false });
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Failed to resend code', 
        isLoading: false 
      });
      throw error;
    }
  };

  // Sign Out
  const signOut = async () => {
    updateState({ isLoading: true });
    
    try {
      await supabase.auth.signOut();
      setState({ ...initialState, isLoading: false });
      router.push('/login');
    } catch (error: any) {
      updateState({ 
        error: error.message || 'Failed to sign out', 
        isLoading: false 
      });
    }
  };

  // Clear error
  const clearError = () => updateState({ error: null });

  // Set step manually
  const setStep = (step: AuthStep) => updateState({ step });

  // Set email manually
  const setEmail = (email: string) => updateState({ email });

  return (
    <AuthContext.Provider
      value={{
        ...state,
        signUpWithEmail,
        verifyEmailOTP,
        setPassword,
        signIn,
        signInWithGoogle,
        requestPasswordReset,
        verifyResetOTP,
        resetPassword,
        signOut,
        resendOTP,
        clearError,
        setStep,
        setEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
