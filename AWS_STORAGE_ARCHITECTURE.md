# AWS 기반 저장소 아키텍처

## 🎯 목표
- 1GB 이상 대용량 파일 지원
- 데이터 영속성 보장
- 확장 가능한 아키텍처
- 비용 효율적인 솔루션

## 🏗️ 권장 아키텍처

### 1. 하이브리드 저장 방식
```
┌─────────────────┐    ┌──────────────┐    ┌─────────────┐
│   Frontend      │    │   Backend    │    │    AWS      │
│   (React)       │    │  (Express)   │    │  Services   │
├─────────────────┤    ├──────────────┤    ├─────────────┤
│ • 메타데이터    │◄──►│ • API 서버   │◄──►│ • S3 (파일) │
│ • 캐시          │    │ • 인증       │    │ • DynamoDB  │
│ • UI 상태       │    │ • 파일 관리  │    │ • Cognito   │
└─────────────────┘    └──────────────┘    └─────────────┘
```

### 2. 데이터 분리 전략

#### 메타데이터 → DynamoDB
```json
{
  "id": "content-123",
  "title": "대용량 비디오 데모",
  "description": "...",
  "category": "Manufacturing",
  "tags": ["video", "demo"],
  "author": "user-456",
  "createdAt": "2024-12-01T10:00:00Z",
  "files": [
    {
      "id": "file-789",
      "name": "demo-video.mp4",
      "size": 1073741824,
      "type": "video/mp4",
      "s3Key": "contents/videos/demo-video-123.mp4",
      "s3Bucket": "aws-demo-factory-files"
    }
  ],
  "views": 245,
  "likes": 18
}
```

#### 파일 데이터 → S3
- 실제 파일 저장
- CDN 연동 (CloudFront)
- 자동 백업 및 버전 관리

## 🛠️ 구현 방안

### Phase 1: S3 + DynamoDB 기본 구조
```javascript
// src/services/awsStorage.js
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  region: process.env.REACT_APP_AWS_REGION,
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient({
  region: process.env.REACT_APP_AWS_REGION
});

// 대용량 파일 업로드 (Multipart Upload)
export const uploadLargeFile = async (file, onProgress) => {
  const params = {
    Bucket: 'aws-demo-factory-files',
    Key: `contents/${Date.now()}-${file.name}`,
    Body: file,
    ContentType: file.type
  };

  const upload = s3.upload(params);
  
  upload.on('httpUploadProgress', (progress) => {
    const percentage = Math.round((progress.loaded / progress.total) * 100);
    onProgress(percentage);
  });

  return upload.promise();
};

// 메타데이터 저장
export const saveContentMetadata = async (contentData) => {
  const params = {
    TableName: 'DemoFactoryContents',
    Item: {
      ...contentData,
      id: contentData.id || `content-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };

  return dynamodb.put(params).promise();
};
```

### Phase 2: 스트리밍 및 최적화
```javascript
// 대용량 파일 스트리밍 재생
export const getStreamingUrl = (s3Key) => {
  return s3.getSignedUrl('getObject', {
    Bucket: 'aws-demo-factory-files',
    Key: s3Key,
    Expires: 3600 // 1시간 유효
  });
};

// 썸네일 자동 생성 (Lambda)
export const generateThumbnail = async (s3Key) => {
  const lambda = new AWS.Lambda();
  
  const params = {
    FunctionName: 'generateThumbnail',
    Payload: JSON.stringify({ s3Key })
  };

  return lambda.invoke(params).promise();
};
```

## 💰 비용 분석

### S3 비용 (서울 리전)
- **저장 비용**: $0.025/GB/월
- **요청 비용**: $0.0005/1000 PUT, $0.0004/1000 GET
- **데이터 전송**: 첫 1GB 무료, 이후 $0.126/GB

### DynamoDB 비용
- **온디맨드**: $1.25/백만 쓰기, $0.25/백만 읽기
- **프로비저닝**: $0.65/WCU/월, $0.13/RCU/월

### 예상 월간 비용 (100GB 저장, 1000회 업로드/다운로드)
- **S3**: $2.5 (저장) + $1 (요청) = $3.5
- **DynamoDB**: $2 (메타데이터)
- **총계**: 약 $5.5/월

## 🚀 마이그레이션 계획

### 1단계: AWS 서비스 설정
```bash
# DynamoDB 테이블 생성
aws dynamodb create-table \
  --table-name DemoFactoryContents \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
  --key-schema \
    AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST

