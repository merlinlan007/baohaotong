import React, { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  Select,
  MenuItem,
  Typography,
  Chip,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import {
  Search as SearchIcon,
  Smartphone as SmartphoneIcon,
  Warning as WarningIcon,
  ErrorOutline as ErrorOutlineIcon,
  FilterList as FilterListIcon,
} from '@mui/icons-material';
import PhoneCard from './PhoneCard';
import { CARRIER_OPTIONS } from '../utils/helpers';

/**
 * Dashboard component — stats bar, search/filter, and phone card grid.
 */
export default function Dashboard({
  phones,
  stats,
  onEdit,
  onDelete,
  onKeep,
  onRecords,
}) {
  const [search, setSearch] = useState('');
  const [carrierFilter, setCarrierFilter] = useState('all');

  // Filter phones by search query and carrier
  const filteredPhones = useMemo(() => {
    return phones.filter((phone) => {
      const matchSearch = phone.phoneNumber.includes(search);
      const matchCarrier =
        carrierFilter === 'all' || phone.carrier === carrierFilter;
      return matchSearch && matchCarrier;
    });
  }, [phones, search, carrierFilter]);

  return (
    <Box>
      {/* --- Stats Bar --- */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #E5E7EB', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <SmartphoneIcon sx={{ color: '#2563EB' }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">总号码数</Typography>
                <Typography variant="h5" fontWeight={700}>{stats.total}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #FDE68A', borderRadius: 3, bgcolor: '#FFFBEB' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#FEF3C7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <WarningIcon sx={{ color: '#F59E0B' }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">即将到期</Typography>
                <Typography variant="h5" fontWeight={700} color="#D97706">{stats.warning}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={6} sm={4}>
          <Paper elevation={0} sx={{ p: 2.5, border: '1px solid #FECACA', borderRadius: 3, bgcolor: '#FEF2F2' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 2,
                  bgcolor: '#FEE2E2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ErrorOutlineIcon sx={{ color: '#EF4444' }} />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">已过期</Typography>
                <Typography variant="h5" fontWeight={700} color="#DC2626">{stats.expired}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* --- Search & Filter --- */}
      <Paper elevation={0} sx={{ p: 2, mb: 3, border: '1px solid #E5E7EB', borderRadius: 3 }}>
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
          }}
        >
          <TextField
            size="small"
            placeholder="搜索手机号码..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 0, width: { xs: '100%', sm: 'auto' } }}
          />
          <FormControl size="small" sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}>
            <Select
              value={carrierFilter}
              onChange={(e) => setCarrierFilter(e.target.value)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
            >
              <MenuItem value="all">全部运营商</MenuItem>
              {CARRIER_OPTIONS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* --- Phone Cards Grid --- */}
      {filteredPhones.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            border: '1px dashed #D1D5DB',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <SmartphoneIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 1 }} />
          <Typography variant="body1" color="text.secondary">
            {phones.length === 0 ? '暂无号码，点击上方按钮添加' : '没有匹配的号码'}
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredPhones.map((phone) => (
            <Grid item xs={12} sm={6} md={4} key={phone.id}>
              <PhoneCard
                phone={phone}
                onEdit={onEdit}
                onDelete={onDelete}
                onKeep={onKeep}
                onRecords={onRecords}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
