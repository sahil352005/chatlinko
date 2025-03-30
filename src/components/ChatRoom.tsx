
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import Message from './Message';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, UserRound, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

const ChatRoom: React.FC = () => {
  const { messages, sendMessage, user, users, connectionStatus } = useChat();
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Focus the input when the component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim()) {
      sendMessage(messageText.trim());
      setMessageText('');
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Users list header */}
      <div className="py-2 px-4 bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="ghost" size="sm" className="mr-2 flex gap-2">
                  <Users className="h-4 w-4" />
                  <span>Connected Users ({users.length})</span>
                </Button>
              </DrawerTrigger>
              <DrawerContent>
                <div className="max-w-md w-full mx-auto">
                  <DrawerHeader>
                    <DrawerTitle>Connected Users</DrawerTitle>
                    <DrawerDescription>
                      {users.length === 1 
                        ? "You're the only user in this room. Share the room link and connection data to invite others."
                        : `${users.length} users in this room`
                      }
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="p-4">
                    <div className="space-y-4">
                      {users.map(u => (
                        <div 
                          key={u.id} 
                          className="flex items-center p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Avatar className="h-10 w-10 mr-3" style={{ backgroundColor: u.color }}>
                            <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {u.name} {u.id === user?.id && "(You)"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {connectionStatus === 'connected' ? 'Connected' : 'Local'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
          <div className="flex -space-x-2">
            {users.slice(0, 3).map(u => (
              <Avatar key={u.id} className="border-2 border-white h-8 w-8" style={{ backgroundColor: u.color }}>
                <AvatarFallback>{getInitials(u.name)}</AvatarFallback>
              </Avatar>
            ))}
            {users.length > 3 && (
              <Avatar className="border-2 border-white h-8 w-8 bg-gray-200">
                <AvatarFallback>+{users.length - 3}</AvatarFallback>
              </Avatar>
            )}
          </div>
        </div>
        <div className="mt-1 text-xs">
          {connectionStatus === 'connected' ? (
            <span className="text-green-500 font-medium">Connected with other users</span>
          ) : connectionStatus === 'connecting' ? (
            <span className="text-orange-500 font-medium">Connecting to other users...</span>
          ) : (
            <span className="text-gray-500 font-medium">Local Mode (only users on this device)</span>
          )}
        </div>
      </div>
      
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-chat-light">
        <div className="max-w-2xl mx-auto">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation by sending a message</p>
              </div>
            </div>
          )}
          
          {messages.map((message) => (
            <Message
              key={message.id}
              id={message.id}
              text={message.text}
              userId={message.userId}
              userName={message.userName}
              timestamp={message.timestamp}
              color={message.color}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Message input */}
      <div className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2 max-w-2xl mx-auto">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="rounded-full bg-gray-100 border-gray-200 focus:bg-white"
          />
          <Button 
            type="submit" 
            className="rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0"
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
