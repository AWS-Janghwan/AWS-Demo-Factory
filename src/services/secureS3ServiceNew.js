import AWS from 'aws-sdk';
import awsCredentials from '../utils/awsCredentials.js';

// AWS S3 클라이언트
let s3 = null;

// S3 클라이언트 초기화
const initializeS3 = () => {
  if (s3) return s3;

  try {
    console.log('🔐 Secure S3 클라이언트 초기화 중...');
    
    // 로컬 credentials에서 AWS 설정 가져오기
    const credentials = awsCredentials.getCredentials();
    
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region
    });

    s3 = new AWS.S3();
    
    console.log('✅ Secure S3 설정 완료:', {
      region: credentials.region
    });
    
    return s3;
  } catch (error) {
    console.error('❌ Secure S3 초기화 실패:', error);
    throw error;
  }
};

// 날짜 기반 폴더 구조 생성 함수
const generateDatePath = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}/${month}/${day}`;
};

// 파일 타입에 따른 S3 경로 생성
const generateS3Path = (fileName) => {
  const extension = fileName.toLowerCase().split('.').pop();
  const datePath = generateDatePath();
  
  // 파일 확장자에 따라 폴더 분류
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
    return `contents/images/${datePath}/`;
  } else if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension)) {
    return `contents/videos/${datePath}/`;
  } else if (['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension)) {
    return `contents/documents/${datePath}/`;
  } else {
    return `contents/files/${datePath}/`;
  }
};

// 안전한 파일명 생성
const generateSafeFileName = (originalName) => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9가-힣]/g, '_');
  
  return `${baseName}_${timestamp}_${randomString}.${extension}`;
};

// Presigned URL 생성 (업로드용)
export const generatePresignedUploadUrl = async (fileName, fileType, bucketName) => {
  try {
    const s3Client = initializeS3();
    
    const s3Path = generateS3Path(fileName);
    const safeFileName = generateSafeFileName(fileName);
    const key = `${s3Path}${safeFileName}`;
    
    const params = {
      Bucket: bucketName,
      Key: key,
      ContentType: fileType,
      Expires: 300, // 5분
      Conditions: [
        ['content-length-range', 0, 100 * 1024 * 1024], // 최대 100MB
      ]
    };

    console.log(`🔗 Presigned 업로드 URL 생성 중 (${fileName})`);
    const uploadUrl = s3Client.getSignedUrl('putObject', params);
    
    console.log('✅ Presigned 업로드 URL 생성 성공');
    
    return {
      uploadUrl,
      key,
      fileName: safeFileName,
      originalName: fileName
    };
  } catch (error) {
    console.error('❌ generatePresignedUploadUrl 오류:', error);
    throw error;
  }
};

// Presigned URL 생성 (다운로드용)
export const generatePresignedDownloadUrl = async (key, bucketName, expiresIn = 3600) => {
  try {
    const s3Client = initializeS3();
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Expires: expiresIn
    };

    console.log(`🔗 Presigned 다운로드 URL 생성 중 (${key})`);
    const downloadUrl = s3Client.getSignedUrl('getObject', params);
    
    console.log('✅ Presigned 다운로드 URL 생성 성공');
    
    return downloadUrl;
  } catch (error) {
    console.error('❌ generatePresignedDownloadUrl 오류:', error);
    throw error;
  }
};

// 파일 직접 업로드
export const uploadFileToS3 = async (file, bucketName, onProgress = null) => {
  try {
    const s3Client = initializeS3();
    
    const s3Path = generateS3Path(file.name);
    const safeFileName = generateSafeFileName(file.name);
    const key = `${s3Path}${safeFileName}`;
    
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file,
      ContentType: file.type,
      Metadata: {
        originalName: file.name,
        uploadDate: new Date().toISOString()
      }
    };

    console.log(`📤 파일 직접 업로드 시작 (${file.name})`);
    
    const upload = s3Client.upload(params);
    
    // 진행률 추적
    if (onProgress) {
      upload.on('httpUploadProgress', (progress) => {
        const percentage = Math.round((progress.loaded / progress.total) * 100);
        onProgress(percentage);
      });
    }

    const result = await upload.promise();
    console.log('✅ 파일 직접 업로드 성공');
    
    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      fileName: safeFileName,
      originalName: file.name
    };
  } catch (error) {
    console.error('❌ uploadFileToS3 오류:', error);
    throw error;
  }
};

// 파일 삭제
export const deleteFileFromS3 = async (key, bucketName) => {
  try {
    const s3Client = initializeS3();
    
    const params = {
      Bucket: bucketName,
      Key: key
    };

    console.log(`🗑️ S3 파일 삭제 중 (${key})`);
    await s3Client.deleteObject(params).promise();
    console.log('✅ S3 파일 삭제 성공');
    
    return true;
  } catch (error) {
    console.error('❌ deleteFileFromS3 오류:', error);
    throw error;
  }
};

// 파일 존재 여부 확인
export const checkFileExists = async (key, bucketName) => {
  try {
    const s3Client = initializeS3();
    
    const params = {
      Bucket: bucketName,
      Key: key
    };

    console.log(`🔍 파일 존재 여부 확인 중 (${key})`);
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
