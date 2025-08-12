// DynamoDB 데이터 수집 및 관리자 대시보드 연동 테스트 스크립트

const testAnalyticsFlow = async () => {
  console.log('🧪 Analytics 데이터 흐름 테스트 시작...\n');

  // 1. 백엔드 서버 상태 확인
  console.log('1️⃣ 백엔드 서버 상태 확인');
  try {
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ 백엔드 서버 정상:', healthData.status);
  } catch (error) {
    console.error('❌ 백엔드 서버 연결 실패:', error.message);
    return;
  }

  // 2. 방문자 목적 추적 테스트
  console.log('\n2️⃣ 방문자 목적 추적 테스트');
  try {
    const visitorData = {
      eventType: 'visitor_purpose',
      data: {
        purpose: 'technical-evaluation',
        userAgent: 'Mozilla/5.0 (Test Browser)',
        sessionId: `test-session-${Date.now()}`,
        url: 'http://localhost:3000',
        referrer: ''
      },
      timestamp: new Date().toISOString()
    };

    const trackResponse = await fetch('http://localhost:3001/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visitorData)
    });

    const trackResult = await trackResponse.json();
    if (trackResult.success) {
      console.log('✅ 방문자 목적 추적 성공');
    } else {
      console.error('❌ 방문자 목적 추적 실패:', trackResult.error);
    }
  } catch (error) {
    console.error('❌ 방문자 목적 추적 오류:', error.message);
  }

  // 3. 페이지 조회 추적 테스트
  console.log('\n3️⃣ 페이지 조회 추적 테스트');
  try {
    const pageViewData = {
      eventType: 'page_view',
      data: {
        pageName: 'Test Page',
        url: 'http://localhost:3000/test',
        referrer: 'http://localhost:3000',
        sessionId: `test-session-${Date.now()}`
      },
      timestamp: new Date().toISOString()
    };

    const pageResponse = await fetch('http://localhost:3001/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pageViewData)
    });

    const pageResult = await pageResponse.json();
    if (pageResult.success) {
      console.log('✅ 페이지 조회 추적 성공');
    } else {
      console.error('❌ 페이지 조회 추적 실패:', pageResult.error);
    }
  } catch (error) {
    console.error('❌ 페이지 조회 추적 오류:', error.message);
  }

  // 4. 콘텐츠 조회 추적 테스트
  console.log('\n4️⃣ 콘텐츠 조회 추적 테스트');
  try {
    const contentViewData = {
      eventType: 'content_view',
      data: {
        contentId: 'test-content-123',
        contentTitle: 'Test Content Title',
        url: 'http://localhost:3000/content/test-content-123',
        sessionId: `test-session-${Date.now()}`
      },
      timestamp: new Date().toISOString()
    };

    const contentResponse = await fetch('http://localhost:3001/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(contentViewData)
    });

    const contentResult = await contentResponse.json();
    if (contentResult.success) {
      console.log('✅ 콘텐츠 조회 추적 성공');
    } else {
      console.error('❌ 콘텐츠 조회 추적 실패:', contentResult.error);
    }
  } catch (error) {
    console.error('❌ 콘텐츠 조회 추적 오류:', error.message);
  }

  // 5. 저장된 데이터 조회 테스트
  console.log('\n5️⃣ 저장된 데이터 조회 테스트');
  try {
    const dataResponse = await fetch('http://localhost:3001/api/analytics/data');
    const dataResult = await dataResponse.json();
    
    if (dataResult.success) {
      console.log(`✅ 총 ${dataResult.count}개의 분석 데이터 조회 성공`);
      
      // 이벤트 타입별 통계
      const eventTypes = {};
      dataResult.data.forEach(item => {
        eventTypes[item.eventType] = (eventTypes[item.eventType] || 0) + 1;
      });
      
      console.log('📊 이벤트 타입별 통계:');
      Object.entries(eventTypes).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}개`);
      });
      
      // 최근 5개 데이터 표시
      const recentData = dataResult.data
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 5);
      
      console.log('\n📋 최근 5개 데이터:');
      recentData.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.eventType} - ${item.timestamp}`);
        if (item.data.purpose) console.log(`      목적: ${item.data.purpose}`);
        if (item.data.pageName) console.log(`      페이지: ${item.data.pageName}`);
        if (item.data.contentTitle) console.log(`      콘텐츠: ${item.data.contentTitle}`);
      });
      
    } else {
      console.error('❌ 데이터 조회 실패:', dataResult.error);
    }
  } catch (error) {
    console.error('❌ 데이터 조회 오류:', error.message);
  }

  console.log('\n🏁 Analytics 데이터 흐름 테스트 완료!');
};

// Node.js 환경에서 실행
if (typeof window === 'undefined') {
  const fetch = require('node-fetch');
  testAnalyticsFlow().catch(console.error);
}

// 브라우저 환경에서 실행
if (typeof window !== 'undefined') {
  window.testAnalyticsFlow = testAnalyticsFlow;
}