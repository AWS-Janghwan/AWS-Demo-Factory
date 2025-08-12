// PDF 생성 테스트 스크립트
const { generateAnalyticsReport } = require('./src/utils/pdfGenerator');

// 테스트 데이터
const testAnalyticsData = {
  summary: {
    totalVisitors: 150,
    totalPageViews: 1200,
    totalContents: 45,
    totalCategories: 8
  },
  accessPurpose: [
    { purpose: 'aws-internal', count: 50, percentage: 33 },
    { purpose: 'customer-demo', count: 30, percentage: 20 },
    { purpose: 'other', count: 25, percentage: 17 },
    { purpose: 'Skipped', count: 45, percentage: 30 }
  ],
  content: [
    { title: 'AWS Lambda Guide', category: 'Serverless', views: 250 },
    { title: 'React Best Practices', category: 'Frontend', views: 180 },
    { title: 'Docker Tutorial', category: 'DevOps', views: 160 }
  ],
  category: [
    { name: 'Serverless', totalViews: 400, contentCount: 8, avgViews: 50 },
    { name: 'Frontend', totalViews: 350, contentCount: 6, avgViews: 58 },
    { name: 'DevOps', totalViews: 300, contentCount: 5, avgViews: 60 }
  ],
  time: [
    { date: '2025-08-01', visitors: 25, pageViews: 120 },
    { date: '2025-08-02', visitors: 30, pageViews: 150 },
    { date: '2025-08-03', visitors: 28, pageViews: 140 }
  ],
  hourly: [
    { hour: 9, views: 45 },
    { hour: 10, views: 60 },
    { hour: 11, views: 55 },
    { hour: 14, views: 70 },
    { hour: 15, views: 65 }
  ]
};

console.log('🧪 PDF 생성 테스트 시작...');
console.log('📊 테스트 데이터:', JSON.stringify(testAnalyticsData, null, 2));

// 브라우저 환경이 아니므로 실제 테스트는 브라우저에서 해야 함
console.log('⚠️ 이 테스트는 브라우저 환경에서 실행되어야 합니다.');
console.log('💡 브라우저 콘솔에서 다음 코드를 실행하세요:');

const browserTestCode = `
// 브라우저 콘솔에서 실행할 테스트 코드
const testData = ${JSON.stringify(testAnalyticsData, null, 2)};

// PDF 생성 함수 import (이미 로드되어 있어야 함)
import('./utils/pdfGenerator.js').then(({ generateAnalyticsReport }) => {
  console.log('🧪 PDF 생성 테스트 시작...');
  
  generateAnalyticsReport(testData).then(result => {
    if (result.success) {
      console.log('✅ PDF 생성 성공!', result.fileName);
    } else {
      console.error('❌ PDF 생성 실패:', result.error);
    }
  }).catch(error => {
    console.error('❌ PDF 생성 중 오류:', error);
  });
}).catch(error => {
  console.error('❌ 모듈 로드 실패:', error);
});
`;

console.log(browserTestCode);