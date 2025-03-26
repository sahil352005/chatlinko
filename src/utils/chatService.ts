
import { nanoid } from 'nanoid';
import Peer from 'simple-peer';

// Define types
export type PeerMessage = {
  type: string;
  payload: any;
};

// These maps store the peer connections and signaling data
const peerConnections = new Map();
const peerSignalingData = new Map();

export const generateRoomId = (): string => {
  return nanoid(10);
};

export const generateUserId = (): string => {
  return nanoid();
};

// Helper function to check WebRTC compatibility
const checkWebRTCSupport = (): boolean => {
  try {
    // Basic check for required WebRTC APIs
    return typeof window !== 'undefined' && 
           typeof RTCPeerConnection === 'function' && 
           typeof RTCSessionDescription === 'function';
  } catch (err) {
    console.error('WebRTC support check failed:', err);
    return false;
  }
};

// Initialize a peer connection as the room creator
export const initializePeer = (userId: string, roomId: string, onData: (data: any) => void): Peer.Instance | null => {
  try {
    // First check if WebRTC is supported
    if (!checkWebRTCSupport()) {
      console.error('WebRTC is not supported in this browser');
      return null;
    }
    
    console.log('Browser supports WebRTC, creating peer connection...');
    
    // Create a minimal config to reduce errors
    const config = {
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
    };
    
    console.log('Creating peer with simplified config');
    
    // Create the peer
    const peer = new Peer(config);
    console.log('Peer object created successfully');

    // Setup event handlers
    peer.on('signal', (data) => {
      const sigDataStr = JSON.stringify(data);
      peerSignalingData.set(roomId, sigDataStr);
      console.log('Generated signaling data for room:', roomId);
    });

    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        onData(message);
      } catch (error) {
        console.error('Error parsing peer data:', error);
      }
    });

    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
    });

    peer.on('connect', () => {
      console.log('Peer connection established successfully');
    });

    // Store the peer connection
    peerConnections.set(userId, peer);
    return peer;
  } catch (error) {
    console.error('Fatal error in initializePeer:', error);
    return null;
  }
};

// Join an existing peer connection using the signaling data
export const joinPeer = (userId: string, roomId: string, signalingData: string, onData: (data: any) => void): Peer.Instance | null => {
  try {
    // First check if WebRTC is supported
    if (!checkWebRTCSupport()) {
      console.error('WebRTC is not supported in this browser');
      return null;
    }
    
    console.log('Browser supports WebRTC, joining peer connection...');
    
    // Simpler configuration for joining peer
    const config = {
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      }
    };
    
    // Create the peer
    const peer = new Peer(config);
    console.log('Joiner peer created successfully');

    // Connect using the provided signaling data
    try {
      const sigData = JSON.parse(signalingData);
      peer.signal(sigData);
      console.log('Applied signaling data from room creator');
    } catch (e) {
      console.error('Invalid signaling data format:', e);
      return null;
    }

    // Setup event handlers
    peer.on('signal', (data) => {
      console.log('Generated answer signal');
    });

    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        onData(message);
      } catch (error) {
        console.error('Error parsing peer data:', error);
      }
    });

    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
    });

    peer.on('connect', () => {
      console.log('Peer connection established successfully');
    });

    // Store the peer connection
    peerConnections.set(userId, peer);
    return peer;
  } catch (error) {
    console.error('Fatal error in joinPeer:', error);
    return null;
  }
};

// Send a message through the peer connection
export const sendPeerMessage = (userId: string, message: PeerMessage): void => {
  try {
    const peer = peerConnections.get(userId);
    if (peer && peer.connected) {
      peer.send(JSON.stringify(message));
    } else {
      console.warn('Peer not connected, cannot send message');
    }
  } catch (error) {
    console.error('Error sending peer message:', error);
    throw error;
  }
};

// Get signaling data for a room
export const getSignalingData = (roomId: string): string | null => {
  const data = peerSignalingData.get(roomId);
  if (data) {
    console.log(`Retrieved signaling data for room ${roomId}, length:`, data.length);
  } else {
    console.warn(`No signaling data found for room ${roomId}`);
  }
  return data || null;
};

// Close all peer connections
export const closeAllPeers = (): void => {
  try {
    peerConnections.forEach((peer) => {
      if (peer) {
        peer.destroy();
      }
    });
    peerConnections.clear();
    peerSignalingData.clear();
  } catch (error) {
    console.error('Error closing peer connections:', error);
  }
};
