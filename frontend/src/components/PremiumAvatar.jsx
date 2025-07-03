import { Avatar } from "@chakra-ui/react";
import { useUser } from "@clerk/clerk-react";

// Reusable Avatar component that automatically adds a golden ring for premium users.
// Usage: <PremiumAvatar user={someUser} ...otherAvatarProps />
// It falls back to Clerk user metadata if the `user` prop is not provided.
const PremiumAvatar = ({ user: passedUser, src, name, size = "md", ...rest }) => {
  const { user: clerkUser } = useUser();

  // Determine the user object. Use the explicit `user` prop if provided, otherwise fallback to Clerk.
  const user = passedUser || clerkUser;

  // Determine premium status – prioritise explicit user prop, then Clerk publicMetadata.
  const isPremium = user?.isPremium || user?.publicMetadata?.isPremium || false;

  // Resolve avatar source & display name with sensible fallbacks
  const avatarSrc = src || user?.profilePicture || user?.profilePic || "/avatar.png";
  const avatarName = name || user?.name || "User";

  // Golden ring styles for premium members – similar to LinkedIn premium indicator
  const premiumStyles = isPremium
    ? {
        border: "2px solid #f0b429", // gold colour
        boxShadow: "0 0 0 2px rgba(240, 180, 41, 0.4)",
      }
    : {};

  return (
    <Avatar
      src={avatarSrc}
      name={avatarName}
      size={size}
      {...premiumStyles}
      {...rest}
    />
  );
};

export default PremiumAvatar; 