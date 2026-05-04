import { useState, useCallback, useEffect } from 'react';

// Create a singleton state for the announcer so any component using the hook updates the same global announcer
let globalAnnounce = (message: string) => {};

// Store the listener
let listener: ((message: string) => void) | null = null;

export const setAnnouncerListener = (fn: (message: string) => void) => {
  listener = fn;
};

export const announceMessage = (message: string) => {
  if (listener) {
    listener(message);
  }
};

/**
 * Hook to announce dynamic messages to screen readers
 */
export const useA11yAnnouncer = () => {
  const announce = useCallback((message: string) => {
    announceMessage(message);
  }, []);

  return { announce };
};
