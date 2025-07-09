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
import BusinessIcon from '@mui/icons-material/Business';
import TargetIcon from '@mui/icons-material/GpsFixed';
import { useAuth } from '../context/AuthContextCognito';

const LoginPage = () => {
  console.log('🔐 [LoginPage] 컴포넌트 렌더링 시작');
  
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn, signUp, confirmSignUp, forgotPassword, confirmPassword, setNewPassword, loading, error, needsNewPassword, isAuthenticated } = useAuth();
  
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    company: '',
    purpose: '',
    confirmPassword: '',
    verificationCode: ''
  });
  const [showVerification, setShowVerification] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [newPasswordForm, setNewPasswordForm] = useState({
    password: '',
    confirmPassword: ''
  });
  const [showNewPassword, setShowNewPassword] = useState(false);

  // URL 파라미터에서 메시지 확인만 처리
  useEffect(() => {
    console.log('🔐 [LoginPage] useEffect 실행, 인증 상태:', isAuthenticated());
    
    // URL 파라미터에서 메시지 확인
    const message = searchParams.get('message');
    if (message) {
      setSuccessMessage(message);
      // URL에서 메시지 파라미터 제거
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('message');
      navigate({ search: newSearchParams.toString() }, { replace: true });
    }
    
    // 이미 로그인된 사용자에게 안내 메시지만 표시 (리다이렉션 제거)
    if (isAuthenticated()) {
      console.log('ℹ️ [LoginPage] 이미 로그인된 사용자');
      // setSuccessMessage('이미 로그인되어 있습니다.');
    }
  }, [searchParams, navigate]);

  // 인증 상태 변경 감지 및 자동 리다이렉션
  useEffect(() => {
    if (isAuthenticated() && !needsNewPassword && !loading) {
      console.log('✅ [LoginPage] 인증 완료 감지, 메인 페이지로 자동 리다이렉션');
      const redirectTimer = setTimeout(() => {
        navigate('/', { replace: true });
      }, 500); // 0.5초 후 리다이렉션
      
      return () => clearTimeout(redirectTimer);
    }
  }, [isAuthenticated, needsNewPassword, loading, navigate]);

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
      await signIn(formData.email, formData.password);
      // needsNewPassword 상태가 아닐 때만 리다이렉션
      if (!needsNewPassword) {
        console.log('✅ [LoginPage] 로그인 성공, 메인 페이지로 이동');
        navigate('/');
      } else {
        console.log('🔑 [LoginPage] 새 비밀번호 설정 필요, 리다이렉션 대기');
      }
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }

    console.log('🔍 [LoginPage] 회원가입 데이터:', formData);

    try {
      // 객체 형태로 데이터 전달
      await signUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        company: formData.company || '',
        purpose: formData.purpose || 'other',
        role: 'associate-member'
      });
      
      // 회사명과 가입 목적을 로컬 스토리지에 저장
      const userExtraInfo = {
        email: formData.email,
        company: formData.company || '',
        purpose: formData.purpose || 'other',
        registeredAt: new Date().toISOString()
      };
      
      // 기존 사용자 추가 정보 가져오기
      const existingUserInfo = JSON.parse(localStorage.getItem('userExtraInfo') || '[]');
      existingUserInfo.push(userExtraInfo);
      localStorage.setItem('userExtraInfo', JSON.stringify(existingUserInfo));
      
      console.log('💾 사용자 추가 정보 저장됨:', userExtraInfo);
      
      setShowVerification(true);
    } catch (error) {
      console.error('회원가입 실패:', error);
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    try {
      await confirmSignUp(formData.email, formData.verificationCode);
      setSuccessMessage('이메일 인증이 완료되었습니다. 자동으로 로그인됩니다.');
      
      // 인증 완료 후 자동 로그인 시도
      try {
        await signIn(formData.email, formData.password);
        console.log('✅ [LoginPage] 회원가입 인증 완료 후 자동 로그인 성공');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
        
      } catch (loginError) {
        console.warn('⚠️ [LoginPage] 자동 로그인 실패, 수동 로그인 필요:', loginError);
        setShowVerification(false);
        setTabValue(0);
      }
      
    } catch (error) {
      console.error('이메일 인증 실패:', error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      await forgotPassword(resetEmail);
      alert('비밀번호 재설정 이메일이 발송되었습니다.');
      setShowResetForm(true);
    } catch (error) {
      console.error('비밀번호 재설정 실패:', error);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await confirmPassword(resetEmail, resetCode, resetNewPassword);
      setSuccessMessage('비밀번호가 성공적으로 재설정되었습니다. 자동으로 로그인됩니다.');
      
      // 비밀번호 재설정 완료 후 자동 로그인 시도
      try {
        await signIn(resetEmail, resetNewPassword);
        console.log('✅ [LoginPage] 비밀번호 재설정 완료 후 자동 로그인 성공');
        
        setTimeout(() => {
          navigate('/');
        }, 1500);
        
      } catch (loginError) {
        console.warn('⚠️ [LoginPage] 자동 로그인 실패, 수동 로그인 필요:', loginError);
        setShowForgotPassword(false);
        setShowResetForm(false);
        setTabValue(0);
      }
      
    } catch (error) {
      console.error('비밀번호 재설정 확인 실패:', error);
    }
  };

  // 새 비밀번호 설정 (임시 비밀번호 사용 후)
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    
    if (newPasswordForm.password !== newPasswordForm.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (newPasswordForm.password.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    
    try {
      await setNewPassword(newPasswordForm.password);
      setSuccessMessage('새 비밀번호가 설정되었습니다. 로그인되었습니다.');
      console.log('✅ [LoginPage] 새 비밀번호 설정 완료, 메인 페이지로 이동');
      
      // 잠시 후 메인 페이지로 리다이렉션
      setTimeout(() => {
        navigate('/');
      }, 1500);
      
    } catch (error) {
      console.error('새 비밀번호 설정 실패:', error);
    }
  };

  const handleNewPasswordInputChange = (e) => {
    setNewPasswordForm({
      ...newPasswordForm,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Box textAlign="center" mb={3}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            AWS Demo Factory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            AWS 클라우드 혁신의 무한한 가능성을 경험하세요
          </Typography>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {needsNewPassword ? (
          // 새 비밀번호 설정 폼
          <Box>
            <Alert severity="info" sx={{ mb: 2 }}>
              임시 비밀번호로 로그인되었습니다. 보안을 위해 새 비밀번호를 설정해주세요.
            </Alert>
            
            <Typography variant="h6" gutterBottom>
              새 비밀번호 설정
            </Typography>
            
            <Box component="form" onSubmit={handleSetNewPassword}>
              <TextField
                fullWidth
                label="새 비밀번호"
                name="password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPasswordForm.password}
                onChange={handleNewPasswordInputChange}
                margin="normal"
                required
                helperText="최소 8자 이상, 대소문자, 숫자, 특수문자 포함 권장"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                label="새 비밀번호 확인"
                name="confirmPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPasswordForm.confirmPassword}
                onChange={handleNewPasswordInputChange}
                margin="normal"
                required
                error={newPasswordForm.password !== newPasswordForm.confirmPassword && newPasswordForm.confirmPassword !== ''}
                helperText={newPasswordForm.password !== newPasswordForm.confirmPassword && newPasswordForm.confirmPassword !== '' ? '비밀번호가 일치하지 않습니다' : ''}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon />
                    </InputAdornment>
                  ),
                }}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading || newPasswordForm.password !== newPasswordForm.confirmPassword}
              >
                {loading ? <CircularProgress size={24} /> : '새 비밀번호 설정'}
              </Button>
            </Box>
          </Box>
        ) : showForgotPassword ? (
          // 비밀번호 재설정 폼
          <Box>
            <Typography variant="h6" gutterBottom>
              비밀번호 재설정
            </Typography>
            
            {!showResetForm ? (
              <Box component="form" onSubmit={handleForgotPassword}>
                <TextField
                  fullWidth
                  label="이메일"
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : '재설정 이메일 발송'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleResetPassword}>
                <TextField
                  fullWidth
                  label="인증 코드"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  margin="normal"
                  required
                />
                <TextField
                  fullWidth
                  label="새 비밀번호"
                  type="password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  margin="normal"
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  sx={{ mt: 3, mb: 2 }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : '비밀번호 재설정'}
                </Button>
              </Box>
            )}
            
            <Button
              fullWidth
              onClick={() => setShowForgotPassword(false)}
              sx={{ mt: 1 }}
            >
              로그인으로 돌아가기
            </Button>
          </Box>
        ) : showVerification ? (
          // 이메일 인증 폼
          <Box>
            <Typography variant="h6" gutterBottom>
              이메일 인증
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {formData.email}로 발송된 인증 코드를 입력해주세요.
            </Typography>
            
            <Box component="form" onSubmit={handleVerification}>
              <TextField
                fullWidth
                label="인증 코드"
                name="verificationCode"
                value={formData.verificationCode}
                onChange={handleInputChange}
                margin="normal"
                required
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : '인증 완료'}
              </Button>
            </Box>
          </Box>
        ) : (
          // 로그인/회원가입 탭
          <Box>
            <Tabs value={tabValue} onChange={handleTabChange} centered>
              <Tab label="로그인" />
              <Tab label="회원가입" />
            </Tabs>

            <Box sx={{ mt: 3 }}>
              {tabValue === 0 ? (
                // 로그인 폼
                <Box component="form" onSubmit={handleSignIn}>
                  <TextField
                    fullWidth
                    label="이메일"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="비밀번호"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
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
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : '로그인'}
                  </Button>

                  <Box textAlign="center">
                    <MuiLink
                      component="button"
                      variant="body2"
                      onClick={(e) => {
                        e.preventDefault();
                        setShowForgotPassword(true);
                      }}
                    >
                      비밀번호를 잊으셨나요?
                    </MuiLink>
                  </Box>
                </Box>
              ) : (
                // 회원가입 폼
                <Box component="form" onSubmit={handleSignUp}>
                  <TextField
                    fullWidth
                    label="이름"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                  <TextField
                    fullWidth
                    label="이메일"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    fullWidth
                    label="비밀번호"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                    helperText="최소 8자 이상"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon />
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
                    label="비밀번호 확인"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    margin="normal"
                    required
                  />
                  
                  {/* 회사명 필드 */}
                  <TextField
                    fullWidth
                    label="회사명"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    margin="normal"
                    helperText="선택사항"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                  
                  {/* 가입 목적 선택 */}
                  <FormControl fullWidth margin="normal">
                    <InputLabel>가입 목적</InputLabel>
                    <Select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleInputChange}
                      label="가입 목적"
                      startAdornment={
                        <InputAdornment position="start">
                          <TargetIcon />
                        </InputAdornment>
                      }
                    >
                      <MenuItem value="aws-internal">🏢 AWS 내부 직원</MenuItem>
                      <MenuItem value="customer-demo">👥 고객사 데모 제공</MenuItem>
                      <MenuItem value="partner-collaboration">🤝 파트너 협업</MenuItem>
                      <MenuItem value="technical-evaluation">🔍 기술 평가 및 검토</MenuItem>
                      <MenuItem value="business-development">📈 비즈니스 개발</MenuItem>
                      <MenuItem value="education-training">📚 교육 및 트레이닝</MenuItem>
                      <MenuItem value="research-development">🔬 연구 개발</MenuItem>
                      <MenuItem value="other">🔧 기타</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    sx={{ mt: 3, mb: 2 }}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : '회원가입'}
                  </Button>
                </Box>
              )}
            </Box>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />
        
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              ← 홈으로 돌아가기
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;
