#!/usr/bin/env node

// 손상된 콘텐츠 데이터 수정 스크립트

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');

// AWS 설정
const getAWSCredentials = () => {
  try {
    const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
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
          region: 'ap-northeast-2'
        };
      }
    }
    
    throw new Error('AWS credentials를 찾을 수 없습니다');
  } catch (error) {
    console.error('❌ AWS 자격 증명 가져오기 실패:', error.message);
    process.exit(1);
  }
};

// DynamoDB 설정
const credentials = getAWSCredentials();
AWS.config.update(credentials);
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = 'DemoFactoryContents';
const BROKEN_CONTENT_ID = 'content-1754211022768';

async function fixBrokenContent() {
  try {
    console.log('🔍 손상된 콘텐츠 조회 중...');
    
    // 현재 콘텐츠 데이터 조회
    const getParams = {
      TableName: TABLE_NAME,
      Key: { id: BROKEN_CONTENT_ID }
    };
    
    const result = await dynamodb.get(getParams).promise();
    
    if (!result.Item) {
      console.log('❌ 콘텐츠를 찾을 수 없습니다:', BROKEN_CONTENT_ID);
      return;
    }
    
    console.log('📄 현재 콘텐츠 데이터:');
    console.log('- 제목:', result.Item.title);
    console.log('- 내용:', result.Item.content);
    console.log('- 파일 수:', result.Item.files?.length || 0);
    
    // 손상된 콘텐츠 수정
    const updatedContent = result.Item.content.replace(/\[image:undefined\]/g, '');
    const updatedFiles = result.Item.files?.filter(file => 
      file && file.name && file.name !== 'undefined'
    ) || [];
    
    console.log('🔧 콘텐츠 수정 중...');
    console.log('- 수정된 내용:', updatedContent);
    console.log('- 수정된 파일 수:', updatedFiles.length);
    
    // DynamoDB 업데이트
    const updateParams = {
      TableName: TABLE_NAME,
      Key: { id: BROKEN_CONTENT_ID },
      UpdateExpression: 'SET content = :content, files = :files, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':content': updatedContent,
        ':files': updatedFiles,
        ':updatedAt': new Date().toISOString()
      }
    };
    
    await dynamodb.update(updateParams).promise();
    
    console.log('✅ 콘텐츠 수정 완료!');
    console.log('🎯 이제 해당 콘텐츠 페이지에 정상 접근 가능합니다.');
    
  } catch (error) {
    console.error('❌ 콘텐츠 수정 실패:', error);
  }
}

// 스크립트 실행
console.log('🚑 손상된 콘텐츠 수정 스크립트 시작...');
fixBrokenContent().then(() => {
  console.log('🎉 스크립트 완료!');
  process.exit(0);
}).catch(error => {
  console.error('💥 스크립트 실행 실패:', error);
  process.exit(1);
});