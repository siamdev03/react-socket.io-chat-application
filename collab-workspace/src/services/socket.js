import { io } from 'socket.io-client';

// Nischit koro URL-ta jeno Backend port-er sathe mele
const SOCKET_URL = 'http://localhost:3000';

export const socket = io(SOCKET_URL, {
  autoConnect: true, // Jetu connect hochhe na, tai autoConnect true rakho
  transports: ['websocket'] // Forcefully websocket use koro
});