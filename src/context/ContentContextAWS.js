import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import dynamoDBService from '../services/dynamoDBService';
import s3FileService from '../services/s3FileService';
import secureS3Service from '../services/secureS3Service';
import urlManager from '../utils/urlManager';

// Define categories
export const CATEGORIES = {
  GENERATIVE_AI: 'Generative AI',
  MANUFACTURING: 'Manufacturing',
  RETAIL_CPG: 'Retail/CPG',
  TELCO_MEDIA: 'Telco/Media',
  FINANCE: 'Finance',
  AMAZON_Q: 'Amazon Q',
  ETC: 'ETC'
};

// Create content context
const ContentContext = createContext();

// Content provider component with AWS DynamoDB integration
export const ContentProvider = ({ children }) => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState({});

  // DynamoDB에서 데이터 로드 (영구 저장소) - useCallback으로 감싸서 의존성 문제 해결
  const loadContentsFromDynamoDB = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 DynamoDB에서 콘텐츠 로드 시작...');
      
      // DynamoDB에서 데이터 로드 시도
      const dynamoContents = await dynamoDBService.getAllContents();
      
      if (dynamoContents && dynamoContents.length > 0) {
        // S3 파일 목록 가져오기
        let s3Files = [];
        try {
          s3Files = await s3FileService.getS3Files();
          console.log(`☁️ S3에서 ${s3Files.length}개 파일 발견`);
        } catch (error) {
          console.warn('⚠️ S3 파일 목록 조회 실패:', error);
        }
        
        // 파일 URL을 S3 URL로 변환
        const contentsWithS3URLs = await Promise.all(
          dynamoContents.map(async (content) => {
            if (content.files && content.files.length > 0) {
              const updatedFiles = await Promise.all(
                content.files.map(async (file) => {
                  // 이미 S3 URL이 있으면 그대로 사용
                  if (file.url && file.url.startsWith('https://')) {
                    console.log('☁️ [ContentContext] S3 URL 사용:', file.name, file.url);
                    return file;
                  }
                  
                  // S3 키가 있으면 보안 URL 생성
                  if (file.s3Key) {
                    try {
                      const secureUrl = await secureS3Service.generateSecureDownloadUrl(file.s3Key, 86400); // 24시간
                      console.log('🔒 [ContentContext] 보안 URL 생성:', file.name);
                      return {
                        ...file,
                        url: secureUrl,
                        isLocal: false,
                        source: 's3-secure'
                      };
                    } catch (error) {
                      console.warn('⚠️ [ContentContext] 보안 URL 생성 실패:', file.name, error);
                    }
                  }
                  
                  // S3에서 같은 이름의 파일 찾기
                  const s3File = s3Files.find(s3f => 
                    s3f.name === file.name || 
                    s3f.key.includes(file.name)
                  );
                  
                  if (s3File) {
                    console.log('☁️ [ContentContext] S3 파일 매칭 성공:', file.name, '→', s3File.url);
                    return {
                      ...file,
                      url: s3File.url,
                      s3Key: s3File.key,
                      isLocal: false,
                      source: 's3'
                    };
                  }
                  
                  // S3에서 찾지 못한 경우 로컬 파일 유지 (하지만 경고 표시)
                  console.log('📁 [ContentContext] 로컬 파일 유지 (S3 마이그레이션 권장):', file.name);
                  return {
                    ...file,
                    isLocal: true,
                    source: 'local',
                    migrationNeeded: true
                  };
                })
              );
              
              return { ...content, files: updatedFiles };
            }
            return content;
          })
        );
        
        const sortedContents = contentsWithS3URLs.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setContents(sortedContents);
        console.log(`✅ DynamoDB에서 ${dynamoContents.length}개 콘텐츠 로드 완료 (S3 파일 매칭 포함)`);
      } else {
        console.log('📭 DynamoDB에 콘텐츠가 없습니다. localStorage에서 마이그레이션을 시도합니다.');
        await loadFromLocalStorageAndMigrate();
      }
      
    } catch (error) {
      console.error('❌ DynamoDB 로드 실패:', error);
      console.log('🔄 localStorage 폴백 시도...');
      await loadFromLocalStorageAndMigrate();
    } finally {
      setLoading(false);
    }
  }, []); // useCallback 의존성 배열

  // Load content from DynamoDB on mount
  useEffect(() => {
    loadContentsFromDynamoDB();
    
    // 백그라운드 URL 갱신 스케줄러 (1시간마다)
    const urlRefreshInterval = setInterval(() => {
      console.log('🔄 [ContentContext] 백그라운드 URL 갱신 시작...');
      urlManager.refreshExpiringSoonUrls();
      urlManager.cleanupExpiredUrls();
      
      // 캐시 상태 로그
      const cacheStatus = urlManager.getCacheStatus();
      console.log('📊 [ContentContext] URL 캐시 상태:', cacheStatus);
    }, 60 * 60 * 1000); // 1시간마다
    
    return () => {
      clearInterval(urlRefreshInterval);
    };
  }, [loadContentsFromDynamoDB]);

  // localStorage에서 로드하고 DynamoDB로 마이그레이션
  const loadFromLocalStorageAndMigrate = async () => {
    try {
      const localContents = localStorage.getItem('demo-factory-contents');
      if (localContents) {
        const parsedContents = JSON.parse(localContents);
        const sortedContents = parsedContents.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
        setContents(sortedContents);
        console.log(`📦 localStorage에서 ${parsedContents.length}개 콘텐츠 로드 완료`);
        
        // localStorage 데이터를 DynamoDB로 자동 마이그레이션
        console.log('🚀 localStorage → DynamoDB 자동 마이그레이션 시작...');
        await migrateLocalStorageToDynamoDB(parsedContents);
      } else {
        console.log('📭 localStorage에도 콘텐츠가 없습니다. 빈 상태로 시작합니다.');
        setContents([]);
      }
    } catch (error) {
      console.error('❌ localStorage 로드 실패:', error);
      setContents([]);
      setError('데이터 로드에 실패했습니다.');
    }
  };

  // localStorage → DynamoDB 마이그레이션
  const migrateLocalStorageToDynamoDB = async (localContents) => {
    try {
      for (const content of localContents) {
        await dynamoDBService.saveContent(content);
        console.log(`✅ 마이그레이션 완료: ${content.title}`);
      }
      console.log('🎉 모든 콘텐츠 DynamoDB 마이그레이션 완료!');
    } catch (error) {
      console.error('❌ 마이그레이션 실패:', error);
    }
  };

  // Add new content with secure file upload
  const addContent = async (contentData, files = []) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔒 [ContentContext] 보안 콘텐츠 업로드 시작:', contentData.title);

      // 콘텐츠 ID 미리 생성 (파일 업로드에 사용)
      const contentId = `content-${Date.now()}`;
      let uploadedFiles = [];
      
      // 파일이 File 객체인지 메타데이터인지 확인
      if (files && files.length > 0) {
        const firstFile = files[0];
        
        if (firstFile instanceof File) {
          // File 객체들 - 새로 업로드 필요
          console.log(`📁 [ContentContext] ${files.length}개 파일 보안 업로드 시작`);
          
          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileId = `file-${Date.now()}-${i}`;
            
            setUploadProgress(prev => ({
              ...prev,
              [fileId]: { name: file.name, progress: 0 }
            }));

            try {
              // 보안 S3 업로드 사용
              const uploadResult = await secureS3Service.uploadFileSecurely(
                file, 
                contentId, 
                (progress) => {
                  setUploadProgress(prev => ({
                    ...prev,
                    [fileId]: { name: file.name, progress }
                  }));
                }
              );

              uploadedFiles.push({
                ...uploadResult,
                id: fileId
              });

              console.log(`✅ [ContentContext] 보안 업로드 완료: ${file.name}`);

              // 업로드 완료 후 진행률 제거
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[fileId];
                return newProgress;
              });

            } catch (uploadError) {
              console.error(`❌ [ContentContext] 파일 업로드 실패 (${file.name}):`, uploadError);
              setUploadProgress(prev => {
                const newProgress = { ...prev };
                delete newProgress[fileId];
                return newProgress;
              });
              throw new Error(`파일 업로드 실패: ${file.name} - ${uploadError.message}`);
            }
          }
        } else {
          // 이미 업로드된 파일 메타데이터 - 그대로 사용
          console.log(`📁 [ContentContext] ${files.length}개 이미 업로드된 파일 사용`);
          uploadedFiles = files.map((file, i) => ({
            ...file,
            id: file.id || `file-${Date.now()}-${i}`,
            contentId: contentId // 새 콘텐츠 ID로 업데이트
          }));
        }
      }

      // 콘텐츠 메타데이터 생성
      const newContent = {
        ...contentData,
        id: contentId,
        files: uploadedFiles,
        views: 0,
        likes: 0,
        likedBy: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isSecure: uploadedFiles.some(file => file.isSecure) // 보안 파일이 있으면 보안 콘텐츠로 표시
      };

      // AWS DynamoDB에 저장
      const savedContent = await dynamoDBService.saveContent(newContent);
      
      // 로컬 상태 업데이트
      setContents(prevContents => {
        const newContents = [savedContent, ...prevContents];
        return newContents.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      });

      // localStorage에도 백업 저장
      const updatedContents = [savedContent, ...contents];
      localStorage.setItem('demo-factory-contents', JSON.stringify(updatedContents));

      console.log(`✅ [ContentContext] 보안 콘텐츠 저장 완료: ${savedContent.title}`);
      return savedContent;

    } catch (error) {
      console.error('❌ [ContentContext] 콘텐츠 추가 실패:', error);
      setError(`콘텐츠 추가 실패: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update existing content
  const updateContent = async (id, updatedData) => {
    try {
      setLoading(true);
      setError(null);

      // DynamoDB에서 업데이트
      const updatedContent = await dynamoDBService.updateContent(id, updatedData);
      
      // 로컬 상태 업데이트
      setContents(prevContents => 
        prevContents.map(content => 
          content.id === id ? updatedContent : content
        )
      );

      // localStorage 백업 업데이트
      const updatedContents = contents.map(content => 
        content.id === id ? updatedContent : content
      );
      localStorage.setItem('demo-factory-contents', JSON.stringify(updatedContents));

      console.log(`✅ 콘텐츠 업데이트 완료: ${id}`);
      return updatedContent;

    } catch (error) {
      console.error('콘텐츠 업데이트 실패:', error);
      setError(`콘텐츠 업데이트 실패: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Delete content with secure file cleanup
  const deleteContent = async (id) => {
    try {
      setLoading(true);
      setError(null);

      console.log('🗑️ [ContentContext] 보안 콘텐츠 삭제 시작:', id);

      // 콘텐츠 정보 조회
      const content = contents.find(c => c.id === id);
      if (content && content.files && content.files.length > 0) {
        // S3에서 파일들 안전하게 삭제
        try {
          await secureS3Service.deleteContentFiles(id);
          console.log('✅ [ContentContext] S3 파일 삭제 완료');
        } catch (fileDeleteError) {
          console.warn('⚠️ [ContentContext] S3 파일 삭제 실패:', fileDeleteError);
          // 파일 삭제 실패해도 메타데이터는 삭제 진행
        }
      }

      // DynamoDB에서 삭제
      await dynamoDBService.deleteContent(id);
      
      // 로컬 상태에서 제거
      setContents(prevContents => prevContents.filter(content => content.id !== id));

      // localStorage 백업 업데이트
      const updatedContents = contents.filter(content => content.id !== id);
      localStorage.setItem('demo-factory-contents', JSON.stringify(updatedContents));

      console.log(`✅ [ContentContext] 보안 콘텐츠 삭제 완료: ${id}`);
      return true;

    } catch (error) {
      console.error('❌ [ContentContext] 콘텐츠 삭제 실패:', error);
      setError(`콘텐츠 삭제 실패: ${error.message}`);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get secure file URL (스마트 URL 관리)
  const getSecureFileUrl = async (file, expiresIn = 86400) => {
    try {
      if (!file.s3Key) {
        console.warn('⚠️ [ContentContext] S3 키가 없는 파일:', file.name);
        return file.url || null;
      }

      // 스마트 URL 생성 (캐시 확인 후 필요시에만 새로 생성)
      const secureUrl = await urlManager.getSmartUrl(file.s3Key);
      console.log('🔗 [ContentContext] 스마트 URL 생성 완료:', file.name);
      
      return secureUrl;
    } catch (error) {
      console.error('❌ [ContentContext] 스마트 URL 생성 실패:', error);
      return null;
    }
  };

  // Force refresh URLs for content (URL 만료 시 사용)
  const refreshContentUrls = async (contentId) => {
    try {
      console.log('🔄 [ContentContext] 콘텐츠 URL 강제 새로고침:', contentId);
      
      const content = contents.find(c => c.id === contentId);
      if (!content || !content.files) {
        console.warn('⚠️ [ContentContext] 콘텐츠 또는 파일을 찾을 수 없음:', contentId);
        return;
      }
      
      // 모든 파일의 URL 강제 새로고침
      const refreshPromises = content.files
        .filter(file => file.s3Key)
        .map(file => urlManager.getSmartUrl(file.s3Key, true)); // forceRefresh = true
      
      await Promise.all(refreshPromises);
      console.log(`✅ [ContentContext] ${refreshPromises.length}개 URL 새로고침 완료`);
      
    } catch (error) {
      console.error('❌ [ContentContext] URL 새로고침 실패:', error);
    }
  };

  // Get content by ID
  const getContentById = (id) => {
    return contents.find(content => content.id === id);
  };

  // Get contents by category
  const getContentsByCategory = (category) => {
    return contents.filter(content => content.category === category);
  };

  // Search contents
  const searchContents = (query) => {
    if (!query.trim()) return contents;
    
    const lowercaseQuery = query.toLowerCase();
    return contents.filter(content =>
      content.title.toLowerCase().includes(lowercaseQuery) ||
      content.description.toLowerCase().includes(lowercaseQuery) ||
      content.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      content.category.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Get all contents
  const getAllContents = () => contents;

  // Get latest contents
  const getLatestContents = (limit = 5) => {
    return contents.slice(0, limit);
  };

  // Increment views (세션당 한 번만)
  const incrementViews = async (id) => {
    try {
      // 세션 스토리지에서 이미 조회한 콘텐츠인지 확인
      const viewedContents = JSON.parse(sessionStorage.getItem('viewedContents') || '[]');
      
      if (viewedContents.includes(id)) {
        console.log('🚫 [ContentContext] 이미 이 세션에서 조회한 콘텐츠:', id);
        return;
      }
      
      const content = contents.find(c => c.id === id);
      if (content) {
        const updatedViews = (content.views || 0) + 1;
        await updateContent(id, { views: updatedViews });
        
        // 세션 스토리지에 조회 기록 저장
        viewedContents.push(id);
        sessionStorage.setItem('viewedContents', JSON.stringify(viewedContents));
        
        console.log('✅ [ContentContext] 조회수 증가 완료:', id, '→', updatedViews);
      }
    } catch (error) {
      console.error('조회수 증가 실패:', error);
    }
  };

  // Toggle like
  const toggleLike = async (id, userId) => {
    try {
      const content = contents.find(c => c.id === id);
      if (content) {
        const likedBy = content.likedBy || [];
        const isLiked = likedBy.includes(userId);
        
        const updatedLikedBy = isLiked 
          ? likedBy.filter(uid => uid !== userId)
          : [...likedBy, userId];
        
        await updateContent(id, { 
          likedBy: updatedLikedBy,
          likes: updatedLikedBy.length 
        });
      }
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
    }
  };

  // Check if liked by user
  const isLikedByUser = (id, userId) => {
    const content = contents.find(c => c.id === id);
    return content ? (content.likedBy || []).includes(userId) : false;
  };

  // Context value
  const value = {
    contents,
    loading,
    error,
    uploadProgress,
    addContent,
    updateContent,
    deleteContent,
    getContentById,
    getContentsByCategory,
    searchContents,
    getAllContents,
    getLatestContents,
    incrementViews,
    toggleLike,
    isLikedByUser,
    loadContentsFromDynamoDB,
    // 보안 기능
    getSecureFileUrl,
    refreshContentUrls,
    // 버킷 보안 상태 확인
    checkBucketSecurity: async () => {
      try {
        const securityStatus = await secureS3Service.checkBucketSecurity();
        console.log('🔍 [ContentContext] 버킷 보안 상태:', securityStatus);
        return securityStatus;
      } catch (error) {
        console.error('❌ [ContentContext] 보안 상태 확인 실패:', error);
        return { isSecure: false, message: error.message };
      }
    }
  };

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

// Custom hook to use content context
export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};

export default ContentContext;
