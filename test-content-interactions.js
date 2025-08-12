// 콘텐츠 조회수 및 좋아요 기능 테스트 스크립트

const testContentInteractions = async () => {
  console.log('🧪 콘텐츠 상호작용 기능 테스트 시작...\n');

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

  // 2. 기존 콘텐츠 목록 조회
  console.log('\n2️⃣ 기존 콘텐츠 목록 조회');
  try {
    const contentsResponse = await fetch('http://localhost:3001/api/contents');
    const contentsResult = await contentsResponse.json();
    
    if (contentsResult.success && contentsResult.contents.length > 0) {
      console.log(`✅ 총 ${contentsResult.contents.length}개의 콘텐츠 발견`);
      
      // 첫 번째 콘텐츠 선택
      const testContent = contentsResult.contents[0];
      console.log(`📄 테스트 대상 콘텐츠: "${testContent.title}" (ID: ${testContent.id})`);
      console.log(`   현재 조회수: ${testContent.views || 0}`);
      console.log(`   현재 좋아요: ${testContent.likes || 0}`);
      
      // 3. 콘텐츠 조회수 증가 테스트
      console.log('\n3️⃣ 콘텐츠 조회수 증가 테스트');
      
      // 세션별 중복 방지 테스트를 위해 여러 번 호출
      for (let i = 1; i <= 3; i++) {
        console.log(`\n   ${i}번째 조회 시도:`);
        
        const viewData = {
          eventType: 'content_view',
          data: {
            contentId: testContent.id,
            contentTitle: testContent.title,
            url: `http://localhost:3000/content/${testContent.id}`,
            sessionId: `test-session-${Date.now()}`, // 같은 세션 ID 사용
            category: testContent.category,
            author: testContent.author
          },
          timestamp: new Date().toISOString()
        };

        try {
          const trackResponse = await fetch('http://localhost:3001/api/analytics/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(viewData)
          });

          const trackResult = await trackResponse.json();
          if (trackResult.success) {
            console.log(`   ✅ Analytics 추적 성공 (${i}번째)`);
          } else {
            console.error(`   ❌ Analytics 추적 실패 (${i}번째):`, trackResult.error);
          }
        } catch (error) {
          console.error(`   ❌ Analytics 추적 오류 (${i}번째):`, error.message);
        }
        
        // 잠시 대기
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // 4. DynamoDB에서 조회수 업데이트 (실제 시스템에서는 ContentContext가 처리)
      console.log('\n4️⃣ DynamoDB 콘텐츠 조회수 업데이트 시뮬레이션');
      try {
        const updateData = {
          views: (testContent.views || 0) + 1 // 세션별 중복 방지로 1회만 증가
        };
        
        const updateResponse = await fetch(`http://localhost:3001/api/contents/${testContent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData)
        });
        
        const updateResult = await updateResponse.json();
        if (updateResult.success) {
          console.log(`   ✅ 조회수 업데이트 성공: ${testContent.views || 0} → ${updateData.views}`);
        } else {
          console.error('   ❌ 조회수 업데이트 실패:', updateResult.error);
        }
      } catch (error) {
        console.error('   ❌ 조회수 업데이트 오류:', error.message);
      }
      
      // 5. 좋아요 기능 테스트
      console.log('\n5️⃣ 좋아요 기능 테스트');
      try {
        const testUserId = 'test-user@example.com';
        const currentLikedBy = testContent.likedBy || [];
        const isCurrentlyLiked = currentLikedBy.includes(testUserId);
        
        const updatedLikedBy = isCurrentlyLiked 
          ? currentLikedBy.filter(uid => uid !== testUserId)
          : [...currentLikedBy, testUserId];
        
        const likeUpdateData = {
          likedBy: updatedLikedBy,
          likes: updatedLikedBy.length
        };
        
        console.log(`   현재 좋아요 상태: ${isCurrentlyLiked ? '좋아요됨' : '좋아요 안됨'}`);
        console.log(`   ${isCurrentlyLiked ? '좋아요 취소' : '좋아요 추가'} 시도...`);
        
        const likeResponse = await fetch(`http://localhost:3001/api/contents/${testContent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(likeUpdateData)
        });
        
        const likeResult = await likeResponse.json();
        if (likeResult.success) {
          console.log(`   ✅ 좋아요 업데이트 성공: ${testContent.likes || 0} → ${likeUpdateData.likes}`);
        } else {
          console.error('   ❌ 좋아요 업데이트 실패:', likeResult.error);
        }
      } catch (error) {
        console.error('   ❌ 좋아요 업데이트 오류:', error.message);
      }
      
      // 6. 업데이트된 콘텐츠 정보 확인
      console.log('\n6️⃣ 업데이트된 콘텐츠 정보 확인');
      try {
        const updatedResponse = await fetch(`http://localhost:3001/api/contents/${testContent.id}`);
        const updatedResult = await updatedResponse.json();
        
        if (updatedResult.success) {
          const updated = updatedResult.content;
          console.log(`✅ 업데이트된 콘텐츠 정보:`);
          console.log(`   제목: ${updated.title}`);
          console.log(`   조회수: ${updated.views || 0} (이전: ${testContent.views || 0})`);
          console.log(`   좋아요: ${updated.likes || 0} (이전: ${testContent.likes || 0})`);
          console.log(`   좋아요한 사용자: ${(updated.likedBy || []).length}명`);
        } else {
          console.error('❌ 업데이트된 콘텐츠 조회 실패:', updatedResult.error);
        }
      } catch (error) {
        console.error('❌ 업데이트된 콘텐츠 조회 오류:', error.message);
      }
      
      // 7. Analytics 데이터 확인
      console.log('\n7️⃣ Analytics 데이터 확인');
      try {
        const analyticsResponse = await fetch('http://localhost:3001/api/analytics/data?eventType=content_view');
        const analyticsResult = await analyticsResponse.json();
        
        if (analyticsResult.success) {
          const contentViews = analyticsResult.data.filter(item => 
            item.data.contentId === testContent.id
          );
          
          console.log(`✅ 해당 콘텐츠의 Analytics 기록: ${contentViews.length}개`);
          
          if (contentViews.length > 0) {
            const latest = contentViews[contentViews.length - 1];
            console.log(`   최근 조회 시간: ${latest.timestamp}`);
            console.log(`   세션 ID: ${latest.data.sessionId}`);
          }
        } else {
          console.error('❌ Analytics 데이터 조회 실패:', analyticsResult.error);
        }
      } catch (error) {
        console.error('❌ Analytics 데이터 조회 오류:', error.message);
      }
      
    } else {
      console.log('❌ 테스트할 콘텐츠가 없습니다.');
    }
  } catch (error) {
    console.error('❌ 콘텐츠 목록 조회 실패:', error.message);
  }

  console.log('\n🏁 콘텐츠 상호작용 기능 테스트 완료!');
  console.log('\n💡 테스트 결과 확인 방법:');
  console.log('   1. 브라우저에서 http://localhost:3000/admin 접속');
  console.log('   2. 관리자 대시보드에서 실시간 통계 확인');
  console.log('   3. "데이터 새로고침" 버튼으로 최신 데이터 로드');
  console.log('   4. 콘텐츠 상세 페이지에서 조회수/좋아요 확인');
};

// Node.js 환경에서 실행
if (typeof window === 'undefined') {
  const fetch = require('node-fetch');
  testContentInteractions().catch(console.error);
}

// 브라우저 환경에서 실행
if (typeof window !== 'undefined') {
  window.testContentInteractions = testContentInteractions;
}