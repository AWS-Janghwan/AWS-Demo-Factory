// 백엔드 API를 통한 안전한 콘텐츠 관리 서비스
// DynamoDB 작업을 백엔드 서버를 통해 안전하게 처리

// Mixed Content 해결: 현재 도메인 사용 (프록시 통해)
const getBackendUrl = () => {
  // 배포 환경에서 프록시 사용을 위해 상대 경로 사용
  if (typeof window !== 'undefined') {
    // 현재 도메인에서 프록시를 통해 API 호출
    const url = window.location.origin; // protocol + host 포함
    console.log('🔥🔥🔥 [BackendContent] 프록시 사용 모드:', url);
    console.log('🔥🔥🔥 [BackendContent] 상대 경로로 API 호출');
    return url;
  }
  return 'http://localhost:3001';
};

// 레거시 지원용
const BACKEND_API_URL = getBackendUrl();
console.log('🔗 [BackendContent] 동적 API URL:', BACKEND_API_URL);
console.log('🌐 [BackendContent] 현재 도메인:', window.location.hostname);
console.log('🔄 [BackendContent] 코드 업데이트 확인 - v2.0');

class BackendContentService {
    constructor() {
        console.log('🔧 [BackendContent] 백엔드 콘텐츠 서비스 초기화');
    }

    // 백엔드를 통한 콘텐츠 저장
    async saveContent(contentData) {
        try {
            console.log('💾 [BackendContent] 백엔드를 통한 콘텐츠 저장 시작:', contentData.title);
            
            const response = await fetch(`${BACKEND_API_URL}/api/content/save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(contentData)
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log('✅ [BackendContent] 콘텐츠 저장 성공:', data.content.title);
                return data.content;
            } else {
                throw new Error(data.error || '콘텐츠 저장 실패');
            }
            
        } catch (error) {
            console.error('❌ [BackendContent] 콘텐츠 저장 실패:', error);
            throw new Error(`백엔드 콘텐츠 저장 실패: ${error.message}`);
        }
    }
    
    // 백엔드를 통한 콘텐츠 목록 조회
    async getAllContents() {
        try {
            console.log('📋 [BackendContent] 백엔드를 통한 콘텐츠 목록 조회 시작');
            
            const apiUrl = getBackendUrl();
            console.log('🔥🔥 [BackendContent] API 호출 URL:', `${apiUrl}/api/content/list`);
            const response = await fetch(`${apiUrl}/api/content/list`);
            const data = await response.json();
            
            if (response.ok && data.success) {
                console.log(`✅ [BackendContent] 콘텐츠 목록 조회 성공: ${data.contents.length}개`);
                return data.contents;
            } else {
                throw new Error(data.error || '콘텐츠 목록 조회 실패');
            }
            
        } catch (error) {
            console.error('❌ [BackendContent] 콘텐츠 목록 조회 실패:', error);
            throw new Error(`백엔드 콘텐츠 조회 실패: ${error.message}`);
        }
    }
    
    // 백엔드 서버 상태 확인
    async checkBackendStatus() {
        try {
            const response = await fetch(`${BACKEND_API_URL}/health`);
            const data = await response.json();
            
            if (response.ok && data.status === 'healthy') {
                console.log('✅ [BackendContent] 백엔드 서버 정상 동작');
                return true;
            } else {
                console.warn('⚠️ [BackendContent] 백엔드 서버 상태 이상:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ [BackendContent] 백엔드 서버 연결 실패:', error);
            return false;
        }
    }
}

// 단일 인스턴스로 내보내기
const backendContentService = new BackendContentService();

// named export
export const saveContent = (contentData) => {
    return backendContentService.saveContent(contentData);
};

export const getAllContents = () => {
    return backendContentService.getAllContents();
};

export const checkBackendStatus = () => {
    return backendContentService.checkBackendStatus();
};

// default export
export default backendContentService;