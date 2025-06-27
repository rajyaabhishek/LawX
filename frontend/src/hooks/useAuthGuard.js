import { useState } from 'react';
import { useUser } from '@clerk/clerk-react';

export const useAuthGuard = () => {
  const { isSignedIn } = useUser();
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [showAuthGuard, setShowAuthGuard] = useState(false);
  const [guardAction, setGuardAction] = useState('');

  const requireAuth = (action = 'perform this action', callback = null) => {
    if (isSignedIn) {
      // User is authenticated, execute callback if provided
      if (callback) callback();
      return true;
    } else {
      // User is not authenticated, show auth guard
      setGuardAction(action);
      setShowAuthGuard(true);
      return false;
    }
  };

  const showAuth = () => {
    setShowAuthGuard(false);
    setShowAuthPopup(true);
  };

  const closeAuthGuard = () => {
    setShowAuthGuard(false);
  };

  const closeAuthPopup = () => {
    setShowAuthPopup(false);
  };

  const handleAuthSuccess = () => {
    setShowAuthPopup(false);
    setShowAuthGuard(false);
    // Optionally refresh the page or trigger a specific action
    window.location.reload();
  };

  return {
    isSignedIn,
    showAuthPopup,
    showAuthGuard,
    guardAction,
    requireAuth,
    showAuth,
    closeAuthGuard,
    closeAuthPopup,
    handleAuthSuccess,
  };
}; 