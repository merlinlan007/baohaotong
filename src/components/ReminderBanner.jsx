import React, { useMemo } from 'react';
import { Alert, AlertTitle, Box, Typography, Collapse } from '@mui/material';
import { Warning as WarningIcon, ErrorOutline as ErrorIcon, NotificationsActive as Alert5Icon } from '@mui/icons-material';
import { getPhoneStatus } from '../utils/helpers';

export default function ReminderBanner({ phones }) {
  const { warn5, warning, expired } = useMemo(() => {
    const w5 = [], warn = [], exp = [];
    for (const phone of phones) {
      const { status } = getPhoneStatus(phone);
      if (status === 'warn5') w5.push(phone);
      else if (status === 'warning') warn.push(phone);
      else if (status === 'expired') exp.push(phone);
    }
    return { warn5: w5, warning: warn, expired: exp };
  }, [phones]);

  if (!warn5.length && !warning.length && !expired.length) return null;

  return (
    <Box sx={{ px: { xs: 1, sm: 2 }, pt: 2 }}>
      {/* Expired */}
      <Collapse in={expired.length > 0}>
        <Alert severity="error" icon={<ErrorIcon />} sx={{ borderRadius: 2, mb: 1.5, '& .MuiAlert-message': { width: '100%' } }}>
          <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>{expired.length} 个号码已过期</AlertTitle>
          <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {expired.map((p) => (
              <Typography key={p.id} component="span" variant="body2" sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.3)', px: 1, py: 0.25, borderRadius: 1 }}>{p.phoneNumber}</Typography>
            ))}
          </Box>
        </Alert>
      </Collapse>

      {/* 3-day warning */}
      <Collapse in={warning.length > 0}>
        <Alert severity="warning" icon={<WarningIcon />} sx={{ borderRadius: 2, mb: 1.5, '& .MuiAlert-message': { width: '100%' } }}>
          <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>{warning.length} 个号码3天内到期</AlertTitle>
          <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {warning.map((p) => (
              <Typography key={p.id} component="span" variant="body2" sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.4)', px: 1, py: 0.25, borderRadius: 1 }}>{p.phoneNumber}</Typography>
            ))}
          </Box>
        </Alert>
      </Collapse>

      {/* 5-day warning */}
      <Collapse in={warn5.length > 0}>
        <Alert severity="info" icon={<Alert5Icon />} sx={{ borderRadius: 2, '& .MuiAlert-message': { width: '100%' } }}>
          <AlertTitle sx={{ fontWeight: 700, mb: 0.5 }}>{warn5.length} 个号码5天内到期</AlertTitle>
          <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {warn5.map((p) => (
              <Typography key={p.id} component="span" variant="body2" sx={{ fontWeight: 600, bgcolor: 'rgba(255,255,255,0.4)', px: 1, py: 0.25, borderRadius: 1 }}>{p.phoneNumber}</Typography>
            ))}
          </Box>
        </Alert>
      </Collapse>
    </Box>
  );
}
