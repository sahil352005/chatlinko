
import { generateUserId } from './chatService';
import { User } from '../types/chat';

// Random color function (soft pastel colors)
export const getRandomColor = () => {
  const colors = [
    '#FFA69E', '#FAF3DD', '#B8F2E6', '#AED9E0', '#5E6472',
    '#E3D0D8', '#C1D37F', '#A3C4BC', '#957DAD', '#D291BC'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// Create a new user
export const createUser = (userName: string): User => {
  return {
    id: generateUserId(),
    name: userName,
    color: getRandomColor()
  };
};
