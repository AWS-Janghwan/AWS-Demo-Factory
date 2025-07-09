import React, { createContext, useState, useContext, useEffect } from 'react';

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  CONTENT_MANAGER: 'content_manager',
  CONTRIBUTOR: 'contributor', // 컨텐츠 업로더
  VIEWER: 'viewer' // 일반 사용자
};

// Create auth context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // Login function
  const login = (email, password) => {
    return new Promise((resolve, reject) => {
      // Simulate API call delay
      setTimeout(() => {
        // Simple validation
        if (!email || !password) {
          reject(new Error('이메일과 비밀번호를 입력해주세요'));
          return;
        }

        // Demo admin account
        let role = USER_ROLES.VIEWER; // 기본값: 일반 사용자
        if (email === 'admin@amazon.com') {
          role = USER_ROLES.ADMIN;
        } else if (email === 'janghwan@amazon.com') {
          role = USER_ROLES.ADMIN;
        }

        const user = {
          id: Date.now().toString(),
          email,
          name: email.split('@')[0],
          role,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };

        // Store user in state and localStorage
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        resolve(user);
      }, 1000);
    });
  };

  // Logout function
  const logout = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        setCurrentUser(null);
        localStorage.removeItem('currentUser');
        resolve();
      }, 500);
    });
  };

  // Register function
  const register = (userData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (!userData.email || !userData.password || !userData.name) {
          reject(new Error('모든 필수 필드를 입력해주세요'));
          return;
        }

        // 이메일 중복 체크 (간단한 로컬 체크)
        const existingUsers = JSON.parse(localStorage.getItem('demoFactoryUsers') || '[]');
        if (existingUsers.some(user => user.email === userData.email)) {
          reject(new Error('이미 등록된 이메일입니다'));
          return;
        }

        const user = {
          id: Date.now().toString(),
          email: userData.email,
          name: userData.name,
          company: userData.company || '',
          role: userData.role || USER_ROLES.VIEWER,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          approved: true // 모든 신규 가입자는 승인됨
        };

        // 사용자 목록에 추가
        const updatedUsers = [...existingUsers, user];
        localStorage.setItem('demoFactoryUsers', JSON.stringify(updatedUsers));

        // 현재 사용자로 설정
        setCurrentUser(user);
        localStorage.setItem('currentUser', JSON.stringify(user));
        resolve(user);
      }, 1000);
    });
  };

  // 프로필 업데이트 함수
  const updateUserProfile = async (profileData) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          if (!currentUser) {
            reject(new Error('로그인이 필요합니다'));
            return;
          }

          // 업데이트할 사용자 정보
          const updatedUser = {
            ...currentUser,
            name: profileData.name || currentUser.name,
            email: profileData.email || currentUser.email,
            bio: profileData.bio || currentUser.bio || '',
            updatedAt: new Date().toISOString()
          };

          // 로컬 스토리지의 사용자 목록 업데이트
          const existingUsers = JSON.parse(localStorage.getItem('demoFactoryUsers') || '[]');
          const updatedUsers = existingUsers.map(user => 
            user.id === currentUser.id ? updatedUser : user
          );
          localStorage.setItem('demoFactoryUsers', JSON.stringify(updatedUsers));

          // 현재 사용자 정보 업데이트
          setCurrentUser(updatedUser);
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));

          console.log('✅ 프로필 업데이트 성공:', updatedUser);
          resolve(updatedUser);
        } catch (error) {
          console.error('❌ 프로필 업데이트 오류:', error);
          reject(error);
        }
      }, 500);
    });
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    
    switch (permission) {
      case 'admin':
        return currentUser.role === USER_ROLES.ADMIN;
      case 'content_manage':
        return [USER_ROLES.ADMIN, USER_ROLES.CONTENT_MANAGER].includes(currentUser.role);
      case 'content_upload':
        return [USER_ROLES.ADMIN, USER_ROLES.CONTENT_MANAGER, USER_ROLES.CONTRIBUTOR].includes(currentUser.role);
      case 'content_create':
        return [USER_ROLES.ADMIN, USER_ROLES.CONTENT_MANAGER, USER_ROLES.CONTRIBUTOR].includes(currentUser.role);
      case 'view_analytics':
        return currentUser.role === USER_ROLES.ADMIN;
      case 'view_content':
        return true; // 모든 사용자가 콘텐츠 조회 가능
      default:
        return false;
    }
  };

  const value = {
    currentUser,
    login,
    logout,
    register,
    updateUserProfile,
    hasPermission,
    isAuthenticated: !!currentUser,
    USER_ROLES
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  return useContext(AuthContext);
};
