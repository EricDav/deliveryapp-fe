import { useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  threshold?: number; // Distance from bottom in pixels to trigger load
}

export function useInfiniteScroll({
  hasMore,
  loading,
  onLoadMore,
  threshold = 200,
}: UseInfiniteScrollOptions) {
  const loadingRef = useRef(false);

  const handleScroll = useCallback(() => {
    // Prevent multiple simultaneous loads
    if (loadingRef.current || loading || !hasMore) {
      return;
    }

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;

    // Check if we're near the bottom
    if (scrollTop + clientHeight >= scrollHeight - threshold) {
      loadingRef.current = true;
      onLoadMore();
      
      // Reset loading flag after a short delay
      setTimeout(() => {
        loadingRef.current = false;
      }, 1000);
    }
  }, [hasMore, loading, onLoadMore, threshold]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  // Reset loading ref when loading state changes
  useEffect(() => {
    if (!loading) {
      loadingRef.current = false;
    }
  }, [loading]);
} 