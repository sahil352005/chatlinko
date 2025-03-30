
import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, PlusCircle, Link2, Info, AlertCircle } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const JoinForm: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create');
  const [showSignalingInput, setShowSignalingInput] = useState(false);
  const [signalingData, setSignalingData] = useState('');
  const { joinRoom, createRoom, signalingData: peerSignalingData, connectWithSignalingData, connectionStatus } = useChat();

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
        description: "Share both the room link AND your connection data with others to join"
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

  const handleCopyRoomLink = () => {
    if (roomId) {
      const roomLink = window.location.origin + '?room=' + roomId;
      navigator.clipboard.writeText(roomLink);
      toast({
        title: "Room link copied!",
        description: "Share this link with friends to join your room"
      });
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (clipboardText.trim()) {
        setSignalingData(clipboardText.trim());
        toast({
          title: "Connection data pasted",
          description: "Connection data has been pasted from clipboard"
        });
      }
    } catch (error) {
      toast({
        title: "Cannot access clipboard",
        description: "Please paste the connection data manually",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="glass-panel p-8 w-full max-w-md transition-all animate-scale-in">
      <h2 className="text-2xl font-medium mb-6 text-center">
        {joinMode === 'create' ? 'Create a New Chat Room' : 'Join Existing Chat Room'}
      </h2>
      
      {joinMode === 'create' && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Important: Cross-Network Instructions</AlertTitle>
          <AlertDescription>
            <p className="text-sm">After creating a room, you <strong>must share both</strong>:</p>
            <ol className="list-decimal ml-5 text-sm mt-1">
              <li>The room link</li>
              <li>The connection data (will appear after room creation)</li>
            </ol>
          </AlertDescription>
        </Alert>
      )}
      
      {joinMode === 'join' && !showSignalingInput && (
        <Alert className="mb-4 bg-blue-50 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Cross-Network Chat Instructions</AlertTitle>
          <AlertDescription className="text-sm">
            To chat with someone on a different network, you <strong>must</strong> click "Enter connection data" below and paste the data shared by the room creator.
          </AlertDescription>
        </Alert>
      )}
      
      {joinMode === 'join' && showSignalingInput && !signalingData && (
        <Alert className="mb-4 bg-red-50 border-red-200">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-700">Required Connection Data</AlertTitle>
          <AlertDescription className="text-sm text-red-700">
            <strong>Connection data is required</strong> for cross-network chat. Ask the room creator to send you their connection data and paste it below.
          </AlertDescription>
        </Alert>
      )}
      
      {!isWebRTCSupported() && (
        <Alert className="mb-4 bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertTitle className="text-yellow-700">Limited Functionality</AlertTitle>
          <AlertDescription className="text-sm text-yellow-700">
            Your browser doesn't fully support WebRTC. The app will only work for users on the same device.
          </AlertDescription>
        </Alert>
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
                  <div className="flex mb-2">
                    <Textarea
                      value={signalingData}
                      onChange={(e) => setSignalingData(e.target.value)}
                      placeholder="Paste the connection data from the room creator"
                      className="h-24 text-xs"
                    />
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePasteFromClipboard}
                    className="mb-2 text-xs"
                  >
                    Paste from clipboard
                  </Button>
                  <p className="text-xs font-medium text-red-600">
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
        
        {peerSignalingData && joinMode === 'create' && roomId && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Room Information</span>
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyRoomLink}
                  className="h-7 text-xs"
                >
                  Copy Link
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopySignalingData}
                  className="h-7 text-xs"
                >
                  Copy Data
                </Button>
              </div>
            </div>
            <p className="text-xs text-red-600 mb-2 font-medium">
              <strong>IMPORTANT:</strong> You MUST share BOTH the room link AND this connection data!
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
