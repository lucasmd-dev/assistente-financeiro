'use client';

// Toggle global "ocultar valores" persistido em chave própria do localStorage.

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const HIDE_KEY = 'assistenteFinanceiroHideValues';

export function useHideValues(): [boolean, Dispatch<SetStateAction<boolean>>] {
  const [hideValues, setHideValues] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHideValues(localStorage.getItem(HIDE_KEY) === 'true');
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(HIDE_KEY, String(hideValues));
  }, [hideValues, hydrated]);

  return [hideValues, setHideValues];
}
