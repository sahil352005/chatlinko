
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

// Simple-peer requires a specific polyfill for WebRTC in some browsers
// This is handled automatically by the library

export const generateRoomId = (): string => {
  return nanoid(10);
};

export const generateUserId = (): string => {
  return nanoid();
};

// Initialize a peer connection as the room creator
export const initializePeer = (userId: string, roomId: string, onData: (data: any) => void): Peer.Instance => {
  // Create a new peer as the initiator
  const peer = new Peer({
    initiator: true,
    trickle: false
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

  // Store the peer connection
  peerConnections.set(userId, peer);
  return peer;
};

// Join an existing peer connection using the signaling data
export const joinPeer = (userId: string, roomId: string, signalingData: string, onData: (data: any) => void): Peer.Instance => {
  try {
    // Create a new peer as a non-initiator
    const peer = new Peer({
      initiator: false,
      trickle: false
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
  const peer = peerConnections.get(userId);
  if (peer && peer.connected) {
    peer.send(JSON.stringify(message));
  } else {
    console.warn('Peer not connected, cannot send message');
  }
};

// Get signaling data for a room
export const getSignalingData = (roomId: string): string | null => {
  return peerSignalingData.get(roomId) || null;
};

// Close all peer connections
export const closeAllPeers = (): void => {
  peerConnections.forEach((peer) => {
    if (peer) {
      peer.destroy();
    }
  });
  peerConnections.clear();
  peerSignalingData.clear();
};
