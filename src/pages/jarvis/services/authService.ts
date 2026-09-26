/**
 * @fileoverview Authentication service supporting both live Supabase Auth
 * and resilient local-sandbox guest states.
 * @packageDocumentation
 */

import { supabase, isSupabaseConfigured } from './supabaseClient';
import { UserSession } from '../types/task';
import { storageAdapter } from './storageAdapter';

export interface AuthResponse {
  session: UserSession | null;
  error: string | null;
}

class AuthenticationService {
  /**
   * Registers a new operator account via Supabase Auth or Local Gateway.
   */
  async signUp(email: string, password: string, name?: string): Promise<AuthResponse> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name || email.split('@')[0]
            }
          }
        });

        if (error) {
          return { session: null, error: error.message };
        }

        if (data.user) {
          const session: UserSession = {
            id: data.user.id,
            name: data.user.user_metadata?.display_name || name || email.split('@')[0],
            email: data.user.email || email,
            isGuest: false,
            createdAt: data.user.created_at || new Date().toISOString()
          };
          await storageAdapter.setSession(session);
          return { session, error: null };
        }

        return { session: null, error: 'Registration incomplete. Check confirmation parameters.' };
      } catch (err: unknown) {
        return {
          session: null,
          error: err instanceof Error ? err.message : 'Unknown network authentication error.'
        };
      }
    }

    // Local Persistence Gateway Fallback
    const localSession: UserSession = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: name?.trim() || email.split('@')[0],
      email: email.trim(),
      isGuest: false,
      createdAt: new Date().toISOString()
    };
    await storageAdapter.setSession(localSession);
    return { session: localSession, error: null };
  }

  /**
   * Authenticates existing operator credentials.
   */
  async signIn(email: string, password: string): Promise<AuthResponse> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) {
          return { session: null, error: error.message };
        }

        if (data.user) {
          const session: UserSession = {
            id: data.user.id,
            name: data.user.user_metadata?.display_name || email.split('@')[0],
            email: data.user.email || email,
            isGuest: false,
            createdAt: data.user.created_at || new Date().toISOString()
          };
          await storageAdapter.setSession(session);
          return { session, error: null };
        }

        return { session: null, error: 'Authentication failed. Invalid user record.' };
      } catch (err: unknown) {
        return {
          session: null,
          error: err instanceof Error ? err.message : 'Network failure during authentication.'
        };
      }
    }

    // Local Gateway Fallback
    const localSession: UserSession = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name: email.split('@')[0],
      email: email.trim(),
      isGuest: false,
      createdAt: new Date().toISOString()
    };
    await storageAdapter.setSession(localSession);
    return { session: localSession, error: null };
  }

  /**
   * Generates or retrieves an ephemeral Guest session.
   */
  async proceedAsGuest(): Promise<UserSession> {
    const existing = await storageAdapter.fetchSession();
    if (existing && existing.isGuest) {
      return existing;
    }

    const guestSession: UserSession = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      name: 'Guest Operator',
      email: null,
      isGuest: true,
      createdAt: new Date().toISOString()
    };
    await storageAdapter.setSession(guestSession);
    return guestSession;
  }

  /**
   * Terminates active session across Supabase and local cache.
   */
  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[Jarvis Auth] Supabase signOut error:', err);
      }
    }
    await storageAdapter.setSession(null);
  }

  /**
   * Retrieves current active session.
   */
  async getCurrentSession(): Promise<UserSession | null> {
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user) {
          const user = data.session.user;
          const session: UserSession = {
            id: user.id,
            name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Operator',
            email: user.email || null,
            isGuest: false,
            createdAt: user.created_at || new Date().toISOString()
          };
          await storageAdapter.setSession(session);
          return session;
        }
      } catch {
        // Fall back to storage adapter on network error
      }
    }

    return storageAdapter.fetchSession();
  }

  /**
   * Registers a listener for Supabase authentication state mutations.
   */
  onAuthStateChange(callback: (session: UserSession | null) => void): () => void {
    if (isSupabaseConfigured() && supabase) {
      const { data: authListener } = supabase.auth.onAuthStateChange(
        async (_event, supabaseSession) => {
          if (supabaseSession?.user) {
            const user = supabaseSession.user;
            const session: UserSession = {
              id: user.id,
              name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'Operator',
              email: user.email || null,
              isGuest: false,
              createdAt: user.created_at || new Date().toISOString()
            };
            await storageAdapter.setSession(session);
            callback(session);
          } else {
            const localSession = await storageAdapter.fetchSession();
            if (!localSession || !localSession.isGuest) {
              await storageAdapter.setSession(null);
              callback(null);
            }
          }
        }
      );

      return () => {
        authListener.subscription.unsubscribe();
      };
    }

    return () => {};
  }
}

export const authService = new AuthenticationService();
