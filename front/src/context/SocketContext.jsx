import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

export const useSocket = () => {
  return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [examInvite, setExamInvite] = useState(null);

  useEffect(() => {
    // Create socket connection
    const newSocket = io('http://localhost:3000');
    setSocket(newSocket);

    // Register user when connected if user exists in localStorage
    newSocket.on('connect', () => {
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.id) {
            newSocket.emit('register', { userId: user.id });
          }
        }
      } catch (e) {
        console.error('Failed to register socket:', e);
      }
    });

    // Listen for exam invites
    newSocket.on('examInviteReceived', (data) => {
      setExamInvite(data);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const clearInvite = () => setExamInvite(null);

  return (
    <SocketContext.Provider value={{ socket, examInvite, clearInvite }}>
      {children}
    </SocketContext.Provider>
  );
};
