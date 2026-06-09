/**
 * 保号通 — 邮件提醒脚本
 * 仅在号码需保号前5天/前3天/已过期时发送提醒，全部正常则不发邮件
 */
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const PHONES_FILE = path.join(__dirname, '..', 'data', 'phones.json');

// 读取号码
let phones = [];
try {
  if (fs.existsSync(PHONES_FILE)) {
    phones = JSON.parse(fs.readFileSync(PHONES_FILE, 'utf-8'));
  }
} catch (e) {
  console.error('读取号码数据失败:', e.message);
  process.exit(1);
}

// 计算状态
function getPhoneStatus(phone) {
  const lastDate = new Date(phone.lastKeepDate + 'T00:00:00');
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + phone.cycleDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / 86400000);
  let status = 'normal';
  if (diffDays <= 0) status = 'expired';
  else if (diffDays <= 3) status = 'warning';
  else if (diffDays <= 5) status = 'warn5';
  return { status, remainingDays: diffDays };
}

const expired = [];
const warning = [];
const warn5 = [];
const normal = [];
for (const phone of phones) {
  const { status, remainingDays } = getPhoneStatus(phone);
  if (status === 'expired') expired.push({ ...phone, remainingDays });
  else if (status === 'warning') warning.push({ ...phone, remainingDays });
  else if (status === 'warn5') warn5.push({ ...phone, remainingDays });
  else normal.push({ ...phone, remainingDays });
}

// 全部正常 → 不打扰，不发邮件
if (expired.length === 0 && warning.length === 0 && warn5.length === 0) {
  console.log('所有号码状态正常，无需发送提醒。');
  process.exit(0);
}

// SMTP 配置
const smtpHost = process.env.SMTP_HOST;
const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const toEmail = process.env.TO_EMAIL;

if (!smtpHost || !smtpUser || !smtpPass || !toEmail) {
  console.error('SMTP 配置不完整，请检查 Secrets: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, TO_EMAIL');
  process.exit(1);
}

// 构建邮件
const now = new Date();
let html = `<h2 style="color:#1F2937;">保号通 — 保号提醒</h2>`;
html += `<p style="color:#6B7280;">检查时间：${now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>`;

if (expired.length > 0) {
  html += `<h3 style="color:#DC2626;">⚠ ${expired.length} 个已过期</h3><ul>`;
  for (const p of expired) {
    html += `<li><strong>${p.phoneNumber}</strong>（${p.carrier}）— 已过期 ${Math.abs(p.remainingDays)} 天</li>`;
  }
  html += `</ul>`;
}

if (warning.length > 0) {
  html += `<h3 style="color:#F97316;">⚡ ${warning.length} 个即将到期（3天内）</h3><ul>`;
  for (const p of warning) {
    html += `<li><strong>${p.phoneNumber}</strong>（${p.carrier}）— 剩余 ${p.remainingDays} 天</li>`;
  }
  html += `</ul>`;
}

if (warn5.length > 0) {
  html += `<h3 style="color:#F59E0B;">🔔 ${warn5.length} 个即将到期（5天内）</h3><ul>`;
  for (const p of warn5) {
    html += `<li><strong>${p.phoneNumber}</strong>（${p.carrier}）— 剩余 ${p.remainingDays} 天</li>`;
  }
  html += `</ul>`;
}

html += `<hr style="border-color:#E5E7EB;"><p style="color:#9CA3AF;font-size:12px;">此邮件由保号通自动发送 | GitHub Actions</p>`;

const subject = `保号通提醒 — ${expired.length}过期 ${warning.length}临期 ${warn5.length}预警`;

// 发送
const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: { user: smtpUser, pass: smtpPass },
});

console.log(`发件: ${smtpUser} → 收件: ${toEmail}`);
console.log(`号码总数: ${phones.length}, 过期: ${expired.length}, 3天内: ${warning.length}, 5天内: ${warn5.length}, 正常: ${normal.length}`);

transporter.sendMail({ from: smtpUser, to: toEmail, subject, html })
  .then((info) => {
    console.log('✅ 邮件发送成功:', info.messageId);
  })
  .catch((err) => {
    console.error('❌ 邮件发送失败:', err.message);
    process.exit(1);
  });
