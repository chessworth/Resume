
import { UserProfile } from "../types";

const USER_KEY = 'nt_user_session';

export const userService = {
  getCurrentUser: async (): Promise<UserProfile | null> => {
    const saved = localStorage.getItem(USER_KEY);
    if (!saved) return null;
    return JSON.parse(saved);
  },

  login: async (email: string, password: string): Promise<UserProfile> => {
    const response = await fetch('/.netlify/functions/user-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LOGIN', payload: { email, password } })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Login failed");
    }

    const user = await response.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  signUp: async (profile: Omit<UserProfile, 'id'> & { password?: string }): Promise<UserProfile> => {
    const response = await fetch('/.netlify/functions/user-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SIGN_UP', payload: profile })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || "Registration failed");
    }

    const user = await response.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: async () => {
    localStorage.removeItem(USER_KEY);
  }
};
