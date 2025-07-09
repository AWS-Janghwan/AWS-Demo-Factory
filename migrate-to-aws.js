#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// AWS 설정
AWS.config.update({
  region: process.env.AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const dynamodb = new AWS.DynamoDB.DocumentClient();
const dynamodbService = new AWS.DynamoDB(); // 테이블 관리용

const S3_BUCKET = process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory';
const DYNAMODB_TABLE = process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents';

// 샘플 데이터 (localStorage에서 가져올 수 없는 경우 사용)
const sampleContents = [
  {
    id: 'content-1',
    title: "Amazon Bedrock을 활용한 생성형 AI 애플리케이션 구축",
    description: "Amazon Bedrock을 사용하여 생성형 AI 기반 챗봇과 콘텐츠 생성 애플리케이션을 구축하는 방법을 단계별로 설명합니다.",
    content: `# Amazon Bedrock을 활용한 생성형 AI 애플리케이션 구축

## 개요
Amazon Bedrock은 AWS에서 제공하는 완전 관리형 서비스로, 다양한 파운데이션 모델(Foundation Models)을 통해 생성형 AI 애플리케이션을 쉽게 구축할 수 있습니다.

## 주요 기능
- **다양한 모델 지원**: Claude, Llama, Titan 등 여러 파운데이션 모델
- **서버리스 아키텍처**: 인프라 관리 없이 AI 기능 구현
- **보안 및 프라이버시**: 데이터 암호화 및 VPC 지원

## 구현 예제
\`\`\`python
import boto3

bedrock = boto3.client('bedrock-runtime')

response = bedrock.invoke_model(
    modelId='anthropic.claude-v2',
    body=json.dumps({
        'prompt': 'AWS에 대해 설명해주세요',
        'max_tokens_to_sample': 300
    })
)
\`\`\`

## 활용 사례
1. **고객 서비스 챗봇**
2. **콘텐츠 자동 생성**
3. **코드 리뷰 및 생성**
4. **문서 요약 및 분석**`,
    category: "Generative AI",
    tags: ["Amazon Bedrock", "생성형 AI", "Claude", "챗봇"],
    author: "AWS Demo Factory",
    createdAt: "2024-12-01T10:00:00.000Z",
    updatedAt: "2024-12-01T10:00:00.000Z",
    views: 245,
    likes: 18,
    likedBy: ["user1", "user2", "user3"],
    files: []
  },
  {
    id: 'content-2',
    title: "AWS Lambda와 API Gateway를 활용한 서버리스 아키텍처",
    description: "서버리스 아키텍처의 핵심인 AWS Lambda와 API Gateway를 사용하여 확장 가능한 웹 애플리케이션을 구축하는 방법을 알아봅니다.",
    content: `# AWS Lambda와 API Gateway를 활용한 서버리스 아키텍처

## 서버리스 아키텍처란?
서버리스 아키텍처는 서버 관리 없이 애플리케이션을 실행할 수 있는 클라우드 컴퓨팅 모델입니다.

## 주요 구성 요소
- **AWS Lambda**: 이벤트 기반 컴퓨팅 서비스
- **API Gateway**: RESTful API 관리 서비스
- **DynamoDB**: NoSQL 데이터베이스
- **S3**: 정적 웹사이트 호스팅

## 아키텍처 다이어그램
\`\`\`
Client → API Gateway → Lambda → DynamoDB
                    ↓
                   S3 (Static Files)
\`\`\`

## Lambda 함수 예제
\`\`\`javascript
exports.handler = async (event) => {
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};
\`\`\`

## 장점
1. **비용 효율성**: 사용한 만큼만 지불
2. **자동 확장**: 트래픽에 따른 자동 스케일링
3. **관리 부담 감소**: 서버 관리 불필요
4. **빠른 배포**: 코드 변경 시 즉시 반영`,
    category: "Manufacturing",
    tags: ["AWS Lambda", "API Gateway", "서버리스", "아키텍처"],
    author: "AWS Solutions Architect",
    createdAt: "2024-11-28T14:30:00.000Z",
    updatedAt: "2024-11-28T14:30:00.000Z",
    views: 189,
    likes: 12,
    likedBy: ["user4", "user5"],
    files: []
  },
  {
    id: 'content-3',
    title: "Amazon S3와 CloudFront를 활용한 글로벌 콘텐츠 배포",
    description: "Amazon S3와 CloudFront CDN을 사용하여 전 세계 사용자에게 빠르고 안정적으로 콘텐츠를 배포하는 방법을 설명합니다.",
    content: `# Amazon S3와 CloudFront를 활용한 글로벌 콘텐츠 배포

## 개요
Amazon S3와 CloudFront를 결합하면 전 세계 어디서나 빠른 속도로 콘텐츠를 제공할 수 있습니다.

## S3 (Simple Storage Service)
- **무제한 저장 공간**: 확장 가능한 객체 스토리지
- **11 9's 내구성**: 99.999999999% 데이터 내구성
- **다양한 스토리지 클래스**: Standard, IA, Glacier 등

## CloudFront CDN
- **글로벌 엣지 로케이션**: 전 세계 400+ 엣지 로케이션
- **캐싱 최적화**: 정적/동적 콘텐츠 캐싱
- **보안 기능**: AWS WAF, SSL/TLS 지원

## 아키텍처 설계
\`\`\`
User → CloudFront → S3 Bucket
     ↓
   Edge Cache
\`\`\`

## 설정 예제
\`\`\`bash
# S3 버킷 생성
aws s3 mb s3://my-global-content

# CloudFront 배포 생성
aws cloudfront create-distribution \\
  --distribution-config file://distribution-config.json
\`\`\`

## 성능 최적화 팁
1. **적절한 캐시 정책 설정**
2. **압축 활성화**
3. **HTTP/2 지원**
4. **Origin Shield 사용**

## 비용 최적화
- **S3 Intelligent Tiering** 사용
- **CloudFront 사용량 기반 요금제** 선택
- **불필요한 데이터 전송 최소화**`,
    category: "Retail/CPG",
    tags: ["Amazon S3", "CloudFront", "CDN", "글로벌 배포"],
    author: "AWS Cloud Engineer",
    createdAt: "2024-11-25T09:15:00.000Z",
    updatedAt: "2024-11-25T09:15:00.000Z",
    views: 156,
    likes: 8,
    likedBy: ["user6", "user7", "user8"],
    files: []
  }
];

async function uploadFileToS3(filePath, key) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️ 파일이 존재하지 않음: ${filePath}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath);
    const stats = fs.statSync(filePath);
    
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: fileContent,
      ContentType: getContentType(filePath),
      Metadata: {
        'original-name': path.basename(filePath),
        'upload-timestamp': new Date().toISOString(),
        'migration-source': 'localStorage'
      }
    };

    console.log(`📤 S3 업로드 중: ${key} (${(stats.size / 1024 / 1024).toFixed(2)}MB)`);
    
    const result = await s3.upload(params).promise();
    console.log(`✅ S3 업로드 완료: ${key}`);
    
    return {
      s3Key: result.Key,
      s3Bucket: result.Bucket,
      url: result.Location,
      size: stats.size,
      type: getContentType(filePath),
      name: path.basename(filePath)
    };
  } catch (error) {
    console.error(`❌ S3 업로드 실패 (${key}):`, error.message);
    return null;
  }
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  return contentTypes[ext] || 'application/octet-stream';
}

