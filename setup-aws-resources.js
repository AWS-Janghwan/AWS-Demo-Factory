#!/usr/bin/env node

const AWS = require('aws-sdk');
require('dotenv').config();

// AWS 설정
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB();

const S3_BUCKET = process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory';
const DYNAMODB_TABLE = process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents';

async function createS3Bucket() {
  try {
    console.log(`🪣 S3 버킷 생성 중: ${S3_BUCKET}`);
    
    // 버킷 존재 확인
    try {
      await s3.headBucket({ Bucket: S3_BUCKET }).promise();
      console.log(`✅ S3 버킷이 이미 존재합니다: ${S3_BUCKET}`);
      return;
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
    }

    // 버킷 생성
    const createParams = {
      Bucket: S3_BUCKET,
      CreateBucketConfiguration: {
        LocationConstraint: process.env.AWS_REGION
      }
    };

    await s3.createBucket(createParams).promise();
    console.log(`✅ S3 버킷 생성 완료: ${S3_BUCKET}`);

    // CORS 설정
    const corsParams = {
      Bucket: S3_BUCKET,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000
          }
        ]
      }
    };

    await s3.putBucketCors(corsParams).promise();
    console.log('✅ S3 CORS 설정 완료');

    // 버전 관리 활성화
    const versioningParams = {
      Bucket: S3_BUCKET,
      VersioningConfiguration: {
        Status: 'Enabled'
      }
    };

    await s3.putBucketVersioning(versioningParams).promise();
    console.log('✅ S3 버전 관리 활성화 완료');

  } catch (error) {
    console.error('❌ S3 버킷 생성 실패:', error.message);
    throw error;
  }
}

async function createDynamoDBTable() {
  try {
    console.log(`🗄️ DynamoDB 테이블 생성 중: ${DYNAMODB_TABLE}`);

    // 테이블 존재 확인
    try {
      await dynamodb.describeTable({ TableName: DYNAMODB_TABLE }).promise();
      console.log(`✅ DynamoDB 테이블이 이미 존재합니다: ${DYNAMODB_TABLE}`);
      return;
    } catch (error) {
      if (error.code !== 'ResourceNotFoundException') {
        throw error;
      }
    }

    // 테이블 생성
    const params = {
      TableName: DYNAMODB_TABLE,
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
        },
        {
          AttributeName: 'category',
          AttributeType: 'S'
        },
        {
          AttributeName: 'createdAt',
          AttributeType: 'S'
        },
        {
          AttributeName: 'author',
          AttributeType: 'S'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: [
        {
          IndexName: 'CategoryIndex',
          KeySchema: [
            {
              AttributeName: 'category',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'createdAt',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        },
        {
          IndexName: 'AuthorIndex',
          KeySchema: [
            {
              AttributeName: 'author',
              KeyType: 'HASH'
            },
            {
              AttributeName: 'createdAt',
              KeyType: 'RANGE'
            }
          ],
          Projection: {
            ProjectionType: 'ALL'
          }
        }
      ],
      StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
      },
      Tags: [
        {
          Key: 'Project',
          Value: 'AWS-Demo-Factory'
        },
        {
          Key: 'Environment',
          Value: 'Development'
        }
      ]
    };

    await dynamodb.createTable(params).promise();
    console.log(`✅ DynamoDB 테이블 생성 완료: ${DYNAMODB_TABLE}`);

    // 테이블 활성화 대기
    console.log('⏳ 테이블 활성화 대기 중...');
    await dynamodb.waitFor('tableExists', { TableName: DYNAMODB_TABLE }).promise();
    console.log('✅ 테이블 활성화 완료');

  } catch (error) {
    console.error('❌ DynamoDB 테이블 생성 실패:', error.message);
    throw error;
  }
}

async function setupCloudFrontDistribution() {
  try {
    console.log('🌐 CloudFront 배포 설정 권장사항:');
    console.log(`
📋 CloudFront 수동 설정 가이드:
1. AWS Console → CloudFront → Create Distribution
2. Origin Domain: ${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com
3. Origin Path: /contents
4. Viewer Protocol Policy: Redirect HTTP to HTTPS
5. Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
6. Cache Policy: CachingOptimized
7. Origin Request Policy: CORS-S3Origin

💡 이렇게 하면 대용량 파일도 빠르게 전송됩니다!
    `);
  } catch (error) {
    console.error('CloudFront 설정 안내 실패:', error);
  }
}

async function createIAMPolicy() {
  try {
    console.log('🔐 필요한 IAM 권한:');
    console.log(`
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::${S3_BUCKET}",
        "arn:aws:s3:::${S3_BUCKET}/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan",
        "dynamodb:Query"
      ],
      "Resource": [
        "arn:aws:dynamodb:${process.env.AWS_REGION}:*:table/${DYNAMODB_TABLE}",
        "arn:aws:dynamodb:${process.env.AWS_REGION}:*:table/${DYNAMODB_TABLE}/index/*"
      ]
    }
  ]
}
    `);
  } catch (error) {
    console.error('IAM 정책 생성 실패:', error);
  }
}

async function testConnections() {
  try {
    console.log('🔍 연결 테스트 중...');

    // S3 테스트
    await s3.headBucket({ Bucket: S3_BUCKET }).promise();
    console.log('✅ S3 연결 성공');

    // DynamoDB 테스트
    await dynamodb.describeTable({ TableName: DYNAMODB_TABLE }).promise();
    console.log('✅ DynamoDB 연결 성공');

    console.log('🎉 모든 AWS 서비스 연결 성공!');
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 AWS Demo Factory 리소스 설정 시작\n');

    await createS3Bucket();
    console.log();

    await createDynamoDBTable();
    console.log();

    await setupCloudFrontDistribution();
    console.log();

    await createIAMPolicy();
    console.log();

    await testConnections();
    console.log();

    console.log('✅ AWS 리소스 설정 완료!');
    console.log(`
🎯 다음 단계:
1. 기존 데이터 마이그레이션: node migrate-to-aws.js
2. 앱 재시작: ./start-dev.sh
3. 대용량 파일 업로드 테스트

💰 예상 비용 (월간):
- S3: $2-5 (100GB 기준)
- DynamoDB: $1-3 (소규모 사용량)
- CloudFront: $1-2 (CDN 사용량)
- 총계: $4-10/월
    `);

  } catch (error) {
    console.error('❌ 설정 실패:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
