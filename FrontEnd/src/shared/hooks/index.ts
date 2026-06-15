import { useEffect, useState, useCallback, useRef } from 'react';

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

import { useAuthStore } from '../../store/AuthStore';

export function useContentProtection() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    // 1. Create and append security watermark if user is logged in
    let overlay: HTMLDivElement | null = null;
    if (user) {
      const text = `${user.fullName} - ${user.email}`;
      const canvas = document.createElement('canvas');
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.rotate(-20 * Math.PI / 180);
        ctx.font = '500 12px Inter, sans-serif';
        ctx.fillStyle = 'rgba(148, 163, 184, 0.08)'; // Sleek light gray/slate text
        ctx.fillText(text, 20, 150);
      }
      const dataUrl = canvas.toDataURL();

      overlay = document.createElement('div');
      overlay.id = 'security-watermark';
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '999999';
      overlay.style.backgroundImage = `url(${dataUrl})`;
      overlay.style.backgroundRepeat = 'repeat';
      document.body.appendChild(overlay);
    }

    // 2. Prevent standard keyboard/mouse capture routes
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        console.warn('Screenshot blocked by Enterprise policy.');
      }
      // Prevent Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        console.warn('Printing blocked by Enterprise policy.');
      }
      // Prevent Ctrl+S / Cmd+S (Save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        console.warn('File saving blocked by Enterprise policy.');
      }
      // Prevent Ctrl+Shift+I / F12 (Dev Tools)
      if ((e.ctrlKey && e.shiftKey && e.key === 'I') || e.key === 'F12') {
        e.preventDefault();
        console.warn('DevTools shortcut blocked.');
      }
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn('Security Alert: User left active learning portal tab.');
      }
    };

    const handleBlur = () => {
      console.warn('Security Alert: Window focus lost.');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      if (overlay) {
        overlay.remove();
      }
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [user]);
}

export function useAutoSave(saveFunction: () => void, intervalMs: number = 15000) {
  const savedCallback = useRef(saveFunction);

  useEffect(() => {
    savedCallback.current = saveFunction;
  }, [saveFunction]);

  useEffect(() => {
    const interval = setInterval(() => savedCallback.current(), intervalMs);
    return () => clearInterval(interval);
  }, [intervalMs]);
}

export function useTimer(durationMinutes: number, onExpiry: () => void) {
  const [timeRemaining, setTimeRemaining] = useState(durationMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const reset = useCallback(() => {
    setTimeRemaining(durationMinutes * 60);
    setIsRunning(false);
  }, [durationMinutes]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          onExpiry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onExpiry]);

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    reset,
    formattedTime: `${Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:${(timeRemaining % 60).toString().padStart(2, '0')}`,
  };
}