async function saveToDynamoDB(content) {
  try {
    const item = {
      ...content,
      // GSI를 위한 복합 키 추가
      categoryCreatedAt: `${content.category}#${content.createdAt}`,
      authorCreatedAt: `${content.author}#${content.createdAt}`,
      // 검색을 위한 추가 필드
      searchText: `${content.title} ${content.description} ${content.tags.join(' ')}`.toLowerCase()
    };

    const params = {
      TableName: DYNAMODB_TABLE,
      Item: item
    };

    await dynamodb.put(params).promise();
    console.log(`✅ DynamoDB 저장 완료: ${content.id}`);
    return item;
  } catch (error) {
    console.error(`❌ DynamoDB 저장 실패 (${content.id}):`, error.message);
    throw error;
  }
}

async function migrateLocalFiles() {
  const localFilesDir = path.join(__dirname, 'public', 'contents');
  const migratedFiles = [];

  if (!fs.existsSync(localFilesDir)) {
    console.log('📁 로컬 파일 디렉토리가 없습니다. 샘플 데이터만 마이그레이션합니다.');
    return migratedFiles;
  }

  console.log('📁 로컬 파일 마이그레이션 시작...');

  const scanDirectory = async (dir, prefix = '') => {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        await scanDirectory(itemPath, `${prefix}${item}/`);
      } else {
        const s3Key = `contents/${prefix}${item}`;
        const uploadResult = await uploadFileToS3(itemPath, s3Key);
        
        if (uploadResult) {
          migratedFiles.push(uploadResult);
        }
      }
    }
  };

  await scanDirectory(localFilesDir);
  console.log(`✅ 로컬 파일 마이그레이션 완료: ${migratedFiles.length}개 파일`);
  
  return migratedFiles;
}

