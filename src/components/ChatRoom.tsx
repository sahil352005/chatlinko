
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import Message from './Message';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, UserRound } from 'lucide-react';

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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Users typing indicator */}
      <div className="py-2 px-4 bg-gray-50 border-b">
        <div className="flex justify-between items-center">
          <div className="flex flex-wrap gap-2">
            {users.map(u => (
              <div 
                key={u.id} 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${u.color}20`, color: u.color }}
              >
                <UserRound className="w-3 h-3 mr-1" />
                {u.name}
              </div>
            ))}
          </div>
          <div className="text-xs text-gray-500">
            {connectionStatus === 'connected' ? (
              <span className="text-green-500 font-medium">Connected</span>
            ) : connectionStatus === 'connecting' ? (
              <span className="text-orange-500 font-medium">Connecting...</span>
            ) : (
              <span className="text-gray-500 font-medium">Local Mode</span>
            )}
          </div>
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
