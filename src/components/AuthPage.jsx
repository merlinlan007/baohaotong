import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
} from '@mui/material';
import { Key as KeyIcon } from '@mui/icons-material';
import { verifyToken, setToken } from '../github-api';

export default function AuthPage({ onAuth }) {
  const [token, setTokenValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    if (!token.trim()) {
      setError('请输入 GitHub Token');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyToken(token.trim());
      setToken(token.trim()); // 保存到 localStorage
      onAuth(user);
    } catch (err) {
      setError(err.message || '验证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#F5F7FA',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 3, boxShadow: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h5" fontWeight={700} color="#1F2937" gutterBottom>
              保号通
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              使用 GitHub 账号验证身份
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="GitHub Personal Access Token"
              type="password"
              value={token}
              onChange={(e) => setTokenValue(e.target.value)}
              InputProps={{ startAdornment: <KeyIcon sx={{ mr: 1, color: '#9CA3AF' }} /> }}
              fullWidth
              placeholder="ghp_xxxxxxxxxxxx"
              helperText={
                <span>
                  需要 <strong>repo</strong> 权限。
                  <Link href="https://github.com/settings/tokens/new?scopes=repo&description=baohatong" target="_blank" underline="hover">
                    点此创建 Token
                  </Link>
                </span>
              }
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              size="large"
              sx={{ mt: 1, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              {loading ? '验证中...' : '登录'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
