import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

// Access purposes
export const ACCESS_PURPOSES = {
  AWS_INTERNAL: 'AWS Internal',
  CUSTOMER_DEMO: '고객사 데모 제공',
  OTHER: '기타'
};

// Create analytics context
const AnalyticsContext = createContext();

// Analytics provider component
export const AnalyticsProvider = ({ children }) => {
  const [analytics, setAnalytics] = useState({
    pageViews: {},
    contentViews: {},
    categoryViews: {},
    accessPurposes: {},
    totalVisitors: 0,
    dailyStats: {}
  });
  const [currentAccessPurpose, setCurrentAccessPurpose] = useState(null);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  
  // 중복 실행 방지를 위한 ref
  const isInitialized = useRef(false);

  // Load analytics from localStorage on mount
  useEffect(() => {
    if (isInitialized.current) {
      console.log('⚠️ useEffect 중복 실행 방지');
      return;
    }
    
    console.log('🚀 AnalyticsContext 초기화 시작');
    isInitialized.current = true;
    
    const storedAnalytics = localStorage.getItem('demoFactoryAnalytics');
    if (storedAnalytics) {
      try {
        const parsedData = JSON.parse(storedAnalytics);
        // 데이터 구조 검증 및 초기화
        const validatedData = {
          pageViews: parsedData.pageViews || {},
          contentViews: parsedData.contentViews || {},
          categoryViews: parsedData.categoryViews || {},
          accessPurposes: parsedData.accessPurposes || {},
          totalVisitors: parsedData.totalVisitors || 0,
          dailyStats: parsedData.dailyStats || {}
        };
        setAnalytics(validatedData);
        console.log('📊 분석 데이터 로드 완료:', validatedData);
      } catch (error) {
        console.error('❌ 분석 데이터 파싱 오류:', error);
        // 오류 시 초기 상태로 리셋
        setAnalytics({
          pageViews: {},
          contentViews: {},
          categoryViews: {},
          accessPurposes: {},
          totalVisitors: 0,
          dailyStats: {}
        });
      }
    } else {
      console.log('📭 저장된 분석 데이터가 없습니다. 새로 시작합니다.');
    }

    // Check if user has already selected purpose in this session
    const sessionPurpose = sessionStorage.getItem('accessPurpose');
    console.log('🔍 세션에서 접속 목적 확인:', sessionPurpose);
    
    if (sessionPurpose) {
      setCurrentAccessPurpose(sessionPurpose);
      // 이미 접속 목적이 있는 경우, 오늘 첫 방문인지 확인하고 추적
      const today = new Date().toISOString().split('T')[0];
      const visitorSessionKey = `visitor_${today}`;
      console.log('🔍 방문자 세션 키 확인:', visitorSessionKey, '존재 여부:', !!sessionStorage.getItem(visitorSessionKey));
      
      if (!sessionStorage.getItem(visitorSessionKey)) {
        console.log('🔄 기존 세션 목적으로 방문자 추적 시작:', sessionPurpose);
        trackVisitorWithPurpose(sessionPurpose);
      } else {
        console.log('👥 이미 오늘 추적된 방문자 (기존 세션)');
      }
    } else {
      console.log('🎯 접속 목적 미설정 - 팝업 표시');
      setShowPurposeModal(true);
    }
  }, []);

  // Save analytics to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(analytics.pageViews).length > 0 || 
        Object.keys(analytics.contentViews).length > 0 || 
        Object.keys(analytics.categoryViews).length > 0) {
      localStorage.setItem('demoFactoryAnalytics', JSON.stringify(analytics));
      console.log('💾 분석 데이터 저장됨');
    }
  }, [analytics]);

  // Track page view with content details - 개선된 중복 방지 로직
  const trackPageView = (pageName, category = null, contentId = null, contentTitle = null) => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const hour = now.getHours();
    const purpose = currentAccessPurpose || 'Unknown';
    
    // 메인페이지 방문자 추적 (하루에 한 번만)
    if (pageName === 'Home' || pageName === 'HomePage') {
      const visitorSessionKey = `visitor_${today}`;
      
      if (!sessionStorage.getItem(visitorSessionKey)) {
        sessionStorage.setItem(visitorSessionKey, 'true');
        
        setAnalytics(prev => {
          const newAnalytics = { ...prev };
          
          // 방문자 수만 증가
          newAnalytics.totalVisitors++;
          
          // 접속 목적 추적
          if (!newAnalytics.accessPurposes[purpose]) {
            newAnalytics.accessPurposes[purpose] = 0;
          }
          newAnalytics.accessPurposes[purpose]++;
          
          // 일별 방문자 통계
          if (!newAnalytics.dailyStats[today]) {
            newAnalytics.dailyStats[today] = {
              totalViews: 0,
              visitors: 0,
              purposes: {},
              hourlyViews: {}
            };
          }
          newAnalytics.dailyStats[today].visitors++;
          
          if (!newAnalytics.dailyStats[today].purposes[purpose]) {
            newAnalytics.dailyStats[today].purposes[purpose] = 0;
          }
          newAnalytics.dailyStats[today].purposes[purpose]++;
          
          console.log(`👥 새 방문자 추적: 총 ${newAnalytics.totalVisitors}명`);
          return newAnalytics;
        });
      } else {
        console.log('👥 이미 오늘 방문한 사용자');
      }
      return; // 메인페이지는 여기서 종료
    }
    
    // 실제 콘텐츠 페이지만 페이지뷰 카운트
    const isContentPage = contentId && contentTitle;
    const isCategoryPage = category && pageName.includes('Category:');
    
    if (!isContentPage && !isCategoryPage) {
      console.log('📄 일반 페이지 방문 (페이지뷰 카운트 안함):', pageName);
      return;
    }
    
    // 강화된 중복 방지 - 세션별 + 시간별 제한
    const sessionKey = `tracked_${contentId || pageName}_${today}_${hour}`;
    const globalSessionKey = `page_${pageName}_${today}`;
    
    // 이미 이 시간대에 추적된 콘텐츠인지 확인
    if (sessionStorage.getItem(sessionKey)) {
      console.log('🚫 이미 이 시간대에 추적된 콘텐츠:', contentTitle || pageName);
      return;
    }
    
    // 같은 페이지를 하루에 너무 많이 추적하는 것 방지
    const dailyTrackCount = parseInt(sessionStorage.getItem(globalSessionKey) || '0');
    if (dailyTrackCount >= 5) { // 하루 최대 5회 제한
      console.log('🚫 일일 추적 한도 초과:', pageName);
      return;
    }
    
    console.log('📈 페이지 뷰 추적:', { pageName, category, contentId, contentTitle, purpose });
    
    // 추적 기록 저장
    sessionStorage.setItem(sessionKey, 'true');
    sessionStorage.setItem(globalSessionKey, (dailyTrackCount + 1).toString());
    
    setAnalytics(prev => {
      const newAnalytics = { ...prev };
      
      // Track page views (실제 콘텐츠만)
      if (!newAnalytics.pageViews[pageName]) {
        newAnalytics.pageViews[pageName] = {};
      }
      if (!newAnalytics.pageViews[pageName][purpose]) {
        newAnalytics.pageViews[pageName][purpose] = 0;
      }
      newAnalytics.pageViews[pageName][purpose]++;
      
      // Track content views (실제 콘텐츠 조회 시에만)
      if (contentId && contentTitle) {
        if (!newAnalytics.contentViews) {
          newAnalytics.contentViews = {};
        }
        if (!newAnalytics.contentViews[contentId]) {
          newAnalytics.contentViews[contentId] = {
            title: contentTitle,
            category: category,
            totalViews: 0,
            dailyViews: {},
            hourlyViews: {},
            purposes: {},
            firstViewed: today,
            lastViewed: today
          };
        }
        
        // 총 조회수 (하루에 한 번만 증가)
        if (!newAnalytics.contentViews[contentId].dailyViews[today]) {
          newAnalytics.contentViews[contentId].totalViews++;
          newAnalytics.contentViews[contentId].lastViewed = today;
          
          // 일별 조회수
          newAnalytics.contentViews[contentId].dailyViews[today] = 1;
          
          // 시간대별 조회수
          if (!newAnalytics.contentViews[contentId].hourlyViews[hour]) {
            newAnalytics.contentViews[contentId].hourlyViews[hour] = 0;
          }
          newAnalytics.contentViews[contentId].hourlyViews[hour]++;
          
          // 목적별 조회수
          if (!newAnalytics.contentViews[contentId].purposes[purpose]) {
            newAnalytics.contentViews[contentId].purposes[purpose] = 0;
          }
          newAnalytics.contentViews[contentId].purposes[purpose]++;
          
          // 콘텐츠 조회 시 해당 카테고리 통계도 업데이트
          if (category) {
            if (!newAnalytics.categoryViews) {
              newAnalytics.categoryViews = {};
            }
            if (!newAnalytics.categoryViews[category]) {
              newAnalytics.categoryViews[category] = {
                totalViews: 0,
                dailyViews: {},
                purposes: {},
                firstViewed: today,
                lastViewed: today
              };
            }
            
            // 카테고리 통계 업데이트 (콘텐츠 조회로 인한)
            newAnalytics.categoryViews[category].totalViews++;
            newAnalytics.categoryViews[category].lastViewed = today;
            
            if (!newAnalytics.categoryViews[category].dailyViews[today]) {
              newAnalytics.categoryViews[category].dailyViews[today] = 0;
            }
            newAnalytics.categoryViews[category].dailyViews[today]++;
            
            if (!newAnalytics.categoryViews[category].purposes[purpose]) {
              newAnalytics.categoryViews[category].purposes[purpose] = 0;
            }
            newAnalytics.categoryViews[category].purposes[purpose]++;
            
            console.log(`📂 카테고리 통계 업데이트 (콘텐츠 조회): "${category}" (${newAnalytics.categoryViews[category].totalViews}회)`);
          }
          
          console.log(`📄 콘텐츠 조회 추적: "${contentTitle}" (${newAnalytics.contentViews[contentId].totalViews}회)`);
        } else {
          console.log(`📄 콘텐츠 이미 오늘 조회됨: "${contentTitle}"`);
        }
      }
      
      // Track category views (카테고리 페이지 직접 방문 시)
      if (category && pageName.includes('Category:')) {
        const categorySessionKey = `tracked_category_page_${category}_${today}`;
        
        if (!sessionStorage.getItem(categorySessionKey)) {
          sessionStorage.setItem(categorySessionKey, 'true');
          
          if (!newAnalytics.categoryViews) {
            newAnalytics.categoryViews = {};
          }
          if (!newAnalytics.categoryViews[category]) {
            newAnalytics.categoryViews[category] = {
              totalViews: 0,
              dailyViews: {},
              purposes: {},
              firstViewed: today,
              lastViewed: today
            };
          }
          
          // 카테고리 페이지 직접 방문 추가 점수
          newAnalytics.categoryViews[category].totalViews += 2; // 페이지 직접 방문은 2점
          newAnalytics.categoryViews[category].lastViewed = today;
          
          if (!newAnalytics.categoryViews[category].dailyViews[today]) {
            newAnalytics.categoryViews[category].dailyViews[today] = 0;
          }
          newAnalytics.categoryViews[category].dailyViews[today] += 2;
          
          if (!newAnalytics.categoryViews[category].purposes[purpose]) {
            newAnalytics.categoryViews[category].purposes[purpose] = 0;
          }
          newAnalytics.categoryViews[category].purposes[purpose] += 2;
          
          console.log(`📂 카테고리 페이지 직접 방문: "${category}" (${newAnalytics.categoryViews[category].totalViews}회)`);
        }
      }
      
      // Track daily stats (실제 콘텐츠 조회 시에만 페이지뷰 증가)
      if (!newAnalytics.dailyStats[today]) {
        newAnalytics.dailyStats[today] = {
          totalViews: 0,
          visitors: 0,
          purposes: {},
          hourlyViews: {}
        };
      }
      newAnalytics.dailyStats[today].totalViews++;
      
      // 시간대별 통계
      if (!newAnalytics.dailyStats[today].hourlyViews[hour]) {
        newAnalytics.dailyStats[today].hourlyViews[hour] = 0;
      }
      newAnalytics.dailyStats[today].hourlyViews[hour]++;
      
      return newAnalytics;
    });
  };

  // Track visitor (더 이상 사용하지 않음 - 접속 목적 선택 시 자동 추적)
  const trackVisitor = (purpose = null) => {
    console.log('⚠️ trackVisitor는 더 이상 직접 호출하지 않습니다. 접속 목적 선택 시 자동으로 추적됩니다.');
    // 빈 함수로 유지 (기존 코드 호환성)
  };

  // Track visitor with specific purpose (내부 함수)
  const trackVisitorWithPurpose = (purpose) => {
    const today = new Date().toISOString().split('T')[0];
    const visitorSessionKey = `visitor_${today}`;
    const processingKey = `processing_${today}`;
    
    console.log('🔍 trackVisitorWithPurpose 호출:', { purpose, today, visitorSessionKey });
    console.log('🔍 기존 방문자 키 존재 여부:', !!sessionStorage.getItem(visitorSessionKey));
    console.log('🔍 처리 중 플래그 존재 여부:', !!sessionStorage.getItem(processingKey));
    
    // 이미 처리 중이거나 완료된 경우 중복 실행 방지
    if (sessionStorage.getItem(visitorSessionKey) || sessionStorage.getItem(processingKey)) {
      console.log('⚠️ 이미 처리됨 또는 처리 중 - 중복 실행 방지');
      return;
    }
    
    // 처리 시작 플래그 설정
    sessionStorage.setItem(processingKey, 'true');
    console.log('✅ 새 방문자 추적 시작:', purpose);
    
    // 방문자 키 설정
    sessionStorage.setItem(visitorSessionKey, 'true');
    
    setAnalytics(prev => {
      const newAnalytics = { ...prev };
      
      console.log('📊 이전 방문자 수:', newAnalytics.totalVisitors);
      
      // 방문자 수만 증가
      newAnalytics.totalVisitors++;
      
      // 접속 목적 추적
      if (!newAnalytics.accessPurposes[purpose]) {
        newAnalytics.accessPurposes[purpose] = 0;
      }
      newAnalytics.accessPurposes[purpose]++;
      
      // 일별 방문자 통계
      if (!newAnalytics.dailyStats[today]) {
        newAnalytics.dailyStats[today] = {
          totalViews: 0,
          visitors: 0,
          purposes: {},
          hourlyViews: {}
        };
      }
      newAnalytics.dailyStats[today].visitors++;
      
      if (!newAnalytics.dailyStats[today].purposes[purpose]) {
        newAnalytics.dailyStats[today].purposes[purpose] = 0;
      }
      newAnalytics.dailyStats[today].purposes[purpose]++;
      
      console.log('📊 새로운 방문자 수:', newAnalytics.totalVisitors);
      console.log('📊 접속 목적 통계:', newAnalytics.accessPurposes);
      console.log(`👥 새 방문자 추적 완료 (${purpose}): 총 ${newAnalytics.totalVisitors}명`);
      
      // 처리 완료 후 플래그 제거
      setTimeout(() => {
        sessionStorage.removeItem(processingKey);
        console.log('🏁 처리 완료 플래그 제거');
      }, 100);
      
      return newAnalytics;
    });
  };

  const setAccessPurpose = (purpose) => {
    console.log('🎯 setAccessPurpose 호출:', purpose);
    
    setCurrentAccessPurpose(purpose);
    sessionStorage.setItem('accessPurpose', purpose);
    setShowPurposeModal(false);
    
    // 접속 목적 선택 후 방문자 추적 (새로 선택한 경우에만)
    const today = new Date().toISOString().split('T')[0];
    const visitorSessionKey = `visitor_${today}`;
    
    console.log('🔍 setAccessPurpose에서 방문자 키 확인:', visitorSessionKey, '존재 여부:', !!sessionStorage.getItem(visitorSessionKey));
    
    if (!sessionStorage.getItem(visitorSessionKey)) {
      console.log('🎯 새로운 접속 목적 설정 및 방문자 추적 시작:', purpose);
      trackVisitorWithPurpose(purpose);
    } else {
      console.log('🎯 접속 목적 설정 완료 (이미 추적된 방문자):', purpose);
    }
  };

  // Skip purpose selection
  const skipPurposeSelection = () => {
    console.log('⏭️ skipPurposeSelection 호출');
    
    setCurrentAccessPurpose('Skipped');
    sessionStorage.setItem('accessPurpose', 'Skipped');
    setShowPurposeModal(false);
    
    // 건너뜀으로 방문자 추적 (새로 선택한 경우에만)
    const today = new Date().toISOString().split('T')[0];
    const visitorSessionKey = `visitor_${today}`;
    
    console.log('🔍 skipPurposeSelection에서 방문자 키 확인:', visitorSessionKey, '존재 여부:', !!sessionStorage.getItem(visitorSessionKey));
    
    if (!sessionStorage.getItem(visitorSessionKey)) {
      console.log('⏭️ 접속 목적 선택 건너뜀 및 방문자 추적 시작');
      trackVisitorWithPurpose('Skipped');
    } else {
      console.log('⏭️ 접속 목적 선택 건너뜀 (이미 추적된 방문자)');
    }
  };

  // Get analytics summary - 페이지뷰 계산 로직 개선
  const getAnalyticsSummary = () => {
    // 실제 콘텐츠 조회수만 계산 (contentViews 기준)
    const totalContentViews = Object.values(analytics.contentViews || {}).reduce((total, content) => {
      return total + (content.totalViews || 0);
    }, 0);
    
    // 페이지뷰는 실제 의미있는 페이지만 계산
    const meaningfulPageViews = Object.entries(analytics.pageViews || {})
      .filter(([pageName]) => {
        // 실제 콘텐츠 페이지나 카테고리 페이지만 포함
        return pageName.includes('Content:') || pageName.includes('Category:') || pageName === 'Home';
      })
      .reduce((total, [, pageData]) => {
        return total + Object.values(pageData).reduce((sum, count) => sum + count, 0);
      }, 0);

    const topPages = Object.entries(analytics.pageViews || {})
      .map(([page, data]) => ({
        page,
        views: Object.values(data).reduce((sum, count) => sum + count, 0),
        purposes: data
      }))
      .filter(item => item.views > 0) // 0 조회수 제외
      .sort((a, b) => b.views - a.views)
      .slice(0, 10); // 상위 10개만

    return {
      totalPageViews: Math.max(meaningfulPageViews, totalContentViews), // 더 큰 값 사용
      totalContentViews, // 실제 콘텐츠 조회수
      topPages,
      accessPurposes: analytics.accessPurposes,
      dailyStats: analytics.dailyStats
    };
  };

  // Get author analytics - 작성자별 통계
  const getAuthorAnalytics = (period = 'all') => {
    // 콘텐츠 데이터 가져오기
    const contents = JSON.parse(localStorage.getItem('demoFactoryContents') || '[]');
    
    if (!contents.length || !analytics.contentViews) return [];
    
    // 작성자별 데이터 집계
    const authorStats = {};
    
    contents.forEach(content => {
      const author = content.author || 'Unknown';
      const contentViews = analytics.contentViews[content.id] || {};
      
      if (!authorStats[author]) {
        authorStats[author] = {
          author,
          totalContents: 0,
          totalViews: 0,
          totalLikes: 0,
          periodViews: 0,
          contents: []
        };
      }
      
      // 콘텐츠 수 증가
      authorStats[author].totalContents++;
      
      // 총 조회수와 좋아요 수 추가
      authorStats[author].totalViews += content.views || 0;
      authorStats[author].totalLikes += content.likes || 0;
      
      // 기간별 조회수 계산
      const now = new Date();
      let periodViews = 0;
      
      if (contentViews.dailyViews) {
        Object.entries(contentViews.dailyViews).forEach(([date, views]) => {
          const viewDate = new Date(date);
          const daysDiff = Math.floor((now - viewDate) / (1000 * 60 * 60 * 24));
          
          if (period === 'all') {
            periodViews += views;
          } else if (period === 'day' && daysDiff === 0) {
            periodViews += views;
          } else if (period === 'week' && daysDiff <= 7) {
            periodViews += views;
          } else if (period === 'month' && daysDiff <= 30) {
            periodViews += views;
          }
        });
      }
      
      authorStats[author].periodViews += periodViews;
      
      // 콘텐츠 정보 추가
      authorStats[author].contents.push({
        id: content.id,
        title: content.title,
        category: content.category,
        views: content.views || 0,
        likes: content.likes || 0,
        createdAt: content.createdAt
      });
    });
    
    // 배열로 변환하고 정렬 (총 조회수 기준)
    return Object.values(authorStats)
      .sort((a, b) => b.totalViews - a.totalViews);
  };

  // Get content analytics with author info
  const getContentAnalyticsWithAuthor = (period = 'all') => {
    if (!analytics.contentViews) return [];
    
    // 콘텐츠 데이터 가져오기
    const contents = JSON.parse(localStorage.getItem('demoFactoryContents') || '[]');
    const contentMap = {};
    contents.forEach(content => {
      contentMap[content.id] = content;
    });
    
    const now = new Date();
    const filterByPeriod = (dailyViews) => {
      if (period === 'all') return dailyViews;
      
      const filtered = {};
      Object.entries(dailyViews).forEach(([date, views]) => {
        const viewDate = new Date(date);
        const daysDiff = Math.floor((now - viewDate) / (1000 * 60 * 60 * 24));
        
        if (period === 'day' && daysDiff === 0) filtered[date] = views;
        else if (period === 'week' && daysDiff <= 7) filtered[date] = views;
        else if (period === 'month' && daysDiff <= 30) filtered[date] = views;
      });
      return filtered;
    };

    return Object.entries(analytics.contentViews)
      .map(([contentId, data]) => {
        const content = contentMap[contentId];
        if (!content) return null;
        
        const filteredViews = filterByPeriod(data.dailyViews || {});
        const periodViews = Object.values(filteredViews).reduce((sum, views) => sum + views, 0);
        
        return {
          contentId: parseInt(contentId),
          title: content.title,
          category: content.category || 'Uncategorized',
          author: content.author || 'Unknown', // 작성자 정보 추가
          totalViews: data.totalViews || 0,
          periodViews,
          likes: content.likes || 0, // 좋아요 수 추가
          createdAt: content.createdAt
        };
      })
      .filter(item => item !== null && item.periodViews > 0)
      .sort((a, b) => b.periodViews - a.periodViews);
  };

  // Get category analytics
  const getCategoryAnalytics = (period = 'all') => {
    if (!analytics.categoryViews) return [];
    
    const now = new Date();
    const filterByPeriod = (dailyViews) => {
      if (period === 'all') return dailyViews;
      
      const filtered = {};
      Object.entries(dailyViews).forEach(([date, views]) => {
        const viewDate = new Date(date);
        const daysDiff = Math.floor((now - viewDate) / (1000 * 60 * 60 * 24));
        
        if (period === 'day' && daysDiff === 0) filtered[date] = views;
        else if (period === 'week' && daysDiff <= 7) filtered[date] = views;
        else if (period === 'month' && daysDiff <= 30) filtered[date] = views;
      });
      
      return filtered;
    };

    return Object.entries(analytics.categoryViews)
      .map(([category, data]) => {
        const filteredViews = filterByPeriod(data.dailyViews);
        const periodViews = Object.values(filteredViews).reduce((sum, views) => sum + views, 0);
        
        return {
          category,
          totalViews: data.totalViews,
          periodViews,
          dailyViews: data.dailyViews,
          purposes: data.purposes,
          firstViewed: data.firstViewed,
          lastViewed: data.lastViewed
        };
      })
      .sort((a, b) => b.periodViews - a.periodViews);
  };

  // Get time-based analytics
  const getTimeAnalytics = (period = 'week') => {
    const now = new Date();
    const result = [];
    
    if (period === 'week') {
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = analytics.dailyStats[dateStr] || { totalViews: 0 };
        
        result.push({
          date: dateStr,
          day: date.toLocaleDateString('ko-KR', { weekday: 'short' }),
          views: dayData.totalViews,
          purposes: dayData.purposes || {}
        });
      }
    } else if (period === 'month') {
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayData = analytics.dailyStats[dateStr] || { totalViews: 0 };
        
        result.push({
          date: dateStr,
          day: date.getDate(),
          views: dayData.totalViews,
          purposes: dayData.purposes || {}
        });
      }
    }
    
    return result;
  };

  // Get hourly analytics
  const getHourlyAnalytics = () => {
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      views: 0,
      label: `${hour}:00`
    }));

    Object.values(analytics.dailyStats).forEach(dayData => {
      if (dayData.hourlyViews) {
        Object.entries(dayData.hourlyViews).forEach(([hour, views]) => {
          hourlyData[parseInt(hour)].views += views;
        });
      }
    });

    return hourlyData;
  };

  // Clear all analytics data
  const clearAnalytics = () => {
    setAnalytics({
      pageViews: {},
      contentViews: {},
      categoryViews: {},
      accessPurposes: {},
      totalVisitors: 0,
      dailyStats: {}
    });
    localStorage.removeItem('demoFactoryAnalytics');
    
    // 세션 스토리지에서 추적 기록도 삭제
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('tracked_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log('🧹 분석 데이터 및 추적 기록 초기화 완료');
  };

  // Get access purpose analytics (새로 추가)
  const getAccessPurposeAnalytics = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    
    // 전체 접속 목적 통계
    const totalPurposes = Object.entries(analytics.accessPurposes || {}).map(([purpose, count]) => ({
      purpose,
      count,
      percentage: analytics.totalVisitors > 0 ? ((count / analytics.totalVisitors) * 100).toFixed(1) : 0
    })).sort((a, b) => b.count - a.count);

    // 일별 접속 목적 트렌드 (최근 7일)
    const dailyTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = analytics.dailyStats[dateStr] || { purposes: {} };
      
      const dayTrend = {
        date: dateStr,
        day: date.toLocaleDateString('ko-KR', { weekday: 'short', month: 'short', day: 'numeric' }),
        purposes: {}
      };

      // 각 목적별 일별 데이터
      Object.keys(ACCESS_PURPOSES).forEach(key => {
        const purposeValue = ACCESS_PURPOSES[key];
        dayTrend.purposes[purposeValue] = dayData.purposes[purposeValue] || 0;
      });
      dayTrend.purposes['Skipped'] = dayData.purposes['Skipped'] || 0;
      dayTrend.purposes['Unknown'] = dayData.purposes['Unknown'] || 0;

      dailyTrends.push(dayTrend);
    }

    // 오늘의 접속 목적
    const todayPurposes = analytics.dailyStats[today]?.purposes || {};
    const todayTotal = Object.values(todayPurposes).reduce((sum, count) => sum + count, 0);

    return {
      totalPurposes,
      dailyTrends,
      todayPurposes: Object.entries(todayPurposes).map(([purpose, count]) => ({
        purpose,
        count,
        percentage: todayTotal > 0 ? ((count / todayTotal) * 100).toFixed(1) : 0
      })).sort((a, b) => b.count - a.count),
      totalVisitors: analytics.totalVisitors || 0,
      todayTotal
    };
  };

  // Debug function to check category data
  const debugCategoryData = () => {
    console.log('🔍 카테고리 데이터 디버깅:');
    console.log('categoryViews:', analytics.categoryViews);
    console.log('contentViews:', analytics.contentViews);
    
    // 콘텐츠에서 카테고리 추출
    const categoriesFromContent = {};
    Object.values(analytics.contentViews || {}).forEach(content => {
      if (content.category) {
        if (!categoriesFromContent[content.category]) {
          categoriesFromContent[content.category] = 0;
        }
        categoriesFromContent[content.category] += content.totalViews;
      }
    });
    console.log('콘텐츠에서 추출한 카테고리:', categoriesFromContent);
  };

  const value = {
    analytics,
    currentAccessPurpose,
    showPurposeModal,
    trackPageView,
    trackVisitor,
    setAccessPurpose,
    skipPurposeSelection,
    getAnalyticsSummary,
    getContentAnalytics: getContentAnalyticsWithAuthor, // 기존 함수를 새로운 함수로 교체
    getAuthorAnalytics, // 새로운 작성자 분석 함수 추가
    getCategoryAnalytics,
    getTimeAnalytics,
    getHourlyAnalytics,
    getAccessPurposeAnalytics,
    clearAnalytics,
    debugCategoryData,
    ACCESS_PURPOSES
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Custom hook to use analytics context
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export default AnalyticsContext;
