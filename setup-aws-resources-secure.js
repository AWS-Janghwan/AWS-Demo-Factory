#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config();

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

// AWS 설정 (로컬 credentials 사용)
const credentials = getLocalCredentials();
AWS.config.update({
  region: credentials.region,
  accessKeyId: credentials.accessKeyId,
  secretAccessKey: credentials.secretAccessKey
});

console.log('🚀 AWS Demo Factory 리소스 설정 시작...');
console.log(`📍 리전: ${credentials.region}`);

// AWS 서비스 클라이언트 초기화
const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();

// 설정 상수
const BUCKET_NAME = 'demo-factory-storage-bucket';
const TABLE_NAME = 'DemoFactoryContents';

// S3 버킷 생성
async function createS3Bucket() {
  try {
    console.log(`📦 S3 버킷 생성 중: ${BUCKET_NAME}`);
    
    // 버킷 존재 여부 확인
    try {
      await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
      console.log(`✅ S3 버킷이 이미 존재합니다: ${BUCKET_NAME}`);
      return;
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
    }

    // 버킷 생성
    const bucketParams = {
      Bucket: BUCKET_NAME,
      CreateBucketConfiguration: {
        LocationConstraint: credentials.region
      }
    };

    await s3.createBucket(bucketParams).promise();
    console.log(`✅ S3 버킷 생성 완료: ${BUCKET_NAME}`);

    // CORS 설정
    const corsParams = {
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };

    await s3.putBucketCors(corsParams).promise();
    console.log('✅ S3 CORS 설정 완료');

  } catch (error) {
    console.error('❌ S3 버킷 생성 실패:', error);
    throw error;
  }
}

// DynamoDB 테이블 생성
async function createDynamoDBTable() {
  try {
    console.log(`🗄️ DynamoDB 테이블 생성 중: ${TABLE_NAME}`);
    
    // 테이블 존재 여부 확인
    try {
      await dynamodb.describeTable({ TableName: TABLE_NAME }).promise();
      console.log(`✅ DynamoDB 테이블이 이미 존재합니다: ${TABLE_NAME}`);
      return;
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // 테이블 생성
    const tableParams = {
      TableName: TABLE_NAME,
      KeySchema: [
        {
          AttributeName: 'id',
          KeyType: 'HASH'
        }
      ],
      AttributeDefinitions: [
        {
          AttributeName: 'id',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    await dynamodb.createTable(tableParams).promise();
    console.log(`✅ DynamoDB 테이블 생성 완료: ${TABLE_NAME}`);

    // 테이블 활성화 대기
    await dynamodb.waitFor('tableExists', { TableName: TABLE_NAME }).promise();
    console.log('✅ DynamoDB 테이블 활성화 완료');

  } catch (error) {
    console.error('❌ DynamoDB 테이블 생성 실패:', error);
    throw error;
  }
}

// 메인 실행 함수
async function main() {
  try {
    console.log('🔐 AWS 자격 증명 확인 완료');
    console.log('🚀 AWS 리소스 설정 시작...\n');

    await createS3Bucket();
    await createDynamoDBTable();

    console.log('\n🎉 모든 AWS 리소스 설정 완료!');
    console.log('\n📋 생성된 리소스:');
    console.log(`   📦 S3 버킷: ${BUCKET_NAME}`);
    console.log(`   🗄️ DynamoDB 테이블: ${TABLE_NAME}`);
    console.log(`   📍 리전: ${credentials.region}`);
    
    console.log('\n✅ 이제 애플리케이션을 시작할 수 있습니다!');

  } catch (error) {
    console.error('\n❌ AWS 리소스 설정 실패:', error);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}
