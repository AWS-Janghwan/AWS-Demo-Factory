// 백엔드 API를 통한 S3 서비스
// 강제로 현재 도메인 사용 (환경 변수 무시)
const BACKEND_API_URL = (() => {
  // 상대 경로 사용으로 정적 서버 프록시를 통해 호출
  console.log('🔥 [BackendS3] 상대 경로 모드: 프록시 사용');
  return ''; // 상대 경로 사용
})();
console.log('🔗 [BackendS3] 동적 API URL:', BACKEND_API_URL);

// 백엔드를 통해 S3 파일 목록 가져오기
export const getS3Files = async () => {
  try {
    console.log('☁️ [BackendS3] 백엔드를 통한 S3 파일 목록 조회 시작');
    
    const response = await fetch(`${BACKEND_API_URL}/api/s3/files`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ [BackendS3] ${data.files.length}개 파일 조회 완료`);
      return data.files;
    } else {
      throw new Error(data.error || 'S3 파일 목록 조회 실패');
    }
  } catch (error) {
    console.error('❌ [BackendS3] S3 파일 목록 조회 실패:', error);
    return [];
  }
};

// 백엔드를 통해 S3 파일 URL 생성 (스트리밍 방식)
export const generatePresignedUrl = async (s3Key, expiresIn = 86400) => {
  try {
    console.log('🔗 [BackendS3] S3 스트리밍 URL 생성:', s3Key);
    
    // S3 키를 URL 인코딩
    const encodedKey = encodeURIComponent(s3Key);
    const streamingUrl = `${BACKEND_API_URL}/api/s3/file/${encodedKey}`;
    
    console.log('✅ [BackendS3] S3 스트리밍 URL 생성 완료');
    return streamingUrl;
  } catch (error) {
    console.error('❌ [BackendS3] S3 URL 생성 실패:', error);
    throw error;
  }
};

// 파일들에 대해 Presigned URL을 배치로 생성 (리소스 부족 방지)
export const generatePresignedUrlsForFiles = async (files) => {
  try {
    console.log(`🔗 [BackendS3] ${files.length}개 파일에 대한 URL 생성 시작`);
    
    const BATCH_SIZE = 5; // 동시 요청 수 제한
    const updatedFiles = [];
    
    // 배치로 처리
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      
      const batchResults = await Promise.all(
        batch.map(async (file) => {
          if (file.s3Key && !file.url) {
            try {
              const presignedUrl = await generatePresignedUrl(file.s3Key);
              return {
                ...file,
                url: presignedUrl,
                isSecure: true,
                urlGeneratedAt: new Date().toISOString()
              };
            } catch (error) {
              console.warn(`⚠️ [BackendS3] ${file.name} URL 생성 실패:`, error);
              return file;
            }
          }
          return file;
        })
      );
      
      updatedFiles.push(...batchResults);
      
      // 배치 간 짧은 대기
      if (i + BATCH_SIZE < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log(`✅ [BackendS3] URL 생성 완료`);
    return updatedFiles;
  } catch (error) {
    console.error('❌ [BackendS3] 일괄 URL 생성 실패:', error);
    return files;
  }
};

export default {
  getS3Files,
  generatePresignedUrl,
  generatePresignedUrlsForFiles
};