# S3 버킷 생성
aws s3 mb s3://aws-demo-factory-files --region ap-northeast-2
```

### 2단계: 기존 데이터 마이그레이션
```javascript
// migration/migrateToAWS.js
const migrateLocalStorageToAWS = async () => {
  const localContents = JSON.parse(
    localStorage.getItem('demoFactoryContents') || '[]'
  );

  for (const content of localContents) {
    // 1. 파일들을 S3에 업로드
    const updatedFiles = [];
    for (const file of content.files || []) {
      if (file.isLocal) {
        const s3Result = await uploadFileToS3(file);
        updatedFiles.push({
          ...file,
          s3Key: s3Result.Key,
          s3Bucket: s3Result.Bucket,
          isLocal: false
        });
      } else {
        updatedFiles.push(file);
      }
    }

    // 2. 메타데이터를 DynamoDB에 저장
    await saveContentMetadata({
      ...content,
      files: updatedFiles
    });
  }

  console.log('마이그레이션 완료!');
};
```

### 3단계: 프론트엔드 업데이트
```javascript
// src/context/ContentContext.js 업데이트
const ContentProvider = ({ children }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);

  // AWS에서 데이터 로드
  useEffect(() => {
    const loadContentsFromAWS = async () => {
      try {
        const response = await fetch('/api/contents');
        const awsContents = await response.json();
        setContents(awsContents);
      } catch (error) {
        console.error('AWS 데이터 로드 실패:', error);
        // 폴백: localStorage에서 로드
        loadFromLocalStorage();
      } finally {
        setLoading(false);
      }
    };

    loadContentsFromAWS();
  }, []);

  // 대용량 파일 업로드
  const addContentWithLargeFiles = async (contentData, files) => {
    setLoading(true);
    
    try {
      // 1. 파일들을 S3에 업로드
      const uploadedFiles = [];
      for (const file of files) {
        const result = await uploadLargeFile(file, (progress) => {
          console.log(`업로드 진행률: ${progress}%`);
        });
        
        uploadedFiles.push({
          name: file.name,
          size: file.size,
          type: file.type,
          s3Key: result.Key,
          s3Bucket: result.Bucket
        });
      }

      // 2. 메타데이터 저장
      const newContent = {
        ...contentData,
        files: uploadedFiles,
        id: `content-${Date.now()}`
      };

      await saveContentMetadata(newContent);
      
      // 3. 로컬 상태 업데이트
      setContents(prev => [newContent, ...prev]);
      
      return newContent;
    } catch (error) {
      console.error('콘텐츠 추가 실패:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ContentContext.Provider value={{
      contents,
      loading,
      addContentWithLargeFiles,
      // ... 기타 메서드들
    }}>
      {children}
    </ContentContext.Provider>
  );
};
```

## 🔧 대용량 파일 처리 최적화

### 1. 청크 업로드
```javascript
const uploadInChunks = async (file, chunkSize = 5 * 1024 * 1024) => {
  const chunks = Math.ceil(file.size / chunkSize);
  const uploadId = await initiateMultipartUpload(file.name);
  
  const uploadPromises = [];
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    uploadPromises.push(uploadChunk(chunk, i + 1, uploadId));
  }
  
  const parts = await Promise.all(uploadPromises);
  return completeMultipartUpload(uploadId, parts);
};
```

### 2. 프로그레시브 로딩
```javascript
const VideoPlayer = ({ s3Key }) => {
  const [streamingUrl, setStreamingUrl] = useState('');
  
  useEffect(() => {
    const getUrl = async () => {
      const url = await getStreamingUrl(s3Key);
      setStreamingUrl(url);
    };
    
    getUrl();
  }, [s3Key]);

  return (
    <video 
      src={streamingUrl}
      controls
      preload="metadata" // 메타데이터만 미리 로드
    />
  );
};
```

## ✅ 권장사항

1. **즉시 구현**: S3 + DynamoDB 기본 구조
2. **1주일 내**: 기존 데이터 마이그레이션
3. **2주일 내**: 대용량 파일 업로드 UI
4. **1개월 내**: CloudFront CDN 연동
5. **2개월 내**: Lambda 기반 썸네일 생성

이렇게 하면 1GB 이상의 대용량 파일도 안정적으로 처리할 수 있고, 데이터 손실 걱정도 없어집니다!
