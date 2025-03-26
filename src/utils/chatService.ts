
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

// Initialize a peer connection as the room creator
export const initializePeer = (userId: string, roomId: string, onData: (data: any) => void): Peer.Instance | null => {
  try {
    // Check for WebRTC support
    if (typeof window.RTCPeerConnection !== 'function') {
      console.error('RTCPeerConnection is not supported in this browser');
      return null;
    }
    
    // Additional safety check for browser compatibility
    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      console.error('Browser environment not fully compatible with WebRTC');
      return null;
    }
    
    const config = {
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          // Public STUN servers to help with NAT traversal
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          // Add a couple more but avoid adding too many which can cause issues
          { urls: 'stun:openrelay.metered.ca:80' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      },
      // Disable any media requirements to prevent getUserMedia issues
      streams: [], 
      offerConstraints: {
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      }
    };
    
    console.log('Creating peer with config:', JSON.stringify(config));
    
    // Create a new peer as the initiator with safety wrapper
    let peer;
    try {
      peer = new Peer(config);
      console.log('Peer initialized successfully');
    } catch (e) {
      console.error('Error initializing peer:', e);
      return null;
    }

    // Listen for signaling data that needs to be shared with other peers
    peer.on('signal', (data) => {
      // Store the signaling data for this room
      const sigDataStr = JSON.stringify(data);
      peerSignalingData.set(roomId, sigDataStr);
      console.log('Created room with signaling data, length:', sigDataStr.length);
    });

    // Handle incoming data from connected peers
    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        onData(message);
      } catch (error) {
        console.error('Error parsing peer data:', error);
      }
    });

    // Handle errors
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
    });

    // Log connection status
    peer.on('connect', () => {
      console.log('Peer connection established successfully');
    });

    // Store the peer connection
    peerConnections.set(userId, peer);
    return peer;
  } catch (error) {
    console.error('Error in initializePeer:', error);
    return null;
  }
};

// Join an existing peer connection using the signaling data
export const joinPeer = (userId: string, roomId: string, signalingData: string, onData: (data: any) => void): Peer.Instance | null => {
  try {
    // Check for WebRTC support
    if (typeof window.RTCPeerConnection !== 'function') {
      console.error('RTCPeerConnection is not supported in this browser');
      return null;
    }
    
    // Additional safety check for browser compatibility
    if (typeof window === 'undefined' || !window.RTCPeerConnection) {
      console.error('Browser environment not fully compatible with WebRTC');
      return null;
    }
    
    const config = {
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          // Use fewer STUN/TURN servers to reduce complexity
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:openrelay.metered.ca:80' },
          {
            urls: 'turn:openrelay.metered.ca:80',
            username: 'openrelayproject',
            credential: 'openrelayproject'
          }
        ]
      },
      // Disable any media requirements to prevent getUserMedia issues
      streams: [],
      offerConstraints: {
        offerToReceiveAudio: false,
        offerToReceiveVideo: false
      }
    };
    
    // Create a new peer as a non-initiator with safety wrapper
    let peer;
    try {
      peer = new Peer(config);
      console.log('Joiner peer initialized successfully');
    } catch (e) {
      console.error('Error initializing joiner peer:', e);
      return null;
    }

    // Connect to the peer using the signaling data
    try {
      const sigData = JSON.parse(signalingData);
      peer.signal(sigData);
    } catch (e) {
      console.error('Invalid signaling data:', e);
      return null;
    }

    // Listen for our own signaling data to send back to the initiator
    peer.on('signal', (data) => {
      console.log('Generated answer signal');
    });

    // Handle incoming data
    peer.on('data', (data) => {
      try {
        const message = JSON.parse(data.toString());
        onData(message);
      } catch (error) {
        console.error('Error parsing peer data:', error);
      }
    });

    // Handle errors
    peer.on('error', (err) => {
      console.error('Peer connection error:', err);
    });

    // Log connection status
    peer.on('connect', () => {
      console.log('Peer connection established successfully');
    });

    // Store the peer connection
    peerConnections.set(userId, peer);
    return peer;
  } catch (error) {
    console.error('Error in joinPeer:', error);
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
