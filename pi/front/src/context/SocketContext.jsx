import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../config/api.js';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

function emitRegister(client) {
  try {
    const userStr = localStorage.getItem('user');
    if (!userStr) return;
    const user = JSON.parse(userStr);
    if (user?.id) client.emit('register', { userId: user.id });
  } catch (e) {
    console.error('Failed to register socket:', e);
  }
}

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [examInvite, setExamInvite] = useState(null);
  /** True after Socket.IO handshake completes (server accepted JWT in CommunicationGateway). */
  const [liveConnected, setLiveConnected] = useState(false);
  /** Bumped on login/logout so we reconnect with the right JWT (CommunicationGateway rejects clients without auth.token). */
  const [authEpoch, setAuthEpoch] = useState(0);

  useEffect(() => {
    const bump = () => setAuthEpoch((n) => n + 1);
    window.addEventListener('evalai:user-updated', bump);
    return () => window.removeEventListener('evalai:user-updated', bump);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setLiveConnected(false);
      setSocket((prev) => {
        if (prev) {
          prev.removeAllListeners();
          prev.close();
        }
        return null;
      });
      setExamInvite(null);
      return undefined;
    }

    setLiveConnected(false);

    const newSocket = io(API_BASE_URL, {
      transports: ['websocket', 'polling'],
      auth: { token },
    });

    setSocket(newSocket);

    const checkUser = () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          const uid = user?.id || user?._id;
          if (uid) {
            newSocket.emit('register', { userId: String(uid) });
          }
        }
      } catch (e) {
        console.error('Failed to register socket:', e);
      }
    };

    const onLiveUp = () => {
      setLiveConnected(true);
      checkUser();
    };
    const onLiveDown = () => {
      setLiveConnected(false);
    };

    newSocket.on('connect', onLiveUp);
    newSocket.on('reconnect', onLiveUp);
    newSocket.on('disconnect', onLiveDown);
    newSocket.on('connect_error', (err) => {
      console.error('[socket] connect_error:', err?.message || err, err?.data || '');
      setLiveConnected(false);
    });

    newSocket.on('examInviteReceived', (data) => {
      setExamInvite(data);
    });

    // Polling check for registration (every 5 seconds)
    const interval = setInterval(checkUser, 5000);

    if (newSocket.connected) {
      setLiveConnected(true);
      checkUser();
    }

    return () => {
      setLiveConnected(false);
      clearInterval(interval);
      newSocket.removeAllListeners();
      newSocket.close();
    };
  }, [authEpoch]);

  const clearInvite = () => setExamInvite(null);

  return (
    <SocketContext.Provider value={{ socket, examInvite, clearInvite, liveConnected }}>
      {children}
    </SocketContext.Provider>
  );
};
