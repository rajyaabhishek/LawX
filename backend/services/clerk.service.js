import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });

/**
 * Update user profile information in Clerk metadata
 * @param {string} clerkId - The Clerk user ID
 * @param {Object} profileData - Profile data to sync (name, username, etc.)
 * @returns {Promise<Object>} Updated metadata
 */
export const syncProfileToClerk = async (clerkId, profileData) => {
    try {
        console.log("Syncing profile data to Clerk for user:", clerkId);
        
        // Get current metadata to preserve existing data
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const currentMetadata = clerkUser.publicMetadata || {};

        // Prepare the metadata update
        const metadataUpdate = {
            publicMetadata: {
                ...currentMetadata,
                lastProfileUpdate: new Date().toISOString()
            }
        };

        // Also prepare user data update for core Clerk fields
        const userUpdate = {};

        // Map profile fields to Clerk metadata
        if (profileData.name) {
            metadataUpdate.publicMetadata.displayName = profileData.name;
            // Also update Clerk's core name fields
            userUpdate.firstName = profileData.name.split(' ')[0] || profileData.name;
            if (profileData.name.includes(' ')) {
                userUpdate.lastName = profileData.name.split(' ').slice(1).join(' ');
            }
        }

        if (profileData.username) {
            metadataUpdate.publicMetadata.username = profileData.username;
            // Also update Clerk's core username field
            userUpdate.username = profileData.username;
        }

        if (profileData.headline) {
            metadataUpdate.publicMetadata.headline = profileData.headline;
        }

        if (profileData.location) {
            metadataUpdate.publicMetadata.location = profileData.location;
        }

        // Update Clerk metadata first
        await clerkClient.users.updateUserMetadata(clerkId, metadataUpdate);
        
        // Update core Clerk user fields if we have updates
        if (Object.keys(userUpdate).length > 0) {
            try {
                await clerkClient.users.updateUser(clerkId, userUpdate);
                console.log("Updated Clerk core user fields:", userUpdate);
            } catch (coreUpdateError) {
                console.warn("Failed to update Clerk core fields, but metadata was updated:", coreUpdateError.message);
                // Don't fail the entire operation if core field updates fail
            }
        }
        
        console.log("Successfully synced profile to Clerk metadata");
        return metadataUpdate.publicMetadata;
    } catch (error) {
        console.error("Failed to sync profile to Clerk:", error);
        throw error;
    }
};

/**
 * Update user premium status in Clerk metadata
 * @param {string} clerkId - The Clerk user ID
 * @param {boolean} isPremium - Premium status
 * @param {Object} subscription - Subscription details
 * @returns {Promise<Object>} Updated metadata
 */
export const syncPremiumStatusToClerk = async (clerkId, isPremium, subscription = null) => {
    try {
        console.log("Syncing premium status to Clerk for user:", clerkId);
        
        // Get current metadata to preserve existing data
        const clerkUser = await clerkClient.users.getUser(clerkId);
        const currentMetadata = clerkUser.publicMetadata || {};

        const metadataUpdate = {
            publicMetadata: {
                ...currentMetadata,
                isPremium,
                isVerified: isPremium, // Premium users are verified
                lastStatusUpdate: new Date().toISOString()
            }
        };

        if (subscription) {
            metadataUpdate.publicMetadata.subscription = subscription;
        }

        // Update Clerk metadata
        await clerkClient.users.updateUserMetadata(clerkId, metadataUpdate);
        
        console.log("Successfully synced premium status to Clerk metadata");
        return metadataUpdate.publicMetadata;
    } catch (error) {
        console.error("Failed to sync premium status to Clerk:", error);
        throw error;
    }
};

/**
 * Get user from Clerk by ID
 * @param {string} clerkId - The Clerk user ID
 * @returns {Promise<Object>} Clerk user object
 */
export const getClerkUser = async (clerkId) => {
    try {
        return await clerkClient.users.getUser(clerkId);
    } catch (error) {
        console.error("Failed to get Clerk user:", error);
        throw error;
    }
};

export { clerkClient }; 