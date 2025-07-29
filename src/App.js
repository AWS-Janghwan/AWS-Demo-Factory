import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import SearchPage from './pages/SearchPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import ContentUploadPage from './pages/ContentUploadPage';
import ContentEditPage from './pages/ContentEditPage';
import ContentDetailPage from './pages/ContentDetailPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import AccessPurposeModal from './components/AccessPurposeModal';

// Import contexts
import { AuthProvider, useAuth, USER_ROLES } from './context/AuthContextCognito';
import { ContentProvider } from './context/ContentContextAWS';
import { AnalyticsProvider } from './context/AnalyticsContext';

// 권한별 보호 라우트 컴포넌트들
const AuthRequiredRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <div>로딩 중...</div>
      </Box>
    );
  }
  
  if (!isAuthenticated()) {
    console.log('🔒 로그인이 필요한 페이지, 로그인 페이지로 이동');
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const ContentManagerRoute = ({ children }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <div>로딩 중...</div>
      </Box>
    );
  }
  
  if (!isAuthenticated()) {
    console.log('🔒 로그인이 필요한 페이지, 로그인 페이지로 이동');
    return <Navigate to="/login" replace />;
  }
  
  // 콘텐츠 관리자 이상 권한 필요
  if (!hasRole(USER_ROLES.CONTENT_MANAGER)) {
    console.log('❌ 콘텐츠 관리자 권한 필요');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <div>콘텐츠 관리자 권한이 필요합니다.</div>
      </Box>
    );
  }
  
  return children;
};

const AdminRoute = ({ children }) => {
  const { isAuthenticated, loading, hasRole } = useAuth();
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <div>로딩 중...</div>
      </Box>
    );
  }
  
  if (!isAuthenticated()) {
    console.log('🔒 로그인이 필요한 페이지, 로그인 페이지로 이동');
    return <Navigate to="/login" replace />;
  }
  
  // 관리자 권한 필요
  if (!hasRole(USER_ROLES.ADMIN)) {
    console.log('❌ 관리자 권한 필요');
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <div>관리자 권한이 필요합니다.</div>
      </Box>
    );
  }
  
  return children;
};

// AWS 테마 설정
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF9900', // AWS Orange
      light: '#FFB84D',
      dark: '#E68A00',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#232F3E', // AWS Dark Blue
      light: '#4A5568',
      dark: '#1A202C',
      contrastText: '#FFFFFF',
    },
    background: {
      default: '#F7FAFC',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#2D3748',
      secondary: '#4A5568',
    },
  },
  typography: {
    fontFamily: ['Amazon Ember', 'Helvetica Neue', 'Arial', 'sans-serif'].join(','),
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
  },
});

function App() {
  console.log('🚀 [App] 전체 기능 버전 렌더링 시작');
console.log('🔥🔥🔥 [App] 코드 버전 확인: v3.0 - 직접 IP 테스트');
console.log('🔥🔥🔥 [App] 이 로그가 보이지 않으면 캐시 문제입니다!');
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AnalyticsProvider>
        <AuthProvider>
          <ContentProvider>
            <Router>
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column',
                minHeight: '100vh'
              }}>
                <Header />
                <Box sx={{ flexGrow: 1 }}>
                  <Routes>
                    {/* 🌐 비회원 접근 가능한 페이지들 */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/category/:category" element={<CategoryPage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/content/:id" element={<ContentDetailPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    
                    {/* 👤 로그인 필요한 페이지들 */}
                    <Route 
                      path="/profile" 
                      element={
                        <AuthRequiredRoute>
                          <ProfilePage />
                        </AuthRequiredRoute>
                      } 
                    />
                    
                    {/* ✏️ 콘텐츠 관리자 이상 권한 필요한 페이지들 */}
                    <Route 
                      path="/upload" 
                      element={
                        <ContentManagerRoute>
                          <ContentUploadPage />
                        </ContentManagerRoute>
                      } 
                    />
                    <Route 
                      path="/content/:id/edit" 
                      element={
                        <ContentManagerRoute>
                          <ContentEditPage />
                        </ContentManagerRoute>
                      } 
                    />
                    
                    {/* 👑 관리자 권한 필요한 페이지들 */}
                    <Route 
                      path="/admin" 
                      element={
                        <AdminRoute>
                          <AdminPage />
                        </AdminRoute>
                      } 
                    />
                  </Routes>
                </Box>
                <Footer />
                <AccessPurposeModal />
              </Box>
            </Router>
          </ContentProvider>
        </AuthProvider>
      </AnalyticsProvider>
    </ThemeProvider>
  );
}

export default App;
