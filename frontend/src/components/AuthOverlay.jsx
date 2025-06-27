import React from 'react';
import { SignIn, useUser } from '@clerk/clerk-react';
import { useColorMode } from '@chakra-ui/react';

const AuthOverlay = () => {
  const { isSignedIn } = useUser();
  const { colorMode } = useColorMode();

  if (isSignedIn) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
    >
      <SignIn
        redirectUrl={window.location.origin}
        appearance={{
          variables: {
            colorPrimary: '#3B82F6',
            colorBackground: colorMode === 'dark' ? '#1A202C' : '#FFFFFF',
            colorText: colorMode === 'dark' ? '#FFFFFF' : '#1A202C',
          },
          elements: {
            card: colorMode === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800',
            headerTitle: colorMode === 'dark' ? 'text-white' : 'text-gray-700',
            formFieldInput:
              colorMode === 'dark'
                ? 'bg-gray-700 text-white placeholder-gray-400'
                : 'bg-gray-100 text-gray-800 placeholder-gray-500',
            socialButtonsBlockButton:
              colorMode === 'dark'
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
          },
        }}
      />
    </div>
  );
};

export default AuthOverlay; 