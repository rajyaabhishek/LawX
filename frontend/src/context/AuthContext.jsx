import React, { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import useShowToast from '../hooks/useShowToast';
import { axiosInstance } from '../lib/axios';

const AuthContext = createContext();

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const { isSignedIn, user, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestTimeLeft, setGuestTimeLeft] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const showToast = useShowToast();

  // Initialize session tracking
  useEffect(() => {
    if (!sessionStartTime) {
      setSessionStartTime(Date.now());
    }
  }, []);

  // Handle user authentication state changes
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsLoading(true);
      try {
        if (isSignedIn && user && isLoaded) {
          const token = await getToken();
          
          if (token) {
            try {
              const { data } = await axiosInstance.get('/users/me', {
                headers: { Authorization: `Bearer ${token}` }
              });
              
              // Ensure we get the most up-to-date premium status from Clerk
              const isPremiumFromClerk = user.publicMetadata?.isPremium || false;
              const subscriptionFromClerk = user.publicMetadata?.subscription || null;
              
              // Create combined user data with Clerk metadata taking precedence
              const combinedUserData = {
                ...data.user,
                isPremium: isPremiumFromClerk,
                subscription: subscriptionFromClerk,
                // Ensure isVerified is also properly set
                isVerified: data.user.isVerified || isPremiumFromClerk
              };
              
              setCurrentUser(combinedUserData);
              setSessionStartTime(Date.now());
              updateLastActivity();
            } catch (apiError) {
              console.error('API call failed, using Clerk data only:', apiError);
              
              // Fallback: use Clerk data directly if API fails
              const isPremiumFromClerk = user.publicMetadata?.isPremium || false;
              const subscriptionFromClerk = user.publicMetadata?.subscription || null;
              
              setCurrentUser({
                _id: user.id,
                clerkId: user.id,
                name: user.fullName || user.firstName || 'User',
                username: user.username || user.emailAddresses[0]?.emailAddress?.split('@')[0],
                email: user.emailAddresses[0]?.emailAddress || '',
                profilePicture: user.imageUrl || '',
                isPremium: isPremiumFromClerk,
                subscription: subscriptionFromClerk,
                isVerified: isPremiumFromClerk // Premium users are auto-verified
              });
            }
          }
        } else if (!isLoaded || !isSignedIn) {
          // Handle guest mode checking
          try {
            const savedState = localStorage.getItem('authOverlayState');
            if (savedState) {
              const { isGuestMode: savedGuestMode, timestamp } = JSON.parse(savedState);
              const timeDiff = Math.floor((Date.now() - timestamp) / 1000);
              if (savedGuestMode && timeDiff < 300) {
                setIsGuestMode(true);
                setGuestTimeLeft(300 - timeDiff);
              }
            }
          } catch (error) {
            console.error('Error parsing saved state:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, [isSignedIn, user, isLoaded, getToken]);

  // Guest mode timer
  useEffect(() => {
    if (!isGuestMode || isSignedIn) return;

    const timer = setInterval(() => {
      setGuestTimeLeft((prev) => {
        if (prev <= 1) {
          setIsGuestMode(false);
          localStorage.removeItem('authOverlayState');
          showToast(
            "Guest session expired",
            "Please sign in to continue using LawX",
            "warning"
          );
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isGuestMode, isSignedIn, showToast]);

  // Session activity tracking
  const updateLastActivity = () => {
    localStorage.setItem('lastActivity', Date.now().toString());
  };

  // Check for inactive sessions
  useEffect(() => {
    const checkInactivity = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity);
        const thirtyMinutes = 30 * 60 * 1000;
        
        if (timeSinceLastActivity > thirtyMinutes && !isSignedIn) {
          setIsGuestMode(false);
          localStorage.removeItem('authOverlayState');
        }
      }
    };

    const interval = setInterval(checkInactivity, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [isSignedIn]);

  // Enhanced user permissions checking
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    switch (permission) {
      case 'CREATE_CASE':
        // For case creation, user must be premium and verified
        return currentUser.isPremium && currentUser.isVerified;
      case 'VIEW_PREMIUM_CONTENT':
      case 'VIEW_MY_CASES':
        // For viewing premium content (like My Cases), only premium is required
        return currentUser.isPremium;
      case 'APPLY_TO_CASE':
        // For applying to cases, user just needs to be verified OR premium
        return currentUser.isVerified || currentUser.isPremium;
      case 'MESSAGE_USERS':
        return currentUser.isVerified || currentUser.isPremium;
      default:
        return false;
    }
  };

  // Enhanced user role checking
  const hasRole = (role) => {
    if (!currentUser) return false;
    return currentUser.role === role;
  };

  // Check if user can access a feature
  const canAccess = (feature) => {
    if (isSignedIn && currentUser) return true;
    if (isGuestMode) {
      // Define what guests can access
      const guestAllowedFeatures = [
        'VIEW_CASES',
        'BROWSE_CONTENT',
        'VIEW_PROFILES',
        'READ_POSTS'
      ];
      return guestAllowedFeatures.includes(feature);
    }
    return false;
  };

  // Get user display info
  const getUserDisplayInfo = () => {
    if (isSignedIn && user) {
      return {
        name: user.fullName || user.firstName || 'User',
        email: user.primaryEmailAddress?.emailAddress || '',
        avatar: user.imageUrl || '',
        isPremium: currentUser?.isPremium || false,
        isVerified: currentUser?.isVerified || false,
      };
    }
    if (isGuestMode) {
      return {
        name: 'Guest User',
        email: '',
        avatar: '',
        isPremium: false,
        isVerified: false,
      };
    }
    return null;
  };

  // Session time tracking
  const getSessionDuration = () => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime) / 1000);
  };

  // Authentication helpers
  const signOut = async () => {
    try {
      localStorage.removeItem('authOverlayState');
      localStorage.removeItem('lastActivity');
      setCurrentUser(null);
      setIsGuestMode(false);
      // Clerk will handle the actual sign out
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  const activateGuestMode = (duration = 300) => {
    setIsGuestMode(true);
    setGuestTimeLeft(duration);
    const state = {
      isGuestMode: true,
      hasShownModal: true,
      timestamp: Date.now()
    };
    localStorage.setItem('authOverlayState', JSON.stringify(state));
    updateLastActivity();
  };

  const value = {
    // Clerk auth state
    isSignedIn,
    user,
    isLoaded,
    
    // Extended auth state
    currentUser,
    isLoading,
    isGuestMode,
    guestTimeLeft,
    sessionStartTime,
    
    // Helper functions
    hasPermission,
    hasRole,
    canAccess,
    getUserDisplayInfo,
    getSessionDuration,
    updateLastActivity,
    signOut,
    activateGuestMode,
    
    // Computed values
    isAuthenticated: isSignedIn || isGuestMode,
    isPremiumUser: currentUser?.isPremium || false,
    isVerifiedUser: currentUser?.isVerified || false,
    userRole: currentUser?.role || 'guest',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 