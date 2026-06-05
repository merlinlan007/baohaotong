import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  CheckCircleOutline as KeepIcon,
  History as HistoryIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { getPhoneStatus, getCarrierColor, formatDateCN } from '../utils/helpers';

/**
 * PhoneCard component — displays a single phone number's info and actions.
 */
export default function PhoneCard({ phone, onEdit, onDelete, onKeep, onRecords }) {
  const { status, remainingDays, nextKeepDate, config } = getPhoneStatus(phone);
  const carrierColor = getCarrierColor(phone.carrier);

  // Compute display text for remaining days
  const remainingText =
    status === 'expired'
      ? `已过期 ${Math.abs(remainingDays)} 天`
      : status === 'warning'
      ? `紧急！剩余 ${remainingDays} 天`
      : status === 'warn5'
      ? `注意：剩余 ${remainingDays} 天`
      : `剩余 ${remainingDays} 天`;

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          transform: 'translateY(-2px)',
        },
        borderLeft: `4px solid ${config.color}`,
      }}
    >
      <CardContent sx={{ flex: 1, pb: 1 }}>
        {/* Phone Number */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
          <Typography variant="h6" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
            {phone.phoneNumber}
          </Typography>
        </Box>

        {/* Tags: Carrier + Status */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={phone.carrier}
            size="small"
            sx={{
              bgcolor: carrierColor.bg,
              color: carrierColor.text,
              border: `1px solid ${carrierColor.border}`,
              fontWeight: 500,
            }}
          />
          <Chip
            label={config.label}
            size="small"
            sx={{
              bgcolor: config.bg,
              color: config.color,
              fontWeight: 600,
            }}
          />
        </Box>

        {/* Cycle & Dates */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5,
            color: 'text.secondary',
            fontSize: '0.875rem',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <TimeIcon fontSize="inherit" />
            <Typography variant="body2" component="span">
              保号周期：{phone.cycleDays} 天
            </Typography>
          </Box>
          <Typography variant="body2">
            上次保号：{formatDateCN(phone.lastKeepDate)}
          </Typography>
          <Typography variant="body2">
            下次保号：{formatDateCN(
              `${nextKeepDate.getFullYear()}-${String(nextKeepDate.getMonth() + 1).padStart(2, '0')}-${String(nextKeepDate.getDate()).padStart(2, '0')}`
            )}
          </Typography>
        </Box>

        {/* Remaining Days Highlight */}
        <Box
          sx={{
            mt: 2,
            py: 1,
            px: 2,
            borderRadius: 2,
            bgcolor: config.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="body2"
            fontWeight={700}
            sx={{ color: config.color }}
          >
            {remainingText}
          </Typography>
        </Box>

        {/* Note */}
        {phone.note && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 1.5, fontStyle: 'italic' }}
          >
            备注：{phone.note}
          </Typography>
        )}
      </CardContent>

      <Divider />

      {/* Action Buttons */}
      <CardActions sx={{ justifyContent: 'space-around', px: 1, py: 0.5 }}>
        <Tooltip title="完成保号">
          <IconButton
            size="small"
            onClick={() => onKeep(phone)}
            sx={{ color: '#10B981', '&:hover': { bgcolor: '#ECFDF5' } }}
          >
            <KeepIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="操作记录">
          <IconButton
            size="small"
            onClick={() => onRecords(phone)}
            sx={{ color: '#6366F1', '&:hover': { bgcolor: '#EEF2FF' } }}
          >
            <HistoryIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="编辑">
          <IconButton
            size="small"
            onClick={() => onEdit(phone)}
            sx={{ color: '#2563EB', '&:hover': { bgcolor: '#EFF6FF' } }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="删除">
          <IconButton
            size="small"
            onClick={() => onDelete(phone)}
            sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
