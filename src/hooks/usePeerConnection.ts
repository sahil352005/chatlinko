
import { useState, useCallback, useEffect, useRef } from 'react';
import {
  checkWebRTCSupport,
  getSignalingData,
  storeSignalingData,
  PeerMessage
} from '../utils/chatService';

// Define a more specific handler type
type PeerHandler = (data: any) => void;

export const usePeerConnection = () => {
  const [signalingData, setSignalingData] = useState<string | null>(null);
  const [peerSupported, setPeerSupported] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  // References to store connection objects
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const onDataHandlerRef = useRef<PeerHandler | null>(null);

  // Check if WebRTC is supported in this browser
  useEffect(() => {
    const isSupported = checkWebRTCSupport();
    setPeerSupported(isSupported);
    
    // Cleanup function
    return () => {
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }
    };
  }, []);

  // Setup RTCPeerConnection with minimal configuration
  const setupPeerConnection = useCallback(() => {
    if (!peerSupported) return null;
    
    try {
      const iceServers = [
        { urls: 'stun:stun.l.google.com:19302' }
      ];
      
      // Create new RTCPeerConnection with minimal config
      const peerConnection = new RTCPeerConnection({ iceServers });
      
      // Add event listeners
      peerConnection.onicecandidate = (event) => {
        if (event.candidate === null) {
          // ICE gathering completed, we can get the description
          console.log("ICE gathering completed");
        }
      };
      
      peerConnection.onconnectionstatechange = () => {
        console.log("Connection state:", peerConnection.connectionState);
        if (peerConnection.connectionState === 'connected') {
          setConnectionStatus('connected');
        } else if (peerConnection.connectionState === 'disconnected' || 
                   peerConnection.connectionState === 'failed' ||
                   peerConnection.connectionState === 'closed') {
          setConnectionStatus('disconnected');
        }
      };
      
      peerConnection.onicegatheringstatechange = () => {
        console.log("ICE gathering state:", peerConnection.iceGatheringState);
      };
      
      peerConnection.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peerConnection.iceConnectionState);
      };
      
      peerConnectionRef.current = peerConnection;
      return peerConnection;
    } catch (error) {
      console.error("Error creating peer connection:", error);
      return null;
    }
  }, [peerSupported]);

  // Initialize as room creator
  const createPeerConnection = useCallback((userId: string, roomId: string, onDataHandler: PeerHandler) => {
    if (!peerSupported) {
      console.warn('WebRTC not supported, using BroadcastChannel only');
      return false;
    }
    
    try {
      setConnectionStatus('connecting');
      console.log('Attempting to create peer connection...');
      
      // Store the data handler
      onDataHandlerRef.current = onDataHandler;
      
      // Setup the peer connection
      const peerConnection = setupPeerConnection();
      if (!peerConnection) {
        console.error('Failed to create peer connection');
        setPeerSupported(false);
        setConnectionStatus('disconnected');
        return false;
      }
      
      // Create data channel
      const dataChannel = peerConnection.createDataChannel('chat');
      dataChannelRef.current = dataChannel;
      
      dataChannel.onopen = () => {
        console.log('Data channel opened');
        setConnectionStatus('connected');
      };
      
      dataChannel.onclose = () => {
        console.log('Data channel closed');
        setConnectionStatus('disconnected');
      };
      
      dataChannel.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (onDataHandlerRef.current) {
            onDataHandlerRef.current(message);
          }
        } catch (error) {
          console.error('Error parsing data channel message:', error);
        }
      };
      
      // Create offer
      peerConnection.createOffer()
        .then(offer => peerConnection.setLocalDescription(offer))
        .then(() => {
          // Wait for ICE gathering to complete
          const checkForComplete = setInterval(() => {
            if (peerConnection.iceGatheringState === 'complete') {
              clearInterval(checkForComplete);
              
              // Get complete session description
              if (peerConnection.localDescription) {
                const sdpData = JSON.stringify(peerConnection.localDescription);
                console.log('Generated offer SDP, length:', sdpData.length);
                setSignalingData(sdpData);
                storeSignalingData(roomId, sdpData);
              }
            }
          }, 500);
          
          // Timeout after 5 seconds to ensure we get some signaling data even if not complete
          setTimeout(() => {
            clearInterval(checkForComplete);
            if (!signalingData && peerConnection.localDescription) {
              const sdpData = JSON.stringify(peerConnection.localDescription);
              console.log('Generated offer SDP (timeout), length:', sdpData.length);
              setSignalingData(sdpData);
              storeSignalingData(roomId, sdpData);
            }
          }, 5000);
        })
        .catch(error => {
          console.error('Error creating offer:', error);
          return false;
        });
      
      return true;
    } catch (error) {
      console.error('Error initializing peer connection:', error);
      setPeerSupported(false);
      setConnectionStatus('disconnected');
      return false;
    }
  }, [peerSupported, setupPeerConnection, signalingData]);

  // Join an existing peer connection
  const joinPeerConnection = useCallback((userId: string, roomId: string, connectionData: string, onDataHandler: PeerHandler) => {
    if (!peerSupported) {
      console.warn('WebRTC not supported, using BroadcastChannel only');
      return false;
    }
    
    try {
      setConnectionStatus('connecting');
      console.log('Attempting to join peer connection...');
      
      // Store the data handler
      onDataHandlerRef.current = onDataHandler;
      
      // Setup the peer connection
      const peerConnection = setupPeerConnection();
      if (!peerConnection) {
        console.error('Failed to create peer connection for joining');
        setPeerSupported(false);
        setConnectionStatus('disconnected');
        return false;
      }
      
      // Set up data channel event handlers
      peerConnection.ondatachannel = (event) => {
        const dataChannel = event.channel;
        dataChannelRef.current = dataChannel;
        
        dataChannel.onopen = () => {
          console.log('Data channel opened');
          setConnectionStatus('connected');
        };
        
        dataChannel.onclose = () => {
          console.log('Data channel closed');
          setConnectionStatus('disconnected');
        };
        
        dataChannel.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            if (onDataHandlerRef.current) {
              onDataHandlerRef.current(message);
            }
          } catch (error) {
            console.error('Error parsing data channel message:', error);
          }
        };
      };
      
      // Parse the remote description from the connection data
      try {
        const remoteDesc = JSON.parse(connectionData);
        
        // Set the remote description
        peerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc))
          .then(() => peerConnection.createAnswer())
          .then(answer => peerConnection.setLocalDescription(answer))
          .then(() => {
            console.log('Answer created and set as local description');
            
            // If needed, create and share the answer SDP for two-way connection
            if (peerConnection.localDescription) {
              const answerSdp = JSON.stringify(peerConnection.localDescription);
              console.log('Generated answer SDP, length:', answerSdp.length);
              // For simplicity, we're not handling the answer SDP sharing in this example
            }
          })
          .catch(error => {
            console.error('Error in connection process:', error);
            return false;
          });
          
        return true;
      } catch (error) {
        console.error('Error parsing connection data:', error);
        return false;
      }
    } catch (error) {
      console.error('Error joining peer connection:', error);
      setPeerSupported(false);
      setConnectionStatus('disconnected');
      return false;
    }
  }, [peerSupported, setupPeerConnection]);

  // Send a message through the data channel
  const sendPeerData = useCallback((userId: string, type: string, payload: any) => {
    if (!peerSupported || !dataChannelRef.current || dataChannelRef.current.readyState !== 'open') {
      console.warn('Data channel not available or not open');
      return false;
    }
    
    try {
      const message: PeerMessage = { type, payload };
      dataChannelRef.current.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error('Error sending data through data channel:', error);
      return false;
    }
  }, [peerSupported]);

  // Close the peer connection
  const closePeerConnections = useCallback(() => {
    try {
      if (dataChannelRef.current) {
        dataChannelRef.current.close();
        dataChannelRef.current = null;
      }
      
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      
      setSignalingData(null);
      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Error closing peer connections:', error);
    }
  }, []);

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
