// localStorage 안전 초기화 스크립트
console.log('🧹 localStorage 초기화 시작...');

try {
  // 모든 관련 데이터 제거
  const keysToRemove = [
    'analyticsData',
    'demoFactoryAnalytics', 
    'accessPurpose',
    'contentData',
    'uploadedFiles'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    console.log(`✅ ${key} 제거 완료`);
  });
  
  // 전체 localStorage 확인
  console.log('📊 현재 localStorage 키들:', Object.keys(localStorage));
  console.log('📊 현재 sessionStorage 키들:', Object.keys(sessionStorage));
  
  console.log('🎉 localStorage 초기화 완료!');
  
} catch (error) {
  console.error('❌ localStorage 초기화 실패:', error);
}