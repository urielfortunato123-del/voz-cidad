import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SwipeBackOptions {
  /** Minimum swipe distance in pixels to trigger navigation (default: 80) */
  threshold?: number;
  /** Minimum velocity in px/ms to trigger navigation (default: 0.3) */
  velocityThreshold?: number;
  /** Edge zone width in pixels where swipe must start (default: 30) */
  edgeZone?: number;
  /** Routes that should not allow swipe back */
  excludeRoutes?: string[];
  /** Enable/disable the gesture (default: true) */
  enabled?: boolean;
}

export function useSwipeBack({
  threshold = 80,
  velocityThreshold = 0.3,
  edgeZone = 30,
  excludeRoutes = ['/home', '/', '/selecionar-local'],
  enabled = true,
}: SwipeBackOptions = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchStartTime = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const swipeIndicator = useRef<HTMLDivElement | null>(null);

  const isExcludedRoute = excludeRoutes.includes(location.pathname);

  const createSwipeIndicator = useCallback(() => {
    if (swipeIndicator.current) return;
    
    const indicator = document.createElement('div');
    indicator.id = 'swipe-back-indicator';
    indicator.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 8px;
      height: 100%;
      background: linear-gradient(to right, hsl(var(--primary) / 0.3), transparent);
      transform: translateX(-100%);
      transition: transform 0.1s ease-out;
      z-index: 9999;
      pointer-events: none;
    `;
    document.body.appendChild(indicator);
    swipeIndicator.current = indicator;
  }, []);

  const updateSwipeIndicator = useCallback((progress: number) => {
    if (swipeIndicator.current) {
      const clampedProgress = Math.min(Math.max(progress, 0), 1);
      swipeIndicator.current.style.transform = `translateX(${-100 + clampedProgress * 100}%)`;
      swipeIndicator.current.style.opacity = String(clampedProgress);
    }
  }, []);

  const resetSwipeIndicator = useCallback(() => {
    if (swipeIndicator.current) {
      swipeIndicator.current.style.transform = 'translateX(-100%)';
      swipeIndicator.current.style.opacity = '0';
    }
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isExcludedRoute) return;
    
    const touch = e.touches[0];
    
    // Only start tracking if touch begins in edge zone
    if (touch.clientX <= edgeZone) {
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
      touchStartTime.current = Date.now();
      isSwiping.current = true;
      createSwipeIndicator();
    }
  }, [enabled, isExcludedRoute, edgeZone, createSwipeIndicator]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isSwiping.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);
    
    // Cancel if vertical movement is greater (scrolling)
    if (deltaY > Math.abs(deltaX)) {
      isSwiping.current = false;
      resetSwipeIndicator();
      return;
    }
    
    // Only track right swipes
    if (deltaX > 0) {
      const progress = deltaX / threshold;
      updateSwipeIndicator(progress);
      
      // Prevent default scrolling when swiping
      if (deltaX > 10) {
        e.preventDefault();
      }
    }
  }, [threshold, updateSwipeIndicator, resetSwipeIndicator]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!isSwiping.current) return;
    
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaTime = Date.now() - touchStartTime.current;
    const velocity = deltaX / deltaTime;
    
    // Check if swipe meets threshold requirements
    const meetsDistance = deltaX >= threshold;
    const meetsVelocity = velocity >= velocityThreshold;
    
    if (meetsDistance || (deltaX > threshold / 2 && meetsVelocity)) {
      // Navigate back
      navigate(-1);
    }
    
    // Reset
    isSwiping.current = false;
    resetSwipeIndicator();
  }, [threshold, velocityThreshold, navigate, resetSwipeIndicator]);

  useEffect(() => {
    if (!enabled) return;
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      
      // Cleanup indicator
      if (swipeIndicator.current) {
        swipeIndicator.current.remove();
        swipeIndicator.current = null;
      }
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    isEnabled: enabled && !isExcludedRoute,
  };
}
