// 업로드 실패 시 대체 엔드포인트를 시도하는 간단한 함수

import { BackendUploadService } from './backendUploadService';

// 대체 엔드포인트로 업로드 시도
export const uploadWithFallback = async (file, contentId, onProgress) => {
    const uploadService = new BackendUploadService();
    
    // 대체 엔드포인트 목록
    const endpoints = ['/api/upload/secure', '/api/files/upload'];
    
    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        try {
            console.log(`🔄 [UploadFallback] 시도 ${i + 1}/${endpoints.length}: ${endpoint}`);
            
            // 기존 uploadFileSecurely 함수를 수정하여 엔드포인트를 받도록 함
            const result = await uploadService.uploadFileWithFallback(file, contentId, onProgress);
            console.log(`✅ [UploadFallback] 성공: ${endpoint}`);
            return result;
            
        } catch (error) {
            console.warn(`⚠️ [UploadFallback] ${endpoint} 실패:`, error.message);
            
            if (i === endpoints.length - 1) {
                throw new Error(`모든 업로드 엔드포인트 실패: ${error.message}`);
            }
        }
    }
};