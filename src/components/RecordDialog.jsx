import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import {
  CheckCircleOutline as KeepIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { formatDateCN } from '../utils/helpers';

/**
 * RecordDialog — displays operation history for a phone number in a timeline view.
 * Uses a custom CSS timeline instead of @mui/lab to avoid peer dependency conflicts.
 */
export default function RecordDialog({ open, phone, onClose }) {
  const records = phone?.records || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
        {phone?.phoneNumber} — 操作记录
      </DialogTitle>
      <DialogContent dividers>
        {records.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CalendarIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              暂无操作记录
            </Typography>
          </Box>
        ) : (
          <Box sx={{ position: 'relative', pl: 4 }}>
            {records.map((record, index) => {
              const isLatest = index === records.length - 1;
              return (
                <Box
                  key={record.id}
                  sx={{
                    position: 'relative',
                    pb: isLatest ? 0 : 3,
                  }}
                >
                  {/* Vertical connector line */}
                  {!isLatest && (
                    <Box
                      sx={{
                        position: 'absolute',
                        left: -28,
                        top: 32,
                        bottom: -4,
                        width: 2,
                        bgcolor: '#E5E7EB',
                      }}
                    />
                  )}

                  {/* Dot */}
                  <Box
                    sx={{
                      position: 'absolute',
                      left: -36,
                      top: 4,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      bgcolor: isLatest ? '#2563EB' : '#D1D5DB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <KeepIcon sx={{ fontSize: 12, color: '#fff' }} />
                  </Box>

                  {/* Content card */}
                  <Box
                    sx={{
                      bgcolor: '#F9FAFB',
                      borderRadius: 2,
                      p: 2,
                      border: '1px solid #E5E7EB',
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} color="#1F2937">
                        {record.method}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatDateCN(record.date)}
                      </Typography>
                    </Box>
                    {record.note && (
                      <Typography variant="body2" color="text.secondary">
                        {record.note}
                      </Typography>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>关闭</Button>
      </DialogActions>
    </Dialog>
  );
}
