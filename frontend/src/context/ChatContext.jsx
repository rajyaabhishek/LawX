import React, { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChatPopup = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatPopup must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = () => setIsChatOpen(true);
  const closeChat = () => setIsChatOpen(false);
  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const value = {
    isChatOpen,
    openChat,
    closeChat,
    toggleChat,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext; 