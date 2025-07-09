import AWS from 'aws-sdk';

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
  } else {
    return `contents/documents/${datePath}/`;
  }
};

// AWS S3 설정 (보안 강화)
const s3Config = {
  region: process.env.REACT_APP_AWS_REGION || 'ap-northeast-2',
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  signatureVersion: 'v4'
};

const s3 = new AWS.S3(s3Config);
const BUCKET_NAME = process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory';

console.log('🔒 [SecureS3Service] 보안 설정 완료:', {
  region: s3Config.region,
  bucket: BUCKET_NAME,
  signatureVersion: s3Config.signatureVersion
});

// 보안 파일 업로드 (Presigned URL 사용)
export const uploadFileSecurely = async (file, contentId, onProgress = () => {}) => {
  try {
    console.log('🔒 [SecureS3] 보안 파일 업로드 시작:', file.name);
    
    // 파일 검증
    const validationResult = validateFile(file);
    if (!validationResult.isValid) {
      throw new Error(`파일 검증 실패: ${validationResult.error}`);
    }
    
    // 안전한 파일명 생성
    const safeFileName = generateSafeFileName(file.name);
    
    // 날짜 기반 경로 생성 (YYYY/MM/DD 구조)
    const datePath = generateS3Path(file.name);
    const s3Key = `${datePath}${Date.now()}-${safeFileName}`;
    
    console.log(`📁 [SecureS3] 날짜 기반 업로드 경로: ${s3Key}`);
    
    // Presigned URL 생성 (업로드용)
    const presignedUrl = await generatePresignedUploadUrl(s3Key, file.type);
    
    // 파일 업로드 (Presigned URL 사용)
    const uploadResult = await uploadWithPresignedUrl(presignedUrl, file, onProgress);
    
    // 업로드 완료 후 파일 정보 반환
    const fileInfo = {
      id: `file-${Date.now()}`,
      name: file.name,
      safeName: safeFileName,
      size: file.size,
      type: file.type,
      s3Key: s3Key,
      s3Bucket: BUCKET_NAME,
      url: null, // 보안상 직접 URL은 제공하지 않음
      isSecure: true,
      uploadedAt: new Date().toISOString(),
      contentId: contentId
    };
    
    console.log('✅ [SecureS3] 보안 업로드 완료:', fileInfo.name);
    return fileInfo;
    
  } catch (error) {
    console.error('❌ [SecureS3] 업로드 실패:', error);
    throw new Error(`보안 업로드 실패: ${error.message}`);
  }
};

// 파일 검증 (보안)
const validateFile = (file) => {
  // 파일 크기 제한 (500MB)
  const MAX_FILE_SIZE = 500 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { isValid: false, error: '파일 크기가 500MB를 초과합니다.' };
  }
  
  // 허용된 파일 타입
  const allowedTypes = [
    // 이미지
    'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    // 비디오
    'video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/quicktime',
    // 오디오
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    // 문서
    'application/pdf', 'text/plain', 'text/markdown',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: '허용되지 않는 파일 형식입니다.' };
  }
  
  // 파일명 검증 (위험한 문자 체크)
  const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/;
  if (dangerousChars.test(file.name)) {
    return { isValid: false, error: '파일명에 허용되지 않는 문자가 포함되어 있습니다.' };
  }
  
  return { isValid: true };
};

// 안전한 파일명 생성
const generateSafeFileName = (originalName) => {
  // 특수문자 제거 및 공백을 언더스코어로 변경
  const safeName = originalName
    .replace(/[^a-zA-Z0-9가-힣.\-_]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');
  
  // 파일명이 너무 길면 자르기 (확장자 보존)
  const maxLength = 100;
  if (safeName.length > maxLength) {
    const extension = safeName.split('.').pop();
    const nameWithoutExt = safeName.substring(0, safeName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 1);
    return `${truncatedName}.${extension}`;
  }
  
  return safeName;
};

// Presigned URL 생성 (업로드용)
const generatePresignedUploadUrl = async (s3Key, contentType) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
      Expires: 300 // 5분 유효
    };
    
    const presignedUrl = await s3.getSignedUrlPromise('putObject', params);
    console.log('🔗 [SecureS3] Presigned 업로드 URL 생성 완료');
    
    return presignedUrl;
  } catch (error) {
    console.error('❌ [SecureS3] Presigned URL 생성 실패:', error);
    throw error;
  }
};

// Presigned URL로 파일 업로드
const uploadWithPresignedUrl = async (presignedUrl, file, onProgress) => {
  try {
    const xhr = new XMLHttpRequest();
    
    return new Promise((resolve, reject) => {
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress(percentage);
        }
      });
      
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve({ success: true });
        } else {
          reject(new Error(`업로드 실패: ${xhr.status} ${xhr.statusText}`));
        }
      });
      
      xhr.addEventListener('error', () => {
        reject(new Error('네트워크 오류로 업로드 실패'));
      });
      
      xhr.open('PUT', presignedUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error('❌ [SecureS3] Presigned URL 업로드 실패:', error);
    throw error;
  }
};

