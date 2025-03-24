
import React, { useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';

type MessageProps = {
  id: string;
  text: string;
  userId: string;
  userName: string;
  timestamp: number;
  color: string;
};

const Message: React.FC<MessageProps> = ({ id, text, userId, userName, timestamp, color }) => {
  const { user } = useChat();
  const messageRef = useRef<HTMLDivElement>(null);
  const isSelf = user?.id === userId;
  
  // Format time (HH:MM)
  const time = new Date(timestamp).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true
  });
  
  // Scroll into view for new messages
  useEffect(() => {
    messageRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return (
    <div 
      ref={messageRef}
      className={`flex flex-col mb-4 animate-fade-in ${isSelf ? 'items-end' : 'items-start'}`}
    >
      {!isSelf && (
        <div className="ml-2 mb-1 text-xs font-medium" style={{ color }}>
          {userName}
        </div>
      )}
      <div 
        className={`message-bubble ${isSelf ? 'message-bubble-self' : 'message-bubble-other'}`}
      >
        {text}
      </div>
      <div className="message-time px-2">
        {time}
      </div>
    </div>
  );
};

export default Message;
