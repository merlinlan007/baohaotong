import { useState, useEffect, useCallback } from 'react';
import { loadPhones as ghLoad, savePhones as ghSave, getStoredToken } from '../github-api';
import { generateId, getTodayStr, getPhoneStatus } from '../utils/helpers';

/**
 * Custom hook for managing phone numbers via GitHub repo.
 * Data is stored in the repo's data/phones.json file.
 * @param {object|null} user - GitHub user info
 */
export default function usePhones(user) {
  const [phones, setPhones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !getStoredToken()) {
      setPhones([]);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const data = await ghLoad();
        if (!cancelled) setPhones(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('Failed to load phones:', e.message);
        if (!cancelled) setPhones([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [user]);

  /** Save to GitHub after state change */
  const persist = useCallback(async (newPhones) => {
    const token = getStoredToken();
    if (!token) return;
    try {
      await ghSave(newPhones);
    } catch (e) {
      console.error('Failed to save phones:', e.message);
    }
  }, []);

  const addPhone = useCallback(async (data) => {
    const now = getTodayStr();
    const newPhone = {
      id: generateId(),
      phoneNumber: data.phoneNumber,
      carrier: data.carrier,
      cycleDays: data.cycleDays,
      lastKeepDate: data.lastKeepDate,
      note: data.note || '',
      records: [],
      createdAt: now,
    };
    const updated = [newPhone, ...phones];
    setPhones(updated);
    await persist(updated);
  }, [phones, persist]);

  const updatePhone = useCallback(async (id, data) => {
    const updated = phones.map((p) => (p.id === id ? { ...p, ...data } : p));
    setPhones(updated);
    await persist(updated);
  }, [phones, persist]);

  const deletePhone = useCallback(async (id) => {
    const updated = phones.filter((p) => p.id !== id);
    setPhones(updated);
    await persist(updated);
  }, [phones, persist]);

  const keepPhone = useCallback(async (id, method = '手动保号', note = '') => {
    const today = getTodayStr();
    const record = { id: generateId(), date: today, method, note };
    const updated = phones.map((p) =>
      p.id === id
        ? { ...p, lastKeepDate: today, records: [...(p.records || []), record] }
        : p,
    );
    setPhones(updated);
    await persist(updated);
  }, [phones, persist]);

  const getStats = useCallback(() => {
    let total = phones.length;
    let warn5 = 0;
    let warning = 0;
    let expired = 0;
    for (const phone of phones) {
      const { status } = getPhoneStatus(phone);
      if (status === 'warn5') warn5++;
      if (status === 'warning') warning++;
      if (status === 'expired') expired++;
    }
    return { total, warn5, warning, expired };
  }, [phones]);

  return { phones, loading, addPhone, updatePhone, deletePhone, keepPhone, getStats };
}
