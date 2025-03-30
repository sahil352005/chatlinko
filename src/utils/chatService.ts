
import { nanoid } from 'nanoid';

// Define types
export type PeerMessage = {
  type: string;
  payload: any;
};

// These maps store the signaling data - using an object for better serialization
const peerSignalingData = {};

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
    peerSignalingData[roomId] = data;
    console.log(`Stored signaling data for room ${roomId}, length:`, data.length);
    
    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`signaling_${roomId}`, data);
    } catch (e) {
      console.warn('Could not store signaling data in localStorage:', e);
    }
  } catch (error) {
    console.error('Error storing signaling data:', error);
  }
};

// Get signaling data for a room
export const getSignalingData = (roomId: string): string | null => {
  // First try to get from memory
  let data = peerSignalingData[roomId];
  
  // If not in memory, try localStorage
  if (!data) {
    try {
      data = localStorage.getItem(`signaling_${roomId}`);
      
      // If found in localStorage, update memory cache
      if (data) {
        peerSignalingData[roomId] = data;
      }
    } catch (e) {
      console.warn('Could not retrieve signaling data from localStorage:', e);
    }
  }
  
  if (data) {
    console.log(`Retrieved signaling data for room ${roomId}, length:`, data.length);
  } else {
    console.warn(`No signaling data found for room ${roomId}`);
  }
  
  return data || null;
};

// New function to clear signaling data on disconnect
export const clearSignalingData = (roomId: string): void => {
  try {
    delete peerSignalingData[roomId];
    localStorage.removeItem(`signaling_${roomId}`);
    console.log(`Cleared signaling data for room ${roomId}`);
  } catch (error) {
    console.error('Error clearing signaling data:', error);
  }
};
