/**
 * @fileoverview Authentication modal and guest onboarding dialog.
 * Facilitates credential registration or ephemeral guest session creation.
 * Integrates with Supabase Auth when configured, with resilient local sandbox fallback.
 * @packageDocumentation
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Key,
  Mail,
  User,
  AlertCircle,
  Cpu,
  Eye,
  EyeOff,
  Cloud,
  HardDrive
} from 'lucide-react';
import { UserSession } from '../types/task';
import { authService } from '../services/authService';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface AuthModalProps {
  isOpen: boolean;
  onAuthenticate: (session: UserSession) => void;
  onProceedGuest: () => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onAuthenticate,
  onProceedGuest,
  onClose,
  canClose = false
}) => {
  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('SIGNUP');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const isCloudAuthReady = isSupabaseConfigured();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !email.includes('@')) {
      setErrorMsg('Invalid email format. Input RFC 5322 compliant address.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Password fails minimum entropy criteria (minimum 6 characters).');
      return;
    }

    setIsProcessing(true);

    try {
      if (mode === 'SIGNUP') {
        const { session, error } = await authService.signUp(email, password, name);
        if (error) {
          setErrorMsg(error);
          setIsProcessing(false);
          return;
        }
        if (session) {
          onAuthenticate(session);
        }
      } else {
        const { session, error } = await authService.signIn(email, password);
        if (error) {
          setErrorMsg(error);
          setIsProcessing(false);
          return;
        }
        if (session) {
          onAuthenticate(session);
        }
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Authentication attempt failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 text-slate-800 dark:text-slate-100 transition-colors">
        {/* Header Protocol Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-600 dark:text-cyan-400">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-mono tracking-tight text-slate-950 dark:text-white">
                JARVIS AUTHENTICATION GATE
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                {isCloudAuthReady ? (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                    <Cloud className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    SUPABASE CLOUD AUTH ONLINE
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-cyan-700 dark:text-cyan-400 font-bold">
                    <HardDrive className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                    LOCAL PERSISTENCE GATEWAY
                  </span>
                )}
              </div>
            </div>
          </div>
          {canClose && onClose && (
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-mono uppercase tracking-wider cursor-pointer font-bold"
            >
              [CLOSE]
            </button>
          )}
        </div>

        {/* Persistence Notice */}
        <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-300 dark:border-amber-500/30 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-sans font-medium">
            <strong className="text-amber-950 dark:text-amber-300 font-bold">DATA ISOLATION:</strong> Authenticated sessions synchronize state securely. Guest sandbox stores tasks in the local browser cache.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="mt-5 grid grid-cols-2 gap-1 p-1.5 bg-slate-100 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => { setMode('SIGNUP'); setErrorMsg(null); }}
            className={`py-2 text-xs font-bold rounded-xl font-mono uppercase transition-all cursor-pointer ${
              mode === 'SIGNUP'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => { setMode('LOGIN'); setErrorMsg(null); }}
            className={`py-2 text-xs font-bold rounded-xl font-mono uppercase transition-all cursor-pointer ${
              mode === 'LOGIN'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Sign In
          </button>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mt-3 p-3 text-xs font-mono font-medium text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 rounded-xl">
            ERROR: {errorMsg}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          {mode === 'SIGNUP' && (
            <div>
              <label className="block text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mb-1">
                OPERATOR CALLSIGN / NAME (OPTIONAL)
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Lead Architect"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans shadow-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mb-1">
              EMAIL ADDRESS *
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operator@system.org"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-slate-800 dark:text-slate-200 mb-1">
              PASSWORD (MIN 6 CHARACTERS) *
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans shadow-xs"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isProcessing}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-cyan-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <ShieldCheck className="w-4 h-4" />
            {isProcessing ? 'AUTHENTICATING...' : mode === 'SIGNUP' ? 'INITIALIZE SECURE ACCOUNT' : 'VERIFY & SIGN IN'}
          </button>
        </form>

        {/* Secondary Guest Pathway */}
        <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-600 dark:text-slate-400 mb-2 font-medium">Prefer immediate local sandbox testing?</p>
          <button
            type="button"
            onClick={onProceedGuest}
            className="w-full py-2.5 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-mono rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer font-bold"
          >
            <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            PROCEED AS GUEST (LOCAL STORAGE ONLY)
          </button>
        </div>
      </div>
    </div>
  );
};
