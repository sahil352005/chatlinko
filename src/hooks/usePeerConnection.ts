
import { useState, useCallback, useEffect } from 'react';
import {
  initializePeer,
  joinPeer,
  sendPeerMessage,
  closeAllPeers,
  getSignalingData,
  PeerMessage
} from '../utils/chatService';

// Define a more specific handler type
type PeerHandler = (data: any) => void;

export const usePeerConnection = () => {
  const [signalingData, setSignalingData] = useState<string | null>(null);
  const [peerSupported, setPeerSupported] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  // Check if WebRTC is supported in this browser
  useEffect(() => {
    const checkPeerSupport = () => {
      try {
        // Basic WebRTC API availability check
        if (typeof window === 'undefined' || typeof RTCPeerConnection === 'undefined') {
          console.warn('WebRTC API is not available in this browser');
          setPeerSupported(false);
          return false;
        }
        
        // Test creating an RTCPeerConnection to catch early errors
        try {
          const testConnection = new RTCPeerConnection();
          testConnection.close();
          console.log('RTCPeerConnection test successful');
        } catch (err) {
          console.warn('Failed to create test RTCPeerConnection:', err);
          setPeerSupported(false);
          return false;
        }
        
        return true;
      } catch (error) {
        console.error('Error checking WebRTC support:', error);
        setPeerSupported(false);
        return false;
      }
    };

    checkPeerSupport();
  }, []);

  // Initialize a peer connection as the room creator
  const createPeerConnection = useCallback((userId: string, roomId: string, onDataHandler: PeerHandler) => {
    if (!peerSupported) {
      console.warn('WebRTC not supported, using BroadcastChannel only');
      return false;
    }
    
    try {
      setConnectionStatus('connecting');
      console.log('Attempting to create peer connection...');
      
      // Initialize the peer connection with better error handling
      const peer = initializePeer(userId, roomId, onDataHandler);
      
      if (!peer) {
        console.error('Failed to initialize peer connection');
        setPeerSupported(false);
        setConnectionStatus('disconnected');
        return false;
      }
      
      console.log('Peer connection object created successfully');
      
      // Listen for connection events
      peer.on('connect', () => {
        console.log('Peer connection established!');
        setConnectionStatus('connected');
      }); 

      // Listen for signaling data that needs to be shared with other peers
      peer.on('signal', (data) => {
        const sigData = JSON.stringify(data);
        console.log('Received signal data, length:', sigData.length);
        setSignalingData(sigData);
      });
      
      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setConnectionStatus('disconnected');
      });
      
      peer.on('close', () => {
        console.log('Peer connection closed');
        setConnectionStatus('disconnected');
      });
      
      // Check for signaling data more frequently with multiple attempts
      const checkForSignalingData = () => {
        const sigData = getSignalingData(roomId);
        if (sigData) {
          console.log('Setting signalingData from getSignalingData, length:', sigData.length);
          setSignalingData(sigData);
          return true;
        }
        return false;
      };
      
      // Try immediately
      if (!checkForSignalingData()) {
        // Try again after short delay
        setTimeout(checkForSignalingData, 500);
        // And again after a longer delay
        setTimeout(checkForSignalingData, 1500);
      }
      
      return true;
    } catch (error) {
      console.error('Error creating peer connection:', error);
      setPeerSupported(false);
      setConnectionStatus('disconnected');
      return false;
    }
  }, [peerSupported]);

  // Join an existing peer connection
  const joinPeerConnection = useCallback((userId: string, roomId: string, connectionData: string, onDataHandler: PeerHandler) => {
    if (!peerSupported) {
      console.warn('WebRTC not supported, using BroadcastChannel only');
      return false;
    }
    
    try {
      setConnectionStatus('connecting');
      
      const peer = joinPeer(userId, roomId, connectionData, onDataHandler);
      
      if (!peer) {
        console.error('Failed to join peer');
        setPeerSupported(false);
        setConnectionStatus('disconnected');
        return false;
      }
      
      // Listen for connection events
      peer.on('connect', () => {
        console.log('Peer connection established!');
        setConnectionStatus('connected');
      });
      
      peer.on('error', (err) => {
        console.error('Peer connection error:', err);
        setConnectionStatus('disconnected');
      });
      
      peer.on('close', () => {
        console.log('Peer connection closed');
        setConnectionStatus('disconnected');
      });
      
      return true;
    } catch (error) {
      console.error('Error joining peer connection:', error);
      setPeerSupported(false);
      setConnectionStatus('disconnected');
      return false;
    }
  }, [peerSupported]);

  // Send a message through the peer connection
  const sendPeerData = useCallback((userId: string, type: string, payload: any) => {
    if (!peerSupported) return false;
    
    try {
      const message: PeerMessage = { type, payload };
      sendPeerMessage(userId, message);
      return true;
    } catch (error) {
      console.error('Error sending peer data:', error);
      return false;
    }
  }, [peerSupported]);

  // Close all peer connections
  const closePeerConnections = useCallback(() => {
    if (!peerSupported) return;
    
    try {
      closeAllPeers();
      setSignalingData(null);
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Error closing peer connections:', error);
    }
  }, [peerSupported]);

  // For debugging purposes, log the signalingData whenever it changes
  useEffect(() => {
    if (signalingData) {
      console.log('Current signalingData available, length:', signalingData.length);
    } else {
      console.log('Current signalingData: null');
    }
  }, [signalingData]);

  return {
    signalingData,
    peerSupported,
    connectionStatus,
    createPeerConnection,
    joinPeerConnection,
    sendPeerData,
    closePeerConnections
  };
};
