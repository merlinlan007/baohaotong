import { useState, useEffect, useCallback } from 'react';
import {
  generateId,
  getTodayStr,
  getPhoneStatus,
} from '../utils/helpers';

const STORAGE_KEY = 'baohatong_phones';

/**
 * Create the initial sample phone record.
 * @returns {object}
 */
function createSamplePhone() {
  const today = new Date();
  const tenDaysAgo = new Date(today);
  tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
  const y = tenDaysAgo.getFullYear();
  const m = String(tenDaysAgo.getMonth() + 1).padStart(2, '0');
  const d = String(tenDaysAgo.getDate()).padStart(2, '0');
  const lastKeepDate = `${y}-${m}-${d}`;

  return {
    id: generateId(),
    phoneNumber: '13800138000',
    carrier: '中国移动',
    cycleDays: 30,
    lastKeepDate,
    note: '示例号码',
    records: [
      {
        id: generateId(),
        date: lastKeepDate,
        method: '系统初始化',
        note: '预置示例数据',
      },
    ],
    createdAt: lastKeepDate,
  };
}

/**
 * Load phones from localStorage, or initialize with sample data.
 * @returns {Array}
 */
function loadPhones() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load phones from localStorage:', e);
  }
  return [createSamplePhone()];
}

/**
 * Custom hook for managing phone numbers.
 * @returns {object} State and action functions
 */
export default function usePhones() {
  const [phones, setPhones] = useState(() => loadPhones());

  // Persist to localStorage whenever phones change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(phones));
    } catch (e) {
      console.warn('Failed to save phones to localStorage:', e);
    }
  }, [phones]);

  /**
   * Add a new phone number.
   * @param {object} data - Phone data without id, records, createdAt
   */
  const addPhone = useCallback((data) => {
    const now = getTodayStr();
    const newPhone = {
      ...data,
      id: generateId(),
      records: [],
      createdAt: now,
    };
    setPhones((prev) => [newPhone, ...prev]);
  }, []);

  /**
   * Update an existing phone number.
   * @param {string} id
   * @param {object} data - Updated fields
   */
  const updatePhone = useCallback((id, data) => {
    setPhones((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p)),
    );
  }, []);

  /**
   * Delete a phone number.
   * @param {string} id
   */
  const deletePhone = useCallback((id) => {
    setPhones((prev) => prev.filter((p) => p.id !== id));
  }, []);

  /**
   * Mark a phone as "kept alive" — update lastKeepDate and add record.
   * @param {string} id
   * @param {string} [method='手动保号']
   * @param {string} [note='']
   */
  const keepPhone = useCallback((id, method = '手动保号', note = '') => {
    const today = getTodayStr();
    const record = {
      id: generateId(),
      date: today,
      method,
      note,
    };
    setPhones((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              lastKeepDate: today,
              records: [...p.records, record],
            }
          : p,
      ),
    );
  }, []);

  /**
   * Get computed stats for all phones.
   */
  const getStats = useCallback(() => {
    let total = phones.length;
    let warning = 0;
    let expired = 0;

    for (const phone of phones) {
      const { status } = getPhoneStatus(phone);
      if (status === 'warning') warning++;
      if (status === 'expired') expired++;
    }

    return { total, warning, expired };
  }, [phones]);

  return {
    phones,
    addPhone,
    updatePhone,
    deletePhone,
    keepPhone,
    getStats,
  };
}
