import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
} from '@mui/material';
import { CARRIER_OPTIONS, validatePhoneNumber, getTodayStr } from '../utils/helpers';

/** Default form values */
const DEFAULT_VALUES = {
  phoneNumber: '',
  carrier: '中国移动',
  cycleDays: 30,
  lastKeepDate: getTodayStr(),
  note: '',
};

/**
 * Phone form dialog for adding / editing phone numbers.
 */
export default function PhoneForm({ open, phone, onSubmit, onClose }) {
  const isEdit = Boolean(phone);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [errors, setErrors] = useState({});

  // Reset form when dialog opens or phone changes
  useEffect(() => {
    if (open) {
      if (phone) {
        setValues({
          phoneNumber: phone.phoneNumber,
          carrier: phone.carrier,
          cycleDays: phone.cycleDays,
          lastKeepDate: phone.lastKeepDate,
          note: phone.note || '',
        });
      } else {
        setValues({ ...DEFAULT_VALUES, lastKeepDate: getTodayStr() });
      }
      setErrors({});
    }
  }, [open, phone]);

  /** Update a single field value */
  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setValues((v) => ({ ...v, [field]: val }));
    // Clear error on change
    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: '' }));
    }
  };

  /** Validate and submit */
  const handleSubmit = () => {
    const newErrors = {};

    if (!values.phoneNumber.trim()) {
      newErrors.phoneNumber = '请输入手机号码';
    } else if (!validatePhoneNumber(values.phoneNumber.trim())) {
      newErrors.phoneNumber = '请输入正确的11位手机号码';
    }

    if (!values.cycleDays || values.cycleDays < 1) {
      newErrors.cycleDays = '保号周期必须大于0';
    }

    if (!values.lastKeepDate) {
      newErrors.lastKeepDate = '请选择上次保号日期';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      phoneNumber: values.phoneNumber.trim(),
      carrier: values.carrier,
      cycleDays: Number(values.cycleDays),
      lastKeepDate: values.lastKeepDate,
      note: values.note.trim(),
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, fontSize: '1.125rem' }}>
        {isEdit ? '编辑号码' : '添加号码'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          {/* Phone Number */}
          <TextField
            label="手机号码"
            placeholder="请输入11位手机号码"
            value={values.phoneNumber}
            onChange={handleChange('phoneNumber')}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber}
            inputProps={{ maxLength: 11 }}
            fullWidth
            required
          />

          {/* Carrier */}
          <FormControl fullWidth>
            <InputLabel>运营商</InputLabel>
            <Select
              value={values.carrier}
              label="运营商"
              onChange={handleChange('carrier')}
            >
              {CARRIER_OPTIONS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Cycle Days */}
          <TextField
            label="保号周期（天）"
            type="number"
            value={values.cycleDays}
            onChange={handleChange('cycleDays')}
            error={!!errors.cycleDays}
            helperText={errors.cycleDays || '建议30天'}
            inputProps={{ min: 1, max: 365 }}
            fullWidth
          />

          {/* Last Keep Date */}
          <TextField
            label="上次保号日期"
            type="date"
            value={values.lastKeepDate}
            onChange={handleChange('lastKeepDate')}
            error={!!errors.lastKeepDate}
            helperText={errors.lastKeepDate}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          {/* Note */}
          <TextField
            label="备注"
            placeholder="可选备注信息"
            value={values.note}
            onChange={handleChange('note')}
            multiline
            rows={2}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit">取消</Button>
        <Button onClick={handleSubmit} variant="contained">
          {isEdit ? '保存修改' : '添加'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