async function loadLocalStorageData() {
  // 실제 환경에서는 브라우저의 localStorage에서 데이터를 가져와야 합니다.
  // 여기서는 백업 파일이나 샘플 데이터를 사용합니다.
  
  const backupFiles = [
    path.join(__dirname, 'backups', 'localStorage-backup.json'),
    path.join(__dirname, 'content-backup.json'),
    path.join(__dirname, 'demo-factory-contents.json')
  ];

  for (const backupFile of backupFiles) {
    if (fs.existsSync(backupFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        console.log(`📦 백업 파일에서 데이터 로드: ${backupFile}`);
        return Array.isArray(data) ? data : data.contents || [];
      } catch (error) {
        console.log(`⚠️ 백업 파일 읽기 실패: ${backupFile}`);
      }
    }
  }

  console.log('📋 백업 파일이 없어 샘플 데이터를 사용합니다.');
  return sampleContents;
}

async function migrateContent(content, migratedFiles) {
  try {
    console.log(`🔄 콘텐츠 마이그레이션 중: ${content.title}`);

    // 파일 정보 업데이트
    const updatedFiles = [];
    
    if (content.files && content.files.length > 0) {
      for (const file of content.files) {
        if (file.isLocal && file.localPath) {
          // 로컬 파일을 S3에 업로드
          const s3Key = `contents/migrated/${Date.now()}-${file.name}`;
          const uploadResult = await uploadFileToS3(file.localPath, s3Key);
          
          if (uploadResult) {
            updatedFiles.push({
              ...file,
              ...uploadResult,
              isLocal: false
            });
          }
        } else if (file.url && file.url.startsWith('blob:')) {
          // Blob URL은 마이그레이션할 수 없으므로 제거
          console.log(`⚠️ Blob URL 파일 제거: ${file.name}`);
        } else {
          // 이미 S3에 있는 파일이거나 외부 URL
          updatedFiles.push(file);
        }
      }
    }

    // 마이그레이션된 파일 중에서 이 콘텐츠와 관련된 파일 찾기
    const relatedFiles = migratedFiles.filter(file => 
      file.name.includes(content.id) || 
      file.s3Key.includes(content.id.toString())
    );
    
    updatedFiles.push(...relatedFiles);

    const migratedContent = {
      ...content,
      files: updatedFiles,
      migratedAt: new Date().toISOString(),
      migrationSource: 'localStorage'
    };

    await saveToDynamoDB(migratedContent);
    console.log(`✅ 콘텐츠 마이그레이션 완료: ${content.title}`);
    
    return migratedContent;
  } catch (error) {
    console.error(`❌ 콘텐츠 마이그레이션 실패 (${content.title}):`, error.message);
    throw error;
  }
}

