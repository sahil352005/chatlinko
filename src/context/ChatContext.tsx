
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { generateRoomId } from '../utils/chatService';
import { setupBroadcastChannel, sendBroadcastMessage } from '../utils/broadcastChannel';
import { usePeerConnection } from '../hooks/usePeerConnection';
import { createUser } from '../utils/userUtils';
import { User, Message, ChatContextType } from '../types/chat';

// Create context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [broadcastChannel, setBroadcastChannel] = useState<BroadcastChannel | null>(null);

  // Use our custom hook for peer connections
  const { 
    signalingData, 
    createPeerConnection, 
    joinPeerConnection, 
    sendPeerData, 
    closePeerConnections 
  } = usePeerConnection();

  // Handler for peer and broadcast messages
  const handleDataReceived = useCallback((data: any) => {
    const { type, payload } = data;
    
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
          if (user) {
            sendPeerData(user.id, 'USER_INFO', user);
          }
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
        if (payload.userId !== user?.id && user) {
          sendPeerData(user.id, 'USER_INFO', user);
        }
        break;
    }
  }, [user, sendPeerData]);

  // Create a new room
  const createRoom = useCallback((userName: string) => {
    const newRoomId = generateRoomId();
    const newUser = createUser(userName);
    
    setUser(newUser);
    setRoomId(newRoomId);
    setUsers([newUser]);
    
    // Initialize peer connection as the room creator
    createPeerConnection(newUser.id, newRoomId, handleDataReceived);
    
    // Also set up broadcast channel for same-origin communication
    const { channel } = setupBroadcastChannel(
      newRoomId,
      newUser,
      (message) => setMessages(prev => [...prev, message]),
      (user) => setUsers(prev => [...prev.filter(u => u.id !== user.id), user]),
      (userId) => setUsers(prev => prev.filter(u => u.id !== userId))
    );
    
    setBroadcastChannel(channel);
    setIsConnected(true);
    return newRoomId;
  }, [createPeerConnection, handleDataReceived]);

  // Join an existing room
  const joinRoom = useCallback((roomId: string, userName: string) => {
    const newUser = createUser(userName);
    
    setUser(newUser);
    setRoomId(roomId);
    setUsers([newUser]);
    
    // Set up broadcast channel for same-origin communication
    const { channel } = setupBroadcastChannel(
      roomId,
      newUser,
      (message) => setMessages(prev => [...prev, message]),
      (user) => setUsers(prev => [...prev.filter(u => u.id !== user.id), user]),
      (userId) => setUsers(prev => prev.filter(u => u.id !== userId))
    );
    
    setBroadcastChannel(channel);
    
    // Announce user's presence
    sendBroadcastMessage(channel, 'USER_JOINED', newUser);
    
    // Request current users in the room
    sendBroadcastMessage(channel, 'REQUEST_USERS', { userId: newUser.id });
    
    setIsConnected(true);
  }, []);

  // Connect with signaling data (for WebRTC)
  const connectWithSignalingData = useCallback((data: string) => {
    if (!user || !roomId) return;
    
    try {
      const success = joinPeerConnection(user.id, roomId, data, handleDataReceived);
      
      if (success) {
        // Announce user's presence
        sendPeerData(user.id, 'USER_JOINED', user);
        
        // Request current users
        sendPeerData(user.id, 'REQUEST_USERS', { userId: user.id });
      }
    } catch (error) {
      console.error('Error connecting with signaling data:', error);
    }
  }, [user, roomId, joinPeerConnection, handleDataReceived, sendPeerData]);

  // Leave room
  const leaveRoom = useCallback(() => {
    // Close peer connections
    closePeerConnections();
    
    // Close broadcast channel
    if (broadcastChannel && user) {
      sendBroadcastMessage(broadcastChannel, 'USER_LEFT', { userId: user.id });
      broadcastChannel.close();
    }
    
    setBroadcastChannel(null);
    setUser(null);
    setRoomId(null);
    setMessages([]);
    setUsers([]);
    setIsConnected(false);
  }, [broadcastChannel, user, closePeerConnections]);

  // Send a message
  const sendMessage = useCallback((text: string) => {
    if (!user || !roomId) return;
    
    const newMessage: Message = {
      id: generateRoomId(), // Using the roomId generator function for message IDs
      text,
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      color: user.color
    };
    
    // Add to local messages
    setMessages(prev => [...prev, newMessage]);
    
    // Send via peer connections if available
    sendPeerData(user.id, 'NEW_MESSAGE', newMessage);
    
    // Also broadcast to same-origin peers
    if (broadcastChannel) {
      sendBroadcastMessage(broadcastChannel, 'NEW_MESSAGE', newMessage);
    }
  }, [user, roomId, broadcastChannel, sendPeerData]);

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
    signalingData,
    connectWithSignalingData
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
