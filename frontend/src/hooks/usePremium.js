import { useUser } from "@clerk/clerk-react";
import { useMemo, useCallback } from "react";

export const usePremium = () => {
    const { user, isLoaded, isSignedIn } = useUser();
    
    const refreshUserData = useCallback(async () => {
        if (isSignedIn && user) {
            try {
                // Force refresh of user data from Clerk
                await user.reload();
                console.log('User data refreshed successfully');
                
                // Trigger a page refresh to ensure all components get updated data
                window.location.reload();
            } catch (error) {
                console.error('Failed to refresh user data:', error);
            }
        }
    }, [isSignedIn, user]);
    
    const premiumData = useMemo(() => {
        if (!isLoaded || !user) {
            return {
                isPremium: false,
                subscription: null,
                isLoading: !isLoaded,
                refreshUserData
            };
        }

        const isPremium = user.publicMetadata?.isPremium || false;
        const subscription = user.publicMetadata?.subscription || null;

        return {
            isPremium,
            subscription,
            isLoading: false,
            user,
            refreshUserData
        };
    }, [user, isLoaded, refreshUserData]);

    return premiumData;
};

export default usePremium; 