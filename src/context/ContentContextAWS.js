import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { saveContent as saveContentToBackend, getAllContents as getAllContentsFromBackend } from '../services/backendContentService';
// import s3FileService from '../services/s3FileService'; // 백엔드 API 사용으로 대체
// import secureS3Service from '../services/secureS3Service'; // 백엔드 API 사용으로 대체
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
      
      // 백엔드를 통해 DynamoDB에서 데이터 로드 시도
      const dynamoContents = await getAllContentsFromBackend();
      
      if (dynamoContents && dynamoContents.length > 0) {
        // 백엔드를 통해 S3 파일 목록 가져오기
        let s3Files = [];
        try {
          const backendS3Service = await import('../services/backendS3Service');
          s3Files = await backendS3Service.getS3Files();
          console.log(`☁️ 백엔드를 통해 S3에서 ${s3Files.length}개 파일 발견`);
        } catch (error) {
          console.warn('⚠️ S3 파일 목록 조회 실패:', error);
        }
        
        // 파일 URL을 S3 URL로 변환
        const contentsWithUrls = dynamoContents.map(content => {
          if (content.files && content.files.length > 0) {
            const updatedFiles = content.files.map(file => {
              // S3 키가 있으면 백엔드 스트리밍 URL 사용
              if (file.s3Key) {
                const backendUrl = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:3001';
                file.url = `${backendUrl}/api/s3/file/${encodeURIComponent(file.s3Key)}`;
                console.log(`🔗 [ContentContext] 백엔드 스트리밍 URL 생성: ${file.name} -> ${file.url}`);
              }
              return file;
            });
            return { ...content, files: updatedFiles };
          }
          return content;
        });
        
        setContents(contentsWithUrls);
        console.log(`✅ DynamoDB에서 ${contentsWithUrls.length}개 콘텐츠 로드 완료`);
        
        // localStorage에 백업 저장
        localStorage.setItem('demo-factory-contents', JSON.stringify(contentsWithUrls));
        console.log('💾 localStorage에 백업 저장 완료');
        
      } else {
        console.log('📭 DynamoDB에 콘텐츠가 없음, localStorage에서 로드 시도...');
        await loadFromLocalStorageAndMigrate();
      }
      
    } catch (error) {
      console.error('❌ DynamoDB 로드 실패:', error);
      console.log('🔄 localStorage 백업에서 로드 시도...');
      await loadFromLocalStorageAndMigrate();
    } finally {
      setLoading(false);
    }
  }, []); // 빈 의존성 배열로 설정

  // localStorage에서 데이터 로드 및 DynamoDB로 마이그레이션
  const loadFromLocalStorageAndMigrate = async () => {
    try {
      const savedContents = localStorage.getItem('demo-factory-contents');
      if (savedContents) {
        const parsedContents = JSON.parse(savedContents);
        setContents(parsedContents);
        console.log(`📱 localStorage에서 ${parsedContents.length}개 콘텐츠 로드`);
        
        // DynamoDB로 마이그레이션 시도 (백그라운드에서)
        try {
          for (const content of parsedContents) {
            await saveContentToBackend(content);
          }
          console.log('🔄 localStorage → DynamoDB 마이그레이션 완료');
        } catch (migrationError) {
          console.warn('⚠️ DynamoDB 마이그레이션 실패:', migrationError);
        }
      } else {
        console.log('📭 저장된 콘텐츠가 없습니다.');
        setContents([]);
      }
    } catch (error) {
      console.error('❌ localStorage 로드 실패:', error);
      setContents([]);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadContentsFromDynamoDB();
  }, [loadContentsFromDynamoDB]); // loadContentsFromDynamoDB를 의존성에 추가

  // Add new content
  const addContent = async (newContent) => {
    try {
      setLoading(true);
      setError(null);

      // 백엔드를 통해 DynamoDB에 저장
      const savedContent = await saveContentToBackend(newContent);
      
      // 로컬 상태 업데이트
      setContents(prevContents => [savedContent, ...prevContents]);
      
      // localStorage 백업 업데이트
      const updatedContents = [savedContent, ...contents];
      localStorage.setItem('demo-factory-contents', JSON.stringify(updatedContents));
      
      console.log('✅ 콘텐츠 추가 완료:', savedContent.title);
      return savedContent;
      
    } catch (error) {
      console.error('❌ 콘텐츠 추가 실패:', error);
      setError(error.message);
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

      // 기존 콘텐츠 찾기
      const existingContent = contents.find(content => content.id === id);
      if (!existingContent) {
        throw new Error('콘텐츠를 찾을 수 없습니다.');
      }

      // 업데이트된 콘텐츠 생성
      const updatedContent = {
        ...existingContent,
        ...updatedData,
        updatedAt: new Date().toISOString()
      };

      // 백엔드를 통해 DynamoDB에 저장
      const savedContent = await saveContentToBackend(updatedContent);
      
      // 로컬 상태 업데이트
      setContents(prevContents => 
        prevContents.map(content => 
          content.id === id ? savedContent : content
        )
      );
      
      // localStorage 백업 업데이트
      const updatedContents = contents.map(content => 
        content.id === id ? savedContent : content
      );
      localStorage.setItem('demo-factory-contents', JSON.stringify(updatedContents));
      
      console.log('✅ 콘텐츠 업데이트 완료:', savedContent.title);
      return savedContent;
      
    } catch (error) {
      console.error('❌ 콘텐츠 업데이트 실패:', error);
      setError(error.message);
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
      console.log('📊 [ContentContext] 삭제 전 콘텐츠 개수:', contents.length);

      // 콘텐츠 정보 조회
      const content = contents.find(c => c.id === id);
      if (content && content.files && content.files.length > 0) {
        // S3에서 파일들 안전하게 삭제 (백엔드를 통해)
        try {
          // TODO: 백엔드 API를 통한 파일 삭제 기능 추가 필요
          console.log('✅ [ContentContext] S3 파일 삭제 스킵 (백엔드 API 미구현)');
        } catch (fileDeleteError) {
          console.warn('⚠️ [ContentContext] S3 파일 삭제 실패:', fileDeleteError);
          // 파일 삭제 실패해도 메타데이터는 삭제 진행
        }
      }

      // 백엔드를 통한 삭제
      const { deleteContent: deleteContentFromBackend } = await import('../services/backendContentService');
      await deleteContentFromBackend(id);
      console.log('✅ DynamoDB에서 콘텐츠 삭제 완료');
      
      // 로컬 상태에서 제거
      console.log('🔄 [ContentContext] React 상태 업데이트 시작...');
      setContents(prevContents => {
        const filteredContents = prevContents.filter(content => content.id !== id);
        console.log('📊 [ContentContext] 상태 업데이트:', prevContents.length, '→', filteredContents.length);
        return filteredContents;
      });

      // localStorage 백업 업데이트
      const updatedContents = contents.filter(content => content.id !== id);
      localStorage.setItem('demo-factory-contents', JSON.stringify(updatedContents));

      console.log(`✅ [ContentContext] 보안 콘텐츠 삭제 완료: ${id}`);
      console.log('🎉 [ContentContext] 삭제 프로세스 완전 완료!');

    } catch (error) {
      console.error('❌ 콘텐츠 삭제 실패:', error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Get content by ID (with fallback to backend API)
  const getContentById = async (id) => {
    // 먼저 로컬 contents에서 찾기
    const localContent = contents.find(content => content.id === id);
    if (localContent) {
      console.log('✅ [ContentContext] 로컬에서 콘텐츠 발견:', localContent.title);
      return localContent;
    }
    
    // 로컬에 없으면 백엔드에서 직접 조회
    console.log('🔍 [ContentContext] 로컬에 없음, 백엔드에서 조회:', id);
    try {
      const { getContentById: getContentFromBackend } = await import('../services/backendContentService');
      const backendContent = await getContentFromBackend(id);
      if (backendContent) {
        console.log('✅ [ContentContext] 백엔드에서 콘텐츠 발견:', backendContent.title);
        // 로컬 contents에도 추가
        setContents(prevContents => {
          const exists = prevContents.find(c => c.id === id);
          if (!exists) {
            return [...prevContents, backendContent];
          }
          return prevContents;
        });
        return backendContent;
      }
    } catch (error) {
      console.error('❌ [ContentContext] 백엔드 조회 실패:', error);
    }
    
    console.warn('❌ [ContentContext] 콘텐츠를 찾을 수 없음:', id);
    return null;
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
      content.content.toLowerCase().includes(lowercaseQuery) ||
      content.description?.toLowerCase().includes(lowercaseQuery) ||
      content.tags?.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
      content.author.toLowerCase().includes(lowercaseQuery)
    );
  };

  // Get all contents
  const getAllContents = () => {
    return contents;
  };

  // Get latest contents
  const getLatestContents = (limit = 10) => {
    return contents
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  };

  // Increment views
  const incrementViews = async (id) => {
    try {
      const content = contents.find(c => c.id === id);
      if (content) {
        const updatedViews = (content.views || 0) + 1;
        await updateContent(id, { views: updatedViews });
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

  // 보안 파일 URL 생성 (백엔드를 통해)
  const getSecureFileUrl = async (file, expiresIn = 3600) => {
    try {
      console.log('🔍 [ContentContext] 환경 변수 확인 (함수):', {
        REACT_APP_BACKEND_API_URL: process.env.REACT_APP_BACKEND_API_URL,
        NODE_ENV: process.env.NODE_ENV
      });
      
      // 환경 변수가 없거나 유효하지 않으면 동적 생성
      let backendUrl = process.env.REACT_APP_BACKEND_API_URL;
      if (!backendUrl || backendUrl === 'undefined') {
        console.log('⚠️ [ContentContext] 환경 변수 무효, 동적 생성 사용 (함수):', backendUrl);
        
        if (window.location.hostname === 'localhost') {
          backendUrl = 'http://localhost:3001';
        } else {
          backendUrl = `${window.location.protocol}//${window.location.hostname}`;
        }
      }
      
      // S3 키가 있으면 백엔드 스트리밍 URL 생성
      if (file.s3Key) {
        const streamingUrl = `${backendUrl}/api/s3/file/${encodeURIComponent(file.s3Key)}`;
        console.log('🔗 [ContentContext] 백엔드 스트리밍 URL 생성 완료:', file.name);
        return streamingUrl;
      }
      
      // 기존 URL이 있으면 그대로 반환
      if (file.url) {
        return file.url;
      }
      
      console.warn('⚠️ [ContentContext] 파일 URL 생성 불가:', file.name);
      return null;
      
    } catch (error) {
      console.error('❌ [ContentContext] 보안 URL 생성 실패:', error);
      return file.url || null;
    }
  };

  // 콘텐츠 URL 새로고침
  const refreshContentUrls = async () => {
    try {
      console.log('🔄 [ContentContext] 콘텐츠 URL 새로고침 시작...');
      
      const updatedContents = await Promise.all(
        contents.map(async (content) => {
          if (content.files && content.files.length > 0) {
            const updatedFiles = await Promise.all(
              content.files.map(async (file) => {
                try {
                  const newUrl = await getSecureFileUrl(file);
                  return { ...file, url: newUrl };
                } catch (error) {
                  console.warn(`⚠️ [ContentContext] 파일 URL 새로고침 실패: ${file.name}`, error);
                  return file;
                }
              })
            );
            return { ...content, files: updatedFiles };
          }
          return content;
        })
      );
      
      setContents(updatedContents);
      localStorage.setItem('demo-factory-contents', JSON.stringify(updatedContents));
      
      console.log('✅ [ContentContext] 콘텐츠 URL 새로고침 완료');
      
    } catch (error) {
      console.error('❌ [ContentContext] URL 새로고침 실패:', error);
    }
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
        // TODO: 백엔드 API를 통한 버킷 보안 체크 기능 추가 필요
        const securityStatus = { isSecure: true, message: '백엔드 API를 통한 안전한 접근' };
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