
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
        // Check if RTCPeerConnection is available (core WebRTC API)
        if (typeof RTCPeerConnection === 'undefined') {
          console.warn('WebRTC is not supported in this browser');
          setPeerSupported(false);
          return false;
        }
        
        // The simple-peer library uses these browser APIs, check if they're available
        if (typeof window.RTCPeerConnection !== 'function' || 
            typeof window.RTCSessionDescription !== 'function') {
          console.warn('Required WebRTC APIs are not available');
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
      
      // Initialize the peer connection
      const peer = initializePeer(userId, roomId, onDataHandler);
      
      if (!peer) {
        console.error('Failed to initialize peer');
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
      
      // Get and set the signaling data
      const sigData = getSignalingData(roomId);
      if (sigData) {
        setSignalingData(sigData);
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
