import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  FormControlLabel,
  Checkbox,
  Link
} from '@mui/material';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    inquiryType: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);

  const inquiryTypes = [
    { value: 'technical', label: '기술 문의' },
    { value: 'pricing', label: '가격 문의' },
    { value: 'demo', label: '데모 요청' },
    { value: 'partnership', label: '파트너십 문의' },
    { value: 'other', label: '기타' }
  ];

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    if (!agreed) {
      setError('개인정보 처리에 대한 동의가 필요합니다.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // AWS SES를 사용한 실제 API 호출
      const response = await fetch('http://localhost:3001/api/send-inquiry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        console.error('JSON parsing error:', jsonError);
        throw new Error('서버 응답을 처리할 수 없습니다.');
      }

      if (!response.ok) {
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }

      if (result.status === 'success') {
        setSuccess(true);
      } else {
        throw new Error(result.message || '메일 발송에 실패했습니다.');
      }
    } catch (err) {
      console.error('Email sending error:', err);
      setError(err.message || '문의 전송 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Header Section */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" component="h1" gutterBottom fontWeight="bold" color="primary">
          AWS 지원 문의
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', whiteSpace: 'nowrap' }}>
          AWS 서비스에 대한 궁금한 점이나 기술 지원이 필요하시면 언제든지 문의해주세요.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Contact Form - Full Width */}
        <Grid item xs={12}>
          <Paper sx={{ p: 4, borderRadius: 2, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
              문의하기
            </Typography>
            
            {success ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Alert severity="success" sx={{ mb: 2 }}>
                  문의가 성공적으로 전송되었습니다!
                </Alert>
                <Typography variant="body1">
                  빠른 시일 내에 답변드리겠습니다.
                </Typography>
                <Button 
                  variant="outlined" 
                  onClick={() => {
                    setSuccess(false);
                    setAgreed(false);
                    setFormData({
                      name: '',
                      email: '',
                      company: '',
                      inquiryType: '',
                      subject: '',
                      message: ''
                    });
                  }}
                  sx={{ mt: 2 }}
                >
                  새 문의 작성
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {error && (
                  <Alert severity="error" onClose={() => setError('')}>
                    {error}
                  </Alert>
                )}
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="이름 *"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    fullWidth
                    variant="outlined"
                  />
                  <TextField
                    label="이메일 *"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    fullWidth
                    variant="outlined"
                  />
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    label="회사명"
                    value={formData.company}
                    onChange={handleInputChange('company')}
                    fullWidth
                    variant="outlined"
                  />
                  <FormControl fullWidth>
                    <InputLabel>문의 유형</InputLabel>
                    <Select
                      value={formData.inquiryType}
                      onChange={handleInputChange('inquiryType')}
                      label="문의 유형"
                    >
                      {inquiryTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                
                <TextField
                  label="제목 *"
                  value={formData.subject}
                  onChange={handleInputChange('subject')}
                  fullWidth
                  variant="outlined"
                />
                
                <TextField
                  label="문의 내용 *"
                  value={formData.message}
                  onChange={handleInputChange('message')}
                  fullWidth
                  multiline
                  rows={6}
                  variant="outlined"
                  placeholder="AWS 서비스에 대한 문의사항을 자세히 작성해주세요."
                />
                
                <Typography variant="caption" color="text.secondary">
                  * 표시된 항목은 필수 입력 사항입니다.
                </Typography>
                
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body2">
                      예. <Link 
                        href="https://aws.amazon.com/ko/legal/marketingentities/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        color="primary"
                      >
                        Amazon Web Services(AWS)
                      </Link>에서 제 답변에 대해 후속 조치를 취하기를 바라며, 이러한 목적으로 제 이름과 이메일 주소를 공유하는 데 동의합니다.
                    </Typography>
                  }
                  sx={{ mt: 2, alignItems: 'flex-start' }}
                />
                
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setAgreed(false);
                      setFormData({
                        name: '',
                        email: '',
                        company: '',
                        inquiryType: '',
                        subject: '',
                        message: ''
                      });
                      setError('');
                    }}
                    disabled={loading}
                  >
                    초기화
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    startIcon={loading && <CircularProgress size={20} />}
                    sx={{ minWidth: 120 }}
                    onClick={handleSubmit}
                  >
                    {loading ? '전송 중...' : '문의 전송'}
                  </Button>
                </Box>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ContactPage;
