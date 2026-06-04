/**
 * 保号通 — 独立邮件检查脚本
 * 由 GitHub Actions 定时调用，不依赖 Express 后端
 *
 * 环境变量（从 GitHub Secrets 注入）:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TO_EMAIL
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// --- 读取号码数据 ---
const PHONES_FILE = path.join(__dirname, '..', 'server', 'data', 'phones.json');

let phones = [];
try {
  if (fs.existsSync(PHONES_FILE)) {
    phones = JSON.parse(fs.readFileSync(PHONES_FILE, 'utf-8'));
  }
} catch (e) {
  console.error('读取号码数据失败:', e.message);
  process.exit(1);
}

if (!Array.isArray(phones) || phones.length === 0) {
  console.log('暂无号码数据，跳过检查。');
  process.exit(0);
}

// --- 计算状态 ---
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

const expired = [];
const warning = [];
for (const phone of phones) {
  const { status, remainingDays } = getPhoneStatus(phone);
  if (status === 'expired') expired.push({ ...phone, remainingDays });
  if (status === 'warning') warning.push({ ...phone, remainingDays });
}

if (expired.length === 0 && warning.length === 0) {
  console.log('所有号码状态正常，无需发送提醒。');
  process.exit(0);
}

// --- 读取 SMTP 配置 ---
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const toEmail = process.env.TO_EMAIL;

if (!smtpHost || !smtpUser || !smtpPass || !toEmail) {
  console.error('SMTP 配置不完整，请检查 GitHub Secrets。');
  console.error('需要: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TO_EMAIL');
  process.exit(1);
}

// --- 发送邮件 ---
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass },
});

const now = new Date();
let html = `<h2 style="color:#1F2937;">保号通 — 保号提醒</h2>`;
html += `<p style="color:#6B7280;">检查时间：${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>`;

if (expired.length > 0) {
  html += `<h3 style="color:#DC2626;">${expired.length} 个号码已过期</h3><ul>`;
  for (const p of expired) {
    html += `<li><strong>${p.phoneNumber}</strong>（${p.carrier}）— 已过期 ${Math.abs(p.remainingDays)} 天，周期 ${p.cycleDays} 天</li>`;
  }
  html += `</ul>`;
}

if (warning.length > 0) {
  html += `<h3 style="color:#F59E0B;">${warning.length} 个号码即将到期</h3><ul>`;
  for (const p of warning) {
    html += `<li><strong>${p.phoneNumber}</strong>（${p.carrier}）— 剩余 ${p.remainingDays} 天，周期 ${p.cycleDays} 天</li>`;
  }
  html += `</ul>`;
}

html += `<p style="color:#9CA3AF;font-size:12px;">此邮件由保号通系统自动发送 | GitHub Actions</p>`;

transporter.sendMail({
  from: smtpUser,
  to: toEmail,
  subject: `保号通提醒 — ${expired.length}个过期 ${warning.length}个即将到期`,
  html,
})
  .then((info) => {
    console.log('邮件发送成功:', info.messageId);
  })
  .catch((err) => {
    console.error('邮件发送失败:', err.message);
    process.exit(1);
  });
