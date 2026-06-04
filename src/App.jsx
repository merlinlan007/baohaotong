import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Container,
  Typography,
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Smartphone as SmartphoneIcon,
  Email as EmailIcon,
} from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import PhoneForm from './components/PhoneForm';
import RecordDialog from './components/RecordDialog';
import ReminderBanner from './components/ReminderBanner';
import EmailSettings from './components/EmailSettings';
import usePhones from './hooks/usePhones';

const API_BASE = 'http://localhost:3003';

const theme = createTheme({
  palette: {
    primary: { main: '#2563EB' },
    background: { default: '#F5F7FA' },
  },
  typography: {
    fontFamily: '"Roboto", "PingFang SC", "Microsoft YaHei", sans-serif',
  },
  shape: { borderRadius: 12 },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        },
      },
    },
  },
});

export default function App() {
  const { phones, addPhone, updatePhone, deletePhone, keepPhone, getStats } = usePhones();

  // Form dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);

  // Record-dialog state
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordPhone, setRecordPhone] = useState(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Keep alive dialog state
  const [keepTarget, setKeepTarget] = useState(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Email settings dialog state
  const [emailSettingsOpen, setEmailSettingsOpen] = useState(false);

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  // Stats (recalculated on phones change)
  const stats = useMemo(() => getStats(), [getStats]);

  // --- Handlers ---

  const handleAdd = useCallback(() => {
    setEditingPhone(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((phone) => {
    setEditingPhone(phone);
    setFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(
    (data) => {
      if (editingPhone) {
        updatePhone(editingPhone.id, data);
        showSnackbar('号码信息已更新');
      } else {
        addPhone(data);
        showSnackbar('号码添加成功');
      }
      setFormOpen(false);
      setEditingPhone(null);
    },
    [editingPhone, addPhone, updatePhone, showSnackbar],
  );

  const handleFormClose = useCallback(() => {
    setFormOpen(false);
    setEditingPhone(null);
  }, []);

  const handleDeleteRequest = useCallback((phone) => {
    setDeleteTarget(phone);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      deletePhone(deleteTarget.id);
      showSnackbar('号码已删除');
    }
    setDeleteTarget(null);
  }, [deleteTarget, deletePhone, showSnackbar]);

  const handleKeepRequest = useCallback((phone) => {
    setKeepTarget(phone);
  }, []);

  const handleKeepConfirm = useCallback(() => {
    if (keepTarget) {
      keepPhone(keepTarget.id);
      showSnackbar(`已记录保号操作：${keepTarget.phoneNumber}`);
    }
    setKeepTarget(null);
  }, [keepTarget, keepPhone, showSnackbar]);

  const handleRecordsOpen = useCallback((phone) => {
    setRecordPhone(phone);
    setRecordOpen(true);
  }, []);

  const handleRecordsClose = useCallback(() => {
    setRecordOpen(false);
    setRecordPhone(null);
  }, []);

  // Browser Notification permission request
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Sync phone data to backend for email reminders
  useEffect(() => {
    if (phones.length === 0) return;
    fetch(`${API_BASE}/api/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phones }),
    }).catch(() => {
      // Backend might not be running — that's OK for frontend-only usage
    });
  }, [phones]);

  // Send browser notifications for expired phones
  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // Find expired phones using inline calculation
    const urgentPhones = phones.filter((p) => {
      const nextDate = new Date(p.lastKeepDate + 'T00:00:00');
      nextDate.setDate(nextDate.getDate() + p.cycleDays);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diff = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diff <= 0;
    });

    if (urgentPhones.length > 0) {
      const msg = urgentPhones.length === 1
        ? `${urgentPhones[0].phoneNumber} 保号已过期，请及时处理！`
        : `有 ${urgentPhones.length} 个号码保号已过期，请及时处理！`;
      try {
        // eslint-disable-next-line no-new
        new Notification('保号通提醒', { body: msg });
      } catch (_) { /* ignore notification errors */ }
    }
  }, [phones]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      {/* App Bar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ px: { xs: 1, sm: 0 } }}>
            <SmartphoneIcon sx={{ color: '#2563EB', mr: 1 }} />
            <Typography
              variant="h6"
              sx={{
                flexGrow: 1,
                fontWeight: 700,
                color: '#1F2937',
                fontSize: { xs: '1rem', sm: '1.25rem' },
              }}
            >
              保号通
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleAdd}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                px: { xs: 2, sm: 3 },
              }}
            >
              添加号码
            </Button>
            <IconButton
              onClick={() => setEmailSettingsOpen(true)}
              sx={{ ml: 1, color: '#6B7280' }}
              title="邮件提醒设置"
            >
              <EmailIcon />
            </IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Reminder Banner */}
      <ReminderBanner phones={phones} />

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        <Dashboard
          phones={phones}
          stats={stats}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
          onKeep={handleKeepRequest}
          onRecords={handleRecordsOpen}
        />
      </Container>

      {/* Add / Edit Form Dialog */}
      <PhoneForm
        open={formOpen}
        phone={editingPhone}
        onSubmit={handleFormSubmit}
        onClose={handleFormClose}
      />

      {/* Operation Records Dialog */}
      <RecordDialog
        open={recordOpen}
        phone={recordPhone}
        onClose={handleRecordsClose}
      />

      {/* Email Settings Dialog */}
      <EmailSettings
        open={emailSettingsOpen}
        onClose={() => setEmailSettingsOpen(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确定要删除号码 <strong>{deleteTarget?.phoneNumber}</strong> 吗？此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)}>取消</Button>
          <Button onClick={handleDeleteConfirm} variant="contained" color="error">
            确认删除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Keep-Alive Confirmation Dialog */}
      <Dialog open={!!keepTarget} onClose={() => setKeepTarget(null)}>
        <DialogTitle>确认保号</DialogTitle>
        <DialogContent>
          <DialogContentText>
            确认已完成号码 <strong>{keepTarget?.phoneNumber}</strong> 的保号操作？
            <br />
            操作后将更新上次保号日期为今天。
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setKeepTarget(null)}>取消</Button>
          <Button onClick={handleKeepConfirm} variant="contained" color="primary">
            确认完成
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          variant="filled"
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