// 보안 파일 다운로드 URL 생성 (24시간 유효)
export const generateSecureDownloadUrl = async (s3Key, expiresIn = 86400) => { // 24시간 = 86400초
  try {
    console.log('🔗 [SecureS3] 보안 다운로드 URL 생성:', s3Key);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Expires: expiresIn, // 기본 1시간 유효
      ResponseContentDisposition: 'inline' // 브라우저에서 직접 표시
    };
    
    const presignedUrl = await s3.getSignedUrlPromise('getObject', params);
    console.log('✅ [SecureS3] 보안 다운로드 URL 생성 완료');
    
    return presignedUrl;
  } catch (error) {
    console.error('❌ [SecureS3] 다운로드 URL 생성 실패:', error);
    throw error;
  }
};

// 파일 존재 여부 확인
export const checkFileExists = async (s3Key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };
    
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound' || error.code === 'NoSuchKey') {
      return false;
    }
    throw error;
  }
};

// 보안 파일 삭제
export const deleteFileSecurely = async (s3Key) => {
  try {
    console.log('🗑️ [SecureS3] 파일 삭제 시작:', s3Key);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: s3Key
    };
    
    await s3.deleteObject(params).promise();
    console.log('✅ [SecureS3] 파일 삭제 완료:', s3Key);
    
    return true;
  } catch (error) {
    console.error('❌ [SecureS3] 파일 삭제 실패:', error);
    throw error;
  }
};

// 콘텐츠의 모든 파일 삭제
export const deleteContentFiles = async (contentId) => {
  try {
    console.log('🗑️ [SecureS3] 콘텐츠 파일 일괄 삭제:', contentId);
    
    // 콘텐츠 폴더의 모든 파일 조회
    const listParams = {
      Bucket: BUCKET_NAME,
      Prefix: `contents/${contentId}/`
    };
    
    const objects = await s3.listObjectsV2(listParams).promise();
    
    if (objects.Contents && objects.Contents.length > 0) {
      // 일괄 삭제
      const deleteParams = {
        Bucket: BUCKET_NAME,
        Delete: {
          Objects: objects.Contents.map(obj => ({ Key: obj.Key }))
        }
      };
      
      await s3.deleteObjects(deleteParams).promise();
      console.log(`✅ [SecureS3] ${objects.Contents.length}개 파일 삭제 완료`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ [SecureS3] 콘텐츠 파일 삭제 실패:', error);
    throw error;
  }
};

// S3 버킷 보안 상태 확인
export const checkBucketSecurity = async () => {
  try {
    console.log('🔍 [SecureS3] 버킷 보안 상태 확인...');
    
    // 버킷 정책 확인
    try {
      const policyResult = await s3.getBucketPolicy({ Bucket: BUCKET_NAME }).promise();
      console.log('📋 [SecureS3] 버킷 정책:', JSON.parse(policyResult.Policy));
    } catch (error) {
      if (error.code === 'NoSuchBucketPolicy') {
        console.log('⚠️ [SecureS3] 버킷 정책이 설정되지 않음');
      }
    }
    
    // 퍼블릭 액세스 차단 설정 확인
    try {
      const blockResult = await s3.getPublicAccessBlock({ Bucket: BUCKET_NAME }).promise();
      console.log('🔒 [SecureS3] 퍼블릭 액세스 차단 설정:', blockResult.PublicAccessBlockConfiguration);
      
      const isSecure = blockResult.PublicAccessBlockConfiguration.BlockPublicAcls &&
                      blockResult.PublicAccessBlockConfiguration.BlockPublicPolicy &&
                      blockResult.PublicAccessBlockConfiguration.IgnorePublicAcls &&
                      blockResult.PublicAccessBlockConfiguration.RestrictPublicBuckets;
      
      return {
        isSecure,
        message: isSecure ? '버킷이 안전하게 설정됨' : '버킷 보안 설정 필요'
      };
    } catch (error) {
      console.warn('⚠️ [SecureS3] 퍼블릭 액세스 설정 확인 실패:', error);
      return { isSecure: false, message: '보안 상태 확인 불가' };
    }
    
  } catch (error) {
    console.error('❌ [SecureS3] 보안 상태 확인 실패:', error);
    return { isSecure: false, message: error.message };
  }
};

export default {
  uploadFileSecurely,
  generateSecureDownloadUrl,
  checkFileExists,
  deleteFileSecurely,
  deleteContentFiles,
  checkBucketSecurity
};
