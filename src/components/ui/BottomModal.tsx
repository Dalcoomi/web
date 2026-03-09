"use client";

import { useEffect, useRef, useState, type PointerEvent, type ReactNode } from "react";

interface BottomModalProps {
  isMounted: boolean;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  closeDragThreshold?: number;
  overlayClassName?: string;
  sheetClassName?: string;
  handleClassName?: string;
}

const DEFAULT_CLOSE_DRAG_THRESHOLD = 160;

let modalScrollLockCount = 0;
let restoreDocumentStyles: {
  bodyOverflow: string;
  htmlOverflow: string;
  bodyTouchAction: string;
  bodyOverscrollBehavior: string;
  htmlOverscrollBehavior: string;
} | null = null;

export default function BottomModal({
  isMounted,
  isOpen,
  onClose,
  children,
  closeDragThreshold = DEFAULT_CLOSE_DRAG_THRESHOLD,
  overlayClassName = "bg-[#d9d9d9]",
  sheetClassName = "bg-white rounded-t-[20px] rounded-b-none pt-3 pb-0",
  handleClassName = "w-16 h-[5px] bg-gray-100 rounded-[100px] mx-auto mb-5 cursor-grab active:cursor-grabbing touch-none",
}: BottomModalProps) {
  const dragStartYRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  useEffect(() => {
    if (!isMounted) {
      return;
    }

    const body = document.body;
    const html = document.documentElement;

    if (modalScrollLockCount === 0) {
      restoreDocumentStyles = {
        bodyOverflow: body.style.overflow,
        htmlOverflow: html.style.overflow,
        bodyTouchAction: body.style.touchAction,
        bodyOverscrollBehavior: body.style.overscrollBehavior,
        htmlOverscrollBehavior: html.style.overscrollBehavior,
      };

      body.style.overflow = "hidden";
      html.style.overflow = "hidden";
      body.style.touchAction = "none";
      body.style.overscrollBehavior = "none";
      html.style.overscrollBehavior = "none";
    }

    modalScrollLockCount += 1;

    return () => {
      modalScrollLockCount = Math.max(0, modalScrollLockCount - 1);

      if (modalScrollLockCount === 0 && restoreDocumentStyles) {
        body.style.overflow = restoreDocumentStyles.bodyOverflow;
        html.style.overflow = restoreDocumentStyles.htmlOverflow;
        body.style.touchAction = restoreDocumentStyles.bodyTouchAction;
        body.style.overscrollBehavior = restoreDocumentStyles.bodyOverscrollBehavior;
        html.style.overscrollBehavior = restoreDocumentStyles.htmlOverscrollBehavior;
        restoreDocumentStyles = null;
      }
    };
  }, [isMounted]);

  useEffect(() => {
    if (!isOpen) {
      setDragOffset(0);
      setIsDragging(false);
      dragStartYRef.current = null;
    }
  }, [isOpen]);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartYRef.current = e.clientY;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging || dragStartYRef.current === null) {
      return;
    }

    const deltaY = Math.max(0, e.clientY - dragStartYRef.current);
    setDragOffset(deltaY);
  };

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    setIsDragging(false);
    dragStartYRef.current = null;

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (dragOffset > closeDragThreshold) {
      onClose();
      return;
    }

    setDragOffset(0);
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-40 overflow-hidden">
      <div
        className={`absolute inset-0 transition-opacity duration-200 ${
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        } ${overlayClassName}`}
        onClick={onClose}
      />

      <div
        className={`absolute left-0 right-0 bottom-0 z-10 overflow-hidden ${
          isDragging ? "" : "transition-transform duration-200 ease-out"
        } ${sheetClassName} bottom-modal-scroll-hide`}
        data-bottom-modal="true"
        style={{
          transform: isOpen ? `translateY(${dragOffset}px)` : "translateY(100%)",
        }}
      >
        <div
          className={handleClassName}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
        {children}
      </div>
    </div>
  );
}
