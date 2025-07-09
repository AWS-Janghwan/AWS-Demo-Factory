import { v4 as uuidv4 } from 'uuid';
import indexedDBStorage from './indexedDBStorage';
import s3FileService from '../services/s3FileService';

/**
 * 앱 설정을 초기화합니다.
 * IndexedDB를 우선 사용하고, 실패 시 localStorage로 폴백합니다.
 */
export const configureAmplify = () => {
  console.log('🚀 대용량 파일 저장 시스템을 초기화합니다.');
  console.log('📦 IndexedDB (우선) + localStorage (폴백) 하이브리드 시스템');
};

/**
 * 파일을 저장합니다. IndexedDB를 우선 사용하고, 실패 시 localStorage 사용
 */
export const saveFileLocally = async (file, path) => {
  try {
    console.log(`💾 파일 저장 시작: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
    
    // 1. IndexedDB 우선 시도
    try {
      console.log('🔄 IndexedDB에 저장 시도 중...');
      const result = await indexedDBStorage.saveFile(file, path);
      
      // IndexedDB 메타데이터를 localStorage에도 저장 (호환성을 위해)
      const localFiles = JSON.parse(localStorage.getItem('localFiles') || '[]');
      localFiles.push({
        id: result.id,
        name: file.name,
        path,
        url: result.url,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        isIndexedDB: true,
        isPermanent: true
      });
      
      try {
        localStorage.setItem('localFiles', JSON.stringify(localFiles));
      } catch (e) {
        console.warn('⚠️ localStorage 메타데이터 저장 실패 (무시 가능):', e);
      }
      
      console.log(`✅ IndexedDB 저장 성공: ${file.name}`);
      return result.url;
      
    } catch (indexedDBError) {
      console.warn('⚠️ IndexedDB 저장 실패, localStorage로 폴백:', indexedDBError);
      
      // 2. localStorage 폴백
      return await saveToLocalStorage(file, path);
    }
    
  } catch (error) {
    console.error('❌ 파일 저장 완전 실패:', error);
    throw error;
  }
};

/**
 * localStorage에 저장 (폴백 방식)
 */
const saveToLocalStorage = (file, path) => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = (event) => {
        try {
          const fileUrl = event.target.result;
          const localFiles = JSON.parse(localStorage.getItem('localFiles') || '[]');
          const fileId = uuidv4();
          
          // 파일 크기 경고
          if (file.size > 100 * 1024 * 1024) { // 100MB
            console.warn(`⚠️ 큰 파일 저장 (${(file.size / 1024 / 1024).toFixed(2)}MB): ${file.name}`);
          }
          
          const fileData = {
            id: fileId,
            name: file.name,
            path,
            url: fileUrl,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
            isIndexedDB: false,
            isPermanent: true
          };
          
          localFiles.push(fileData);
          
          try {
            localStorage.setItem('localFiles', JSON.stringify(localFiles));
            console.log(`✅ localStorage 저장 성공: ${file.name}`);
            resolve(fileUrl);
          } catch (storageError) {
            if (storageError.name === 'QuotaExceededError') {
              console.error('❌ localStorage 용량 초과. IndexedDB도 실패했습니다.');
              reject(new Error('저장 공간이 부족합니다. 기존 파일들을 정리해주세요.'));
            } else {
              throw storageError;
            }
          }
        } catch (error) {
          console.error('❌ localStorage 파일 처리 중 오류:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('파일 읽기 실패'));
      };
    } catch (error) {
      console.error('❌ localStorage 저장 중 오류:', error);
      reject(error);
    }
  });
};

/**
 * 파일을 업로드합니다 (하이브리드 저장소 사용)
 */
export const uploadFile = async (file, path, onProgress = null) => {
  return new Promise((resolve, reject) => {
    try {
      // 진행률 시뮬레이션
      if (onProgress) {
        let progress = 0;
        const interval = setInterval(() => {
          progress += 20;
          onProgress(Math.min(progress, 90));
          if (progress >= 90) {
            clearInterval(interval);
          }
        }, 200);
      }

      // saveFileLocally 사용 (IndexedDB 우선)
      saveFileLocally(file, path)
        .then((url) => {
          if (onProgress) {
            onProgress(100);
          }
          resolve({
            fileUrl: url,
            isLocal: true,
            key: `hybrid-${uuidv4()}-${file.name}`
          });
        })
        .catch((error) => {
          reject(error);
        });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * localStorage 메타데이터를 업데이트합니다
 */
const updateLocalStorageMetadata = async (files) => {
  try {
    const existingMeta = JSON.parse(localStorage.getItem('localFiles') || '[]');
    
    // 파일 URL 업데이트
    const updatedMeta = files.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path || file.key,
      url: file.url,
      type: file.type,
      size: file.size,
      uploadedAt: file.uploadedAt || file.lastModified,
      isS3: file.source === 's3',
      isPermanent: true,
      refreshedAt: new Date().toISOString()
    }));
    
    localStorage.setItem('localFiles', JSON.stringify(updatedMeta));
    console.log('✅ localStorage 메타데이터 업데이트 완료 (S3 파일)');
  } catch (error) {
    console.error('❌ localStorage 메타데이터 업데이트 실패:', error);
  }
};

/**
 * 저장된 파일 목록을 가져옵니다 (S3 우선 + 로컬 폴백)
 */
export const getLocalFiles = async () => {
  try {
    console.log('🔄 [getLocalFiles] 파일 목록 새로고침 시작...');
    
    // 1. S3에서 파일 목록 먼저 시도
    let s3Files = [];
    try {
      s3Files = await s3FileService.getS3Files();
      if (s3Files.length > 0) {
        console.log(`☁️ S3에서 ${s3Files.length}개 파일 로드 완료`);
        
        // S3 파일이 있으면 로컬 저장소는 건너뛰고 S3만 사용
        const allFiles = [...s3Files];
        
        // localStorage 메타데이터 업데이트 (S3 URL로)
        await updateLocalStorageMetadata(allFiles);
        
        console.log(`📁 총 ${allFiles.length}개 파일 로드 완료 (S3 우선)`);
        return allFiles;
      }
    } catch (error) {
      console.warn('⚠️ S3 파일 로드 실패, 로컬 저장소 사용:', error);
    }
    
    // 2. S3에 파일이 없으면 IndexedDB에서 파일 목록 가져오기 (폴백)
    let indexedDBFiles = [];
    try {
      indexedDBFiles = await indexedDBStorage.getFiles();
      console.log(`📁 IndexedDB에서 ${indexedDBFiles.length}개 파일 로드 (URL 새로고침 완료)`);
    } catch (error) {
      console.warn('⚠️ IndexedDB 파일 로드 실패:', error);
    }
    
    // 3. localStorage에서 파일 목록 가져오기 (최종 폴백)
    let localStorageFiles = [];
    try {
      const stored = JSON.parse(localStorage.getItem('localFiles') || '[]');
      localStorageFiles = stored.filter(file => !file.isIndexedDB); // IndexedDB가 아닌 것만
      console.log(`📁 localStorage에서 ${localStorageFiles.length}개 파일 로드`);
    } catch (error) {
      console.error('❌ localStorage 파일 목록 조회 실패:', error);
    }
    
    // 3. 합치기
    const allFiles = [...indexedDBFiles, ...localStorageFiles];
    console.log(`📁 총 ${allFiles.length}개 파일 로드 완료 (썸네일 URL 새로고침됨)`);
    
    // 4. localStorage 메타데이터도 새 URL로 업데이트
    if (indexedDBFiles.length > 0) {
      try {
        const existingMeta = JSON.parse(localStorage.getItem('localFiles') || '[]');
        const updatedMeta = existingMeta.map(meta => {
          if (meta.isIndexedDB) {
            const matchingFile = indexedDBFiles.find(f => f.id === meta.id);
            if (matchingFile) {
              return {
                ...meta,
                url: matchingFile.url,
                refreshedAt: matchingFile.refreshedAt
              };
            }
          }
          return meta;
        });
        
        // 새로운 IndexedDB 파일들도 메타데이터에 추가
        indexedDBFiles.forEach(file => {
          if (!updatedMeta.find(meta => meta.id === file.id)) {
            updatedMeta.push({
              id: file.id,
              name: file.name,
              path: file.path,
              url: file.url,
              type: file.type,
              size: file.size,
              uploadedAt: file.uploadedAt,
              isIndexedDB: true,
              isPermanent: true,
              refreshedAt: file.refreshedAt
            });
          }
        });
        
        localStorage.setItem('localFiles', JSON.stringify(updatedMeta));
        console.log('✅ localStorage 메타데이터 URL 업데이트 완료');
      } catch (error) {
        console.warn('⚠️ localStorage 메타데이터 업데이트 실패:', error);
      }
    }
    
    return allFiles;
  } catch (error) {
    console.error('❌ 파일 목록 조회 실패:', error);
    return [];
  }
};

/**
 * 파일을 삭제합니다 (하이브리드)
 */
export const deleteLocalFile = async (fileId) => {
  try {
    // 1. IndexedDB에서 삭제 시도
    try {
      await indexedDBStorage.deleteFile(fileId);
      console.log(`✅ IndexedDB에서 파일 삭제: ${fileId}`);
    } catch (error) {
      console.warn('⚠️ IndexedDB 삭제 실패 (파일이 없을 수 있음):', error);
    }
    
    // 2. localStorage에서도 삭제
    try {
      const localFiles = JSON.parse(localStorage.getItem('localFiles') || '[]');
      const filteredFiles = localFiles.filter(file => file.id !== fileId);
      localStorage.setItem('localFiles', JSON.stringify(filteredFiles));
      console.log(`✅ localStorage에서 메타데이터 삭제: ${fileId}`);
    } catch (error) {
      console.warn('⚠️ localStorage 삭제 실패:', error);
    }
    
    return true;
  } catch (error) {
    console.error('❌ 파일 삭제 실패:', error);
    return false;
  }
};

/**
 * 저장소 정리 함수 (하이브리드)
 */
export const cleanupLocalStorage = async () => {
  try {
    console.log('🧹 하이브리드 저장소 정리 시작...');
    
    // 1. IndexedDB 정리
    try {
      await indexedDBStorage.clearStorage();
      console.log('✅ IndexedDB 정리 완료');
    } catch (error) {
      console.warn('⚠️ IndexedDB 정리 실패:', error);
    }
    
    // 2. localStorage 정리
    try {
      localStorage.removeItem('localFiles');
      console.log('✅ localStorage 정리 완료');
    } catch (error) {
      console.warn('⚠️ localStorage 정리 실패:', error);
    }
    
    console.log('✅ 하이브리드 저장소 정리 완료');
  } catch (error) {
    console.error('❌ 저장소 정리 실패:', error);
  }
};

/**
 * 저장소 사용량 확인
 */
export const getStorageUsage = async () => {
  try {
    const usage = await indexedDBStorage.getStorageUsage();
    console.log(`📊 전체 저장소 사용량: ${(usage.totalSize / 1024 / 1024).toFixed(2)}MB`);
    return usage;
  } catch (error) {
    console.error('❌ 저장소 사용량 확인 실패:', error);
    return { totalSize: 0, totalCount: 0, files: [] };
  }
};
