'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface DragConfig {
  iconSize: number;
  margin: number;
  topSafe: number;
  bottomSafe: number;
  dragThreshold: number;
}

const DEFAULT_CONFIG: DragConfig = {
  iconSize: 56, // Default FAB size (14 * 4 = 56px)
  margin: 16,
  topSafe: 80, // Keep below top bar
  bottomSafe: 160, // Keep above bottom nav
  dragThreshold: 8, // Pixels before counting as drag vs tap
};

/**
 * Hook for managing draggable floating icon position with persistence.
 * Handles pointer events for smooth drag behavior on both touch and mouse.
 * 
 * @param storageKey - Unique localStorage key for this icon's position
 * @param config - Optional configuration for bounds and thresholds
 * @returns Object with position, handlers, and drag state
 */
export function useDraggablePosition(
  storageKey: string,
  config: Partial<DragConfig> = {}
) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const { iconSize, margin, topSafe, bottomSafe, dragThreshold } = mergedConfig;

  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const hasDraggedRef = useRef(false);
  const elementRef = useRef<HTMLButtonElement | null>(null);

  // Clamp position within safe bounds
  const clampPosition = useCallback((pos: { x: number; y: number }) => {
    if (typeof window === 'undefined') return pos;
    
    const maxX = Math.max(margin, window.innerWidth - iconSize - margin);
    const maxY = Math.max(topSafe, window.innerHeight - iconSize - bottomSafe);
    
    return {
      x: Math.min(Math.max(pos.x, margin), maxX),
      y: Math.min(Math.max(pos.y, topSafe), maxY),
    };
  }, [iconSize, margin, topSafe, bottomSafe]);

  // Get default position (bottom-right corner by default)
  const getDefaultPosition = useCallback(() => {
    if (typeof window === 'undefined') return { x: 0, y: 0 };
    return clampPosition({
      x: window.innerWidth - iconSize - 32,
      y: window.innerHeight - iconSize - bottomSafe,
    });
  }, [clampPosition, iconSize, bottomSafe]);

  // Load saved position on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { x: number; y: number };
          setPosition(clampPosition(parsed));
        } catch {
          setPosition(getDefaultPosition());
        }
      } else {
        setPosition(getDefaultPosition());
      }
    }
  }, [storageKey, clampPosition, getDefaultPosition]);

  // Handle pointer down - start potential drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const target = e.currentTarget as HTMLElement;
    target.setPointerCapture(e.pointerId);
    
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    hasDraggedRef.current = false;
    setIsDragging(true);
  }, []);

  // Handle pointer move - perform drag
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStartRef.current || !hasDraggedRef.current) {
      const start = dragStartRef.current;
      if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > dragThreshold) {
        hasDraggedRef.current = true;
      }
      return;
    }

    const start = dragStartRef.current;
    if (!start || !position) return;

    const deltaX = e.clientX - start.x;
    const deltaY = e.clientY - start.y;
    
    const newPos = clampPosition({
      x: position.x + deltaX,
      y: position.y + deltaY,
    });
    
    setPosition(newPos);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, [position, clampPosition, dragThreshold]);

  // Handle pointer up - end drag and persist
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const target = e.currentTarget as HTMLElement;
    if (target.hasPointerCapture(e.pointerId)) {
      target.releasePointerCapture(e.pointerId);
    }
    
    setIsDragging(false);
    dragStartRef.current = null;
    
    // Persist position after a brief delay to allow click handler to check hasDragged
    setTimeout(() => {
      if (position) {
        localStorage.setItem(storageKey, JSON.stringify(position));
      }
    }, 50);
  }, [position, storageKey]);

  // Handle pointer cancel/leave - abort drag
  const handlePointerCancel = useCallback(() => {
    setIsDragging(false);
    dragStartRef.current = null;
    hasDraggedRef.current = false;
  }, []);

  // Check if the last interaction was a drag (for click suppression)
  const wasDragged = useCallback(() => {
    return hasDraggedRef.current;
  }, []);

  // Reset dragged state after click is processed
  const resetDraggedState = useCallback(() => {
    setTimeout(() => {
      hasDraggedRef.current = false;
    }, 0);
  }, []);

  return {
    position,
    isDragging,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerCancel,
      onPointerLeave: handlePointerCancel,
    },
    wasDragged,
    resetDraggedState,
    elementRef,
    style: position ? { left: position.x, top: position.y } : undefined,
  };
}
