import { Server } from 'socket.io';
import { config } from '../config/index.js';

let ioInstance = null;

export function initializeWebSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: config.corsOrigins,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  ioInstance = io;

  io.on('connection', (socket) => {
    // Join authority command room
    socket.on('join_authority_room', () => {
      socket.join('authority_command_room');
    });

    // Join individual tourist room for private safety updates
    socket.on('join_tourist_room', (touristId) => {
      if (touristId) {
        socket.join(`tourist_${touristId}`);
      }
    });

    // Handle tourist live telemetry stream from client
    socket.on('telemetry_stream', (data) => {
      // Forward to authority command map
      io.to('authority_command_room').emit('tourist_telemetry_update', data);
    });

    // Handle Panic SOS broadcast
    socket.on('panic_sos_broadcast', (sosData) => {
      io.to('authority_command_room').emit('critical_panic_sos', sosData);
    });

    socket.on('disconnect', () => {
      // Client disconnected
    });
  });

  return io;
}

export function getSocketIO() {
  return ioInstance;
}
