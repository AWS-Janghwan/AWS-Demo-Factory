import AWS from 'aws-sdk';
import awsCredentials from '../utils/awsCredentials.js';

// AWS 클라이언트들
let s3 = null;
let dynamodb = null;

// 상수
const S3_BUCKET = process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory';
const DYNAMODB_TABLE = process.env.REACT_APP_DYNAMODB_TABLE || 'DemoFactoryContents';

// AWS 클라이언트 초기화
const initializeAWS = () => {
  if (s3 && dynamodb) return { s3, dynamodb };

  try {
    console.log('🔐 AWS Storage 클라이언트 초기화 중...');
    
    // 로컬 credentials에서 AWS 설정 가져오기
    const credentials = awsCredentials.getCredentials();
    
    const awsConfig = {
      region: credentials.region,
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey
    };

    s3 = new AWS.S3(awsConfig);
    dynamodb = new AWS.DynamoDB.DocumentClient(awsConfig);
    
    console.log('✅ AWS Storage 설정 완료:', {
      region: credentials.region,
      s3Bucket: S3_BUCKET,
      dynamoTable: DYNAMODB_TABLE
    });
    
    return { s3, dynamodb };
  } catch (error) {
    console.error('❌ AWS Storage 초기화 실패:', error);
    throw error;
  }
};

// 대용량 파일 업로드 (Multipart Upload 지원)
export const uploadLargeFile = async (file, onProgress = () => {}) => {
  try {
    const { s3: s3Client } = initializeAWS();
    
    const key = `contents/${Date.now()}-${file.name}`;
    
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      Body: file,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadDate: new Date().toISOString()
      }
    };

    console.log(`📤 대용량 파일 업로드 시작 (${file.name})`);
    
    const upload = s3Client.upload(params);
    
    // 진행률 추적
    upload.on('httpUploadProgress', (progress) => {
      const percentage = Math.round((progress.loaded / progress.total) * 100);
      onProgress(percentage);
    });

    const result = await upload.promise();
    console.log('✅ 대용량 파일 업로드 성공');
    
    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket
    };
  } catch (error) {
    console.error('❌ uploadLargeFile 오류:', error);
    throw error;
  }
};

// Presigned URL 생성 (안전한 업로드)
export const generatePresignedUrl = async (fileName, fileType, expiresIn = 3600) => {
  try {
    const { s3: s3Client } = initializeAWS();
    
    const key = `contents/${Date.now()}-${fileName}`;
    
    const params = {
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: fileType,
      Expires: expiresIn
    };

    console.log(`🔗 Presigned URL 생성 중 (${fileName})`);
    const url = s3Client.getSignedUrl('putObject', params);
    console.log('✅ Presigned URL 생성 성공');
    
    return {
      uploadUrl: url,
      key: key,
      downloadUrl: `https://${S3_BUCKET}.s3.amazonaws.com/${key}`
    };
  } catch (error) {
    console.error('❌ generatePresignedUrl 오류:', error);
    throw error;
  }
};

// 파일 메타데이터를 DynamoDB에 저장
export const saveFileMetadata = async (fileInfo) => {
  try {
    const { dynamodb: dynamoClient } = initializeAWS();
    
    const item = {
      id: Date.now().toString(),
      ...fileInfo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const params = {
      TableName: DYNAMODB_TABLE,
      Item: item
    };

    console.log('💾 파일 메타데이터 저장 중...');
    await dynamoClient.put(params).promise();
    console.log('✅ 파일 메타데이터 저장 성공');
    
    return item;
  } catch (error) {
    console.error('❌ saveFileMetadata 오류:', error);
    throw error;
  }
};

// 파일 목록 조회 (DynamoDB + S3)
export const getFileList = async () => {
  try {
    const { dynamodb: dynamoClient } = initializeAWS();
    
    const params = {
      TableName: DYNAMODB_TABLE,
      FilterExpression: 'attribute_exists(fileUrl)'
    };

    console.log('📋 파일 목록 조회 중...');
    const result = await dynamoClient.scan(params).promise();
    console.log(`✅ ${result.Items.length}개 파일 조회 완료`);
    
    return result.Items || [];
  } catch (error) {
    console.error('❌ getFileList 오류:', error);
    throw error;
  }
};

// 파일 삭제 (S3 + DynamoDB)
export const deleteFile = async (fileId, s3Key) => {
  try {
    const { s3: s3Client, dynamodb: dynamoClient } = initializeAWS();
    
    // S3에서 파일 삭제
    if (s3Key) {
      const s3Params = {
        Bucket: S3_BUCKET,
        Key: s3Key
      };
      
      console.log(`🗑️ S3 파일 삭제 중 (${s3Key})`);
      await s3Client.deleteObject(s3Params).promise();
    }

    // DynamoDB에서 메타데이터 삭제
    const dynamoParams = {
      TableName: DYNAMODB_TABLE,
      Key: { id: fileId }
    };

    console.log(`🗑️ 파일 메타데이터 삭제 중 (${fileId})`);
    await dynamoClient.delete(dynamoParams).promise();
    console.log('✅ 파일 삭제 완료');
    
    return true;
  } catch (error) {
    console.error('❌ deleteFile 오류:', error);
    throw error;
  }
};

// 파일 다운로드 URL 생성
export const getDownloadUrl = async (s3Key, expiresIn = 3600) => {
  try {
    const { s3: s3Client } = initializeAWS();
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: expiresIn
    };

    console.log(`🔗 다운로드 URL 생성 중 (${s3Key})`);
    const url = s3Client.getSignedUrl('getObject', params);
    console.log('✅ 다운로드 URL 생성 성공');
    
    return url;
  } catch (error) {
    console.error('❌ getDownloadUrl 오류:', error);
    throw error;
  }
};

// 파일 존재 여부 확인
export const checkFileExists = async (s3Key) => {
  try {
    const { s3: s3Client } = initializeAWS();
    
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };

    console.log(`🔍 파일 존재 여부 확인 중 (${s3Key})`);
    await s3Client.headObject(params).promise();
    console.log('✅ 파일 존재 확인');
    
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      console.log('⚠️ 파일이 존재하지 않음');
      return false;
    }
    console.error('❌ checkFileExists 오류:', error);
    throw error;
  }
};
