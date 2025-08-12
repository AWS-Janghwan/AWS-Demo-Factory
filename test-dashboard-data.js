/**
 * 대시보드 데이터 서비스 테스트 스크립트
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDashboardData() {
  console.log('🧪 대시보드 데이터 서비스 테스트 시작...\n');

  try {
    // 1. 백엔드 서버 상태 확인
    console.log('1️⃣ 백엔드 서버 상태 확인');
    const healthResponse = await fetch('http://localhost:3001/api/health');
    const healthData = await healthResponse.json();
    console.log('✅ 백엔드 서버 상태:', healthData.status);

    // 2. 콘텐츠 데이터 조회 테스트
    console.log('\n2️⃣ 콘텐츠 데이터 조회 테스트');
    const contentsResponse = await fetch('http://localhost:3001/api/contents');
    
    if (contentsResponse.ok) {
      const contentsData = await contentsResponse.json();
      console.log('✅ 콘텐츠 데이터 조회 성공:', contentsData.count, '개');
      
      // 콘텐츠 통계 출력
      if (contentsData.contents && contentsData.contents.length > 0) {
        const contents = contentsData.contents;
        
        // 카테고리별 통계
        const categoryStats = {};
        contents.forEach(content => {
          const category = content.category || 'Uncategorized';
          categoryStats[category] = (categoryStats[category] || 0) + 1;
        });
        
        console.log('📂 카테고리별 콘텐츠 수:');
        Object.entries(categoryStats).forEach(([category, count]) => {
          console.log(`   ${category}: ${count}개`);
        });
        
        // 작성자별 통계
        const authorStats = {};
        contents.forEach(content => {
          const author = content.author || 'Unknown';
          authorStats[author] = (authorStats[author] || 0) + 1;
        });
        
        console.log('✍️ 작성자별 콘텐츠 수:');
        Object.entries(authorStats)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .forEach(([author, count]) => {
            console.log(`   ${author}: ${count}개`);
          });
        
        // 조회수/좋아요 통계
        const totalViews = contents.reduce((sum, content) => sum + (content.views || 0), 0);
        const totalLikes = contents.reduce((sum, content) => sum + (content.likes || 0), 0);
        
        console.log('📊 콘텐츠 상호작용 통계:');
        console.log(`   총 조회수: ${totalViews}`);
        console.log(`   총 좋아요: ${totalLikes}`);
        console.log(`   평균 조회수: ${Math.round(totalViews / contents.length)}`);
        console.log(`   평균 좋아요: ${Math.round(totalLikes / contents.length)}`);
      }
    } else {
      console.log('❌ 콘텐츠 데이터 조회 실패:', contentsResponse.status);
    }

    // 3. Analytics 데이터 조회 테스트
    console.log('\n3️⃣ Analytics 데이터 조회 테스트');
    const analyticsResponse = await fetch('http://localhost:3001/api/analytics/data');
    const analyticsData = await analyticsResponse.json();
    console.log('✅ Analytics 데이터 조회 성공:', analyticsData.count, '개');

    // 이벤트 타입별 통계
    const eventStats = {};
    analyticsData.data.forEach(item => {
      eventStats[item.eventType] = (eventStats[item.eventType] || 0) + 1;
    });

    console.log('📊 이벤트 타입별 통계:');
    Object.entries(eventStats).forEach(([eventType, count]) => {
      console.log(`   ${eventType}: ${count}개`);
    });

    // 방문자 목적별 통계
    const purposeStats = {};
    analyticsData.data.forEach(item => {
      if (item.eventType === 'visitor_purpose') {
        const purpose = item.data.purpose || 'Unknown';
        purposeStats[purpose] = (purposeStats[purpose] || 0) + 1;
      }
    });

    console.log('🎯 방문자 목적별 통계:');
    Object.entries(purposeStats).forEach(([purpose, count]) => {
      const percentage = Math.round((count / Object.values(purposeStats).reduce((a, b) => a + b, 0)) * 100);
      console.log(`   ${purpose}: ${count}개 (${percentage}%)`);
    });

    // 4. 시간대별 분석
    console.log('\n4️⃣ 시간대별 활동 분석');
    const hourlyStats = {};
    for (let i = 0; i < 24; i++) {
      hourlyStats[i] = 0;
    }

    analyticsData.data.forEach(item => {
      const hour = new Date(item.timestamp).getHours();
      hourlyStats[hour]++;
    });

    const topHours = Object.entries(hourlyStats)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5);

    console.log('🕐 가장 활발한 시간대 TOP 5:');
    topHours.forEach(([hour, count]) => {
      console.log(`   ${hour}:00 - ${count}개 활동`);
    });

    // 5. 최근 활동 분석
    console.log('\n5️⃣ 최근 24시간 활동 분석');
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const recentActivities = analyticsData.data.filter(item => {
      return new Date(item.timestamp) >= yesterday;
    });

    console.log(`📈 최근 24시간 활동: ${recentActivities.length}개`);
    
    const recentEventStats = {};
    recentActivities.forEach(item => {
      recentEventStats[item.eventType] = (recentEventStats[item.eventType] || 0) + 1;
    });

    console.log('최근 24시간 이벤트 타입별:');
    Object.entries(recentEventStats).forEach(([eventType, count]) => {
      console.log(`   ${eventType}: ${count}개`);
    });

    console.log('\n🏁 대시보드 데이터 서비스 테스트 완료!');
    console.log('\n💡 권장사항:');
    console.log('1. 브라우저에서 http://localhost:3000/admin 접속');
    console.log('2. "데이터 새로고침" 버튼으로 실시간 데이터 확인');
    console.log('3. 각 탭에서 상세 분석 데이터 확인');
    console.log('4. PDF 리포트 생성 기능 테스트');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
  }
}

// 테스트 실행
testDashboardData();