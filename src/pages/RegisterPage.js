import React, { useState } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Fade,
  Slide,
  useTheme,
  alpha,
  Stack,
  Chip,
  Stepper,
  Step,
  StepLabel,
  Grid
} from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import BusinessIcon from '@mui/icons-material/Business';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloudIcon from '@mui/icons-material/Cloud';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import WorkIcon from '@mui/icons-material/Work';
import TargetIcon from '@mui/icons-material/GpsFixed';
import SecurityIcon from '@mui/icons-material/Security';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContextCognito';

const RegisterPage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: 'viewer',
    purpose: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const steps = ['기본 정보', '회사 정보', '보안 설정'];

  const purposeOptions = [
    { value: 'aws-internal', label: '🏢 AWS 내부 직원', color: 'primary' },
    { value: 'customer-demo', label: '👥 고객사 데모 제공', color: 'secondary' },
    { value: 'partner-collaboration', label: '🤝 파트너 협업', color: 'success' },
    { value: 'technical-evaluation', label: '🔍 기술 평가 및 검토', color: 'info' },
    { value: 'business-development', label: '📈 비즈니스 개발', color: 'warning' },
    { value: 'education-training', label: '📚 교육 및 트레이닝', color: 'secondary' },
    { value: 'research-development', label: '🔬 연구 개발', color: 'primary' },
    { value: 'other', label: '🔧 기타', color: 'default' }
  ];

  const handleInputChange = (field) => (event) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError('');
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prevActiveStep) => prevActiveStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const validateStep = (step) => {
    switch (step) {
      case 0:
        if (!formData.name.trim()) {
          setError('이름을 입력해주세요.');
          return false;
        }
        if (!formData.email.trim()) {
          setError('이메일을 입력해주세요.');
          return false;
        }
        if (!formData.email.includes('@')) {
          setError('올바른 이메일 형식을 입력해주세요.');
          return false;
        }
        break;
      case 1:
        if (!formData.company.trim()) {
          setError('회사명을 입력해주세요.');
          return false;
        }
        if (!formData.purpose) {
          setError('가입 목적을 선택해주세요.');
          return false;
        }
        break;
      case 2:
        if (formData.password.length < 8) {
          setError('비밀번호는 최소 8자 이상이어야 합니다.');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('비밀번호가 일치하지 않습니다.');
          return false;
        }
        break;
      default:
        return true;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateStep(2)) return;
    
    console.log('🔍 [RegisterPage] 제출할 데이터:', formData);
    console.log('🔍 [RegisterPage] 이메일 값:', formData.email);
    console.log('🔍 [RegisterPage] 비밀번호 존재:', !!formData.password);
    console.log('🔍 [RegisterPage] 이름 값:', formData.name);

    setIsLoading(true);

    try {
      await signUp(formData);
      navigate('/login?message=회원가입이 완료되었습니다. 이메일을 확인하여 계정을 활성화해주세요.');
    } catch (err) {
      console.error('❌ [RegisterPage] 회원가입 실패:', err);
      setError(err.message || '회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Fade in timeout={400}>
            <Stack spacing={3}>
              <Box textAlign="center" mb={2}>
                <PersonIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  기본 정보를 입력해주세요
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  AWS Demo Factory에 오신 것을 환영합니다
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                name="name"
                label="이름"
                value={formData.name}
                onChange={handleInputChange('name')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              
              <TextField
                fullWidth
                name="email"
                label="이메일 주소"
                type="email"
                value={formData.email}
                onChange={handleInputChange('email')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
            </Stack>
          </Fade>
        );
      case 1:
        return (
          <Fade in timeout={400}>
            <Stack spacing={3}>
              <Box textAlign="center" mb={2}>
                <WorkIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  회사 및 목적 정보
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  더 나은 서비스 제공을 위해 필요합니다
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                name="company"
                label="회사명"
                value={formData.company}
                onChange={handleInputChange('company')}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <BusinessIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              
              <FormControl fullWidth required>
                <InputLabel>가입 목적</InputLabel>
                <Select
                  value={formData.purpose}
                  label="가입 목적"
                  onChange={handleInputChange('purpose')}
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  {purposeOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography>{option.label}</Typography>
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.purpose && (
                <Slide direction="up" in mountOnEnter>
                  <Alert 
                    severity="info" 
                    sx={{ 
                      borderRadius: 2,
                      background: alpha(theme.palette.info.main, 0.1)
                    }}
                  >
                    <Typography variant="body2">
                      선택하신 목적: <strong>
                        {purposeOptions.find(opt => opt.value === formData.purpose)?.label}
                      </strong>
                    </Typography>
                  </Alert>
                </Slide>
              )}
              
              <FormControl fullWidth>
                <InputLabel>계정 유형</InputLabel>
                <Select
                  value={formData.role}
                  label="계정 유형"
                  onChange={handleInputChange('role')}
                  sx={{
                    borderRadius: 2,
                  }}
                >
                  <MenuItem value="viewer">
                    <Stack>
                      <Typography fontWeight="bold">일반 사용자 (Viewer)</Typography>
                      <Typography variant="caption" color="text.secondary">
                        콘텐츠 조회만 가능
                      </Typography>
                    </Stack>
                  </MenuItem>
                  <MenuItem value="contributor">
                    <Stack>
                      <Typography fontWeight="bold">컨텐츠 업로더 (Contributor)</Typography>
                      <Typography variant="caption" color="text.secondary">
                        콘텐츠 생성 및 업로드 가능
                      </Typography>
                    </Stack>
                  </MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Fade>
        );
      case 2:
        return (
          <Fade in timeout={400}>
            <Stack spacing={3}>
              <Box textAlign="center" mb={2}>
                <SecurityIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  보안 설정
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  안전한 비밀번호를 설정해주세요
                </Typography>
              </Box>
              
              <TextField
                fullWidth
                name="password"
                label="비밀번호"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange('password')}
                required
                helperText="최소 8자 이상, 영문/숫자/특수문자 조합 권장"
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />
              
              <TextField
                fullWidth
                name="confirmPassword"
                label="비밀번호 확인"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleInputChange('confirmPassword')}
                required
                error={formData.confirmPassword && formData.password !== formData.confirmPassword}
                helperText={
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? '비밀번호가 일치하지 않습니다'
                    : ''
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  }
                }}
              />

              {formData.password && formData.confirmPassword && formData.password === formData.confirmPassword && (
                <Slide direction="up" in mountOnEnter>
                  <Alert 
                    severity="success" 
                    icon={<CheckCircleIcon />}
                    sx={{ 
                      borderRadius: 2,
                      background: alpha(theme.palette.success.main, 0.1)
                    }}
                  >
                    비밀번호가 일치합니다!
                  </Alert>
                </Slide>
              )}
            </Stack>
          </Fade>
        );
      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, 
          ${alpha(theme.palette.secondary.main, 0.1)} 0%, 
          ${alpha(theme.palette.primary.main, 0.05)} 50%, 
          ${alpha(theme.palette.secondary.light, 0.1)} 100%)`,
        display: 'flex',
        alignItems: 'center',
        py: 4
      }}
    >
      <Container maxWidth="md">
        <Fade in timeout={800}>
          <Card 
            elevation={24}
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              backdropFilter: 'blur(20px)',
              background: alpha(theme.palette.background.paper, 0.95),
              border: `1px solid ${alpha(theme.palette.secondary.main, 0.1)}`
            }}
          >
            {/* 헤더 섹션 */}
            <Box
              sx={{
                background: `linear-gradient(135deg, 
                  ${theme.palette.secondary.main} 0%, 
                  ${theme.palette.secondary.dark} 100%)`,
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
              
              <PersonAddIcon sx={{ fontSize: 48, mb: 2, opacity: 0.9 }} />
              <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
                AWS Demo Factory
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 1 }}>
                회원가입
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8 }}>
                클라우드 혁신 여정을 시작하세요
              </Typography>
            </Box>

            <CardContent sx={{ p: 4 }}>
              {/* 스테퍼 */}
              <Stepper 
                activeStep={activeStep} 
                sx={{ 
                  mb: 4,
                  '& .MuiStepLabel-label': {
                    fontWeight: 600
                  }
                }}
              >
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              {/* 에러 메시지 */}
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

              {/* 스텝 콘텐츠 */}
              <Box sx={{ minHeight: 400 }}>
                {getStepContent(activeStep)}
              </Box>

              {/* 네비게이션 버튼 */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  variant="outlined"
                  sx={{ 
                    borderRadius: 2,
                    textTransform: 'none',
                    px: 3
                  }}
                >
                  이전
                </Button>
                
                <Box sx={{ flex: '1 1 auto' }} />
                
                {activeStep === steps.length - 1 ? (
                  <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={isLoading}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      background: `linear-gradient(135deg, 
                        ${theme.palette.success.main} 0%, 
                        ${theme.palette.success.dark} 100%)`,
                      '&:hover': {
                        background: `linear-gradient(135deg, 
                          ${theme.palette.success.dark} 0%, 
                          ${theme.palette.success.main} 100%)`,
                      }
                    }}
                  >
                    {isLoading ? <CircularProgress size={24} color="inherit" /> : '계정 생성'}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    sx={{ 
                      borderRadius: 2,
                      textTransform: 'none',
                      px: 3
                    }}
                  >
                    다음
                  </Button>
                )}
              </Box>

              {/* 로그인 링크 */}
              <Divider sx={{ my: 3 }} />
              <Box textAlign="center">
                <Typography variant="body2" color="text.secondary">
                  이미 계정이 있으신가요?{' '}
                  <MuiLink 
                    component={Link} 
                    to="/login" 
                    sx={{ 
                      fontWeight: 600,
                      textDecoration: 'none',
                      '&:hover': {
                        textDecoration: 'underline'
                      }
                    }}
                  >
                    로그인하기
                  </MuiLink>
                </Typography>
              </Box>
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
                  label="Secure Registration" 
                  size="small" 
                  variant="outlined" 
                  sx={{ borderRadius: 1 }}
                />
                <Chip 
                  label="AWS Powered" 
                  size="small" 
                  variant="outlined" 
                  sx={{ borderRadius: 1 }}
                />
                <Chip 
                  label="Enterprise Ready" 
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

export default RegisterPage;
