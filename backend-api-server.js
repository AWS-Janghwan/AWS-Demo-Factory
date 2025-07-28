const express = require('express');
const cors = require('cors');
const AWS = require('aws-sdk');
const multer = require('multer');
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
      region: process.env.REACT_APP_AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-northeast-2'
    };
  } catch (error) {
    console.error('❌ AWS 자격 증명 가져오기 실패:', error.message);
    
    // 환경 변수 fallback
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ 환경 변수에서 AWS 자격 증명 사용');
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.REACT_APP_AWS_REGION || process.env.AWS_DEFAULT_REGION || 'ap-northeast-2'
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

// AWS 설정은 initializeAWS()에서 이미 완료됨

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

// 파일 업로드를 위한 multer 설정
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB 제한
  },
  fileFilter: (req, file, cb) => {
    // 파일 확장자 기반 검증 (더 안전하고 정확함)
    const fileName = file.originalname.toLowerCase();
    const allowedExtensions = [
      // 이미지
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
      // 비디오
      '.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv',
      // 오디오
      '.mp3', '.wav', '.ogg',
      // 문서
      '.pdf', '.txt', '.md', '.doc', '.docx'
    ];
    
    const hasAllowedExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (hasAllowedExtension) {
      console.log(`✅ [백엔드] 파일 타입 허용: ${file.originalname} (${file.mimetype})`);
      cb(null, true);
    } else {
      console.log(`❌ [백엔드] 파일 타입 거부: ${file.originalname} (${file.mimetype})`);
      cb(new Error(`허용되지 않는 파일 형식: ${fileName}`), false);
    }
  }
});

