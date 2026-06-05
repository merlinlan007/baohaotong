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
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Smartphone as SmartphoneIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import Dashboard from './components/Dashboard';
import PhoneForm from './components/PhoneForm';
import RecordDialog from './components/RecordDialog';
import ReminderBanner from './components/ReminderBanner';
import AuthPage from './components/AuthPage';
import usePhones from './hooks/usePhones';
import { clearToken, getStoredToken } from './github-api';

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
  // GitHub auth — just check if token exists
  const [user, setUser] = useState(() => {
    const token = getStoredToken();
    return token ? { login: 'github' } : null;
  });

  const { phones, loading: phonesLoading, addPhone, updatePhone, deletePhone, keepPhone, getStats } = usePhones(user);

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AuthPage onAuth={(u) => setUser(u)} />
      </ThemeProvider>
    );
  }

  return <MainApp {...{ user, phones, phonesLoading, addPhone, updatePhone, deletePhone, keepPhone, getStats, setUser }} />;
}

function MainApp({ user, phones, phonesLoading, addPhone, updatePhone, deletePhone, keepPhone, getStats, setUser }) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordPhone, setRecordPhone] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [keepTarget, setKeepTarget] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const showSnackbar = useCallback((message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const stats = useMemo(() => getStats(), [getStats]);

  const handleAdd = useCallback(() => { setEditingPhone(null); setFormOpen(true); }, []);
  const handleEdit = useCallback((phone) => { setEditingPhone(phone); setFormOpen(true); }, []);

  const handleFormSubmit = useCallback(async (data) => {
    if (editingPhone) { await updatePhone(editingPhone.id, data); showSnackbar('号码信息已更新'); }
    else { await addPhone(data); showSnackbar('号码添加成功'); }
    setFormOpen(false); setEditingPhone(null);
  }, [editingPhone, addPhone, updatePhone, showSnackbar]);

  const handleFormClose = useCallback(() => { setFormOpen(false); setEditingPhone(null); }, []);
  const handleDeleteRequest = useCallback((phone) => setDeleteTarget(phone), []);
  const handleDeleteConfirm = useCallback(async () => {
    if (deleteTarget) { await deletePhone(deleteTarget.id); showSnackbar('号码已删除'); }
    setDeleteTarget(null);
  }, [deleteTarget, deletePhone, showSnackbar]);

  const handleKeepRequest = useCallback((phone) => setKeepTarget(phone), []);
  const handleKeepConfirm = useCallback(async () => {
    if (keepTarget) { await keepPhone(keepTarget.id); showSnackbar(`已记录保号操作：${keepTarget.phoneNumber}`); }
    setKeepTarget(null);
  }, [keepTarget, keepPhone, showSnackbar]);

  const handleRecordsOpen = useCallback((phone) => { setRecordPhone(phone); setRecordOpen(true); }, []);
  const handleRecordsClose = useCallback(() => { setRecordOpen(false); setRecordPhone(null); }, []);

  const handleLogout = useCallback(() => {
    clearToken();
    setUser(null);
  }, [setUser]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const urgentPhones = phones.filter((p) => {
      const nextDate = new Date(p.lastKeepDate + 'T00:00:00');
      nextDate.setDate(nextDate.getDate() + p.cycleDays);
      const today = new Date(); today.setHours(0, 0, 0, 0);
      return Math.ceil((nextDate.getTime() - today.getTime()) / 86400000) <= 0;
    });
    if (urgentPhones.length > 0) {
      const msg = urgentPhones.length === 1
        ? `${urgentPhones[0].phoneNumber} 保号已过期！`
        : `有 ${urgentPhones.length} 个号码保号已过期！`;
      try { new Notification('保号通提醒', { body: msg }); } catch (_) {}
    }
  }, [phones]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: '#fff', borderBottom: '1px solid #E5E7EB' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ px: { xs: 1, sm: 0 } }}>
            <SmartphoneIcon sx={{ color: '#2563EB', mr: 1 }} />
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700, color: '#1F2937', fontSize: { xs: '1rem', sm: '1.25rem' } }}>保号通</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>{user?.login}</Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: { xs: 2, sm: 3 } }}>添加号码</Button>
            <IconButton onClick={handleLogout} sx={{ ml: 1, color: '#EF4444' }} title="退出登录"><LogoutIcon /></IconButton>
          </Toolbar>
        </Container>
      </AppBar>

      <ReminderBanner phones={phones} />

      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 } }}>
        {phonesLoading ? (
          <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress /><Typography sx={{ mt: 1 }} color="text.secondary">加载中...</Typography></Box>
        ) : (
          <Dashboard phones={phones} stats={stats} onEdit={handleEdit} onDelete={handleDeleteRequest} onKeep={handleKeepRequest} onRecords={handleRecordsOpen} />
        )}
      </Container>

      <PhoneForm open={formOpen} phone={editingPhone} onSubmit={handleFormSubmit} onClose={handleFormClose} />
      <RecordDialog open={recordOpen} phone={recordPhone} onClose={handleRecordsClose} />

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>确认删除</DialogTitle>
        <DialogContent><DialogContentText>确定要删除号码 <strong>{deleteTarget?.phoneNumber}</strong> 吗？</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setDeleteTarget(null)}>取消</Button><Button onClick={handleDeleteConfirm} variant="contained" color="error">确认删除</Button></DialogActions>
      </Dialog>

      <Dialog open={!!keepTarget} onClose={() => setKeepTarget(null)}>
        <DialogTitle>确认保号</DialogTitle>
        <DialogContent><DialogContentText>确认已完成号码 <strong>{keepTarget?.phoneNumber}</strong> 的保号操作？<br />操作后将更新上次保号日期为今天。</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={() => setKeepTarget(null)}>取消</Button><Button onClick={handleKeepConfirm} variant="contained" color="primary">确认完成</Button></DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} variant="filled" sx={{ borderRadius: 2 }}>{snackbar.message}</Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
