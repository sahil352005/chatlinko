
import { nanoid } from 'nanoid';

// Define types
export type PeerMessage = {
  type: string;
  payload: any;
};

// These maps store the signaling data
const peerSignalingData = new Map();

export const generateRoomId = (): string => {
  return nanoid(10);
};

export const generateUserId = (): string => {
  return nanoid();
};

// Helper function to check WebRTC compatibility
export const checkWebRTCSupport = (): boolean => {
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

// Store signaling data for a room
export const storeSignalingData = (roomId: string, data: string): void => {
  try {
    peerSignalingData.set(roomId, data);
    console.log(`Stored signaling data for room ${roomId}, length:`, data.length);
  } catch (error) {
    console.error('Error storing signaling data:', error);
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
