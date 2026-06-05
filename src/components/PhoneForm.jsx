import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
} from '@mui/material';
import { validatePhoneNumber, getTodayStr } from '../utils/helpers';

const DEFAULT_VALUES = {
  phoneNumber: '',
  carrier: '',
  cycleDays: 30,
  lastKeepDate: getTodayStr(),
  note: '',
};

export default function PhoneForm({ open, phone, onSubmit, onClose }) {
  const isEdit = Boolean(phone);
  const [values, setValues] = useState(DEFAULT_VALUES);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (open) {
      if (phone) {
        setValues({
          phoneNumber: phone.phoneNumber,
          carrier: phone.carrier || '',
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

  const handleChange = (field) => (e) => {
    const val = e.target.value;
    setValues((v) => ({ ...v, [field]: val }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }));
  };

  const handleSubmit = () => {
    const newErrors = {};
    if (!values.phoneNumber.trim()) {
      newErrors.phoneNumber = '请输入号码';
    } else if (!validatePhoneNumber(values.phoneNumber.trim())) {
      newErrors.phoneNumber = '号码格式不正确（至少5位）';
    }
    if (!values.carrier.trim()) {
      newErrors.carrier = '请输入运营商';
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
      carrier: values.carrier.trim(),
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
          <TextField
            label="手机/电话号码"
            placeholder="支持国际号码，如 +1 2345678901"
            value={values.phoneNumber}
            onChange={handleChange('phoneNumber')}
            error={!!errors.phoneNumber}
            helperText={errors.phoneNumber || '至少5位数字'}
            fullWidth
            required
          />

          <TextField
            label="运营商"
            placeholder="如：中国移动、AT&T、Vodafone..."
            value={values.carrier}
            onChange={handleChange('carrier')}
            error={!!errors.carrier}
            helperText={errors.carrier || '自由填写运营商名称'}
            fullWidth
            required
          />

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
