import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Avatar, 
  Button, 
  Grid, 
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Edit as EditIcon,
  Article as ArticleIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Favorite as FavoriteIcon,
  CalendarToday as CalendarIcon,
  AccessTime as TimeIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContextCognito';
import { useContent } from '../context/ContentContextAWS';

const ProfilePage = () => {
  const { user } = useAuth();
  const { contents } = useContent();
  
  // 편집 상태 관리
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || ''
  });
  const [updateMessage, setUpdateMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 사용자 콘텐츠 통계
  const [userStats, setUserStats] = useState({
    totalContents: 0,
    totalViews: 0,
    totalLikes: 0,
    myContents: []
  });

  // 사용자 콘텐츠 통계 계산
  useEffect(() => {
    if (user && contents) {
      const myContents = contents.filter(content => 
        content.author === user.email || content.author === user.name
      );
      
      const totalViews = myContents.reduce((sum, content) => sum + (content.views || 0), 0);
      const totalLikes = myContents.reduce((sum, content) => sum + (content.likes || 0), 0);
      
      setUserStats({
        totalContents: myContents.length,
        totalViews,
        totalLikes,
        myContents: myContents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    }
  }, [user, contents]);

  // 편집 폼 변경 핸들러
  const handleEditFormChange = (field, value) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 프로필 업데이트 핸들러
  const handleUpdateProfile = async () => {
    setIsUpdating(true);
    setUpdateMessage('');
    
    try {
      // TODO: Cognito 프로필 업데이트 구현 필요
      console.log('프로필 업데이트 요청:', editForm);
      
      setUpdateMessage('프로필 업데이트 기능은 준비 중입니다.');
      setTimeout(() => {
        setEditDialogOpen(false);
        setUpdateMessage('');
      }, 2000);
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      setUpdateMessage('프로필 업데이트 중 오류가 발생했습니다.');
    } finally {
      setIsUpdating(false);
    }
  };

  // 편집 다이얼로그 열기
  const handleOpenEditDialog = () => {
    setEditForm({
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || ''
    });
    setEditDialogOpen(true);
    setUpdateMessage('');
  };
  
  // 권한 표시명 반환
  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'admin':
        return '관리자 (Admin)';
      case 'content_manager':
        return '콘텐츠 관리자 (Content Manager)';
      case 'contributor':
        return '컨텐츠 업로더 (Contributor)';
      case 'viewer':
        return '일반 사용자 (Viewer)';
      default:
        return '사용자';
    }
  };

  // 권한별 색상 반환
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'content_manager':
        return 'warning';
      case 'contributor':
        return 'success';
      case 'viewer':
        return 'info';
      default:
        return 'default';
    }
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString) => {
    if (!dateString) return '정보 없음';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '날짜 형식 오류';
    }
  };

  // 상대적 시간 표시 함수
  const getRelativeTime = (dateString) => {
    if (!dateString) return '정보 없음';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now - date;
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) return '오늘';
      if (diffInDays === 1) return '어제';
      if (diffInDays < 7) return `${diffInDays}일 전`;
      if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}주 전`;
      if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}개월 전`;
      return `${Math.floor(diffInDays / 365)}년 전`;
    } catch (error) {
      return '계산 오류';
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* 왼쪽 프로필 정보 */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2, mb: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '3rem'
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Typography variant="h5" gutterBottom>
                {user?.name || user?.email?.split('@')[0] || 'User'}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {user?.email || 'user@example.com'}
              </Typography>
              
              {/* 권한 배지 */}
              <Chip 
                label={getRoleDisplayName(user?.role)}
                color={getRoleColor(user?.role)}
                sx={{ mt: 1, mb: 2 }}
              />
              
              {/* 프로필 편집 버튼 */}
              <Button
                variant="outlined"
                startIcon={<EditIcon />}
                onClick={handleOpenEditDialog}
                sx={{ mt: 2 }}
              >
                프로필 편집
              </Button>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* 가입 정보 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <CalendarIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                가입 정보
              </Typography>
              <Box sx={{ ml: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>가입일:</strong> {formatDate(user?.createdAt || user?.signUpDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>마지막 로그인:</strong> {formatDate(user?.lastLogin || user?.lastSignInDate)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  <strong>활동 기간:</strong> {getRelativeTime(user?.createdAt || user?.signUpDate)}
                </Typography>
              </Box>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* 콘텐츠 통계 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                <BarChartIcon sx={{ mr: 1, fontSize: '1.2rem' }} />
                콘텐츠 통계
              </Typography>
              <Grid container spacing={2} sx={{ ml: 1 }}>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary.main" sx={{ fontWeight: 'bold' }}>
                      {userStats.totalContents}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      작성한 글
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="success.main" sx={{ fontWeight: 'bold' }}>
                      {userStats.totalViews}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      총 조회수
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={4}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="error.main" sx={{ fontWeight: 'bold' }}>
                      {userStats.totalLikes}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      총 좋아요
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            {/* 관심 태그 */}
            <Box>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                관심 태그
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                <Chip label="AWS" size="small" />
                <Chip label="Cloud Computing" size="small" />
                <Chip label="Serverless" size="small" />
                <Chip label="DevOps" size="small" />
                <Chip label="AI/ML" size="small" />
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* 오른쪽 콘텐츠 영역 */}
        <Grid item xs={12} md={8}>
          {/* 콘텐츠 통계 카드 */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={4}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <ArticleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    {userStats.totalContents}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    작성한 콘텐츠
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <ViewIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {userStats.totalViews}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    총 조회수
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Card sx={{ textAlign: 'center', p: 2 }}>
                <CardContent>
                  <FavoriteIcon sx={{ fontSize: 40, color: 'error.main', mb: 1 }} />
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'error.main' }}>
                    {userStats.totalLikes}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    받은 좋아요
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* 내가 작성한 콘텐츠 */}
          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ mb: 0 }}>
                내가 작성한 콘텐츠
              </Typography>
              <Button 
                variant="contained" 
                color="primary"
                component={RouterLink}
                to="/upload"
                startIcon={<ArticleIcon />}
              >
                새 콘텐츠 작성
              </Button>
            </Box>
            
            {userStats.myContents.length > 0 ? (
              <List>
                {userStats.myContents.slice(0, 5).map((content, index) => (
                  <ListItem 
                    key={content.id || index}
                    component={RouterLink}
                    to={`/content/${content.id}`}
                    sx={{ 
                      textDecoration: 'none', 
                      color: 'inherit',
                      borderRadius: 1,
                      mb: 1,
                      border: '1px solid',
                      borderColor: 'divider',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        borderColor: 'primary.main'
                      }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.light' }}>
                        <ArticleIcon />
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                            {content.title || `콘텐츠 ${index + 1}`}
                          </Typography>
                          <Chip 
                            label={content.category || 'General'} 
                            size="small" 
                            color="primary" 
                            variant="outlined" 
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {formatDate(content.createdAt)} • 조회수 {content.views || 0} • 좋아요 {content.likes || 0}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Tooltip title="조회수">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ViewIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {content.views || 0}
                                </Typography>
                              </Box>
                            </Tooltip>
                            <Tooltip title="좋아요">
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <FavoriteIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {content.likes || 0}
                                </Typography>
                              </Box>
                            </Tooltip>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ArticleIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" paragraph>
                  아직 작성한 콘텐츠가 없습니다
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  첫 번째 콘텐츠를 작성해보세요!
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  component={RouterLink}
                  to="/upload"
                  startIcon={<ArticleIcon />}
                  size="large"
                >
                  첫 콘텐츠 작성하기
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* 프로필 편집 다이얼로그 */}
      <Dialog 
        open={editDialogOpen} 
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <EditIcon sx={{ mr: 1 }} />
            프로필 편집
          </Box>
        </DialogTitle>
        <DialogContent>
          {updateMessage && (
            <Alert 
              severity={updateMessage.includes('성공') ? 'success' : 'error'} 
              sx={{ mb: 2 }}
            >
              {updateMessage}
            </Alert>
          )}
          
          <TextField
            fullWidth
            label="이름"
            value={editForm.name}
            onChange={(e) => handleEditFormChange('name', e.target.value)}
            margin="normal"
            variant="outlined"
          />
          
          <TextField
            fullWidth
            label="이메일"
            type="email"
            value={editForm.email}
            onChange={(e) => handleEditFormChange('email', e.target.value)}
            margin="normal"
            variant="outlined"
            disabled
            helperText="이메일은 변경할 수 없습니다"
          />
          
          <TextField
            fullWidth
            label="자기소개"
            multiline
            rows={3}
            value={editForm.bio}
            onChange={(e) => handleEditFormChange('bio', e.target.value)}
            margin="normal"
            variant="outlined"
            placeholder="자신에 대해 간단히 소개해주세요..."
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setEditDialogOpen(false)}
            startIcon={<CancelIcon />}
            disabled={isUpdating}
          >
            취소
          </Button>
          <Button 
            onClick={handleUpdateProfile}
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={isUpdating}
          >
            {isUpdating ? '저장 중...' : '저장'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
