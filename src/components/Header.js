import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  useMediaQuery,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AddIcon from '@mui/icons-material/Add';
import SupportIcon from '@mui/icons-material/Support';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../context/AuthContextCognito';
import SupportInquiryModal from './SupportInquiryModal';

const Header = () => {
  const theme = useTheme();
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user, signOut, isAuthenticated, isAdmin, isContentManager } = useAuth();
  
  // Mobile drawer
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  
  // User menu
  const [anchorEl, setAnchorEl] = React.useState(null);
  const userMenuOpen = Boolean(anchorEl);

  // Handle mobile drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  // Handle user menu
  const handleUserMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleUserMenuClose();
    signOut();
    navigate('/');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Menu items data - updated categories
  const menuItems = [
    { name: 'Generative AI', path: '/category/generative-ai' },
    { name: 'Manufacturing', path: '/category/manufacturing' },
    { name: 'Retail/CPG', path: '/category/retail-cpg' },
    { name: 'Telco/Media', path: '/category/telco-media' },
    { name: 'Finance', path: '/category/finance' },
    { name: 'Amazon Q', path: '/category/amazon-q' },
    { name: 'ETC', path: '/category/etc' }
  ];

  return (
    <AppBar position="sticky" sx={{ 
      backgroundColor: '#232F3E',
      boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
    }}>
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {/* Logo and title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              <Box 
                component="img" 
                src="/aws-logo-emblem.png" 
                alt="AWS Logo" 
                sx={{ 
                  height: 40, 
                  mr: 1.5,
                  borderRadius: '4px'
                }}
              />
              <Typography
                variant="h6"
                noWrap
                sx={{
                  fontWeight: 700,
                  color: 'white',
                  textDecoration: 'none',
                }}
              >
                AWS Demo Factory
              </Typography>
            </Link>
            
            {/* Desktop Navigation - Moved to the left side */}
            {!isMobile && (
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 4 }}>
                {menuItems.map((menu) => (
                  <Button
                    key={menu.name}
                    component={Link}
                    to={menu.path}
                    color="inherit"
                    sx={{ 
                      mx: 0.5,
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.1)'
                      }
                    }}
                  >
                    {menu.name}
                  </Button>
                ))}
              </Box>
            )}
          </Box>

          {/* Search, Support, and Login buttons - Always on the right */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* AWS 지원 문의 버튼 */}
            <Button
              color="inherit"
              startIcon={<SupportIcon />}
              onClick={() => setSupportModalOpen(true)}
              sx={{ 
                ml: 1,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              {!isMobile && 'AWS 지원 문의'}
            </Button>
            
            <IconButton color="inherit" sx={{ ml: 1 }} component={Link} to="/search">
              <SearchIcon />
            </IconButton>
            
            {isAuthenticated() ? (
              <>
                {/* Create Content Button - Only visible when authenticated */}
                {!isMobile && isContentManager() && (
                  <Button 
                    component={Link} 
                    to="/upload" 
                    variant="contained"
                    color="secondary"
                    startIcon={<AddIcon />}
                    sx={{ 
                      ml: 1,
                      backgroundColor: '#FF9900',
                      '&:hover': {
                        backgroundColor: '#E88B00'
                      }
                    }}
                  >
                    Create Content
                  </Button>
                )}
                
                <Button
                  color="inherit"
                  onClick={handleUserMenuClick}
                  startIcon={
                    <Avatar 
                      sx={{ 
                        width: 28, 
                        height: 28, 
                        bgcolor: '#FF9900',
                        fontSize: '0.875rem',
                        fontWeight: 'bold'
                      }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </Avatar>
                  }
                  sx={{ ml: 1 }}
                >
                  {!isMobile && user?.name}
                </Button>
                <Menu
                  anchorEl={anchorEl}
                  open={userMenuOpen}
                  onClose={handleUserMenuClose}
                  MenuListProps={{
                    'aria-labelledby': 'user-menu-button',
                  }}
                >
                  <MenuItem onClick={handleUserMenuClose} component={Link} to="/profile">
                    <AccountCircleIcon fontSize="small" sx={{ mr: 1 }} />
                    프로필
                  </MenuItem>
                  {isAdmin() && (
                    <MenuItem onClick={handleUserMenuClose} component={Link} to="/admin">
                      <AdminPanelSettingsIcon fontSize="small" sx={{ mr: 1 }} />
                      관리자 페이지
                    </MenuItem>
                  )}
                  {isMobile && isContentManager() && (
                    <MenuItem onClick={handleUserMenuClose} component={Link} to="/upload">
                      <AddIcon fontSize="small" sx={{ mr: 1 }} />
                      콘텐츠 작성
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleLogout}>
                    <LogoutIcon fontSize="small" sx={{ mr: 1 }} />
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <Button 
                onClick={handleLogin}
                color="inherit"
                startIcon={<PersonIcon />}
                sx={{ ml: 1 }}
              >
                Login
              </Button>
            )}
            
            {/* Mobile menu button */}
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={toggleDrawer(true)}
                sx={{ ml: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </Container>

      {/* Mobile Navigation Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: '80%',
            maxWidth: '300px',
            backgroundColor: '#232F3E',
            color: 'white'
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
            AWS Demo Factory
          </Typography>
          
          <List>
            {menuItems.map((menu) => (
              <ListItem 
                button 
                key={menu.name}
                component={Link}
                to={menu.path}
                onClick={toggleDrawer(false)}
                sx={{ 
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <ListItemText primary={menu.name} />
              </ListItem>
            ))}
            
            {/* Contact 링크 추가 */}
            <ListItem 
              button 
              onClick={() => {
                toggleDrawer(false)();
                setSupportModalOpen(true);
              }}
              sx={{ 
                borderRadius: 1,
                mb: 0.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              <ListItemText primary="AWS 지원 문의" />
              <SupportIcon />
            </ListItem>
            
            {!isAuthenticated() ? (
              <ListItem 
                button 
                onClick={() => {
                  toggleDrawer(false)();
                  handleLogin();
                }}
                sx={{
                  borderRadius: 1,
                  mt: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)'
                  }
                }}
              >
                <ListItemText primary="Login" />
                <PersonIcon />
              </ListItem>
            ) : (
              <>
                {isContentManager() && (
                  <ListItem 
                    button 
                    component={Link} 
                    to="/upload"
                    onClick={toggleDrawer(false)}
                    sx={{
                      borderRadius: 1,
                      mt: 1,
                      backgroundColor: '#FF9900',
                      '&:hover': {
                        backgroundColor: '#E88B00'
                      }
                    }}
                  >
                    <ListItemText primary="Create Content" />
                    <AddIcon />
                  </ListItem>
                )}
                <ListItem 
                  button 
                  component={Link} 
                  to="/profile"
                  onClick={toggleDrawer(false)}
                  sx={{
                    borderRadius: 1,
                    mt: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <ListItemText primary="Profile" />
                  <AccountCircleIcon />
                </ListItem>
                <ListItem 
                  button 
                  onClick={() => {
                    toggleDrawer(false)();
                    handleLogout();
                  }}
                  sx={{
                    borderRadius: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.1)'
                    }
                  }}
                >
                  <ListItemText primary="Logout" />
                  <LogoutIcon />
                </ListItem>
              </>
            )}
          </List>
        </Box>
      </Drawer>
      
      {/* AWS 지원 문의 모달 */}
      <SupportInquiryModal 
        open={supportModalOpen} 
        onClose={() => setSupportModalOpen(false)} 
      />

      {/* Support Inquiry Modal */}
      <SupportInquiryModal 
        open={supportModalOpen} 
        onClose={() => setSupportModalOpen(false)} 
      />
    </AppBar>
  );
};

export default Header;
