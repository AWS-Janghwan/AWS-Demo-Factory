// 로컬 스토리지 초기화 스크립트
// 브라우저 개발자 도구 콘솔에서 실행하세요

console.log('🧹 localStorage 초기화 시작...');

// Demo Factory 관련 localStorage 데이터 확인
const keys = Object.keys(localStorage);
const demoFactoryKeys = keys.filter(key => key.includes('demo-factory'));

console.log('📋 발견된 Demo Factory 관련 키들:', demoFactoryKeys);

// 백업 생성
const backup = {};
demoFactoryKeys.forEach(key => {
  backup[key] = localStorage.getItem(key);
});

console.log('💾 백업 생성 완료:', backup);

// localStorage 초기화
demoFactoryKeys.forEach(key => {
  localStorage.removeItem(key);
  console.log(`🗑️ 삭제됨: ${key}`);
});

console.log('✅ localStorage 초기화 완료!');
console.log('🔄 페이지를 새로고침하면 DynamoDB에서 최신 데이터를 로드합니다.');

// 백업 복원 함수 제공
window.restoreBackup = function() {
  Object.keys(backup).forEach(key => {
    localStorage.setItem(key, backup[key]);
  });
  console.log('🔄 백업 복원 완료');
};

console.log('💡 백업을 복원하려면: restoreBackup() 실행');
