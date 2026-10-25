import React, { createContext, useContext, useState, useEffect } from 'react';
import { systemService } from '../api/services';

const SystemContext = createContext(null);

export const SystemProvider = ({ children }) => {
  const [status, setStatus] = useState({
    mode: 'demo_sample',
    is_demo: true,
    is_in_memory_db: false,
    db_type: 'Checking...',
    gemini_model: 'gemini-2.5-flash',
    gemini_key_configured: false,
  });
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    try {
      const res = await systemService.getStatus();
      setStatus(res.data);
    } catch (err) {
      console.warn("Could not fetch system status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Poll system status every 30 seconds
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SystemContext.Provider value={{ status, loading, refreshStatus: fetchStatus }}>
      {children}
    </SystemContext.Provider>
  );
};

export const useSystem = () => {
  const context = useContext(SystemContext);
  if (!context) {
    throw new Error('useSystem must be used within a SystemProvider');
  }
  return context;
};
