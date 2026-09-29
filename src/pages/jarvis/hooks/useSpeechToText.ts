/**
 * @fileoverview Custom React hook for Browser Web Speech API Speech-to-Text Recognition.
 * Enables microphone audio capture for the command palette with keyboard shortcut integration.
 * Adheres to rule: "when using voice, don't default to AI, let the user specify it as well."
 * @packageDocumentation
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// Declarations for Web Speech API
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionEvent) => any) | null;
  onerror: ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => any) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => any) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognitionInstance;
    };
  }
}

export interface UseSpeechToTextOptions {
  onTranscriptChange?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  lang?: string;
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { onTranscriptChange, onFinalTranscript, lang = 'en-US' } = options;
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let currentTranscript = '';
        let finalChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = result[0].transcript;
          if (result.isFinal) {
            finalChunk += text;
          } else {
            currentTranscript += text;
          }
        }

        const combined = (finalChunk || currentTranscript).trim();
        setTranscript(combined);
        if (onTranscriptChange) {
          onTranscriptChange(combined);
        }
        if (finalChunk && onFinalTranscript) {
          onFinalTranscript(finalChunk.trim());
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission was denied.');
        } else if (event.error === 'no-speech') {
          setError('No speech detected. Please speak into your microphone.');
        } else {
          setError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [lang, onTranscriptChange, onFinalTranscript]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Web Speech API is not supported in this browser.');
      return;
    }
    if (recognitionRef.current && !isListening) {
      try {
        setTranscript('');
        setError(null);
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch (err: any) {
        console.error('Failed to stop speech recognition:', err);
      }
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  return {
    isListening,
    transcript,
    error,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
