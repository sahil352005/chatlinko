
import React, { createContext, useContext, useEffect, useState } from 'react';
import { nanoid } from 'nanoid';

// Define types
type User = {
  id: string;
  name: string;
  color: string;
};

type Message = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
  color: string;
};

type ChatContextType = {
  messages: Message[];
  roomId: string | null;
  user: User | null;
  users: User[];
  sendMessage: (text: string) => void;
  joinRoom: (roomId: string, userName: string) => void;
  createRoom: (userName: string) => string;
  leaveRoom: () => void;
  isConnected: boolean;
};

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Random color function (soft pastel colors)
const getRandomColor = () => {
  const colors = [
    '#FFA69E', '#FAF3DD', '#B8F2E6', '#AED9E0', '#5E6472',
    '#E3D0D8', '#C1D37F', '#A3C4BC', '#957DAD', '#D291BC'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Set up the BroadcastChannel for same-origin communication
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  // Join an existing room
  const joinRoom = (roomId: string, userName: string) => {
    // Create user
    const newUser = {
      id: nanoid(),
      name: userName,
      color: getRandomColor()
    };
    setUser(newUser);
    setRoomId(roomId);
    
    // Create a new BroadcastChannel for this room
    const channel = new BroadcastChannel(`chat-room-${roomId}`);
    setBroadcastChannel(channel);
    
    // Announce user's presence
    channel.postMessage({
      type: 'USER_JOINED',
      payload: newUser
    });
    
    // Request current users in the room
    channel.postMessage({
      type: 'REQUEST_USERS',
      payload: { userId: newUser.id }
    });
    
    setIsConnected(true);
  };

  // Create a new room
  const createRoom = (userName: string) => {
    const newRoomId = nanoid(10);
    joinRoom(newRoomId, userName);
    return newRoomId;
  };

  // Leave room
  const leaveRoom = () => {
    if (broadcastChannel && user) {
      broadcastChannel.postMessage({
        type: 'USER_LEFT',
        payload: { userId: user.id }
      });
      broadcastChannel.close();
    }
    
    setBroadcastChannel(null);
    setUser(null);
    setRoomId(null);
    setMessages([]);
    setUsers([]);
    setIsConnected(false);
  };

  // Send a message
  const sendMessage = (text: string) => {
    if (!user || !broadcastChannel || !roomId) return;
    
    const newMessage: Message = {
      id: nanoid(),
      text,
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      color: user.color
    };
    
    // Add to local messages
    setMessages(prev => [...prev, newMessage]);
    
    // Broadcast to others in the room
    broadcastChannel.postMessage({
      type: 'NEW_MESSAGE',
      payload: newMessage
    });
  };

  // Set up event listeners for the BroadcastChannel
  useEffect(() => {
    if (!broadcastChannel) return;
    
    const handleMessage = (event: MessageEvent) => {
      const { type, payload } = event.data;
      
      switch (type) {
        case 'NEW_MESSAGE':
          // Avoid duplicating own messages
          if (payload.userId !== user?.id) {
            setMessages(prev => [...prev, payload]);
          }
          break;
          
        case 'USER_JOINED':
          if (payload.id !== user?.id) {
            setUsers(prev => [...prev.filter(u => u.id !== payload.id), payload]);
            
            // If you're already in the room, send your user info back
            broadcastChannel.postMessage({
              type: 'USER_INFO',
              payload: user
            });
          }
          break;
          
        case 'USER_INFO':
          if (payload.id !== user?.id) {
            setUsers(prev => [...prev.filter(u => u.id !== payload.id), payload]);
          }
          break;
          
        case 'USER_LEFT':
          setUsers(prev => prev.filter(u => u.id !== payload.userId));
          break;
          
        case 'REQUEST_USERS':
          if (payload.userId !== user?.id) {
            broadcastChannel.postMessage({
              type: 'USER_INFO',
              payload: user
            });
          }
          break;
      }
    };
    
    broadcastChannel.addEventListener('message', handleMessage);
    
    // Cleanup
    return () => {
      broadcastChannel.removeEventListener('message', handleMessage);
    };
  }, [broadcastChannel, user]);

  // Context value
  const value = {
    messages,
    roomId,
    user,
    users,
    sendMessage,
    joinRoom,
    createRoom,
    leaveRoom,
    isConnected,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
