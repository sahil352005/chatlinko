
import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, PlusCircle, Link2 } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

const JoinForm: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create');
  const [showSignalingInput, setShowSignalingInput] = useState(false);
  const [signalingData, setSignalingData] = useState('');
  const { joinRoom, createRoom, signalingData: peerSignalingData, connectWithSignalingData } = useChat();

  // Check for room ID in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomIdParam = params.get('room');
    if (roomIdParam) {
      setRoomId(roomIdParam);
      setJoinMode('join');
    }
  }, []);

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) return;
    
    if (joinMode === 'create') {
      const newRoomId = createRoom(userName.trim());
      // Copy room link to clipboard
      const roomLink = window.location.origin + '?room=' + newRoomId;
      navigator.clipboard.writeText(roomLink);
      toast({
        title: "Room created!",
        description: "Share the room link and your connection data with others to join"
      });
    } else {
      if (!roomId.trim()) return;
      joinRoom(roomId.trim(), userName.trim());
      
      if (signalingData.trim()) {
        // Connect using the provided signaling data
        setTimeout(() => {
          connectWithSignalingData(signalingData.trim());
        }, 1000);
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
            
            {joinMode === 'join' && (
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
                  <Textarea
                    value={signalingData}
                    onChange={(e) => setSignalingData(e.target.value)}
                    placeholder="Paste the connection data from the room creator"
                    className="h-24 text-xs"
                  />
                )}
              </div>
            )}
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
            <p className="text-xs text-gray-500 mb-2">
              Share this connection data with anyone who wants to join your room
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
