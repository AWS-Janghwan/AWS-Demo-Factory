import AWS from 'aws-sdk';

// AWS S3 설정
AWS.config.update({
  accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  region: process.env.REACT_APP_AWS_REGION
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory';

console.log('☁️ [S3FileService] 설정 완료:', {
  region: process.env.REACT_APP_AWS_REGION,
  bucket: BUCKET_NAME
});

// S3에서 파일 목록 조회
export const getS3Files = async () => {
  try {
    console.log('☁️ [S3] 파일 목록 조회 시작...');
    
    const params = {
      Bucket: BUCKET_NAME,
      MaxKeys: 1000 // 최대 1000개 파일
    };
    
    const result = await s3.listObjectsV2(params).promise();
    console.log('📋 [S3] 파일 목록 조회 결과:', result.Contents?.length || 0, '개');
    
    if (!result.Contents || result.Contents.length === 0) {
      console.log('📭 [S3] 버킷에 파일이 없습니다.');
      return [];
    }
    
    // S3 객체를 파일 형태로 변환
    const s3Files = result.Contents.map(obj => {
      const fileName = obj.Key.split('/').pop(); // 경로에서 파일명만 추출
      const fileExtension = fileName.split('.').pop().toLowerCase();
      
      // S3 URL 생성
      const s3Url = `https://${BUCKET_NAME}.s3.${process.env.REACT_APP_AWS_REGION}.amazonaws.com/${obj.Key}`;
      
      return {
        id: obj.Key,
        name: fileName,
        key: obj.Key,
        size: obj.Size,
        type: getFileType(fileExtension),
        url: s3Url,
        lastModified: obj.LastModified,
        isLocal: false,
        source: 's3'
      };
    });
    
    console.log('✅ [S3] 파일 목록 변환 완료:', s3Files.length, '개');
    return s3Files;
    
  } catch (error) {
    console.error('❌ [S3] 파일 목록 조회 실패:', error);
    throw error;
  }
};

// 파일 확장자로 MIME 타입 추정
const getFileType = (extension) => {
  const typeMap = {
    // 이미지
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    
    // 비디오
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'ogg': 'video/ogg',
    'avi': 'video/avi',
    'mov': 'video/quicktime',
    
    // 오디오
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    
    // 문서
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain'
  };
  
  return typeMap[extension] || 'application/octet-stream';
};

// S3에서 특정 파일 URL 생성 (Presigned URL)
export const getS3FileUrl = async (key, expiresIn = 3600) => {
  try {
    console.log('🔗 [S3] Presigned URL 생성:', key);
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: expiresIn // 1시간 유효
    };
    
    const url = await s3.getSignedUrlPromise('getObject', params);
    console.log('✅ [S3] Presigned URL 생성 완료:', key);
    
    return url;
  } catch (error) {
    console.error('❌ [S3] Presigned URL 생성 실패:', error);
    throw error;
  }
};

// S3 파일 존재 여부 확인
export const checkS3FileExists = async (key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    await s3.headObject(params).promise();
    return true;
  } catch (error) {
    if (error.code === 'NotFound') {
      return false;
    }
    throw error;
  }
};

export default {
  getS3Files,
  getS3FileUrl,
  checkS3FileExists
};
