import AWS from 'aws-sdk';
import awsCredentials from '../utils/awsCredentials.js';

// AWS S3 설정 (로컬 credentials 사용)
let s3 = null;
const BUCKET_NAME = process.env.REACT_APP_S3_BUCKET || 'aws-demo-factory';

// S3 클라이언트 초기화
const initializeS3 = () => {
  if (s3) return s3;

  try {
    console.log('🔐 S3 클라이언트 초기화 중...');
    
    // 로컬 credentials에서 AWS 설정 가져오기
    const credentials = awsCredentials.getCredentials();
    
    AWS.config.update({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
      region: credentials.region
    });

    s3 = new AWS.S3();
    
    console.log('✅ S3 설정 완료:', {
      region: credentials.region,
      bucket: BUCKET_NAME
    });
    
    return s3;
  } catch (error) {
    console.error('❌ S3 초기화 실패:', error);
    throw error;
  }
};

// S3에서 파일 목록 조회
export const getS3Files = async () => {
  try {
    const s3Client = initializeS3();
    
    const params = {
      Bucket: BUCKET_NAME
    };

    console.log('📁 S3 파일 목록 조회 중...');
    const result = await s3Client.listObjectsV2(params).promise();
    console.log(`✅ ${result.Contents.length}개 파일 조회 완료`);
    
    return result.Contents || [];
  } catch (error) {
    console.error('❌ getS3Files 오류:', error);
    throw error;
  }
};

// S3에 파일 업로드
export const uploadFileToS3 = async (file, key) => {
  try {
    const s3Client = initializeS3();
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Body: file,
      ContentType: file.type
    };

    console.log(`📤 S3 파일 업로드 중 (${key})`);
    const result = await s3Client.upload(params).promise();
    console.log('✅ 파일 업로드 성공');
    
    return result;
  } catch (error) {
    console.error('❌ uploadFileToS3 오류:', error);
    throw error;
  }
};

// S3에서 파일 다운로드 URL 생성
export const getS3FileUrl = async (key) => {
  try {
    const s3Client = initializeS3();
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key,
      Expires: 3600 // 1시간
    };

    console.log(`🔗 S3 파일 URL 생성 중 (${key})`);
    const url = s3Client.getSignedUrl('getObject', params);
    console.log('✅ 파일 URL 생성 성공');
    
    return url;
  } catch (error) {
    console.error('❌ getS3FileUrl 오류:', error);
    throw error;
  }
};

// S3에서 파일 삭제
export const deleteS3File = async (key) => {
  try {
    const s3Client = initializeS3();
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };

    console.log(`🗑️ S3 파일 삭제 중 (${key})`);
    await s3Client.deleteObject(params).promise();
    console.log('✅ 파일 삭제 성공');
    
    return true;
  } catch (error) {
    console.error('❌ deleteS3File 오류:', error);
    throw error;
  }
};
