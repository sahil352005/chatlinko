import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from "@/components/ui/button";
import { Share, Users, LogOut, Wifi, WifiOff, Copy, Eye, EyeOff } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

const Header: React.FC = () => {
  const { roomId, leaveRoom, users, signalingData, connectionStatus } = useChat();
  const [showConnectionData, setShowConnectionData] = useState(false);

  const handleShareLink = () => {
    if (roomId) {
      const roomLink = window.location.origin + '?room=' + roomId;
      navigator.clipboard.writeText(roomLink);
      toast({
        title: "Link copied to clipboard",
        description: "Share this link with others to join this chat room"
      });
    }
  };

  const handleShareSignaling = () => {
    if (signalingData) {
      navigator.clipboard.writeText(signalingData);
      toast({
        title: "Connection data copied",
        description: "Share this data with others for cross-device/network communication"
      });
    } else {
      toast({
        title: "No connection data available",
        description: "Wait a moment and try again",
        variant: "destructive"
      });
    }
  };

  const getConnectionStatusDisplay = () => {
    if (!signalingData) return null;
    
    return (
      <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full flex items-center ${
        connectionStatus === 'connected' 
          ? 'bg-green-100 text-green-800' 
          : connectionStatus === 'connecting'
          ? 'bg-yellow-100 text-yellow-800'
          : 'bg-gray-100 text-gray-800'
      }`}>
        {connectionStatus === 'connected' ? (
          <><Wifi className="h-3 w-3 mr-0.5" />P2P</>
        ) : connectionStatus === 'connecting' ? (
          <><Wifi className="h-3 w-3 mr-0.5" />Connecting...</>
        ) : (
          <><WifiOff className="h-3 w-3 mr-0.5" />Offline</>
        )}
      </span>
    );
  };

  const toggleShowConnectionData = () => {
    setShowConnectionData(!showConnectionData);
  };

  return (
    <header className="w-full p-4 flex flex-col bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-xl font-medium">Chat Room</div>
          {roomId && (
            <div className="flex items-center">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full ml-2">
                Room: {roomId.substring(0, 6)}...
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {roomId && (
            <>
              <div className="flex items-center mr-2">
                <Users className="h-4 w-4 text-gray-500 mr-1" />
                <span className="text-sm text-gray-600">{users.length}</span>
                {getConnectionStatusDisplay()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleShareLink}
                className="text-xs flex items-center gap-1 rounded-full px-3 hover:bg-gray-100"
              >
                <Share className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share Link</span>
              </Button>
              
              {signalingData && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShareSignaling}
                    className="text-xs flex items-center gap-1 rounded-full px-3 hover:bg-gray-100"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Copy Connection</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleShowConnectionData}
                    className="text-xs flex items-center gap-1 rounded-full px-3 hover:bg-gray-100"
                  >
                    {showConnectionData ? 
                      <><EyeOff className="h-3.5 w-3.5" /><span className="hidden sm:inline">Hide Data</span></> : 
                      <><Eye className="h-3.5 w-3.5" /><span className="hidden sm:inline">Show Data</span></>
                    }
                  </Button>
                </>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={leaveRoom}
                className="text-xs flex items-center gap-1 rounded-full px-3 hover:bg-red-50 hover:text-red-500"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Leave</span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      {showConnectionData && signalingData && (
        <div className="mt-4 p-3 bg-gray-50 rounded-md border border-gray-200 text-sm">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium text-gray-700">Connection Data</h3>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleShareSignaling}
                className="text-xs py-1 h-7"
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-2">Share this data with others who want to join from a different network</p>
          <div className="bg-white p-2 rounded border border-gray-200 overflow-x-auto">
            <pre className="text-xs text-gray-600 whitespace-pre-wrap break-all">
              {signalingData}
            </pre>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
