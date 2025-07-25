const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// 로컬 AWS credentials 읽기 함수
const getLocalCredentials = () => {
  try {
    const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
    const profileName = process.env.AWS_PROFILE || 'default';
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`AWS credentials 파일을 찾을 수 없습니다: ${credentialsPath}`);
    }

    const content = fs.readFileSync(credentialsPath, 'utf8');
    const profiles = {};
    let currentProfile = null;

    content.split('\n').forEach(line => {
      line = line.trim();
      
      if (line.startsWith('[') && line.endsWith(']')) {
        currentProfile = line.slice(1, -1);
        profiles[currentProfile] = {};
      } else if (line.includes('=') && currentProfile) {
        const [key, value] = line.split('=').map(s => s.trim());
        profiles[currentProfile][key] = value;
      }
    });

    if (!profiles[profileName]) {
      throw new Error(`AWS 프로필 '${profileName}'을 찾을 수 없습니다`);
    }

    const profile = profiles[profileName];
    
    if (!profile.aws_access_key_id || !profile.aws_secret_access_key) {
      throw new Error('AWS 자격 증명이 완전하지 않습니다');
    }

    console.log(`✅ AWS 자격 증명 로드 성공 (프로필: ${profileName})`);
    
    return {
      accessKeyId: profile.aws_access_key_id,
      secretAccessKey: profile.aws_secret_access_key,
      region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
    };
  } catch (error) {
    console.error('❌ AWS 자격 증명 가져오기 실패:', error.message);
    
    // 환경 변수 fallback
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ 환경 변수에서 AWS 자격 증명 사용');
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
      };
    }
    
    throw error;
  }
};

// AWS 설정 초기화
const initializeAWS = () => {
  try {
    console.log('🔐 AWS 백엔드 서비스 초기화 중...');
    
    const credentials = getLocalCredentials();
    
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region
    });
    
    console.log('✅ AWS 백엔드 서비스 초기화 완료:', {
      region: credentials.region
    });
    
    return true;
  } catch (error) {
    console.error('❌ AWS 백엔드 서비스 초기화 실패:', error);
    throw error;
  }
};

// AWS 초기화 실행
initializeAWS();

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'https://demofactory.cloud',
    'https://www.demofactory.cloud'
  ],
  credentials: true
}));

app.use(express.json());

// AWS 설정
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

// Cognito Identity Provider 설정
const cognitoIdp = new AWS.CognitoIdentityServiceProvider({
  region: process.env.REACT_APP_COGNITO_REGION || 'us-west-2'
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'AWS Demo Factory Backend API'
  });
});

