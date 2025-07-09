import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Divider,
  Link as MuiLink,
  InputAdornment,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  Fade,
  Slide,
  useTheme,
  alpha,
  Stack,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import EmailIcon from '@mui/icons-material/Email';
import SecurityIcon from '@mui/icons-material/Security';
import CloudIcon from '@mui/icons-material/Cloud';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BusinessIcon from '@mui/icons-material/Business';
import { useAuth } from '../context/AuthContextCognito';

const LoginCognito = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, confirmSignUp, forgotPassword, confirmPassword, loading, error, isAuthenticated, user } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showVerification, setShowVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetForm, setShowResetForm] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
    purpose: '',
    confirmPassword: '',
    verificationCode: '',
    resetCode: '',
    newPassword: ''
  });

  // 가입 목적 옵션들
  const purposeOptions = [
    { value: '', label: '선택하지 않음 (선택사항)' },
    { value: 'aws-internal', label: '🏢 AWS 내부 직원' },
    { value: 'customer-demo', label: '👥 고객사 데모 제공' },
    { value: 'partner-collaboration', label: '🤝 파트너 협업' },
    { value: 'technical-evaluation', label: '🔍 기술 평가 및 검토' },
    { value: 'business-development', label: '📈 비즈니스 개발' },
    { value: 'education-training', label: '📚 교육 및 트레이닝' },
    { value: 'research-development', label: '🔬 연구 개발' },
    { value: 'other', label: '🔧 기타' }
  ];

  // URL 파라미터에서 메시지 확인 및 이미 로그인된 사용자 안내
  useEffect(() => {
    // URL 파라미터에서 메시지 확인
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
      // URL에서 메시지 파라미터 제거
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('message');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
    
    // 이미 로그인된 사용자에게 안내 메시지 표시 (자동 리다이렉션 제거)
    if (isAuthenticated()) {
      setSuccessMessage(`이미 로그인되어 있습니다. (${user?.name || user?.email})`);
    }
  }, [searchParams, navigate, isAuthenticated, user]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setShowVerification(false);
    setShowForgotPassword(false);
    setShowResetForm(false);
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const userData = await signIn(formData.email, formData.password);
      console.log('🚀 로그인 성공, 홈으로 이동:', userData);
      
      // 강제 리다이렉션
      setTimeout(() => {
        navigate('/', { replace: true });
        window.location.reload(); // 필요시 페이지 새로고침
      }, 100);
      
    } catch (err) {
      console.error('❌ 로그인 실패:', err);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      // 전체 formData를 signUp 함수에 전달
      await signUp(formData);
      setShowVerification(true);
      setSuccessMessage('회원가입이 완료되었습니다! 이메일을 확인하여 인증 코드를 입력해주세요.');
    } catch (err) {
      console.error('회원가입 실패:', err);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    try {
      await confirmSignUp(formData.email, formData.verificationCode);
      navigate('/');
    } catch (err) {
      console.error('인증 실패:', err);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(formData.email);
      setShowResetForm(true);
    } catch (err) {
      console.error('비밀번호 재설정 요청 실패:', err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await confirmPassword(formData.email, formData.resetCode, formData.newPassword);
      setShowForgotPassword(false);
      setShowResetForm(false);
      alert('비밀번호가 성공적으로 변경되었습니다.');
    } catch (err) {
      console.error('비밀번호 재설정 실패:', err);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.primary.main, 0.1)} 0%, 
          ${alpha(theme.palette.secondary.main, 0.05)} 50%, 
          ${alpha(theme.palette.primary.light, 0.1)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Fade in timeout={800}>
          <Card 
            elevation={24}
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              background: alpha(theme.palette.background.paper, 0.95),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
            }}
          >
            {/* 헤더 섹션 */}
            <Box
              sx={{
                background: `linear-gradient(135deg, 
                  ${theme.palette.primary.main} 0%, 
                  ${theme.palette.primary.dark} 100%)`,
                color: 'white',
                p: 4,
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: alpha('#fff', 0.1),
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: -30,
                  left: -30,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: alpha('#fff', 0.1),
                }}
              />
              
              <CloudIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                AWS Demo Factory
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.9 }}>
                클라우드 혁신의 무한한 가능성을 경험하세요
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* 성공/에러 메시지 */}
              {successMessage && (
                <Slide direction="down" in mountOnEnter unmountOnExit>
                  <Alert 
                    severity="success" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        fontSize: '1.5rem'
                      }
                    }}
                  >
                    {successMessage}
                  </Alert>
                </Slide>
              )}

              {error && (
                <Slide direction="down" in mountOnEnter unmountOnExit>
                  <Alert 
                    severity="error" 
                    sx={{ 
                      mb: 3,
                      borderRadius: 2,
                      '& .MuiAlert-icon': {
                        fontSize: '1.5rem'
                      }
                    }}
                  >
                    {error}
                  </Alert>
                </Slide>
              )}

              {showForgotPassword ? (
                // 비밀번호 재설정 폼
                <Fade in timeout={600}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                      <SecurityIcon color="primary" />
                      <Typography variant="h6" fontWeight="bold">
                        비밀번호 재설정
                      </Typography>
                    </Stack>
                    
                    {!showResetForm ? (
                      <Box component="form" onSubmit={handleForgotPassword}>
                        <TextField
                          fullWidth
                          name="email"
                          label="이메일 주소"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={loading}
                          sx={{ 
                            mb: 2,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 600
                          }}
                        >
                          {loading ? <CircularProgress size={24} /> : '재설정 코드 전송'}
                        </Button>
                        <Button
                          fullWidth
                          variant="text"
                          onClick={() => setShowForgotPassword(false)}
                          sx={{ textTransform: 'none' }}
                        >
                          로그인으로 돌아가기
                        </Button>
                      </Box>
                    ) : (
                      <Box component="form" onSubmit={handleResetPassword}>
                        <TextField
                          fullWidth
                          name="resetCode"
                          label="인증 코드"
                          value={formData.resetCode}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 2 }}
                        />
                        <TextField
                          fullWidth
                          name="newPassword"
                          label="새 비밀번호"
                          type="password"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 3 }}
                        />
                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={loading}
                          sx={{ 
                            mb: 2,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 600
                          }}
                        >
                          {loading ? <CircularProgress size={24} /> : '비밀번호 변경'}
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Fade>
              ) : showVerification ? (
                // 이메일 인증 폼
                <Fade in timeout={600}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} mb={3}>
                      <EmailIcon color="primary" />
                      <Typography variant="h6" fontWeight="bold">
                        이메일 인증
                      </Typography>
                    </Stack>
                    
                    <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                      <Typography variant="body2">
                        <strong>{formData.email}</strong>로 전송된 인증 코드를 입력해주세요.
                      </Typography>
                    </Alert>
                    
                    <Box component="form" onSubmit={handleVerification}>
                      <TextField
                        fullWidth
                        name="verificationCode"
                        label="인증 코드"
                        value={formData.verificationCode}
                        onChange={handleInputChange}
                        required
                        sx={{ mb: 3 }}
                        inputProps={{
                          style: { textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.5rem' }
                        }}
                      />
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        size="large"
                        disabled={loading}
                        sx={{ 
                          mb: 2,
                          py: 1.5,
                          borderRadius: 2,
                          textTransform: 'none',
                          fontSize: '1.1rem',
                          fontWeight: 600
                        }}
                      >
                        {loading ? <CircularProgress size={24} /> : '계정 활성화'}
                      </Button>
                    </Box>
                  </Box>
                </Fade>
              ) : (
                // 로그인/회원가입 탭
                <Box>
                  <Tabs 
                    value={tabValue} 
                    onChange={handleTabChange} 
                    centered
                    sx={{ 
                      mb: 4,
                      '& .MuiTab-root': {
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontWeight: 600,
                        minWidth: 120
                      }
                    }}
                  >
                    <Tab 
                      icon={<LoginIcon />} 
                      label="로그인" 
                      iconPosition="start"
                    />
                    <Tab 
                      icon={<PersonAddIcon />} 
                      label="회원가입" 
                      iconPosition="start"
                    />
                  </Tabs>

                  {tabValue === 0 ? (
                    // 로그인 폼
                    <Fade in timeout={400}>
                      <Box component="form" onSubmit={handleSignIn}>
                        <TextField
                          fullWidth
                          name="email"
                          label="이메일 주소"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <TextField
                          fullWidth
                          name="password"
                          label="비밀번호"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                        
                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={loading}
                          sx={{ 
                            mb: 3,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, 
                              ${theme.palette.primary.main} 0%, 
                              ${theme.palette.primary.dark} 100%)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, 
                                ${theme.palette.primary.dark} 0%, 
                                ${theme.palette.primary.main} 100%)`,
                            }
                          }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : '로그인'}
                        </Button>

                        <Box textAlign="center">
                          <MuiLink
                            component="button"
                            type="button"
                            variant="body2"
                            onClick={() => setShowForgotPassword(true)}
                            sx={{ 
                              textDecoration: 'none',
                              color: theme.palette.primary.main,
                              '&:hover': {
                                textDecoration: 'underline'
                              }
                            }}
                          >
                            비밀번호를 잊으셨나요?
                          </MuiLink>
                        </Box>
                      </Box>
                    </Fade>
                  ) : (
                    // 회원가입 폼
                    <Fade in timeout={400}>
                      <Box component="form" onSubmit={handleSignUp}>
                        <TextField
                          fullWidth
                          name="name"
                          label="이름"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <PersonIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <TextField
                          fullWidth
                          name="email"
                          label="이메일 주소"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <EmailIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        
                        {/* 회사명 필드 (선택사항) */}
                        <TextField
                          fullWidth
                          name="company"
                          label="회사명 (선택사항)"
                          value={formData.company}
                          onChange={handleInputChange}
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <BusinessIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        
                        {/* 가입 목적 필드 (선택사항) */}
                        <FormControl fullWidth sx={{ mb: 2 }}>
                          <InputLabel>가입 목적 (선택사항)</InputLabel>
                          <Select
                            name="purpose"
                            value={formData.purpose}
                            label="가입 목적 (선택사항)"
                            onChange={handleInputChange}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                borderRadius: 1,
                              }
                            }}
                          >
                            {purposeOptions.map((option) => (
                              <MenuItem key={option.value} value={option.value}>
                                {option.label}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          name="password"
                          label="비밀번호"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 2 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon color="action" />
                              </InputAdornment>
                            ),
                            endAdornment: (
                              <InputAdornment position="end">
                                <IconButton
                                  onClick={() => setShowPassword(!showPassword)}
                                  edge="end"
                                >
                                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                </IconButton>
                              </InputAdornment>
                            ),
                          }}
                        />
                        <TextField
                          fullWidth
                          name="confirmPassword"
                          label="비밀번호 확인"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          sx={{ mb: 3 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LockIcon color="action" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        
                        <Button
                          type="submit"
                          fullWidth
                          variant="contained"
                          size="large"
                          disabled={loading}
                          sx={{ 
                            mb: 2,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            background: `linear-gradient(135deg, 
                              ${theme.palette.secondary.main} 0%, 
                              ${theme.palette.secondary.dark} 100%)`,
                            '&:hover': {
                              background: `linear-gradient(135deg, 
                                ${theme.palette.secondary.dark} 0%, 
                                ${theme.palette.secondary.main} 100%)`,
                            }
                          }}
                        >
                          {loading ? <CircularProgress size={24} color="inherit" /> : '계정 생성'}
                        </Button>

                        <Alert severity="info" sx={{ borderRadius: 2 }}>
                          <Typography variant="body2">
                            더 많은 기능을 원하시나요? 
                            <MuiLink 
                              component={Link} 
                              to="/register" 
                              sx={{ ml: 1, fontWeight: 600 }}
                            >
                              상세 회원가입
                            </MuiLink>
                          </Typography>
                        </Alert>
                      </Box>
                    </Fade>
                  )}
                </Box>
              )}
            </CardContent>

            {/* 푸터 */}
            <Box 
              sx={{ 
                p: 3, 
                textAlign: 'center',
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                background: alpha(theme.palette.background.default, 0.5)
              }}
            >
              <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                <Chip 
                  label="AWS" 
                  size="small" 
                  variant="outlined" 
                  sx={{ borderRadius: 1 }}
                />
                <Chip 
                  label="Demo Factory" 
                  size="small" 
                  variant="outlined" 
                  sx={{ borderRadius: 1 }}
                />
                <Chip 
                  label="Cloud Innovation" 
                  size="small" 
                  variant="outlined" 
                  sx={{ borderRadius: 1 }}
                />
              </Stack>
            </Box>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default LoginCognito;
