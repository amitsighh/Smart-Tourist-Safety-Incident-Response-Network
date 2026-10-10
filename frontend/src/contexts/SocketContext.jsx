import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [incomingSosAlert, setIncomingSosAlert] = useState(null);
  const [liveTelemetryPings, setLiveTelemetryPings] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const newSocket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      if (user && ['police', 'operator', 'tourism_official', 'admin'].includes(user.role)) {
        newSocket.emit('join_authority_room');
      }
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('critical_panic_sos', (sosData) => {
      setIncomingSosAlert(sosData);
      // Play subtle warning audio chime if browser permits
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.6);
      } catch (e) {
        // audio context blocked
      }
    });

    newSocket.on('tourist_telemetry_update', (data) => {
      setLiveTelemetryPings(prev => [data, ...prev.slice(0, 49)]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const emitTelemetry = (telemetryData) => {
    if (socket && isConnected) {
      socket.emit('telemetry_stream', telemetryData);
    }
  };

  const emitPanicSos = (sosData) => {
    if (socket && isConnected) {
      socket.emit('panic_sos_broadcast', sosData);
    }
  };

  return (
    <SocketContext.Provider value={{
      socket,
      isConnected,
      incomingSosAlert,
      clearIncomingSos: () => setIncomingSosAlert(null),
      liveTelemetryPings,
      emitTelemetry,
      emitPanicSos
    }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
