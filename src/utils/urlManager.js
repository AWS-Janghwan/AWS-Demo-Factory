// URL 만료 관리 유틸리티
import secureS3Service from '../services/secureS3Service';

// URL 메타데이터 저장소 (메모리 캐시)
const urlCache = new Map();

// URL 정보 저장
export const storeUrlInfo = (s3Key, url, expiresIn = 86400) => {
  const expiresAt = Date.now() + (expiresIn * 1000);
  urlCache.set(s3Key, {
    url,
    expiresAt,
    s3Key
  });
  
  console.log(`🔗 [URLManager] URL 캐시 저장: ${s3Key} (만료: ${new Date(expiresAt).toLocaleString()})`);
};

// URL 만료 확인
export const isUrlExpired = (s3Key) => {
  const urlInfo = urlCache.get(s3Key);
  if (!urlInfo) return true;
  
  const now = Date.now();
  const isExpired = now >= urlInfo.expiresAt;
  
  if (isExpired) {
    console.log(`⏰ [URLManager] URL 만료됨: ${s3Key}`);
    urlCache.delete(s3Key);
  }
  
  return isExpired;
};

// URL 만료 임박 확인 (1시간 전)
export const isUrlExpiringSoon = (s3Key) => {
  const urlInfo = urlCache.get(s3Key);
  if (!urlInfo) return true;
  
  const now = Date.now();
  const oneHourBeforeExpiry = urlInfo.expiresAt - (60 * 60 * 1000); // 1시간 전
  const isExpiringSoon = now >= oneHourBeforeExpiry;
  
  if (isExpiringSoon) {
    console.log(`⚠️ [URLManager] URL 만료 임박: ${s3Key} (${Math.round((urlInfo.expiresAt - now) / 1000 / 60)}분 남음)`);
  }
  
  return isExpiringSoon;
};

// 캐시된 URL 가져오기
export const getCachedUrl = (s3Key) => {
  const urlInfo = urlCache.get(s3Key);
  return urlInfo?.url;
};

// 스마트 URL 생성 (캐시 확인 후 필요시에만 새로 생성)
export const getSmartUrl = async (s3Key, forceRefresh = false) => {
  try {
    // 강제 새로고침이 아니고 유효한 URL이 있으면 캐시 사용
    if (!forceRefresh && !isUrlExpired(s3Key) && !isUrlExpiringSoon(s3Key)) {
      const cachedUrl = getCachedUrl(s3Key);
      if (cachedUrl) {
        console.log(`✅ [URLManager] 캐시된 URL 사용: ${s3Key}`);
        return cachedUrl;
      }
    }
    
    // 새로운 URL 생성
    console.log(`🔄 [URLManager] 새로운 URL 생성: ${s3Key}`);
    const newUrl = await secureS3Service.generateSecureDownloadUrl(s3Key, 86400); // 24시간
    
    // 캐시에 저장
    storeUrlInfo(s3Key, newUrl, 86400);
    
    return newUrl;
  } catch (error) {
    console.error(`❌ [URLManager] URL 생성 실패: ${s3Key}`, error);
    throw error;
  }
};

// 백그라운드 URL 갱신 (만료 임박한 URL들 미리 갱신)
export const refreshExpiringSoonUrls = async () => {
  console.log('🔄 [URLManager] 만료 임박 URL 백그라운드 갱신 시작...');
  
  const refreshPromises = [];
  
  for (const [s3Key, urlInfo] of urlCache.entries()) {
    if (isUrlExpiringSoon(s3Key)) {
      console.log(`🔄 [URLManager] 백그라운드 갱신: ${s3Key}`);
      refreshPromises.push(getSmartUrl(s3Key, true));
    }
  }
  
  if (refreshPromises.length > 0) {
    await Promise.all(refreshPromises);
    console.log(`✅ [URLManager] ${refreshPromises.length}개 URL 백그라운드 갱신 완료`);
  } else {
    console.log('ℹ️ [URLManager] 갱신할 URL 없음');
  }
};

// 캐시 정리 (만료된 URL 제거)
export const cleanupExpiredUrls = () => {
  let cleanedCount = 0;
  
  for (const [s3Key] of urlCache.entries()) {
    if (isUrlExpired(s3Key)) {
      urlCache.delete(s3Key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`🧹 [URLManager] ${cleanedCount}개 만료된 URL 정리 완료`);
  }
};

// 캐시 상태 확인
export const getCacheStatus = () => {
  const total = urlCache.size;
  let valid = 0;
  let expiringSoon = 0;
  let expired = 0;
  
  for (const [s3Key] of urlCache.entries()) {
    if (isUrlExpired(s3Key)) {
      expired++;
    } else if (isUrlExpiringSoon(s3Key)) {
      expiringSoon++;
    } else {
      valid++;
    }
  }
  
  return { total, valid, expiringSoon, expired };
};

export default {
  storeUrlInfo,
  isUrlExpired,
  isUrlExpiringSoon,
  getCachedUrl,
  getSmartUrl,
  refreshExpiringSoonUrls,
  cleanupExpiredUrls,
  getCacheStatus
};
