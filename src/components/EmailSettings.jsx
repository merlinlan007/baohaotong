import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Box,
  Typography,
  Divider,
  CircularProgress,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Email as EmailIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const API_BASE = 'http://localhost:3003';

const SMTP_PRESETS = {
  'smtp.qq.com': { host: 'smtp.qq.com', port: 465, name: 'QQ邮箱' },
  'smtp.163.com': { host: 'smtp.163.com', port: 465, name: '163邮箱' },
  'smtp.126.com': { host: 'smtp.126.com', port: 465, name: '126邮箱' },
  'smtp.gmail.com': { host: 'smtp.gmail.com', port: 587, name: 'Gmail' },
};

/**
 * EmailSettings — dialog for configuring email reminder settings.
 */
export default function EmailSettings({ open, onClose }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load config from backend
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/config`);
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      setTestResult({ error: '无法连接邮件服务，请确保后端已启动' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) loadConfig();
  }, [open, loadConfig]);

  const updateField = (section, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setTestResult({ ok: true, message: '配置已保存' });
        setTimeout(() => setTestResult(null), 2000);
      }
    } catch (err) {
      setTestResult({ error: '保存失败：' + err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setTesting(true);
    setTestResult(null);
    await handleSave(); // save first
    try {
      const res = await fetch(`${API_BASE}/api/email/test`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ ok: true, message: '测试邮件发送成功！请查收收件箱。' });
      } else {
        setTestResult({ error: data.error || '发送失败' });
      }
    } catch (err) {
      setTestResult({ error: '请求失败：' + err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSmtpPreset = (presetKey) => {
    const preset = SMTP_PRESETS[presetKey];
    if (preset) {
      setConfig((prev) => ({
        ...prev,
        email: {
          ...prev.email,
          smtpHost: preset.host,
          smtpPort: preset.port,
          smtpSecure: preset.port === 465,
        },
      }));
    }
  };

  if (!config) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent sx={{ textAlign: 'center', py: 6 }}>
          <CircularProgress />
          <Typography sx={{ mt: 1 }}>加载配置中...</Typography>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
        <EmailIcon color="primary" />
        邮件提醒设置
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          {/* Enable toggle */}
          <FormControlLabel
            control={
              <Switch
                checked={config.email.enabled}
                onChange={(e) => updateField('email', 'enabled', e.target.checked)}
              />
            }
            label={<Typography fontWeight={600}>启用邮件提醒</Typography>}
          />

          {/* Recipient email */}
          <TextField
            label="接收提醒邮箱"
            type="email"
            value={config.email.to}
            onChange={(e) => updateField('email', 'to', e.target.value)}
            placeholder="youremail@qq.com"
            fullWidth
            helperText="系统将向此邮箱发送保号提醒"
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
            <SettingsIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
            SMTP 发件服务器
          </Typography>

          {/* SMTP preset */}
          <FormControl size="small" fullWidth>
            <InputLabel>快速配置</InputLabel>
            <Select
              value=""
              label="快速配置"
              onChange={(e) => handleSmtpPreset(e.target.value)}
              displayEmpty
            >
              <MenuItem value="" disabled>选择邮箱服务商</MenuItem>
              {Object.entries(SMTP_PRESETS).map(([key, preset]) => (
                <MenuItem key={key} value={key}>{preset.name}（{key}）</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="SMTP 服务器地址"
            value={config.email.smtpHost}
            onChange={(e) => updateField('email', 'smtpHost', e.target.value)}
            fullWidth
          />

          <TextField
            label="SMTP 端口"
            type="number"
            value={config.email.smtpPort}
            onChange={(e) => updateField('email', 'smtpPort', Number(e.target.value))}
            fullWidth
          />

          <TextField
            label="发件邮箱地址"
            type="email"
            value={config.email.smtpUser}
            onChange={(e) => updateField('email', 'smtpUser', e.target.value)}
            placeholder="your@qq.com"
            fullWidth
          />

          <TextField
            label="SMTP 授权码"
            type="password"
            value={config.email.smtpPass}
            onChange={(e) => updateField('email', 'smtpPass', e.target.value)}
            fullWidth
            helperText="不是邮箱密码，需要在邮箱设置中生成授权码"
          />

          <Divider />

          <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
            提醒时间
          </Typography>

          <TextField
            label="检查时间（逗号分隔，如 08:00,20:00）"
            value={(config.reminder.checkTimes || []).join(',')}
            onChange={(e) =>
              updateField(
                'reminder',
                'checkTimes',
                e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
              )
            }
            fullWidth
          />

          {/* Test Result */}
          {testResult && (
            <Alert severity={testResult.ok ? 'success' : 'error'} onClose={() => setTestResult(null)}>
              {testResult.message || testResult.error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button onClick={onClose} color="inherit">关闭</Button>
        <Button
          onClick={handleTestEmail}
          variant="outlined"
          startIcon={testing ? <CircularProgress size={16} /> : <SendIcon />}
          disabled={testing || loading}
          color="secondary"
        >
          发送测试邮件
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={loading}
        >
          保存配置
        </Button>
      </DialogActions>
    </Dialog>
  );
}
