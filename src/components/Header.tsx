
import React from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from "@/components/ui/button";
import { Share, Users, LogOut } from 'lucide-react';
import { toast } from "@/hooks/use-toast";

const Header: React.FC = () => {
  const { roomId, leaveRoom, users } = useChat();

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

  return (
    <header className="w-full p-4 flex items-center justify-between bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
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
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleShareLink}
              className="text-xs flex items-center gap-1 rounded-full px-3 hover:bg-gray-100"
            >
              <Share className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            
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
    </header>
  );
};

export default Header;
