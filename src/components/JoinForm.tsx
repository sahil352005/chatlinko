
import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, PlusCircle } from 'lucide-react';

const JoinForm: React.FC = () => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinMode, setJoinMode] = useState<'create' | 'join'>('create');
  const { joinRoom, createRoom } = useChat();

  const handleAction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) return;
    
    if (joinMode === 'create') {
      const newRoomId = createRoom(userName.trim());
      // Copy room link to clipboard
      navigator.clipboard.writeText(window.location.origin + '?room=' + newRoomId);
    } else {
      if (!roomId.trim()) return;
      joinRoom(roomId.trim(), userName.trim());
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
