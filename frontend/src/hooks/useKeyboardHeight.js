import { useState, useEffect, useCallback } from 'react';

const useKeyboardHeight = () => {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  const updateKeyboardState = useCallback((height) => {
    const threshold = 150; // Minimum height difference to consider keyboard open
    const isOpen = height > threshold;
    
    setKeyboardHeight(height > 0 ? height : 0);
    setIsKeyboardOpen(isOpen);
  }, []);

  useEffect(() => {
    // Only run on mobile devices
    if (typeof window === 'undefined' || window.innerWidth > 768) {
      return;
    }

    let initialViewportHeight = window.innerHeight;
    let resizeTimeout;

    // Method 1: Use Visual Viewport API (most reliable for modern browsers)
    const handleVisualViewportChange = () => {
      if (window.visualViewport) {
        const heightDifference = window.innerHeight - window.visualViewport.height;
        updateKeyboardState(heightDifference);
      }
    };

    // Method 2: Use window resize as fallback
    const handleWindowResize = () => {
      // Debounce resize events to avoid excessive calls
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
      
      resizeTimeout = setTimeout(() => {
        const currentHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - currentHeight;
        updateKeyboardState(heightDifference);
      }, 100);
    };

    // Method 3: Use document height changes (additional fallback)
    const handleDocumentHeightChange = () => {
      if (document.body) {
        const bodyHeight = document.body.scrollHeight;
        const windowHeight = window.innerHeight;
        const heightDifference = initialViewportHeight - windowHeight;
        
        if (heightDifference > 0) {
          updateKeyboardState(heightDifference);
        }
      }
    };

    // Try Visual Viewport API first (best support)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    } else {
      // Fallback to window resize
      window.addEventListener('resize', handleWindowResize);
    }

    // Additional listener for orientation changes
    const handleOrientationChange = () => {
      setTimeout(() => {
        initialViewportHeight = window.innerHeight;
        setKeyboardHeight(0);
        setIsKeyboardOpen(false);
      }, 500);
    };

    window.addEventListener('orientationchange', handleOrientationChange);

    // iOS Safari specific handling
    const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOSSafari) {
      // Listen for focus/blur events on input elements
      const handleFocusIn = (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
          setTimeout(() => {
            const heightDifference = initialViewportHeight - window.innerHeight;
            updateKeyboardState(heightDifference);
          }, 300);
        }
      };

      const handleFocusOut = () => {
        setTimeout(() => {
          updateKeyboardState(0);
        }, 300);
      };

      document.addEventListener('focusin', handleFocusIn);
      document.addEventListener('focusout', handleFocusOut);

      // Cleanup for iOS Safari
      return () => {
        document.removeEventListener('focusin', handleFocusIn);
        document.removeEventListener('focusout', handleFocusOut);
        window.removeEventListener('orientationchange', handleOrientationChange);
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
        } else {
          window.removeEventListener('resize', handleWindowResize);
        }
        if (resizeTimeout) {
          clearTimeout(resizeTimeout);
        }
      };
    }

    // Cleanup
    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      } else {
        window.removeEventListener('resize', handleWindowResize);
      }
      if (resizeTimeout) {
        clearTimeout(resizeTimeout);
      }
    };
  }, [updateKeyboardState]);

  return {
    keyboardHeight,
    isKeyboardOpen
  };
};

export default useKeyboardHeight; 