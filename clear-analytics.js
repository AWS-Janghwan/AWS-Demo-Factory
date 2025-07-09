// 분석 데이터 초기화 스크립트
console.log('🧹 분석 데이터 초기화 중...');

// localStorage에서 분석 데이터 제거
if (typeof window !== 'undefined') {
  localStorage.removeItem('demoFactoryAnalytics');
  console.log('✅ localStorage 분석 데이터 삭제 완료');
} else {
  console.log('⚠️  브라우저 환경이 아닙니다. 브라우저에서 실행해주세요.');
}

// 초기화된 분석 데이터 구조
const cleanAnalyticsData = {
  pageViews: {},
  contentViews: {},
  categoryViews: {},
  accessPurposes: {},
  totalVisitors: 0,
  dailyStats: {}
};

console.log('🎯 초기화된 분석 데이터 구조:', cleanAnalyticsData);
console.log('📝 브라우저 콘솔에서 다음 명령어를 실행하세요:');
console.log('localStorage.removeItem("demoFactoryAnalytics")');
