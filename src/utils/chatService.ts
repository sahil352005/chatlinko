
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
export const initializePeer = (userId: string, roomId: string, onData: (data: any) => void): Peer.Instance => {
  try {
    // Create a new peer as the initiator
    const peer = new Peer({
      initiator: true,
      trickle: false,
      config: {
        iceServers: [
          // Public STUN servers to help with NAT traversal
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    // Listen for signaling data that needs to be shared with other peers
    peer.on('signal', (data) => {
      // Store the signaling data for this room
      peerSignalingData.set(roomId, JSON.stringify(data));
      console.log('Created room with signaling data:', data);
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
    console.error('Error initializing peer:', error);
    throw error;
  }
};

// Join an existing peer connection using the signaling data
export const joinPeer = (userId: string, roomId: string, signalingData: string, onData: (data: any) => void): Peer.Instance => {
  try {
    // Create a new peer as a non-initiator
    const peer = new Peer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: [
          // Public STUN servers to help with NAT traversal
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ]
      }
    });

    // Connect to the peer using the signaling data
    peer.signal(JSON.parse(signalingData));

    // Listen for our own signaling data to send back to the initiator
    peer.on('signal', (data) => {
      // This data needs to be manually shared with the initiator
      console.log('Generated answer:', JSON.stringify(data));
      // In a real app, this would be sent to the initiator via a signaling server
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
    console.error('Error joining peer:', error);
    throw error;
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
  return peerSignalingData.get(roomId) || null;
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
