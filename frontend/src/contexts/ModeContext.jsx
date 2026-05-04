import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';

const ModeContext = createContext();

export const useMode = () => useContext(ModeContext);

export const ModeProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('userMode') || 'personal';
  });

  useEffect(() => {
    if (user?.mode_preference) {
      setMode(user.mode_preference);
      localStorage.setItem('userMode', user.mode_preference);
    }
  }, [user]);

  const updateMode = async (newMode) => {
    try {
      const response = await api.patch('/users/mode', { mode: newMode });
      
      if (response.ok) {
        setMode(newMode);
        localStorage.setItem('userMode', newMode);
        toast.success(`Switched to ${newMode} mode`);
      }
    } catch (error) {
      console.error('Failed to update mode:', error);
      toast.error('Failed to update mode');
    }
  };

  return (
    <ModeContext.Provider value={{ mode, updateMode, setMode }}>
      {children}
    </ModeContext.Provider>
  );
};