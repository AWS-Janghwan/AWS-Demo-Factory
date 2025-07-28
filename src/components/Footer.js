import React, { useState } from 'react';
import { Box, Container, Grid, Typography, Link as MuiLink, Divider } from '@mui/material';
import { Link } from 'react-router-dom';
import SupportInquiryModal from './SupportInquiryModal';

const Footer = () => {
  const [showInquiryModal, setShowInquiryModal] = useState(false);

  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#232F3E',
        color: 'white',
        py: 2.5, // 적절한 패딩
        mt: 'auto'
      }}
    >
      <Container maxWidth="lg">
        {/* 상단: 주요 정보 */}
        <Grid container spacing={3} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              AWS Demo Factory
            </Typography>
            <Typography variant="body2" sx={{ color: '#D5DBDB', fontSize: '0.85rem', lineHeight: 1.4 }}>
              AWS 클라우드 솔루션과 데모를 경험하고<br/>
              혁신의 가능성을 발견하세요
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              주요 카테고리
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.3 }}>
              <MuiLink component={Link} to="/category/genai" color="inherit" underline="hover" sx={{ fontSize: '0.8rem' }}>
                Generative AI
              </MuiLink>
              <MuiLink component={Link} to="/category/amazonq" color="inherit" underline="hover" sx={{ fontSize: '0.8rem' }}>
                Amazon Q
              </MuiLink>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={12} md={4}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              문의 및 지원
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <MuiLink 
                component="button"
                onClick={() => setShowInquiryModal(true)}
                color="inherit" 
                underline="hover" 
                sx={{ 
                  fontSize: '0.8rem',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: 0
                }}
              >
                📧 문의하기
              </MuiLink>
              <MuiLink 
                href="https://aws.amazon.com/ko/" 
                target="_blank" 
                color="inherit" 
                underline="hover" 
                sx={{ fontSize: '0.8rem' }}
              >
                🌐 AWS 공식 사이트
              </MuiLink>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.1)' }} />
        
        {/* 하단: 저작권 */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: { xs: 'center', sm: 'flex-start' },
          alignItems: 'center',
          pt: 1.5,
          gap: 1
        }}>
          <Typography variant="body2" sx={{ color: '#D5DBDB', fontSize: '0.75rem' }}>
            &copy; {new Date().getFullYear()} AWS Demo Factory. All rights reserved.
          </Typography>
        </Box>
      </Container>
      
      {/* 문의하기 모달 */}
      <SupportInquiryModal 
        open={showInquiryModal}
        onClose={() => setShowInquiryModal(false)}
      />
    </Box>
  );
};

export default Footer;
