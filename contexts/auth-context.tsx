'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

  // Helper to update state
  const updateState = useCallback((updates: Partial<AuthState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        updateState({ 
          user, 
          isAuthenticated: !!user, 
          isLoading: false 
        });
      } catch {
        updateState({ isLoading: false });
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        updateState({
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
          isLoading: false,
        });
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, updateState]);

  // Sign Up with Email (sends OTP, no password yet)
  // Uses Supabase's secure signUp() method which handles existing users gracefully
  // without revealing whether a user exists (prevents email enumeration)
  const signUpWithEmail = async (email: string) => {
    updateState({ isLoading: true, error: null, step: 'signing_up' });
    
    try {
      // Generate a temporary secure password (user will set their own after email verification)
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();
      
      // Use signUp() - Supabase handles existing users securely:
      // - If user doesn't exist: creates user and sends confirmation email
      // - If user exists: sends login email (no indication to client that user existed)
      const { data, error } = await supabase.auth.signUp({
        email,
        password: tempPassword, // Temporary password, user will set their own after verification
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        // Only show actual errors, not user existence (security feature)
        throw error;
      }

      // signUp() returns user data even if user existed (security feature)
      // We proceed with verification flow regardless
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
  // When using signUp(), Supabase sends confirmation with type 'signup'
  // If user already exists, Supabase handles it securely by sending login email
  // We use 'signup' type since we're in the signup flow
  const verifyEmailOTP = async (token: string) => {
    if (!state.email) {
      updateState({ error: 'Email not found. Please start over.' });
      return;
    }

    updateState({ isLoading: true, error: null });

    try {
      // Verify OTP with 'signup' type (for new user signups)
      // If user existed and got login email instead, they should use login flow
      const { data, error } = await supabase.auth.verifyOtp({
        email: state.email,
        token: token,
        type: 'signup',
      });

      if (error) throw error;

      // User verified, now needs to set password
      if (data?.user) {
        updateState({ 
          user: data.user, 
          step: 'setting_password', 
          isLoading: false 
        });
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
      router.push('/dashboard');
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
      router.push('/dashboard');
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
      router.push('/dashboard');
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
      // Use signUp() again for resending - Supabase handles it securely
      const tempPassword = crypto.randomUUID() + crypto.randomUUID();
      
      const { error } = await supabase.auth.signUp({
        email: state.email,
        password: tempPassword,
        options: {
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
