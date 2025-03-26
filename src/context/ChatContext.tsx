
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { generateRoomId, checkWebRTCSupport } from '../utils/chatService';
import { setupBroadcastChannel, sendBroadcastMessage } from '../utils/broadcastChannel';
import { usePeerConnection } from '../hooks/usePeerConnection';
import { createUser } from '../utils/userUtils';
import { User, Message, ChatContextType } from '../types/chat';
import { toast } from '@/hooks/use-toast';

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
  const [webRTCSupported, setWebRTCSupported] = useState<boolean>(true);

  // Use our custom hook for peer connections
  const { 
    signalingData, 
    peerSupported,
    connectionStatus,
    createPeerConnection, 
    joinPeerConnection, 
    sendPeerData, 
    closePeerConnections 
  } = usePeerConnection();

  // Check for WebRTC support on component mount
  useEffect(() => {
    const isSupported = checkWebRTCSupport();
    setWebRTCSupported(isSupported);
    
    if (!isSupported) {
      console.warn('WebRTC is not supported in this browser. Will use BroadcastChannel only.');
    }
  }, []);

  // Handler for peer and broadcast messages
  const handleDataReceived = useCallback((data: any) => {
    const { type, payload } = data;
    
    switch (type) {
      case 'NEW_MESSAGE':
        if (payload.userId !== user?.id) {
          setMessages(prev => [...prev, payload]);
        }
        break;
        
      case 'USER_JOINED':
        if (payload.id !== user?.id) {
          setUsers(prev => [...prev.filter(u => u.id !== payload.id), payload]);
          
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
    
    // Attempt to use WebRTC if supported
    if (webRTCSupported && peerSupported) {
      const created = createPeerConnection(newUser.id, newRoomId, handleDataReceived);
      if (!created) {
        console.warn('Failed to create WebRTC peer connection, falling back to BroadcastChannel only');
        toast({
          title: "Limited functionality",
          description: "WebRTC initialization failed. Communication limited to this device only.",
          variant: "destructive"
        });
      }
    } else {
      console.log('WebRTC not supported, using BroadcastChannel only');
    }
    
    // Always set up BroadcastChannel for same-device communication
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
  }, [createPeerConnection, handleDataReceived, peerSupported, webRTCSupported]);

  // Join an existing room
  const joinRoom = useCallback((roomId: string, userName: string) => {
    const newUser = createUser(userName);
    
    setUser(newUser);
    setRoomId(roomId);
    setUsers([newUser]);
    
    const { channel } = setupBroadcastChannel(
      roomId,
      newUser,
      (message) => setMessages(prev => [...prev, message]),
      (user) => setUsers(prev => [...prev.filter(u => u.id !== user.id), user]),
      (userId) => setUsers(prev => prev.filter(u => u.id !== userId))
    );
    
    setBroadcastChannel(channel);
    
    sendBroadcastMessage(channel, 'USER_JOINED', newUser);
    sendBroadcastMessage(channel, 'REQUEST_USERS', { userId: newUser.id });
    
    setIsConnected(true);
  }, []);

  // Connect with signaling data (for WebRTC)
  const connectWithSignalingData = useCallback((data: string) => {
    if (!user || !roomId) return;
    
    try {
      if (webRTCSupported && peerSupported) {
        const success = joinPeerConnection(user.id, roomId, data, handleDataReceived);
        
        if (success) {
          toast({
            title: "Connection initiated",
            description: "Attempting to establish WebRTC connection..."
          });
        } else {
          toast({
            title: "Connection failed",
            description: "Could not establish WebRTC connection. Falling back to same-device mode.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "WebRTC not supported",
          description: "Your browser doesn't support WebRTC. Limited to same-device communication.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error connecting with signaling data:', error);
      toast({
        title: "Connection error",
        description: "Failed to connect using the provided data",
        variant: "destructive"
      });
    }
  }, [user, roomId, joinPeerConnection, handleDataReceived, peerSupported, webRTCSupported]);

  // Monitor connection status changes
  useEffect(() => {
    if (connectionStatus === 'connected') {
      toast({
        title: "Connected successfully",
        description: "You're now connected with other users via WebRTC"
      });
      
      // Send user info and request other users once connected
      if (user) {
        sendPeerData(user.id, 'USER_JOINED', user);
        sendPeerData(user.id, 'REQUEST_USERS', { userId: user.id });
      }
    }
  }, [connectionStatus, sendPeerData, user]);

  // Leave room
  const leaveRoom = useCallback(() => {
    if (peerSupported) {
      closePeerConnections();
    }
    
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
  }, [broadcastChannel, user, closePeerConnections, peerSupported]);

  // Send a message
  const sendMessage = useCallback((text: string) => {
    if (!user || !roomId) return;
    
    const newMessage: Message = {
      id: generateRoomId(),
      text,
      userId: user.id,
      userName: user.name,
      timestamp: Date.now(),
      color: user.color
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    if (peerSupported && connectionStatus === 'connected') {
      sendPeerData(user.id, 'NEW_MESSAGE', newMessage);
    }
    
    if (broadcastChannel) {
      sendBroadcastMessage(broadcastChannel, 'NEW_MESSAGE', newMessage);
    }
  }, [user, roomId, broadcastChannel, sendPeerData, peerSupported, connectionStatus]);

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
    connectionStatus,
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
