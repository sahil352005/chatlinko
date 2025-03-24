
import React, { useEffect } from 'react';
import { ChatProvider, useChat } from '../context/ChatContext';
import JoinForm from '../components/JoinForm';
import ChatRoom from '../components/ChatRoom';
import Header from '../components/Header';

// Main component that checks URL params and renders the appropriate UI
const ChatApp: React.FC = () => {
  const { isConnected, joinRoom } = useChat();
  
  // Check for room ID in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomId = params.get('room');
    
    if (roomId && !isConnected) {
      // Show the join form with the room ID pre-filled
      // We don't auto-join because we need the user's name
      const queryParams = new URLSearchParams(window.location.search);
      // Set this as a state in localStorage or context if needed
    }
  }, [isConnected, joinRoom]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-white to-gray-50">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-4">
        {!isConnected ? (
          <JoinForm />
        ) : (
          <div className="w-full max-w-4xl shadow-xl rounded-xl overflow-hidden">
            <ChatRoom />
          </div>
        )}
      </main>
      
      <footer className="p-4 text-center text-sm text-gray-500">
        <p>
          Minimalist chat application • No data is stored on servers
        </p>
      </footer>
    </div>
  );
};

// Wrapper component that provides the ChatContext
const Index: React.FC = () => {
  return (
    <ChatProvider>
      <ChatApp />
    </ChatProvider>
  );
};

export default Index;
