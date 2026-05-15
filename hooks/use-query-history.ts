'use client';

import { useEffect, useState, useCallback } from 'react';

export interface QueryHistoryEntry {
  id: string;
  question: string;
  sqlQuery: string;
  rowCount: number;
  timestamp: number;
}

const STORAGE_KEY = 'queryHistory';
const MAX_ENTRIES = 50;

export function useQueryHistory() {
  const [history, setHistory] = useState<QueryHistoryEntry[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // ignore corrupt entry
    }
  }, []);

  const persist = useCallback((next: QueryHistoryEntry[]) => {
    setHistory(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }, []);

  const addEntry = useCallback(
    (entry: Omit<QueryHistoryEntry, 'id' | 'timestamp'>) => {
      const newEntry: QueryHistoryEntry = {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        timestamp: Date.now(),
      };
      setHistory(prev => {
        const next = [newEntry, ...prev].slice(0, MAX_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const removeEntry = useCallback(
    (id: string) => {
      setHistory(prev => {
        const next = prev.filter(e => e.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    },
    []
  );

  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  return { history, addEntry, removeEntry, clearAll };
}
