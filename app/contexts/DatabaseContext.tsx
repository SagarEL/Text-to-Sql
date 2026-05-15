'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface DbCredentials {
  db_user: string;
  db_password: string;
  db_host: string;
  db_port: string;
  db_name: string;
}

interface DatabaseContextType {
  dbCredentials: DbCredentials;
  setDbCredentials: (credentials: DbCredentials) => void;
  useMockDb: boolean;
  setUseMockDb: (value: boolean) => void;
  isConnected: boolean;
  setIsConnected: (value: boolean) => void;
  dbStructure: {[key: string]: string[]} | null;
  setDbStructure: (structure: {[key: string]: string[]} | null) => void;
  llmChoice: string;
  setLlmChoice: (value: string) => void;
  logout: () => void;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export const useDatabaseContext = () => {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabaseContext must be used within a DatabaseProvider');
  }
  return context;
};

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [dbCredentials, setDbCredentials] = useState<DbCredentials>({
    db_user: '',
    db_password: '',
    db_host: '',
    db_port: '',
    db_name: ''
  });
  const [useMockDb, setUseMockDb] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [dbStructure, setDbStructure] = useState<{[key: string]: string[]} | null>(null);
  const [llmChoice, setLlmChoice] = useState('gemini');

  // Load from localStorage on mount
  useEffect(() => {
    const savedCredentials = localStorage.getItem('dbCredentials');
    const savedUseMockDb = localStorage.getItem('useMockDb');
    const savedIsConnected = localStorage.getItem('isConnected');
    const savedDbStructure = localStorage.getItem('dbStructure');
    const savedLlmChoice = localStorage.getItem('llmChoice');

    if (savedCredentials) {
      setDbCredentials(JSON.parse(savedCredentials));
    }
    if (savedUseMockDb) {
      setUseMockDb(JSON.parse(savedUseMockDb));
    }
    if (savedIsConnected) {
      setIsConnected(JSON.parse(savedIsConnected));
    }
    if (savedDbStructure) {
      setDbStructure(JSON.parse(savedDbStructure));
    }
    if (savedLlmChoice) {
      setLlmChoice(savedLlmChoice);
    }
  }, []);

  // Save to localStorage when values change
  useEffect(() => {
    localStorage.setItem('dbCredentials', JSON.stringify(dbCredentials));
  }, [dbCredentials]);

  useEffect(() => {
    localStorage.setItem('useMockDb', JSON.stringify(useMockDb));
  }, [useMockDb]);

  useEffect(() => {
    localStorage.setItem('isConnected', JSON.stringify(isConnected));
  }, [isConnected]);

  useEffect(() => {
    localStorage.setItem('dbStructure', JSON.stringify(dbStructure));
  }, [dbStructure]);

  useEffect(() => {
    localStorage.setItem('llmChoice', llmChoice);
  }, [llmChoice]);

  const logout = () => {
    setDbCredentials({
      db_user: '',
      db_password: '',
      db_host: '',
      db_port: '',
      db_name: ''
    });
    setUseMockDb(false);
    setIsConnected(false);
    setDbStructure(null);
    setLlmChoice('gemini');
    localStorage.removeItem('dbCredentials');
    localStorage.removeItem('useMockDb');
    localStorage.removeItem('isConnected');
    localStorage.removeItem('dbStructure');
    localStorage.removeItem('llmChoice');
  };

  return (
    <DatabaseContext.Provider
      value={{
        dbCredentials,
        setDbCredentials,
        useMockDb,
        setUseMockDb,
        isConnected,
        setIsConnected,
        dbStructure,
        setDbStructure,
        llmChoice,
        setLlmChoice,
        logout
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
};
