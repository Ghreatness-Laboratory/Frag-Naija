'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for managing floating icon hide/re-open behavior.
 * Each icon type has independent state stored in localStorage.
 * State is session-based (cleared on new browser session via sessionStorage mirror).
 * 
 * @param iconType - Unique identifier for the icon (e.g., 'chatbot', 'font-toggle', 'fantasy-fab')
 * @returns Object with dismissed state, handlers, and re-enable function
 */
export function useFloatingIconDismiss(iconType: string) {
  const storageKey = `fn-${iconType}-dismissed`;
  const sessionCheckKey = `fn-${iconType}-session-check`;
  
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Load dismissed state on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setMounted(true);
      const wasDismissed = localStorage.getItem(storageKey) === 'true';
      
      // Check if this is a new session by comparing sessionStorage marker
      const sessionMarker = sessionStorage.getItem(sessionCheckKey);
      const isNewSession = sessionMarker === null;
      
      if (isNewSession && wasDismissed) {
        // Clear dismissed state on new session
        localStorage.removeItem(storageKey);
        setDismissed(false);
      } else {
        setDismissed(wasDismissed);
      }
      
      // Set session marker to indicate we've checked this session
      sessionStorage.setItem(sessionCheckKey, 'true');
    }
  }, [storageKey, sessionCheckKey]);

  // Dismiss the icon (long-press or explicit dismiss gesture)
  const handleDismiss = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(storageKey, 'true');
      setDismissed(true);
    }
  }, [storageKey]);

  // Re-enable the icon (tap on re-open tab)
  const handleReenable = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
      setDismissed(false);
    }
  }, [storageKey]);

  return {
    dismissed: mounted && dismissed,
    handleDismiss,
    handleReenable,
    mounted,
  };
}
