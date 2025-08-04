// 브라우저 콘솔에서 실행할 파일 업로드 테스트 스크립트

async function testBrowserUpload() {
    console.log('🔍 브라우저 파일 업로드 테스트 시작...');
    
    // 1. 간단한 텍스트 파일 생성
    const testContent = 'Browser upload test - ' + new Date().toISOString();
    const testFile = new File([testContent], 'browser-test.txt', { type: 'text/plain' });
    
    console.log('📁 테스트 파일 생성:', {
        name: testFile.name,
        size: testFile.size,
        type: testFile.type
    });
    
    // 2. FormData 생성 (실제 브라우저와 동일)
    const formData = new FormData();
    formData.append('file', testFile);
    formData.append('contentId', 'browser-test-' + Date.now());
    
    console.log('📋 FormData 생성 완료');
    
    // 3. 실제 업로드 요청
    try {
        console.log('📤 업로드 요청 시작...');
        
        const response = await fetch('/api/upload/secure', {
            method: 'POST',
            body: formData,
            // Content-Type 헤더는 브라우저가 자동으로 설정 (boundary 포함)
        });
        
        console.log('📊 응답 상태:', response.status);
        console.log('📊 응답 헤더:', [...response.headers.entries()]);
        
        if (response.ok) {
            const result = await response.json();
            console.log('✅ 업로드 성공:', result);
            return result;
        } else {
            const errorText = await response.text();
            console.log('❌ 업로드 실패:', response.status, errorText);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
    } catch (error) {
        console.error('💥 업로드 오류:', error);
        throw error;
    }
}

// 실행
testBrowserUpload().then(result => {
    console.log('🎉 테스트 완료:', result);
}).catch(error => {
    console.error('💥 테스트 실패:', error);
});