// 안전한 S3 파일 업로드 엔드포인트
app.post('/api/upload/secure', upload.single('file'), async (req, res) => {
  try {
    console.log('🔒 [백엔드] 안전한 파일 업로드 시작');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: '업로드할 파일이 없습니다'
      });
    }
    
    // 로컬 AWS credentials 로드
    const credentials = getLocalCredentials();
    
    // S3 인스턴스 생성
    const s3 = new AWS.S3({
      region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    
    // 안전한 파일명 생성
    const timestamp = Date.now();
    const safeFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileExtension = path.extname(safeFileName);
    const baseName = path.basename(safeFileName, fileExtension);
    
    // 날짜 기반 경로 생성
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // 파일 타입에 따른 경로 분류
    let folder = 'documents';
    if (req.file.mimetype.startsWith('image/')) {
      folder = 'images';
    } else if (req.file.mimetype.startsWith('video/')) {
      folder = 'videos';
    } else if (req.file.mimetype.startsWith('audio/')) {
      folder = 'audio';
    }
    
    const s3Key = `contents/${folder}/${year}/${month}/${day}/${timestamp}-${baseName}${fileExtension}`;
    
    // S3에 파일 업로드
    const uploadParams = {
      Bucket: process.env.REACT_APP_S3_BUCKET || 'demo-factory-storage-bucket',
      Key: s3Key,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      Metadata: {
        'original-name': req.file.originalname,
        'upload-timestamp': new Date().toISOString(),
        'content-id': req.body.contentId || 'unknown'
      }
    };
    
    console.log(`📁 [백엔드] S3 업로드 시작: ${s3Key}`);
    const uploadResult = await s3.upload(uploadParams).promise();
    
    // 업로드 성공 응답
    const fileInfo = {
      id: `file-${timestamp}`,
      name: req.file.originalname,
      safeName: `${baseName}${fileExtension}`,
      size: req.file.size,
      type: req.file.mimetype,
      s3Key: s3Key,
      s3Bucket: uploadParams.Bucket,
      url: uploadResult.Location,
      isSecure: true,
      uploadedAt: new Date().toISOString(),
      contentId: req.body.contentId || null
    };
    
    console.log('✅ [백엔드] 파일 업로드 성공:', fileInfo.name);
    
    res.json({
      success: true,
      file: fileInfo
    });
    
  } catch (error) {
    console.error('❌ [백엔드] 파일 업로드 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DynamoDB에 콘텐츠 저장 엔드포인트
app.post('/api/content/save', async (req, res) => {
  try {
    console.log('💾 [백엔드] 콘텐츠 DynamoDB 저장 시작');
    
    const contentData = req.body;
    
    if (!contentData.title || !contentData.content) {
      return res.status(400).json({
        success: false,
        error: '제목과 내용은 필수입니다'
      });
    }
    
    // 로컬 AWS credentials 로드
    const credentials = getLocalCredentials();
    
    // DynamoDB 인스턴스 생성
    const dynamodb = new AWS.DynamoDB.DocumentClient({
      region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    
    // 콘텐츠 데이터 준비
    const item = {
      ...contentData,
      id: contentData.id || `content-${Date.now()}`,
      createdAt: contentData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      // GSI를 위한 추가 필드
      categoryCreatedAt: `${contentData.category}#${contentData.createdAt || new Date().toISOString()}`,
      authorCreatedAt: `${contentData.author}#${contentData.createdAt || new Date().toISOString()}`
    };
    
    const params = {
      TableName: process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents',
      Item: item
    };
    
    console.log(`📁 [백엔드] DynamoDB 저장 시작: ${item.id}`);
    await dynamodb.put(params).promise();
    
    console.log('✅ [백엔드] 콘텐츠 DynamoDB 저장 성공:', item.title);
    
    res.json({
      success: true,
      content: item
    });
    
  } catch (error) {
    console.error('❌ [백엔드] 콘텐츠 저장 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DynamoDB에서 콘텐츠 조회 엔드포인트
app.get('/api/content/list', async (req, res) => {
  try {
    console.log('📁 [백엔드] 콘텐츠 목록 조회 시작');
    
    // 로컬 AWS credentials 로드
    const credentials = getLocalCredentials();
    
    // DynamoDB 인스턴스 생성
    const dynamodb = new AWS.DynamoDB.DocumentClient({
      region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    
    const params = {
      TableName: process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents'
    };
    
    const result = await dynamodb.scan(params).promise();
    
    console.log(`✅ [백엔드] 콘텐츠 목록 조회 성공: ${result.Items?.length || 0}개`);
    
    res.json({
      success: true,
      contents: result.Items || []
    });
    
  } catch (error) {
    console.error('❌ [백엔드] 콘텐츠 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// S3 파일 목록 조회 엔드포인트
app.get('/api/s3/files', async (req, res) => {
  try {
    console.log('📁 [백엔드] S3 파일 목록 조회 시작');
    
    // 로컬 AWS credentials 로드
    const credentials = getLocalCredentials();
    
    // S3 인스턴스 생성
    const s3 = new AWS.S3({
      region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory',
      Prefix: 'contents/'
    };
    
    const data = await s3.listObjectsV2(params).promise();
    
    const files = data.Contents
      .filter(obj => obj.Size > 0) // 폴더 제외
      .map(obj => {
        const key = obj.Key;
        const fileName = key.split('/').pop();
        const fileExtension = fileName.split('.').pop().toLowerCase();
        
        // 파일 타입 결정
        let fileType = 'document';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(fileExtension)) {
          fileType = 'image';
        } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(fileExtension)) {
          fileType = 'video';
        } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(fileExtension)) {
          fileType = 'audio';
        }
        
        return {
          id: key,
          name: fileName,
          s3Key: key,
          size: obj.Size,
          lastModified: obj.LastModified,
          type: fileType,
          url: null // Presigned URL은 별도로 생성
        };
      });
    
    console.log(`✅ [백엔드] S3에서 ${files.length}개 파일 조회 완료`);
    
    res.json({
      success: true,
      files: files
    });
    
  } catch (error) {
    console.error('❌ [백엔드] S3 파일 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// S3 파일 직접 스트리밍 엔드포인트
app.get('/api/s3/file/:encodedKey', async (req, res) => {
  try {
    const s3Key = decodeURIComponent(req.params.encodedKey);
    console.log(`📁 [백엔드] S3 파일 스트리밍: ${s3Key}`);
    
    // 로컬 AWS credentials 로드
    const credentials = getLocalCredentials();
    
    // S3 인스턴스 생성
    const s3 = new AWS.S3({
      region: process.env.REACT_APP_AWS_REGION || 'ap-northeast-2',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory',
      Key: s3Key
    };
    
    // S3 객체 메타데이터 가져오기
    const headResult = await s3.headObject(params).promise();
    
    // 적절한 Content-Type 설정
    res.set({
      'Content-Type': headResult.ContentType || 'application/octet-stream',
      'Content-Length': headResult.ContentLength,
      'Cache-Control': 'public, max-age=31536000', // 1년 캐시
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    
    // S3 객체 스트리밍
    const stream = s3.getObject(params).createReadStream();
    stream.pipe(res);
    
    stream.on('error', (error) => {
      console.error('❌ [백엔드] S3 스트리밍 오류:', error);
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    console.log(`✅ [백엔드] S3 파일 스트리밍 시작: ${s3Key}`);
    
  } catch (error) {
    console.error('❌ [백엔드] S3 파일 스트리밍 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// S3 Presigned URL 생성 엔드포인트 (POST로 변경)
app.post('/api/s3/presigned-url', async (req, res) => {
  try {
    const { s3Key } = req.body;
    
    if (!s3Key) {
      return res.status(400).json({
        success: false,
        error: 'S3 키가 필요합니다'
      });
    }
    const expiresIn = parseInt(req.body.expires) || 3600; // 1시간 기본
    
    console.log(`🔗 [백엔드] S3 Presigned URL 생성: ${s3Key}`);
    
    // 로컬 AWS credentials 로드
    const credentials = getLocalCredentials();
    
    // S3 인스턴스 생성
    const s3 = new AWS.S3({
      region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      sessionToken: credentials.sessionToken
    });
    
    const params = {
      Bucket: process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory',
      Key: s3Key,
      Expires: expiresIn
    };
    
    const presignedUrl = await s3.getSignedUrlPromise('getObject', params);
    
    console.log(`✅ [백엔드] Presigned URL 생성 성공: ${s3Key}`);
    
    res.json({
      success: true,
      url: presignedUrl,
      s3Key: s3Key,
      expiresIn: expiresIn
    });
    
  } catch (error) {
    console.error('❌ [백엔드] Presigned URL 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 분석 데이터 저장 엔드포인트
app.post('/api/analytics/track', async (req, res) => {
  try {
    console.log('📊 [백엔드] 분석 데이터 저장 시작');
    
    const { eventType, data, timestamp } = req.body;
    
    if (!eventType || !data) {
      return res.status(400).json({
        success: false,
        error: '이벤트 타입과 데이터가 필요합니다'
      });
    }
    
    const dynamoParams = {
      TableName: 'DemoFactoryAnalytics',
      Item: {
        id: `${eventType}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        eventType: eventType,
        data: data,
        timestamp: timestamp || new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString()
      }
    };
    
    await dynamodb.put(dynamoParams).promise();
    
    console.log(`✅ [백엔드] 분석 데이터 저장 성공: ${eventType}`);
    
    res.json({
      success: true,
      message: '분석 데이터 저장 성공',
      eventType: eventType
    });
    
  } catch (error) {
    console.error('❌ [백엔드] 분석 데이터 저장 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 분석 데이터 조회 엔드포인트
app.get('/api/analytics/data', async (req, res) => {
  try {
    console.log('📊 [백엔드] 분석 데이터 조회 시작');
    
    const { eventType, startDate, endDate } = req.query;
    
    let params = {
      TableName: 'DemoFactoryAnalytics'
    };
    
    // 이벤트 타입별 필터링
    if (eventType) {
      params.FilterExpression = 'eventType = :eventType';
      params.ExpressionAttributeValues = {
        ':eventType': eventType
      };
    }
    
    // 날짜 범위 필터링 (추후 GSI로 개선 가능)
    if (startDate || endDate) {
      let dateFilter = '';
      if (startDate && endDate) {
        dateFilter = '#date BETWEEN :startDate AND :endDate';
        params.ExpressionAttributeValues = {
          ...params.ExpressionAttributeValues,
          ':startDate': startDate,
          ':endDate': endDate
        };
      } else if (startDate) {
        dateFilter = '#date >= :startDate';
        params.ExpressionAttributeValues = {
          ...params.ExpressionAttributeValues,
          ':startDate': startDate
        };
      } else if (endDate) {
        dateFilter = '#date <= :endDate';
        params.ExpressionAttributeValues = {
          ...params.ExpressionAttributeValues,
          ':endDate': endDate
        };
      }
      
      if (params.FilterExpression) {
        params.FilterExpression += ' AND ' + dateFilter;
      } else {
        params.FilterExpression = dateFilter;
      }
      
      params.ExpressionAttributeNames = {
        '#date': 'date'
      };
    }
    
    const result = await dynamodb.scan(params).promise();
    
    console.log(`✅ [백엔드] 분석 데이터 조회 성공: ${result.Items.length}건`);
    
    res.json({
      success: true,
      data: result.Items,
      count: result.Items.length
    });
    
  } catch (error) {
    console.error('❌ [백엔드] 분석 데이터 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 메일 발송 API (AWS SES 사용) - server.js에서 복사한 완전한 로직
app.post('/api/send-inquiry', async (req, res) => {
  try {
    console.log('📧 [백엔드] 문의 메일 발송 시작');
    
    const { name, email, company, inquiryType, subject, message } = req.body;

    // 입력 검증
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        status: 'error',
        message: '필수 항목이 누락되었습니다.'
      });
    }

    // 문의 유형 한글 변환
    const inquiryTypeMap = {
      'technical': '기술 문의',
      'pricing': '가격 문의',
      'demo': '데모 요청',
      'partnership': '파트너십 문의',
      'other': '기타'
    };

    const inquiryTypeKorean = inquiryTypeMap[inquiryType] || inquiryType || '미지정';

    // HTML 이메일 템플릿 (표 형식) - server.js에서 복사
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #232F3E; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">AWS Demo Factory - 지원 문의</h1>
        </div>
        
        <div style="padding: 20px; background-color: #f9f9f9;">
          <p style="font-size: 16px; color: #333;">새로운 지원 문의가 접수되었습니다.</p>
          
          <table style="width: 100%; border-collapse: collapse; background-color: white; margin: 20px 0;">
            <tr style="background-color: #f1f1f1;">
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold; width: 30%;">항목</td>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">내용</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">이름</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">이메일</td>
              <td style="padding: 12px; border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">회사명</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${company || '미입력'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">문의 유형</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${inquiryTypeKorean}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">제목</td>
              <td style="padding: 12px; border: 1px solid #ddd; font-weight: bold;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9; vertical-align: top;">문의 내용</td>
              <td style="padding: 12px; border: 1px solid #ddd; white-space: pre-wrap;">${message}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #ddd; background-color: #f9f9f9;">접수 시간</td>
              <td style="padding: 12px; border: 1px solid #ddd;">${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</td>
            </tr>
          </table>
          
          <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-left: 4px solid #2196F3;">
            <p style="margin: 0; color: #1976D2;">
              <strong>답변 방법:</strong> 위 이메일 주소로 직접 답변하시면 됩니다.
            </p>
          </div>
        </div>
        
        <div style="background-color: #232F3E; color: white; padding: 15px; text-align: center; font-size: 12px;">
          <p style="margin: 0;">AWS Demo Factory | Powered by Amazon Web Services</p>
        </div>
      </div>
    `;

    // 텍스트 버전 (HTML을 지원하지 않는 클라이언트용)
    const textContent = `
AWS Demo Factory - 지원 문의

새로운 지원 문의가 접수되었습니다.

=== 문의 정보 ===
이름: ${name}
이메일: ${email}
회사명: ${company || '미입력'}
문의 유형: ${inquiryTypeKorean}
제목: ${subject}
접수 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}

=== 문의 내용 ===
${message}

답변은 위 이메일 주소로 직접 보내주시면 됩니다.
    `;

    // AWS SES 이메일 파라미터
    const params = {
      Source: process.env.SES_FROM_EMAIL || 'noreply@aws-demo-factory.com',
      Destination: {
        ToAddresses: ['janghwan@amazon.com']
      },
      Message: {
        Subject: {
          Data: `[AWS Demo Factory] ${inquiryTypeKorean} - ${subject}`,
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8'
          },
          Text: {
            Data: textContent,
            Charset: 'UTF-8'
          }
        }
      },
      ReplyToAddresses: [email]
    };

    // AWS SES 인스턴스 생성 (로컬 credentials 사용)
    const credentials = getLocalCredentials();
    const ses = new AWS.SES({
      region: process.env.AWS_REGION || 'ap-northeast-2',
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    });
    
    // AWS SES로 이메일 발송
    const result = await ses.sendEmail(params).promise();
    
    console.log('✅ [백엔드] 메일 발송 성공:', result.MessageId);

    res.json({
      status: 'success',
      message: '문의가 성공적으로 전송되었습니다.',
      messageId: result.MessageId
    });

  } catch (error) {
    console.error('❌ [백엔드] AWS SES 메일 발송 오류:', error);
    
    // AWS SES 특정 에러 처리
    let errorMessage = '메일 발송 중 오류가 발생했습니다.';
    
    if (error.code === 'MessageRejected') {
      errorMessage = '이메일 주소가 확인되지 않았습니다. 관리자에게 문의하세요.';
    } else if (error.code === 'SendingPausedException') {
      errorMessage = '메일 발송이 일시 중단되었습니다. 잠시 후 다시 시도해주세요.';
    } else if (error.code === 'MailFromDomainNotVerifiedException') {
      errorMessage = '발신 도메인이 확인되지 않았습니다. 관리자에게 문의하세요.';
    }

    res.status(500).json({
      status: 'error',
      message: errorMessage,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Backend API server running on port ${PORT}`);
});

module.exports = app;