async function verifyMigration() {
  try {
    console.log('🔍 마이그레이션 검증 중...');

    // DynamoDB에서 모든 아이템 조회
    const params = {
      TableName: DYNAMODB_TABLE
    };

    const result = await dynamodb.scan(params).promise();
    const items = result.Items || [];

    console.log(`📊 마이그레이션 결과:`);
    console.log(`  - 총 콘텐츠 수: ${items.length}개`);
    
    const categories = {};
    const authors = {};
    let totalFiles = 0;

    items.forEach(item => {
      categories[item.category] = (categories[item.category] || 0) + 1;
      authors[item.author] = (authors[item.author] || 0) + 1;
      totalFiles += (item.files || []).length;
    });

    console.log(`  - 총 파일 수: ${totalFiles}개`);
    console.log(`  - 카테고리별 분포:`);
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`    * ${category}: ${count}개`);
    });

    console.log(`  - 작성자별 분포:`);
    Object.entries(authors).forEach(([author, count]) => {
      console.log(`    * ${author}: ${count}개`);
    });

    return { success: true, totalItems: items.length, totalFiles };
  } catch (error) {
    console.error('❌ 마이그레이션 검증 실패:', error.message);
    return { success: false, error: error.message };
  }
}

async function createMigrationReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    migration: {
      totalContents: results.contents.length,
      successfulContents: results.contents.filter(c => c.success).length,
      failedContents: results.contents.filter(c => !c.success).length,
      totalFiles: results.files.length,
      successfulFiles: results.files.filter(f => f.success).length,
      failedFiles: results.files.filter(f => !f.success).length
    },
    verification: results.verification,
    errors: results.errors || []
  };

  const reportPath = path.join(__dirname, `migration-report-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`📋 마이그레이션 리포트 생성: ${reportPath}`);
  return report;
}

async function main() {
  try {
    console.log('🚀 localStorage → AWS 마이그레이션 시작\n');

    // 1. AWS 연결 테스트
    console.log('🔍 AWS 연결 테스트...');
    await s3.headBucket({ Bucket: S3_BUCKET }).promise();
    await dynamodbService.describeTable({ TableName: DYNAMODB_TABLE }).promise();
    console.log('✅ AWS 연결 성공\n');

    // 2. 로컬 파일 마이그레이션
    const migratedFiles = await migrateLocalFiles();
    console.log();

    // 3. localStorage 데이터 로드
    console.log('📦 localStorage 데이터 로드 중...');
    const localContents = await loadLocalStorageData();
    console.log(`✅ ${localContents.length}개 콘텐츠 로드 완료\n`);

    // 4. 콘텐츠 마이그레이션
    console.log('🔄 콘텐츠 마이그레이션 시작...');
    const migrationResults = {
      contents: [],
      files: migratedFiles.map(f => ({ ...f, success: true })),
      errors: []
    };

    for (const content of localContents) {
      try {
        const migratedContent = await migrateContent(content, migratedFiles);
        migrationResults.contents.push({ 
          id: content.id, 
          title: content.title, 
          success: true 
        });
      } catch (error) {
        migrationResults.contents.push({ 
          id: content.id, 
          title: content.title, 
          success: false, 
          error: error.message 
        });
        migrationResults.errors.push({
          contentId: content.id,
          error: error.message
        });
      }
    }

    console.log();

    // 5. 마이그레이션 검증
    const verification = await verifyMigration();
    migrationResults.verification = verification;
    console.log();

    // 6. 리포트 생성
    const report = await createMigrationReport(migrationResults);
    console.log();

    // 7. 결과 요약
    console.log('🎉 마이그레이션 완료!');
    console.log(`
📊 마이그레이션 결과:
  ✅ 성공한 콘텐츠: ${report.migration.successfulContents}개
  ❌ 실패한 콘텐츠: ${report.migration.failedContents}개
  📁 마이그레이션된 파일: ${report.migration.successfulFiles}개
  
🎯 다음 단계:
  1. 앱 재시작: ./start-dev.sh
  2. 브라우저에서 http://localhost:3000 접속
  3. 콘텐츠가 정상적으로 로드되는지 확인
  4. 대용량 파일 업로드 테스트
  
💡 참고사항:
  - 기존 localStorage 데이터는 백업으로 보관됩니다
  - 이제 1GB 이상의 대용량 파일도 업로드 가능합니다
  - 데이터는 AWS에 안전하게 저장되어 손실 위험이 없습니다
    `);

    if (report.migration.failedContents > 0) {
      console.log('\n⚠️ 일부 콘텐츠 마이그레이션이 실패했습니다.');
      console.log('자세한 내용은 마이그레이션 리포트를 확인하세요.');
    }

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
