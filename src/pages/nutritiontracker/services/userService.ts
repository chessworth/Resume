
import { UserProfile } from "../types";

const USER_KEY = 'nutritrack_user';

export const userService = {
  getCurrentUser: (): UserProfile | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  login: async (email: string): Promise<UserProfile> => {
    const response = await fetch('/.netlify/functions/user-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LOGIN', payload: { email } })
    });
    
    if (!response.ok) throw new Error("Login failed");
    const user = await response.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  signUp: async (profile: Omit<UserProfile, 'id'>): Promise<UserProfile> => {
    const response = await fetch('/.netlify/functions/user-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SIGN_UP', payload: profile })
    });
    
    if (!response.ok) throw new Error("Sign up failed");
    const user = await response.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  logout: () => {
    localStorage.removeItem(USER_KEY);
  }
};
