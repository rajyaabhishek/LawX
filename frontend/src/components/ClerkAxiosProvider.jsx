import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { configureAxiosWithClerk } from '../lib/axios';

const ClerkAxiosProvider = ({ children }) => {
  const { getToken } = useAuth();

  useEffect(() => {
    console.log('ClerkAxiosProvider: Setting up axios interceptor');
    // Configure axios to use Clerk tokens
    configureAxiosWithClerk(getToken);
  }, [getToken]);

  return children;
};

export default ClerkAxiosProvider; 