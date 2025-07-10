import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { 
  CognitoUserPool, 
  CognitoUser, 
  AuthenticationDetails,
  CognitoUserAttribute 
} from 'amazon-cognito-identity-js';
import AWS from 'aws-sdk';

// Cognito 설정
const poolData = {
  UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
  ClientId: process.env.REACT_APP_COGNITO_USER_POOL_CLIENT_ID
};

// 환경 변수 검증
if (!poolData.UserPoolId || !poolData.ClientId) {
  console.error('❌ Cognito 환경 변수가 설정되지 않았습니다!');
  console.error('UserPoolId:', poolData.UserPoolId);
  console.error('ClientId:', poolData.ClientId);
  throw new Error('Cognito 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.');
}

const userPool = new CognitoUserPool(poolData);

// AWS Cognito Identity 설정
AWS.config.update({
  region: process.env.REACT_APP_COGNITO_REGION,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID
  })
});

// 사용자 권한 정의
export const USER_ROLES = {
  ADMIN: 'Admin',
  CONTENT_MANAGER: 'Content Manager',
  ASSOCIATE_MEMBER: 'Associate Member',
  VIEWER: 'Viewer'
};

// AuthContext 생성
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [needsNewPassword, setNeedsNewPassword] = useState(false);
  const [tempCognitoUser, setTempCognitoUser] = useState(null);

  // 사용자 그룹 정보 가져오기 (JWT 토큰에서 추출)
  const getUserGroups = useCallback(async (session) => {
    try {
      if (!session) return [];
      
      // ID 토큰에서 그룹 정보 추출
      const idToken = session.getIdToken();
      const payload = idToken.payload;
      
      console.log('🔍 JWT 토큰 페이로드:', payload);
      
      // Cognito 그룹은 'cognito:groups' 클레임에 저장됨
      const groups = payload['cognito:groups'] || [];
      
      console.log('👥 사용자 그룹:', groups);
      return groups;
      
    } catch (error) {
      console.error('사용자 그룹 조회 실패:', error);
      return [];
    }
  }, []);

  // 현재 로그인된 사용자 확인 (useCallback으로 감싸서 의존성 문제 해결)
  const checkCurrentUser = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = userPool.getCurrentUser();
      
      if (currentUser) {
        // 세션 확인
        currentUser.getSession(async (err, session) => {
          if (err) {
            console.error('세션 확인 실패:', err);
            setUser(null);
            setLoading(false);
            return;
          }

          if (session.isValid()) {
            // 사용자 속성 가져오기
            currentUser.getUserAttributes(async (err, attributes) => {
              if (err) {
                console.error('사용자 속성 조회 실패:', err);
                setUser(null);
                setLoading(false);
              } else {
                const userInfo = parseUserAttributes(attributes);
                
                // 사용자 그룹 정보 가져오기
                const groups = await getUserGroups(session);
                
                setUser({
                  ...userInfo,
                  username: currentUser.getUsername(),
                  session: session,
                  groups: groups,
                  // 최고 권한 그룹을 role로 설정
                  role: groups.includes('Admin') ? USER_ROLES.ADMIN :
                        groups.includes('ContentManager') ? USER_ROLES.CONTENT_MANAGER :
                        USER_ROLES.VIEWER
                });
                
                console.log('✅ 사용자 로그인 확인:', {
                  email: userInfo.email,
                  name: userInfo.name,
                  groups: groups,
                  role: groups.includes('Admin') ? USER_ROLES.ADMIN :
                        groups.includes('ContentManager') ? USER_ROLES.CONTENT_MANAGER :
                        USER_ROLES.VIEWER
                });
                
                // AWS 자격 증명 업데이트
                updateAWSCredentials(session);
              }
              setLoading(false);
            });
          } else {
            setUser(null);
            setLoading(false);
          }
        });
      } else {
        // 로그인된 사용자가 없음
        console.log('ℹ️ 로그인된 사용자 없음 (비회원 상태)');
        setUser(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('현재 사용자 확인 실패:', error);
      setUser(null);
      setLoading(false);
    }
  }, [getUserGroups]); // useCallback 의존성 배열

  // 컴포넌트 마운트 시 현재 사용자 확인
  useEffect(() => {
    checkCurrentUser();
  }, [checkCurrentUser]);

  // 사용자 속성 파싱
  const parseUserAttributes = (attributes) => {
    const userInfo = {};
    attributes.forEach(attr => {
      switch (attr.getName()) {
        case 'email':
          userInfo.email = attr.getValue();
          break;
        case 'name':
          userInfo.name = attr.getValue();
          break;
        case 'custom:role':
          userInfo.role = attr.getValue();
          break;
        case 'custom:department':
          userInfo.department = attr.getValue();
          break;
        case 'sub':
          userInfo.id = attr.getValue();
          break;
        default:
          break;
      }
    });
    
    // 기본값 설정
    userInfo.role = userInfo.role || USER_ROLES.VIEWER;
    userInfo.department = userInfo.department || 'AWS';
    
    return userInfo;
  };

  // AWS 자격 증명 업데이트 (선택적)
  const updateAWSCredentials = (session) => {
    try {
      const idToken = session.getIdToken().getJwtToken();
      
      // Identity Pool이 설정되어 있을 때만 자격 증명 업데이트
      if (process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID) {
        AWS.config.credentials = new AWS.CognitoIdentityCredentials({
          IdentityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID,
          Logins: {
            [`cognito-idp.${process.env.REACT_APP_COGNITO_REGION}.amazonaws.com/${process.env.REACT_APP_COGNITO_USER_POOL_ID}`]: idToken
          }
        });

        // 자격 증명 새로고침 (오류가 발생해도 로그인 프로세스는 계속)
        // Identity Pool이 설정되지 않은 경우 건너뛰기
        if (AWS.config.credentials && typeof AWS.config.credentials.refresh === 'function') {
          AWS.config.credentials.refresh((error) => {
            if (error) {
              // Identity Pool 관련 오류는 무시 (선택적 기능)
              if (error.message && error.message.includes('IdentityPool')) {
                console.log('ℹ️ Identity Pool이 설정되지 않음 (선택적 기능, 무시됨)');
              } else {
                console.warn('⚠️ AWS 자격 증명 새로고침 실패 (선택적 기능):', error.message);
              }
            } else {
              console.log('✅ AWS 자격 증명 업데이트 완료');
            }
          });
        } else {
          console.log('ℹ️ AWS 자격 증명 새로고침 건너뜀 (Identity Pool 미설정)');
        }
      } else {
        console.log('ℹ️ Identity Pool이 설정되지 않음 - 기본 인증만 사용');
      }
    } catch (error) {
      console.warn('AWS 자격 증명 설정 중 오류 (선택적 기능):', error.message);
    }
  };

  // 로그인
  const signIn = async (email, password) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      const authenticationDetails = new AuthenticationDetails({
        Username: email,
        Password: password
      });

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });

      cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: async (session) => {
          console.log('로그인 성공:', session);
          
          // 사용자 속성 가져오기
          cognitoUser.getUserAttributes(async (err, attributes) => {
            if (err) {
              console.error('사용자 속성 조회 실패:', err);
              reject(err);
            } else {
              const userInfo = parseUserAttributes(attributes);
              
              // 사용자 그룹 정보 가져오기
              const groups = await getUserGroups(session);
              
              const userData = {
                ...userInfo,
                username: cognitoUser.getUsername(),
                session: session,
                groups: groups,
                // 최고 권한 그룹을 role로 설정
                role: groups.includes('Admin') ? USER_ROLES.ADMIN :
                      groups.includes('ContentManager') ? USER_ROLES.CONTENT_MANAGER :
                      USER_ROLES.VIEWER
              };
              
              setUser(userData);
              
              console.log('✅ 로그인 완료:', {
                email: userInfo.email,
                name: userInfo.name,
                groups: groups,
                role: userData.role
              });
              
              // AWS 자격 증명 업데이트 (비동기, 오류가 발생해도 로그인 완료)
              try {
                updateAWSCredentials(session);
              } catch (credError) {
                console.warn('AWS 자격 증명 업데이트 중 오류 (로그인은 성공):', credError.message);
              }
              
              setLoading(false);
              resolve(userData);
            }
          });
        },
        onFailure: (err) => {
          console.error('로그인 실패:', err);
          setError(err.message || '로그인에 실패했습니다.');
          setLoading(false);
          reject(err);
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          console.log('🔑 새 비밀번호 설정 필요:', userAttributes);
          setNeedsNewPassword(true);
          setTempCognitoUser(cognitoUser);
          setError('임시 비밀번호로 로그인되었습니다. 새 비밀번호를 설정해주세요.');
          setLoading(false);
          // resolve하지 않고 새 비밀번호 설정 대기
        }
      });
    });
  };

  // 회원가입
  const signUp = async (userData) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      console.log('🔍 [signUp] 받은 데이터:', userData);

      const { email, password, name, company, purpose, role = USER_ROLES.ASSOCIATE_MEMBER } = userData;

      console.log('🔍 [signUp] 추출된 값들:', { email, password: '***', name, company, purpose, role });

      // 필수 값 검증
      if (!email || !password || !name) {
        const errorMsg = '이메일, 비밀번호, 이름은 필수 입력 항목입니다.';
        console.error('❌ [signUp] 필수 값 누락:', { email: !!email, password: !!password, name: !!name });
        setError(errorMsg);
        setLoading(false);
        reject(new Error(errorMsg));
        return;
      }

      const attributeList = [
        new CognitoUserAttribute({
          Name: 'email',
          Value: email
        }),
        new CognitoUserAttribute({
          Name: 'name',
          Value: name
        })
        // custom attributes는 Cognito User Pool에서 설정이 필요하므로 일단 제거
        // 나중에 User Pool에서 custom:company, custom:purpose, custom:role 설정 후 추가 가능
      ];

      // email을 username으로 사용 (Cognito 요구사항)
      const username = email.trim();
      console.log('🔍 [signUp] 사용할 username:', username);

      userPool.signUp(username, password, attributeList, null, (err, result) => {
        if (err) {
          console.error('회원가입 실패:', err);
          setError(err.message || '회원가입에 실패했습니다.');
          setLoading(false);
          reject(err);
          return;
        }

        console.log('✅ 회원가입 성공:', result);
        console.log('📝 등록된 정보:', {
          email,
          name,
          company,
          purpose,
          role
        });
        setLoading(false);
        resolve(result.user);
      });
    });
  };

  // 이메일 인증
  const confirmSignUp = async (email, code) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });

      cognitoUser.confirmRegistration(code, true, (err, result) => {
        if (err) {
          console.error('이메일 인증 실패:', err);
          setError(err.message || '이메일 인증에 실패했습니다.');
          setLoading(false);
          reject(err);
          return;
        }

        console.log('이메일 인증 성공:', result);
        setLoading(false);
        resolve(result);
      });
    });
  };

  // 새 비밀번호 설정 (임시 비밀번호 사용 후)
  const setNewPassword = async (newPassword) => {
    return new Promise((resolve, reject) => {
      if (!tempCognitoUser) {
        reject(new Error('임시 사용자 정보가 없습니다.'));
        return;
      }

      setLoading(true);
      setError(null);

      tempCognitoUser.completeNewPasswordChallenge(newPassword, {}, {
        onSuccess: async (session) => {
          console.log('✅ 새 비밀번호 설정 성공:', session);
          
          // 사용자 속성 가져오기
          tempCognitoUser.getUserAttributes(async (err, attributes) => {
            if (err) {
              console.error('사용자 속성 조회 실패:', err);
              reject(err);
            } else {
              const userInfo = parseUserAttributes(attributes);
              
              // 사용자 그룹 정보 가져오기
              const groups = await getUserGroups(session);
              
              const userData = {
                ...userInfo,
                username: tempCognitoUser.getUsername(),
                session: session,
                groups: groups,
                role: groups.includes('Admin') ? USER_ROLES.ADMIN :
                      groups.includes('ContentManager') ? USER_ROLES.CONTENT_MANAGER :
                      USER_ROLES.VIEWER
              };
              
              setUser(userData);
              setNeedsNewPassword(false);
              setTempCognitoUser(null);
              
              console.log('✅ 로그인 완료 (새 비밀번호 설정 후):', {
                email: userInfo.email,
                name: userInfo.name,
                groups: groups,
                role: userData.role
              });
              
              // AWS 자격 증명 업데이트
              try {
                updateAWSCredentials(session);
              } catch (credError) {
                console.warn('AWS 자격 증명 업데이트 중 오류:', credError.message);
              }
              
              setLoading(false);
              resolve(userData);
            }
          });
        },
        onFailure: (err) => {
          console.error('❌ 새 비밀번호 설정 실패:', err);
          setError(err.message || '새 비밀번호 설정에 실패했습니다.');
          setLoading(false);
          reject(err);
        }
      });
    });
  };

  // 로그아웃
  const signOut = () => {
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    
    // AWS 자격 증명 초기화
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: process.env.REACT_APP_COGNITO_IDENTITY_POOL_ID
    });
    
    setUser(null);
    setError(null);
  };

  // 비밀번호 재설정 요청
  const forgotPassword = async (email) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });

      cognitoUser.forgotPassword({
        onSuccess: (data) => {
          console.log('비밀번호 재설정 이메일 발송:', data);
          setLoading(false);
          resolve(data);
        },
        onFailure: (err) => {
          console.error('비밀번호 재설정 실패:', err);
          setError(err.message || '비밀번호 재설정에 실패했습니다.');
          setLoading(false);
          reject(err);
        }
      });
    });
  };

  // 비밀번호 재설정 확인
  const confirmPassword = async (email, code, newPassword) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setError(null);

      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      });

      cognitoUser.confirmPassword(code, newPassword, {
        onSuccess: () => {
          console.log('비밀번호 재설정 완료');
          setLoading(false);
          resolve();
        },
        onFailure: (err) => {
          console.error('비밀번호 재설정 확인 실패:', err);
          setError(err.message || '비밀번호 재설정 확인에 실패했습니다.');
          setLoading(false);
          reject(err);
        }
      });
    });
  };

  // 사용자 권한 확인
  const hasRole = (requiredRole) => {
    if (!user) return false;
    
    const roleHierarchy = {
      [USER_ROLES.ADMIN]: 4,
      [USER_ROLES.CONTENT_MANAGER]: 3,
      [USER_ROLES.ASSOCIATE_MEMBER]: 2,
      [USER_ROLES.VIEWER]: 1
    };

    const userRoleLevel = roleHierarchy[user.role] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    return userRoleLevel >= requiredRoleLevel;
  };

  // 관리자 권한 확인
  const isAdmin = () => hasRole(USER_ROLES.ADMIN);

  // 콘텐츠 관리자 권한 확인
  const isContentManager = () => hasRole(USER_ROLES.CONTENT_MANAGER);

  // 로그인 상태 확인
  const isAuthenticated = () => !!user;

  const value = useMemo(() => ({
    user,
    loading,
    error,
    needsNewPassword,
    signIn,
    signUp,
    confirmSignUp,
    signOut,
    setNewPassword,
    forgotPassword,
    confirmPassword,
    hasRole,
    isAdmin,
    isContentManager,
    isAuthenticated,
    checkCurrentUser,
    // 사용자 역할 상수
    USER_ROLES
  }), [user, loading, error, needsNewPassword]);

  // 디버깅을 위한 전역 접근 설정
  useEffect(() => {
    window.authContext = value;
    return () => {
      delete window.authContext;
    };
  }, [value]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
