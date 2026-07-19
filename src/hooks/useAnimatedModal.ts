"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseAnimatedModalOptions {
  closeDelay?: number;
}

export function useAnimatedModal({
  closeDelay = 220,
}: UseAnimatedModalOptions = {}) {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (!isMounted) {
      setIsMounted(true);
      requestAnimationFrame(() => setIsOpen(true));
      return;
    }

    setIsOpen(true);
  }, [isMounted]);

  const close = useCallback(() => {
    setIsOpen(false);

    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
    }

    closeTimerRef.current = setTimeout(() => {
      setIsMounted(false);
      closeTimerRef.current = null;
    }, closeDelay);
  }, [closeDelay]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  return {
    isMounted,
    isOpen,
    open,
    close,
  };
}
