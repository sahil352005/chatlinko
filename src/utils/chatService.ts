
import { nanoid } from 'nanoid';

// Polyfill for nanoid (not included by default)
<lov-add-dependency>nanoid@4.0.2</lov-add-dependency>

// This file is intentionally minimal since we're using BroadcastChannel
// for same-origin communication. In a production app, you'd implement
// WebRTC or WebSocket connections here.

export const generateRoomId = (): string => {
  return nanoid(10);
};

export const generateUserId = (): string => {
  return nanoid();
};
