// 백엔드 API를 통한 안전한 파일 업로드 서비스
// 브라우저에서 직접 AWS 자격 증명을 사용하지 않고 백엔드 서버를 통해 업로드

const BACKEND_API_URL = process.env.REACT_APP_BACKEND_API_URL || 'http://localhost:3001';

class BackendUploadService {
    constructor() {
        console.log('🔧 [BackendUpload] 백엔드 업로드 서비스 초기화');
    }

    // 백엔드 API를 통한 안전한 파일 업로드
    async uploadFileSecurely(file, contentId, onProgress = () => {}) {
        try {
            console.log('🔒 [BackendUpload] 백엔드를 통한 안전한 파일 업로드 시작:', file.name);
            
            // 파일 검증
            const validationResult = this.validateFile(file);
            if (!validationResult.isValid) {
                throw new Error(`파일 검증 실패: ${validationResult.error}`);
            }
            
            // FormData 생성
            const formData = new FormData();
            formData.append('file', file);
            if (contentId) {
                formData.append('contentId', contentId);
            }
            
            // XMLHttpRequest를 사용하여 진행률 추적
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                
                // 진행률 추적
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable) {
                        const percentage = Math.round((event.loaded / event.total) * 100);
                        onProgress(percentage);
                        console.log(`📊 [BackendUpload] 업로드 진행률: ${percentage}%`);
                    }
                });
                
                // 업로드 완료
                xhr.addEventListener('load', () => {
                    if (xhr.status === 200) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            if (response.success) {
                                console.log('✅ [BackendUpload] 파일 업로드 성공:', response.file.name);
                                resolve(response.file);
                            } else {
                                reject(new Error(response.error || '업로드 실패'));
                            }
                        } catch (parseError) {
                            reject(new Error('서버 응답 파싱 실패'));
                        }
                    } else {
                        reject(new Error(`업로드 실패: ${xhr.status} ${xhr.statusText}`));
                    }
                });
                
                // 업로드 에러
                xhr.addEventListener('error', () => {
                    reject(new Error('네트워크 오류로 업로드 실패'));
                });
                
                // 업로드 중단
                xhr.addEventListener('abort', () => {
                    reject(new Error('업로드가 중단되었습니다'));
                });
                
                // 요청 전송
                xhr.open('POST', `${BACKEND_API_URL}/api/upload/secure`);
                xhr.send(formData);
            });
            
        } catch (error) {
            console.error('❌ [BackendUpload] 업로드 실패:', error);
            throw new Error(`백엔드 업로드 실패: ${error.message}`);
        }
    }
    
    // 파일 검증
    validateFile(file) {
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
    }
    
    // 백엔드 서버 상태 확인
    async checkBackendStatus() {
        try {
            const response = await fetch(`${BACKEND_API_URL}/health`);
            const data = await response.json();
            
            if (response.ok && data.status === 'healthy') {
                console.log('✅ [BackendUpload] 백엔드 서버 정상 동작');
                return true;
            } else {
                console.warn('⚠️ [BackendUpload] 백엔드 서버 상태 이상:', data);
                return false;
            }
        } catch (error) {
            console.error('❌ [BackendUpload] 백엔드 서버 연결 실패:', error);
            return false;
        }
    }
}

// 단일 인스턴스로 내보내기
const backendUploadService = new BackendUploadService();

// named export
export const uploadFileSecurely = (file, contentId, onProgress) => {
    return backendUploadService.uploadFileSecurely(file, contentId, onProgress);
};

export const validateFile = (file) => {
    return backendUploadService.validateFile(file);
};

export const checkBackendStatus = () => {
    return backendUploadService.checkBackendStatus();
};

// default export
export default backendUploadService;