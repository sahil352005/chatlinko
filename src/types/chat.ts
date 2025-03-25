
export type User = {
  id: string;
  name: string;
  color: string;
};

export type Message = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
  color: string;
};

export type ChatContextType = {
  messages: Message[];
  roomId: string | null;
  user: User | null;
  users: User[];
  sendMessage: (text: string) => void;
  joinRoom: (roomId: string, userName: string) => void;
  createRoom: (userName: string) => string;
  leaveRoom: () => void;
  isConnected: boolean;
  signalingData: string | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  connectWithSignalingData: (data: string) => void;
};
