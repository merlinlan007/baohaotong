import React, { useMemo } from 'react';
import { Alert, AlertTitle, Box, Typography, Collapse } from '@mui/material';
import { Warning as WarningIcon, ErrorOutline as ErrorIcon } from '@mui/icons-material';
import { getPhoneStatus } from '../utils/helpers';

/**
 * ReminderBanner — displays a warning alert when phone numbers are expiring or expired.
 */
export default function ReminderBanner({ phones }) {
  // Group phones by expiry status
  const { warningPhones, expiredPhones } = useMemo(() => {
    const warning = [];
    const expired = [];
    for (const phone of phones) {
      const { status } = getPhoneStatus(phone);
      if (status === 'warning') warning.push(phone);
      if (status === 'expired') expired.push(phone);
    }
    return { warningPhones: warning, expiredPhones: expired };
  }, [phones]);

  if (warningPhones.length === 0 && expiredPhones.length === 0) {
    return null;
  }

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, pt: 2 }}>
      {/* Expired banner — highest priority, always shown */}
      <Collapse in={expiredPhones.length > 0}>
        <Alert
          severity="error"
          icon={<ErrorIcon />}
          sx={{
            borderRadius: 2,
            mb: warningPhones.length > 0 ? 1.5 : 0,
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>
            {expiredPhones.length} 个号码保号已过期
          </AlertTitle>
          <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {expiredPhones.map((p) => (
              <Typography
                key={p.id}
                component="span"
                variant="body2"
                sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.3)', px: 1, py: 0.25, borderRadius: 1 }}
              >
                {p.phoneNumber}
              </Typography>
            ))}
          </Box>
        </Alert>
      </Collapse>

      {/* Warning banner */}
      <Collapse in={warningPhones.length > 0}>
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{
            borderRadius: 2,
            '& .MuiAlert-message': { width: '100%' },
          }}
        >
          <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>
            {warningPhones.length} 个号码即将到期（3天内）
          </AlertTitle>
          <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {warningPhones.map((p) => (
              <Typography
                key={p.id}
                component="span"
                variant="body2"
                sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.4)', px: 1, py: 0.25, borderRadius: 1 }}
              >
                {p.phoneNumber}
              </Typography>
            ))}
          </Box>
        </Alert>
      </Collapse>
    </Box>
  );
}
