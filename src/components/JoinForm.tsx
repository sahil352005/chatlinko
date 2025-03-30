
import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, PlusCircle, Link2, Info, Users } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

const JoinForm: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create');
  const [showSignalingInput, setShowSignalingInput] = useState(false);
  const [signalingData, setSignalingData] = useState('');
  const { joinRoom, createRoom, signalingData: peerSignalingData, connectWithSignalingData } = useChat();

  const isWebRTCSupported = () => {
    return typeof RTCPeerConnection !== 'undefined';
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomIdParam = params.get('room');
    if (roomIdParam) {
      setRoomId(roomIdParam);
      setJoinMode('join');
      // Always show signaling input when joining via URL to make it more obvious
      setShowSignalingInput(true);
    }
  }, []);

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to continue",
        variant: "destructive"
      });
      return;
    }
    
    if (joinMode === 'create') {
      const newRoomId = createRoom(userName.trim());
      // Copy room link to clipboard
      const roomLink = window.location.origin + '?room=' + newRoomId;
      navigator.clipboard.writeText(roomLink);
      toast({
        title: "Room created!",
        description: "Share both the room link AND your connection data with others to join across different networks"
      });
      
      if (!isWebRTCSupported()) {
        toast({
          title: "Limited functionality",
          description: "WebRTC is not supported in this browser. The app will work only for users on the same device.",
          variant: "destructive"
        });
      }
    } else {
      if (!roomId.trim()) {
        toast({
          title: "Room ID required",
          description: "Please enter a room ID to join",
          variant: "destructive"
        });
        return;
      }
      
      joinRoom(roomId.trim(), userName.trim());
      
      if (signalingData.trim()) {
        // Connect using the provided signaling data
        setTimeout(() => {
          connectWithSignalingData(signalingData.trim());
          toast({
            title: "Connecting...",
            description: "Attempting to connect with the other user. This may take a moment."
          });
        }, 1000);
      } else if (!isWebRTCSupported()) {
        toast({
          title: "Limited functionality",
          description: "WebRTC is not supported in this browser. You may only see messages from users on the same device.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Connection data missing",
          description: "For cross-network chat, you need the connection data from the room creator",
          variant: "default"
        });
      }
    }
  };

  const handleCopySignalingData = () => {
    if (peerSignalingData) {
      navigator.clipboard.writeText(peerSignalingData);
      toast({
        title: "Connection data copied!",
        description: "Share this with anyone who wants to join your room"
      });
    }
  };

  return (
    <div className="glass-panel p-8 w-full max-w-md transition-all animate-scale-in">
      <h2 className="text-2xl font-medium mb-6 text-center">
        {joinMode === 'create' ? 'Create a New Chat' : 'Join Existing Chat'}
      </h2>
      
      {joinMode === 'create' && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <p className="font-medium mb-1 flex items-center"><Info className="h-4 w-4 mr-1" /> Cross-Network Instructions</p>
          <p>After creating a room, you must share <b>both</b> the room link <b>and</b> connection data with your friends.</p>
        </div>
      )}
      
      {joinMode === 'join' && !showSignalingInput && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
          <p className="font-medium mb-1 flex items-center"><Info className="h-4 w-4 mr-1" /> Cross-Network Instructions</p>
          <p><b>IMPORTANT:</b> To chat with someone on a different network, you <b>must</b> click <b>"Enter connection data"</b> below and paste the data shared by the room creator.</p>
        </div>
      )}
      
      {joinMode === 'join' && showSignalingInput && !signalingData && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          <p className="font-medium mb-1 flex items-center"><Info className="h-4 w-4 mr-1" /> Required Connection Data</p>
          <p><b>YOU MUST</b> paste the connection data from the room creator below or you won't be able to connect!</p>
        </div>
      )}
      
      {!isWebRTCSupported() && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
          <p className="font-medium mb-1">Limited Functionality</p>
          <p>Your browser doesn't fully support WebRTC. The app will only work for users on the same device.</p>
        </div>
      )}
      
      <form onSubmit={handleAction} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 ml-1">Your Name</label>
          <Input 
            type="text" 
            value={userName} 
            onChange={(e) => setUserName(e.target.value)} 
            placeholder="Enter your name"
            className="input-field"
            autoFocus
          />
        </div>
        
        {joinMode === 'join' && (
          <div>
            <label className="block text-sm font-medium mb-1 ml-1">Room ID</label>
            <Input 
              type="text" 
              value={roomId} 
              onChange={(e) => setRoomId(e.target.value)} 
              placeholder="Enter room ID"
              className="input-field"
            />
            
            <div className="mt-3">
              <button 
                type="button" 
                onClick={() => setShowSignalingInput(!showSignalingInput)}
                className="text-sm text-primary/80 hover:text-primary mb-2 flex items-center"
              >
                <Link2 className="h-3.5 w-3.5 mr-1" />
                {showSignalingInput ? 'Hide connection data' : 'Enter connection data'}
              </button>
              
              {showSignalingInput && (
                <>
                  <Textarea
                    value={signalingData}
                    onChange={(e) => setSignalingData(e.target.value)}
                    placeholder="Paste the connection data from the room creator"
                    className="h-24 text-xs"
                  />
                  <p className="text-xs font-medium text-red-600 mt-1">
                    This connection data is REQUIRED for cross-network chat!
                  </p>
                </>
              )}
            </div>
          </div>
        )}
        
        <Button 
          type="submit" 
          className="w-full rounded-full bg-primary hover:bg-primary/90 py-6 group"
        >
          {joinMode === 'create' ? (
            <span className="flex items-center">
              Create Room 
              <PlusCircle className="ml-2 h-4 w-4 group-hover:scale-110 transition-transform" />
            </span>
          ) : (
            <span className="flex items-center">
              Join Room
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </span>
          )}
        </Button>
        
        {peerSignalingData && joinMode === 'create' && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Connection Data</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleCopySignalingData}
                className="h-7 text-xs"
              >
                Copy
              </Button>
            </div>
            <p className="text-xs text-red-600 mb-2 font-medium">
              <b>IMPORTANT:</b> You MUST share this connection data with anyone who wants to join
            </p>
            <div className="bg-white p-2 rounded border text-xs overflow-auto max-h-24 font-mono">
              {peerSignalingData}
            </div>
          </div>
        )}
        
        <div className="text-center pt-2">
          <button 
            type="button"
            onClick={() => setJoinMode(joinMode === 'create' ? 'join' : 'create')}
            className="text-sm text-primary/80 hover:text-primary link-underline"
          >
            {joinMode === 'create' 
              ? 'Join an existing room instead' 
              : 'Create a new room instead'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JoinForm;
