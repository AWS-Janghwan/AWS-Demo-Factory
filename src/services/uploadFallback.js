// 업로드 실패 시 대체 엔드포인트를 시도하는 Fallback 시스템

// 직접 API 호출로 fallback 구현
export const uploadFileWithFallback = async (file, contentId, onProgress) => {
    // 대체 엔드포인트 목록
    const endpoints = [
        '/api/upload/secure',  // 1차 시도
        '/api/files/upload'    // 2차 시도 (대체 엔드포인트)
    ];
    
    const baseUrl = window.location.origin; // https://demofactory.cloud
    
    for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        const fullUrl = `${baseUrl}${endpoint}`;
        
        try {
            console.log(`🔄 [UploadFallback] 업로드 시도 ${i + 1}/${endpoints.length}: ${endpoint}`);
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('contentId', contentId);
            
            const xhr = new XMLHttpRequest();
            
            const uploadPromise = new Promise((resolve, reject) => {
                xhr.upload.addEventListener('progress', (event) => {
                    if (event.lengthComputable && onProgress) {
                        const progress = Math.round((event.loaded / event.total) * 100);
                        onProgress(progress);
                        console.log(`📊 [UploadFallback] 업로드 진행률: ${progress}%`);
                    }
                });
                
                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        try {
                            const response = JSON.parse(xhr.responseText);
                            console.log(`✅ [UploadFallback] ${endpoint} 성공:`, response);
                            resolve(response);
                        } catch (e) {
                            console.log(`✅ [UploadFallback] ${endpoint} 성공 (텍스트 응답):`, xhr.responseText);
                            resolve({ success: true, message: xhr.responseText });
                        }
                    } else {
                        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
                    }
                });
                
                xhr.addEventListener('error', () => {
                    reject(new Error('네트워크 오류'));
                });
                
                xhr.addEventListener('timeout', () => {
                    reject(new Error('업로드 시간 초과'));
                });
            });
            
            xhr.open('POST', fullUrl);
            xhr.timeout = 30000; // 30초 타임아웃
            xhr.send(formData);
            
            const result = await uploadPromise;
            console.log(`🎉 [UploadFallback] 최종 성공: ${endpoint}`);
            return result;
            
        } catch (error) {
            console.warn(`❌ [UploadFallback] ${endpoint} 실패:`, error.message);
            
            if (i === endpoints.length - 1) {
                console.error(`💥 [UploadFallback] 모든 엔드포인트 실패`);
                throw new Error(`업로드 실패: 모든 대체 방법 시도 완료 - ${error.message}`);
            }
            
            console.log(`🔄 [UploadFallback] 다음 엔드포인트로 재시도...`);
        }
    }
};