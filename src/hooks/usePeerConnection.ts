
import { useState, useCallback } from 'react';
import {
  initializePeer,
  joinPeer,
  sendPeerMessage,
  closeAllPeers,
  getSignalingData,
  PeerMessage
} from '../utils/chatService';

type PeerHandler = (data: any) => void;

export const usePeerConnection = () => {
  const [signalingData, setSignalingData] = useState<string | null>(null);

  // Initialize a peer connection as the room creator
  const createPeerConnection = useCallback((userId: string, roomId: string, onDataHandler: PeerHandler) => {
    // Initialize the peer connection
    initializePeer(userId, roomId, onDataHandler);
    
    // Get and set the signaling data
    const sigData = getSignalingData(roomId);
    if (sigData) {
      setSignalingData(sigData);
    }
  }, []);

  // Join an existing peer connection
  const joinPeerConnection = useCallback((userId: string, roomId: string, connectionData: string, onDataHandler: PeerHandler) => {
    try {
      joinPeer(userId, roomId, connectionData, onDataHandler);
      return true;
    } catch (error) {
      console.error('Error joining peer connection:', error);
      return false;
    }
  }, []);

  // Send a message through the peer connection
  const sendPeerData = useCallback((userId: string, type: string, payload: any) => {
    const message: PeerMessage = { type, payload };
    sendPeerMessage(userId, message);
  }, []);

  // Close all peer connections
  const closePeerConnections = useCallback(() => {
    closeAllPeers();
    setSignalingData(null);
  }, []);

  return {
    signalingData,
    createPeerConnection,
    joinPeerConnection,
    sendPeerData,
    closePeerConnections
  };
};