// Cognito 사용자 목록 조회 API
app.get('/api/cognito/users', async (req, res) => {
  try {
    console.log('👥 Cognito 사용자 목록 조회 API 호출');
    
    const params = {
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      Limit: 60
    };
    
    const result = await cognitoIdp.listUsers(params).promise();
    console.log('📋 사용자 목록 조회 성공:', result.Users.length, '명');
    
    // 각 사용자의 그룹 정보도 함께 조회
    const usersWithGroups = await Promise.all(
      result.Users.map(async (cognitoUser) => {
        // 사용자 속성 파싱
        const attributes = {};
        cognitoUser.Attributes.forEach(attr => {
          attributes[attr.Name] = attr.Value;
        });
        
        // 사용자 그룹 정보 가져오기
        let groups = [];
        try {
          const groupParams = {
            UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
            Username: cognitoUser.Username
          };
          const groupResult = await cognitoIdp.adminListGroupsForUser(groupParams).promise();
          groups = groupResult.Groups.map(group => group.GroupName);
        } catch (groupError) {
          console.error('그룹 정보 조회 실패:', groupError);
        }
        
        // 역할 결정
        const role = groups.includes('Admin') ? 'Admin' :
                    groups.includes('ContentManager') ? 'Content Manager' :
                    'Viewer';
        
        return {
          id: cognitoUser.Username,
          username: cognitoUser.Username,
          name: attributes.name || 'Unknown',
          email: attributes.email || 'No Email',
          role: role,
          groups: groups,
          status: cognitoUser.UserStatus,
          enabled: cognitoUser.Enabled,
          createdAt: cognitoUser.UserCreateDate ? 
            new Date(cognitoUser.UserCreateDate).toLocaleDateString('ko-KR') : 'Unknown',
          lastModified: cognitoUser.UserLastModifiedDate ?
            new Date(cognitoUser.UserLastModifiedDate).toLocaleDateString('ko-KR') : 'Unknown'
        };
      })
    );
    
    res.json({
      success: true,
      users: usersWithGroups
    });
    
  } catch (error) {
    console.error('❌ Cognito 사용자 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 역할 변경 API
app.post('/api/cognito/users/:username/role', async (req, res) => {
  try {
    const { username } = req.params;
    const { newRole } = req.body;
    
    console.log(`🔄 사용자 ${username}의 역할을 ${newRole}로 변경 시작`);
    
    // 기존 그룹에서 제거
    const groupParams = {
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      Username: username
    };
    
    const currentGroups = await cognitoIdp.adminListGroupsForUser(groupParams).promise();
    
    for (const group of currentGroups.Groups) {
      await cognitoIdp.adminRemoveUserFromGroup({
        UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
        Username: username,
        GroupName: group.GroupName
      }).promise();
    }
    
    // 새 그룹에 추가
    let targetGroup = null;
    switch (newRole) {
      case 'Admin':
        targetGroup = 'Admin';
        break;
      case 'Content Manager':
        targetGroup = 'ContentManager';
        break;
      default:
        // Viewer는 그룹 없음
        break;
    }
    
    if (targetGroup) {
      await cognitoIdp.adminAddUserToGroup({
        UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
        Username: username,
        GroupName: targetGroup
      }).promise();
    }
    
    res.json({
      success: true,
      message: `사용자 ${username}의 역할이 ${newRole}로 변경되었습니다.`
    });
    
  } catch (error) {
    console.error('❌ 사용자 역할 변경 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 삭제 API
app.delete('/api/cognito/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`🗑️ 사용자 ${username} 삭제 시작`);
    
    await cognitoIdp.adminDeleteUser({
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      Username: username
    }).promise();
    
    res.json({
      success: true,
      message: `사용자 ${username}이 성공적으로 삭제되었습니다.`
    });
    
  } catch (error) {
    console.error('❌ 사용자 삭제 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 비밀번호 초기화 API
app.post('/api/cognito/users/:username/reset-password', async (req, res) => {
  try {
    const { username } = req.params;
    
    console.log(`🔑 사용자 ${username} 비밀번호 초기화 시작`);
    
    // 임시 비밀번호 생성
    const generateTempPassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
      let password = '';
      
      // 각 카테고리에서 최소 1개씩
      password += 'ABCDEFGHJKLMNPQRSTUVWXYZ'[Math.floor(Math.random() * 25)]; // 대문자
      password += 'abcdefghijkmnpqrstuvwxyz'[Math.floor(Math.random() * 25)]; // 소문자
      password += '23456789'[Math.floor(Math.random() * 8)]; // 숫자
      password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // 특수문자
      
      // 나머지 4자리 랜덤
      for (let i = 0; i < 4; i++) {
        password += chars[Math.floor(Math.random() * chars.length)];
      }
      
      return password.split('').sort(() => Math.random() - 0.5).join('');
    };
    
    const tempPassword = generateTempPassword();
    
    await cognitoIdp.adminSetUserPassword({
      UserPoolId: process.env.REACT_APP_COGNITO_USER_POOL_ID,
      Username: username,
      Password: tempPassword,
      Permanent: false
    }).promise();
    
    res.json({
      success: true,
      message: `사용자 ${username}의 비밀번호가 초기화되었습니다.`,
      tempPassword: tempPassword
    });
    
  } catch (error) {
    console.error('❌ 비밀번호 초기화 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on port ${PORT}`);
});

module.exports = app;
