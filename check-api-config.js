// 브라우저에서 현재 API 설정 확인
console.log('🔍 현재 API 설정 확인:');
console.log('현재 도메인:', window.location.origin);
console.log('환경 변수들:');

// React 환경 변수들 확인
const envVars = {};
for (let key in window) {
    if (key.startsWith('REACT_APP_')) {
        envVars[key] = window[key];
    }
}

// process.env 확인 (가능한 경우)
if (typeof process !== 'undefined' && process.env) {
    console.log('Process env REACT_APP vars:');
    Object.keys(process.env).filter(key => key.startsWith('REACT_APP_')).forEach(key => {
        console.log(`${key}:`, process.env[key]);
    });
}

// 로컬 스토리지 확인
console.log('LocalStorage API 관련:');
for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('api') || key.includes('url') || key.includes('backend'))) {
        console.log(`${key}:`, localStorage.getItem(key));
    }
}

// 세션 스토리지 확인
console.log('SessionStorage API 관련:');
for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('api') || key.includes('url') || key.includes('backend'))) {
        console.log(`${key}:`, sessionStorage.getItem(key));
    }
}

// 현재 사용 중인 API URL 추적
console.log('🔍 실제 API 호출 URL 추적:');
const originalFetch = window.fetch;
window.fetch = function(...args) {
    if (args[0] && args[0].includes('/api/')) {
        console.log('📡 API 호출:', args[0]);
    }
    return originalFetch.apply(this, args);
};

console.log('✅ fetch 모니터링 활성화됨. 이제 파일 업로드를 시도해보세요.');