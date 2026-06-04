/**
 * Utility helpers for the BaoHaoTong application.
 */

/** All supported carrier options */
export const CARRIER_OPTIONS = [
  '中国移动',
  '中国联通',
  '中国电信',
  '虚拟运营商',
  '其他',
];

/** Carrier color mapping */
const CARRIER_COLORS = {
  中国移动: { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
  中国联通: { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
  中国电信: { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
  虚拟运营商: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
  其他: { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
};

/** Status config mapping */
const STATUS_CONFIG = {
  normal: { label: '正常', color: '#10B981', bg: '#ECFDF5' },
  warning: { label: '即将到期', color: '#F59E0B', bg: '#FEF3C7' },
  expired: { label: '已过期', color: '#EF4444', bg: '#FEE2E2' },
};

/**
 * Generate a simple unique ID.
 * @returns {string}
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Get today's date string in YYYY-MM-DD format.
 * @returns {string}
 */
export function getTodayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Compute phone status, remaining days, and next keep date.
 * @param {object} phone
 * @returns {{ status: string, remainingDays: number, nextKeepDate: Date, config: object }}
 */
export function getPhoneStatus(phone) {
  const { lastKeepDate, cycleDays } = phone;
  const lastDate = new Date(lastKeepDate + 'T00:00:00');
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + cycleDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let status;
  if (diffDays <= 0) {
    status = 'expired';
  } else if (diffDays <= 3) {
    status = 'warning';
  } else {
    status = 'normal';
  }

  return {
    status,
    remainingDays: diffDays,
    nextKeepDate: nextDate,
    config: STATUS_CONFIG[status],
  };
}

/**
 * Get the carrier display color configuration.
 * @param {string} carrier
 * @returns {{ bg: string, text: string, border: string }}
 */
export function getCarrierColor(carrier) {
  return CARRIER_COLORS[carrier] || CARRIER_COLORS['其他'];
}

/**
 * Validate a Chinese mobile phone number (11 digits, starting with 1).
 * @param {string} num
 * @returns {boolean}
 */
export function validatePhoneNumber(num) {
  return /^1\d{10}$/.test(num);
}

/**
 * Format a date string (YYYY-MM-DD) to Chinese date format.
 * @param {string} dateStr
 * @returns {string}
 */
export function formatDateCN(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
}
