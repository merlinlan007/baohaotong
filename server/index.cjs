const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3003;

app.use(cors());
app.use(express.json());

// --- File paths ---
const DATA_DIR = path.join(__dirname, 'data');
const PHONES_FILE = path.join(DATA_DIR, 'phones.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');

// Ensure data dir exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// --- Default config ---
const DEFAULT_CONFIG = {
  email: {
    enabled: false,
    to: '',            // 接收提醒的邮箱
    from: '',          // 发件邮箱
    smtpHost: 'smtp.qq.com',
    smtpPort: 465,
    smtpSecure: true,
    smtpUser: '',      // SMTP 用户名（通常是发件邮箱）
    smtpPass: '',      // SMTP 授权码
  },
  reminder: {
    checkTimes: ['08:00', '20:00'],  // 检查时间
    warnDaysBefore: 3,               // 提前几天提醒
  },
};

// --- Helpers ---
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8')) };
    }
  } catch (e) {
    console.error('Failed to load config:', e.message);
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

function loadPhones() {
  try {
    if (fs.existsSync(PHONES_FILE)) {
      return JSON.parse(fs.readFileSync(PHONES_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error('Failed to load phones:', e.message);
  }
  return [];
}

function savePhones(phones) {
  fs.writeFileSync(PHONES_FILE, JSON.stringify(phones, null, 2), 'utf-8');
}

/**
 * Calculate phone status and remaining days.
 * Mirror of frontend helpers.js logic.
 */
function getPhoneStatus(phone) {
  const lastDate = new Date(phone.lastKeepDate + 'T00:00:00');
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + phone.cycleDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  let status = 'normal';
  if (diffDays <= 0) status = 'expired';
  else if (diffDays <= 3) status = 'warning';
  return { status, remainingDays: diffDays };
}

/**
 * Create nodemailer transporter from config.
 */
function createTransporter(config) {
  const email = config.email || {};
  if (!email.smtpHost || !email.smtpUser || !email.smtpPass) return null;
  return nodemailer.createTransport({
    host: email.smtpHost,
    port: email.smtpPort || 465,
    secure: email.smtpSecure !== false,
    auth: { user: email.smtpUser, pass: email.smtpPass },
  });
}

/**
 * Send a reminder email.
 */
async function sendReminderEmail(config, phones) {
  const transporter = createTransporter(config);
  if (!transporter) {
    console.log('[Mail] No SMTP config, skipping email.');
    return { sent: false, error: '未配置SMTP' };
  }

  const to = config.email.to;
  if (!to) {
    console.log('[Mail] No recipient email, skipping.');
    return { sent: false, error: '未设置接收邮箱' };
  }

  const now = new Date();
  const expiredPhones = [];
  const warningPhones = [];

  for (const phone of phones) {
    const { status, remainingDays } = getPhoneStatus(phone);
    if (status === 'expired') expiredPhones.push({ ...phone, remainingDays });
    if (status === 'warning') warningPhones.push({ ...phone, remainingDays });
  }

  if (expiredPhones.length === 0 && warningPhones.length === 0) {
    return { sent: false, info: '所有号码状态正常，无需提醒' };
  }

  // Build email content
  let html = `<h2 style="color:#1F2937;">保号通 — 保号提醒</h2>`;
  html += `<p style="color:#6B7280;">检查时间：${now.toLocaleString('zh-CN')}</p>`;

  if (expiredPhones.length > 0) {
    html += `<h3 style="color:#DC2626;">${expiredPhones.length} 个号码已过期</h3><ul>`;
    for (const p of expiredPhones) {
      html += `<li><strong>${p.phoneNumber}</strong>（${p.carrier}）— 已过期 ${Math.abs(p.remainingDays)} 天，周期 ${p.cycleDays} 天</li>`;
    }
    html += `</ul>`;
  }

  if (warningPhones.length > 0) {
    html += `<h3 style="color:#F59E0B;">${warningPhones.length} 个号码即将到期</h3><ul>`;
    for (const p of warningPhones) {
      html += `<li><strong>${p.phoneNumber}</strong>（${p.carrier}）— 剩余 ${p.remainingDays} 天，周期 ${p.cycleDays} 天</li>`;
    }
    html += `</ul>`;
  }

  html += `<p style="color:#9CA3AF;font-size:12px;">此邮件由保号通系统自动发送。</p>`;

  const mailOptions = {
    from: config.email.from || config.email.smtpUser,
    to,
    subject: `保号通提醒 — ${expiredPhones.length}个过期 ${warningPhones.length}个即将到期`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Mail] Sent:', info.messageId);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error('[Mail] Failed:', err.message);
    return { sent: false, error: err.message };
  }
}

// --- API Routes ---

// Sync phones data from frontend
app.post('/api/sync', (req, res) => {
  const { phones } = req.body;
  if (!Array.isArray(phones)) {
    return res.status(400).json({ error: 'Invalid phones data' });
  }
  savePhones(phones);
  res.json({ ok: true, count: phones.length });
});

// Get cached phones
app.get('/api/phones', (_req, res) => {
  res.json(loadPhones());
});

// Get email config
app.get('/api/config', (_req, res) => {
  res.json(loadConfig());
});

// Update email config
app.post('/api/config', (req, res) => {
  const current = loadConfig();
  const newConfig = { ...current, ...req.body };
  saveConfig(newConfig);
  res.json({ ok: true });
});

// Send test email
app.post('/api/email/test', async (req, res) => {
  const config = loadConfig();
  const transporter = createTransporter(config);

  if (!transporter) {
    return res.status(400).json({ error: 'SMTP 未配置，请先设置邮件服务器信息' });
  }
  if (!config.email.to) {
    return res.status(400).json({ error: '未设置接收邮箱' });
  }

  try {
    const info = await transporter.sendMail({
      from: config.email.from || config.email.smtpUser,
      to: config.email.to,
      subject: '保号通 — 测试邮件',
      html: `<h2>保号通邮件提醒测试</h2><p>恭喜！邮件发送功能配置成功。</p><p style="color:#9CA3AF;">此邮件由保号通系统自动发送。</p>`,
    });
    res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    res.status(500).json({ error: '邮件发送失败：' + err.message });
  }
});

// Manual trigger: check and send reminders
app.post('/api/remind/now', async (req, res) => {
  const config = loadConfig();
  const phones = loadPhones();

  if (phones.length === 0) {
    return res.json({ ok: true, info: '暂无号码数据' });
  }

  const result = await sendReminderEmail(config, phones);
  res.json(result);
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// --- Scheduled Tasks ---
const config = loadConfig();

// Set up cron jobs for configured check times
(config.reminder.checkTimes || ['08:00', '20:00']).forEach((timeStr) => {
  const [hour, minute] = timeStr.split(':').map(Number);
  const cronExpr = `${minute} ${hour} * * *`;

  cron.schedule(cronExpr, async () => {
    console.log(`[Cron] Running check at ${timeStr}`);
    const cfg = loadConfig();
    const phones = loadPhones();

    if (!cfg.email.enabled) {
      console.log('[Cron] Email reminders disabled, skipping.');
      return;
    }

    if (phones.length === 0) {
      console.log('[Cron] No phones data, skipping.');
      return;
    }

    const result = await sendReminderEmail(cfg, phones);
    console.log('[Cron] Result:', result);
  }, { timezone: 'Asia/Shanghai' });

  console.log(`[Cron] Scheduled: every day at ${timeStr} (Asia/Shanghai)`);
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`保号通邮件服务已启动: http://localhost:${PORT}`);
  console.log(`API 端点: POST /api/sync | POST /api/email/test | POST /api/remind/now`);
});
