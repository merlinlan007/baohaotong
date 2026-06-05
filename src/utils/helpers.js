/**
 * Utility helpers for the BaoHaoTong application.
 */

/** Status config: warn5=5-4天前提醒, warning=3-1天内, expired=已过期, normal=正常 */
const STATUS_CONFIG = {
  normal: { label: '正常', color: '#10B981', bg: '#ECFDF5' },
  warn5: { label: '即将到期(5天)', color: '#F59E0B', bg: '#FFFBEB' },
  warning: { label: '即将到期(3天)', color: '#F97316', bg: '#FFF7ED' },
  expired: { label: '已过期', color: '#EF4444', bg: '#FEE2E2' },
};

/**
 * Generate a simple unique ID.
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Get today's date string in YYYY-MM-DD format.
 */
export function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Compute phone status and remaining days.
 * @returns {{ status, remainingDays, nextKeepDate, config }}
 */
export function getPhoneStatus(phone) {
  const lastDate = new Date(phone.lastKeepDate + 'T00:00:00');
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + phone.cycleDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);

  let status;
  if (diffDays <= 0) status = 'expired';
  else if (diffDays <= 3) status = 'warning';
  else if (diffDays <= 5) status = 'warn5';
  else status = 'normal';

  return { status, remainingDays: diffDays, nextKeepDate: nextDate, config: STATUS_CONFIG[status] };
}

/**
 * Get carrier display color. Uses hash-based color for custom carriers.
 */
export function getCarrierColor(carrier) {
  const presets = {
    '中国移动': { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0' },
    '中国联通': { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
    '中国电信': { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    虚拟运营商: { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
  };
  if (presets[carrier]) return presets[carrier];

  // Hash-based color for custom carriers
  const colors = [
    { bg: '#F0FDF4', text: '#166534', border: '#BBF7D0' },
    { bg: '#EFF6FF', text: '#1E40AF', border: '#BFDBFE' },
    { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA' },
    { bg: '#F5F3FF', text: '#5B21B6', border: '#DDD6FE' },
    { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA' },
    { bg: '#FDF2F8', text: '#831843', border: '#FBCFE8' },
    { bg: '#ECFEFF', text: '#155E75', border: '#A5F3FC' },
    { bg: '#F3F4F6', text: '#374151', border: '#D1D5DB' },
  ];
  let hash = 0;
  for (let i = 0; i < carrier.length; i++) hash = carrier.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Validate phone number (international format, min 5 digits).
 */
export function validatePhoneNumber(num) {
  return /^\+?[\d\s\-()]{5,20}$/.test(num.trim());
}

/**
 * Format date to Chinese format.
 */
export function formatDateCN(dateStr) {
  if (!dateStr) return '—';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
}
