#!/bin/bash

echo "🔧 Bedrock 서버 문법 오류 수정 중..."

# 백업 생성
cp server/bedrock-api.js server/bedrock-api.js.backup

# 문법 오류 수정 (중복 코드 제거)
cat > server/bedrock-api.js << 'EOF'
// Amazon Bedrock API 서버 (AWS credentials 사용)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const app = express();
const PORT = process.env.PORT || 5001;

// AWS credentials 로딩 함수 (로컬 credentials 우선)
const getAWSCredentials = () => {
  try {
    // 1. 로컬 credentials 파일 우선 확인 (배포 환경: /data/.aws/credentials, 로컬: ~/.aws/credentials)
    const credentialsPath = process.env.NODE_ENV === 'production' 
      ? '/data/.aws/credentials'
      : path.join(os.homedir(), '.aws', 'credentials');
    const profileName = process.env.AWS_PROFILE || 'default';
    
    if (fs.existsSync(credentialsPath)) {
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

      if (profiles[profileName] && profiles[profileName].aws_access_key_id) {
        console.log(`🔐 로컬 credentials 파일 사용 (프로필: ${profileName})`);
        return {
          accessKeyId: profiles[profileName].aws_access_key_id,
          secretAccessKey: profiles[profileName].aws_secret_access_key,
          region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
        };
      }
    }
    
    // 2. 환경 변수 확인
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('🔐 환경 변수에서 AWS 자격 증명 사용');
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
      };
    }
    
    // 3. EC2 인스턴스 프로필 확인 (배포 환경)
    if (process.env.NODE_ENV === 'production' || process.env.AWS_EXECUTION_ENV) {
      console.log('🔐 EC2 인스턴스 프로필 사용 (배포 환경)');
      return {
        region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
      };
    }
    
    // 4. 기본 AWS SDK 설정 사용 (EC2 인스턴스 프로필 등)
    console.log('🔐 기본 AWS SDK 설정 사용 (인스턴스 프로필 등)');
    return {
      region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
    };
    
  } catch (error) {
    console.error('❌ AWS 자격 증명 가져오기 실패:', error.message);
    // 기본 설정으로 fallback
    return {
      region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
    };
  }
};

// Bedrock 클라이언트 초기화
let bedrockClient;

const initializeBedrock = () => {
  try {
    console.log('🔐 Bedrock 서비스 초기화 중...');
    
    const credentials = getAWSCredentials();
    
    const clientConfig = {
      region: credentials.region
    };
    
    // credentials에 accessKeyId가 있으면 명시적 설정
    if (credentials.accessKeyId) {
      clientConfig.credentials = {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      };
      console.log('✅ 명시적 AWS 자격 증명으로 Bedrock 클라이언트 생성');
    } else {
      console.log('✅ EC2 인스턴스 프로필로 Bedrock 클라이언트 생성');
    }
    
    bedrockClient = new BedrockRuntimeClient(clientConfig);
    
    console.log('✅ Bedrock 서비스 초기화 완료:', { 
      region: credentials.region, 
      credentialType: credentials.accessKeyId ? 'explicit' : 'instance-profile' 
    });
    
    return bedrockClient;
    
  } catch (error) {
    console.error('❌ Bedrock 서비스 초기화 실패:', error.message);
    throw error;
  }
};

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://demofactory.cloud',
    'https://www.demofactory.cloud',
    'https://awsdemofactory.cloud',
    'https://www.awsdemofactory.cloud'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  maxAge: 86400
}));

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ extended: true, limit: '200mb' }));

// OPTIONS 요청 처리
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.sendStatus(200);
});

// 헬스체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'AWS Demo Factory Bedrock API',
    timestamp: new Date().toISOString(),
    region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
  });
});

// Bedrock 테스트 엔드포인트
app.get('/api/bedrock/test', async (req, res) => {
  try {
    if (!bedrockClient) {
      initializeBedrock();
    }

    const modelId = 'us.anthropic.claude-sonnet-4-20250514-v1:0';
    
    const command = new InvokeModelCommand({
      modelId: modelId,
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 100,
        messages: [
          {
            role: "user",
            content: "안녕하세요! 간단한 테스트 메시지입니다. 한국어로 짧게 응답해주세요."
          }
        ]
      }),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    res.json({
      success: true,
      message: 'Claude 4 Sonnet 연결 성공',
      model: modelId,
      region: process.env.AWS_DEFAULT_REGION || 'us-west-2',
      response: responseBody.content[0].text,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Bedrock 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Bedrock 연결 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Bedrock 분석 엔드포인트
app.post('/api/bedrock/analyze', async (req, res) => {
  try {
    if (!bedrockClient) {
      initializeBedrock();
    }

    const { prompt, maxTokens = 1000 } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: '프롬프트가 필요합니다'
      });
    }

    const modelId = 'us.anthropic.claude-sonnet-4-20250514-v1:0';
    
    const command = new InvokeModelCommand({
      modelId: modelId,
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ]
      }),
      contentType: 'application/json',
      accept: 'application/json'
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    res.json({
      success: true,
      response: responseBody.content[0].text,
      model: modelId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Bedrock 분석 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Bedrock 분석 실패',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 서버 시작
const startServer = async () => {
  try {
    // Bedrock 클라이언트 초기화
    await initializeBedrock();
    
    app.listen(PORT, () => {
      console.log(`🚀 Bedrock API server running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🤖 Test endpoint: http://localhost:${PORT}/api/bedrock/test`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

startServer();
EOF

echo "✅ Bedrock 서버 파일 수정 완료"

# Bedrock 서버 재시작
echo "🔄 Bedrock 서버 재시작 중..."
./unified-server-manager.sh restart bedrock

echo "🎯 Bedrock 서버 수정 및 재시작 완료!"
EOF