'use client';

// Estado raiz `data` + persistência em localStorage + ponte com o syncVault.
// Hidrata só no client (evita mismatch de SSR e evita sobrescrever dados com o default).

import { useEffect, useRef, useState } from 'react';
import { createDefaultData, getInitialState, STORAGE_KEY } from '@/lib/state';
import { installSyncVault, notifySyncDataChange } from '@/lib/syncVault';
import type { FinanceData } from '@/lib/types';

export function useFinanceData() {
  const [data, setData] = useState<FinanceData>(createDefaultData);
  const [hydrated, setHydrated] = useState(false);
  const dataRef = useRef(data);
  const didPersistInitialData = useRef(false);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Hidrata a partir do localStorage uma única vez no client.
  useEffect(() => {
    setData(getInitialState());
    setHydrated(true);
  }, []);

  // Instala a API de sincronismo (window.assistenteSync) após hidratar.
  useEffect(() => {
    if (!hydrated) return;
    return installSyncVault({
      getData: () => dataRef.current,
      setData,
    });
  }, [hydrated]);

  // Persiste a cada mudança; primeira persistência não dispara push do sync.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      if (didPersistInitialData.current) {
        notifySyncDataChange(data);
      } else {
        didPersistInitialData.current = true;
      }
    } catch {
      /* ignore */
    }
  }, [data, hydrated]);

  return { data, setData, hydrated };
}
