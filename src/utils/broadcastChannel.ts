
import { User, Message } from '../types/chat';

// Set up broadcast channel for same-origin communication
export const setupBroadcastChannel = (
  roomId: string,
  user: User | null,
  onNewMessage: (message: Message) => void,
  onUserJoined: (user: User) => void,
  onUserLeft: (userId: string) => void
) => {
  // Create a new BroadcastChannel for same-origin communication
  const channel = new BroadcastChannel(`chat-room-${roomId}`);
  
  // Set up message handler
  const handleMessage = (event: MessageEvent) => {
    const { type, payload } = event.data;
    
    switch (type) {
      case 'NEW_MESSAGE':
        // Avoid duplicating own messages
        if (payload.userId !== user?.id) {
          onNewMessage(payload);
        }
        break;
        
      case 'USER_JOINED':
        if (payload.id !== user?.id) {
          onUserJoined(payload);
          
          // If you're already in the room, send your user info back
          if (user) {
            channel.postMessage({
              type: 'USER_INFO',
              payload: user
            });
          }
        }
        break;
        
      case 'USER_INFO':
        if (payload.id !== user?.id) {
          onUserJoined(payload);
        }
        break;
        
      case 'USER_LEFT':
        onUserLeft(payload.userId);
        break;
        
      case 'REQUEST_USERS':
        if (payload.userId !== user?.id && user) {
          channel.postMessage({
            type: 'USER_INFO',
            payload: user
          });
        }
        break;
    }
  };
  
  channel.addEventListener('message', handleMessage);
  
  // Return the channel and a cleanup function
  return {
    channel,
    cleanup: () => {
      channel.removeEventListener('message', handleMessage);
      channel.close();
    }
  };
};

// Send a message via the broadcast channel
export const sendBroadcastMessage = (channel: BroadcastChannel, type: string, payload: any) => {
  if (channel) {
    channel.postMessage({ type, payload });
  }
};
