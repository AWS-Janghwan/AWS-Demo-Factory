import React, { createContext, useState, useContext, useEffect, useRef } from 'react';

// Access purposes - 실제 모달에서 사용하는 3가지 옵션만 정의
export const ACCESS_PURPOSES = {
  AWS_INTERNAL: 'aws-internal',
  CUSTOMER_DEMO: 'customer-demo',
  OTHER: 'other'
};

// Create analytics context
const AnalyticsContext = createContext();

// 기본 분석 데이터 구조
const getDefaultAnalytics = () => ({
  pageViews: {},
  contentViews: {},
  categoryViews: {},
  accessPurposes: {},
  totalVisitors: 0,
  dailyStats: {}
});

// Analytics provider component
export const AnalyticsProvider = ({ children }) => {
  const [analytics, setAnalytics] = useState(getDefaultAnalytics());
  const [currentAccessPurpose, setCurrentAccessPurpose] = useState(null);
  const [showPurposeModal, setShowPurposeModal] = useState(false);
  
  // 중복 실행 방지를 위한 ref
  const isInitialized = useRef(false);

  // Load analytics from localStorage on mount (임시 비활성화)
  useEffect(() => {
    if (isInitialized.current) {
      console.log('⚠️ useEffect 중복 실행 방지');
      return;
    }
    
    console.log('🚀 AnalyticsContext 초기화 시작');
    isInitialized.current = true;
    
    // localStorage 데이터만 정리 (세션 데이터는 유지)
    try {
      localStorage.removeItem('demoFactoryAnalytics'); // 기존 데이터 제거
      console.log('🗑️ localStorage 데이터 정리 완료 (세션 데이터는 유지)');
    } catch (cleanupError) {
      console.error('❌ localStorage 정리 실패:', cleanupError);
    }
    
    // 기본 상태로 설정
    setAnalytics(getDefaultAnalytics());
    console.log('📝 기본 분석 데이터로 시작합니다.');

    // Check if user has already selected purpose in this session
    const sessionPurpose = sessionStorage.getItem('accessPurpose');
    const modalShownKey = 'accessPurposeModalShown';
    const modalShown = sessionStorage.getItem(modalShownKey);
    
    console.log('🔍 세션에서 접속 목적 확인:', sessionPurpose);
    console.log('🔍 모달 표시 여부 확인:', modalShown);
    
    if (sessionPurpose && modalShown) {
      // 이미 세션에서 목적을 선택했고 모달도 표시된 경우
      setCurrentAccessPurpose(sessionPurpose);
      
      const today = new Date().toISOString().split('T')[0];
      const visitorSessionKey = `visitor_${today}`;
      
      if (!sessionStorage.getItem(visitorSessionKey)) {
        console.log('🔄 기존 세션 목적으로 방문자 추적 시작:', sessionPurpose);
        trackVisitorWithPurpose(sessionPurpose);
      } else {
        console.log('👥 이미 오늘 추적된 방문자 (기존 세션)');
      }
    } else if (!modalShown) {
      // 세션에서 모달을 아직 보여주지 않은 경우만 표시
      console.log('🎯 세션 최초 접속 - 목적 선택 모달 표시');
      setShowPurposeModal(true);
    } else {
      console.log('👍 이미 이번 세션에서 모달을 보여주었음 - 생략');
    }
  }, []);

  // Save analytics to localStorage whenever it changes (임시 비활성화)
  useEffect(() => {
    if (Object.keys(analytics.pageViews).length > 0 || 
        Object.keys(analytics.contentViews).length > 0 || 
        Object.keys(analytics.categoryViews).length > 0) {
      // localStorage.setItem('demoFactoryAnalytics', JSON.stringify(analytics));
      console.log('💾 분석 데이터 저장됨 (localStorage 저장 임시 비활성화)');
    }
  }, [analytics]);

  // Track visitor with purpose
  const trackVisitorWithPurpose = async (purpose) => {
    const today = new Date().toISOString().split('T')[0];
    const visitorSessionKey = `visitor_${today}`;
    
    // Mark this visitor as tracked for today
    sessionStorage.setItem(visitorSessionKey, 'true');
    sessionStorage.setItem('accessPurpose', purpose);
    
    setCurrentAccessPurpose(purpose);
    
    // 백엔드 API를 통해 DynamoDB에 저장 (비동기, 비차단)
    setTimeout(async () => {
      try {
        const analyticsService = (await import('../services/analyticsService')).default;
        await analyticsService.trackVisitorPurpose(purpose, {
          userAgent: navigator.userAgent,
          url: window.location.href,
          referrer: document.referrer
        });
        console.log(`✅ DynamoDB에 방문 목적 저장 성공: ${purpose}`);
      } catch (error) {
        console.warn(`⚠️ DynamoDB 저장 실패 (로컬 저장으로 대체): ${error.message}`);
      }
    }, 100); // 100ms 지연으로 비차단 처리
    
    // Update local analytics (fallback)
    setAnalytics(prev => ({
      ...prev,
      totalVisitors: prev.totalVisitors + 1,
      accessPurposes: {
        ...prev.accessPurposes,
        [purpose]: (prev.accessPurposes[purpose] || 0) + 1
      },
      dailyStats: {
        ...prev.dailyStats,
        [today]: {
          ...prev.dailyStats[today],
          visitors: (prev.dailyStats[today]?.visitors || 0) + 1,
          purposes: {
            ...prev.dailyStats[today]?.purposes,
            [purpose]: (prev.dailyStats[today]?.purposes?.[purpose] || 0) + 1
          }
        }
      }
    }));
    
    console.log(`📊 방문자 추적 완료: ${purpose}`);
  };

  // Track page view
  const trackPageView = async (pageName) => {
    // 백엔드 API를 통해 DynamoDB에 저장
    try {
      const analyticsService = (await import('../services/analyticsService')).default;
      await analyticsService.trackPageView(pageName);
    } catch (error) {
      console.warn(`⚠️ 페이지 조회 DynamoDB 저장 실패: ${error.message}`);
    }
    
    // Update local analytics (fallback)
    setAnalytics(prev => ({
      ...prev,
      pageViews: {
        ...prev.pageViews,
        [pageName]: (prev.pageViews[pageName] || 0) + 1
      }
    }));
    console.log(`📄 페이지 조회 추적: ${pageName}`);
  };

  // Track content view
  const trackContentView = async (contentId, contentTitle) => {
    // 백엔드 API를 통해 DynamoDB에 저장
    try {
      const analyticsService = (await import('../services/analyticsService')).default;
      await analyticsService.trackContentView(contentId, contentTitle);
    } catch (error) {
      console.warn(`⚠️ 콘텐츠 조회 DynamoDB 저장 실패: ${error.message}`);
    }
    
    // Update local analytics (fallback)
    setAnalytics(prev => ({
      ...prev,
      contentViews: {
        ...prev.contentViews,
        [contentId]: {
          title: contentTitle,
          views: (prev.contentViews[contentId]?.views || 0) + 1,
          lastViewed: new Date().toISOString()
        }
      }
    }));
    console.log(`📖 콘텐츠 조회 추적: ${contentTitle}`);
  };

  // Track category view
  const trackCategoryView = async (category) => {
    // 백엔드 API를 통해 DynamoDB에 저장
    try {
      const analyticsService = (await import('../services/analyticsService')).default;
      await analyticsService.trackCategoryView(category);
    } catch (error) {
      console.warn(`⚠️ 카테고리 조회 DynamoDB 저장 실패: ${error.message}`);
    }
    
    // Update local analytics (fallback)
    setAnalytics(prev => ({
      ...prev,
      categoryViews: {
        ...prev.categoryViews,
        [category]: (prev.categoryViews[category] || 0) + 1
      }
    }));
    console.log(`🏷️ 카테고리 조회 추적: ${category}`);
  };

  // Set access purpose
  const setAccessPurpose = (purpose) => {
    console.log('🎯 접속 목적 설정:', purpose);
    setShowPurposeModal(false);
    trackVisitorWithPurpose(purpose);
  };

  // Skip purpose selection
  const skipPurposeSelection = () => {
    console.log('⏭️ 접속 목적 선택 건너뛰기');
    setShowPurposeModal(false);
    setCurrentAccessPurpose('Skipped');
    trackVisitorWithPurpose('Skipped');
  };

  // Get analytics summary (실시간 데이터 포함)
  const getAnalyticsSummary = async () => {
    // 로컬 데이터 계산
    const totalPageViews = Object.values(analytics.pageViews).reduce((sum, views) => sum + views, 0);
    const totalContentViews = Object.values(analytics.contentViews).reduce((sum, content) => sum + content.views, 0);
    const totalCategoryViews = Object.values(analytics.categoryViews).reduce((sum, views) => sum + views, 0);
    
    // DynamoDB에서 실시간 데이터 조회 (비동기)
    let realTimeData = {
      totalVisitors: analytics.totalVisitors,
      totalPageViews,
      totalContentViews,
      totalCategoryViews,
      accessPurposes: analytics.accessPurposes
    };
    
    try {
      const analyticsService = (await import('../services/analyticsService')).default;
      const dynamoData = await analyticsService.getAnalyticsData();
      
      if (dynamoData && dynamoData.length > 0) {
        // DynamoDB 데이터로 실시간 통계 계산
        const visitorPurposes = {};
        let pageViewCount = 0;
        let contentViewCount = 0;
        
        dynamoData.forEach(item => {
          if (item.eventType === 'visitor_purpose' && item.data.purpose) {
            visitorPurposes[item.data.purpose] = (visitorPurposes[item.data.purpose] || 0) + 1;
          } else if (item.eventType === 'page_view') {
            pageViewCount++;
          } else if (item.eventType === 'content_view') {
            contentViewCount++;
          }
        });
        
        realTimeData = {
          totalVisitors: Object.values(visitorPurposes).reduce((sum, count) => sum + count, 0),
          totalPageViews: pageViewCount,
          totalContentViews: contentViewCount,
          totalCategoryViews,
          accessPurposes: visitorPurposes
        };
        
        console.log('📊 [AnalyticsContext] 실시간 데이터 업데이트:', realTimeData);
      }
    } catch (error) {
      console.warn('⚠️ [AnalyticsContext] 실시간 데이터 조회 실패:', error.message);
    }
    
    return {
      ...realTimeData,
      lastUpdated: new Date().toISOString()
    };
  };

  // Get content analytics (실시간 데이터 포함)
  const getContentAnalytics = async (period = 'all') => {
    // 로컬 데이터
    let localContentViews = Object.entries(analytics.contentViews).map(([id, data]) => ({
      id,
      title: data.title,
      views: data.views,
      lastViewed: data.lastViewed
    }));
    
    // DynamoDB에서 실시간 콘텐츠 조회 데이터 조회
    try {
      const analyticsService = (await import('../services/analyticsService')).default;
      const dynamoData = await analyticsService.getAnalyticsData('content_view');
      
      if (dynamoData && dynamoData.length > 0) {
        const contentViewStats = {};
        
        dynamoData.forEach(item => {
          if (item.data.contentId && item.data.contentTitle) {
            const contentId = item.data.contentId;
            if (!contentViewStats[contentId]) {
              contentViewStats[contentId] = {
                id: contentId,
                title: item.data.contentTitle,
                views: 0,
                lastViewed: item.timestamp
              };
            }
            contentViewStats[contentId].views++;
            if (new Date(item.timestamp) > new Date(contentViewStats[contentId].lastViewed)) {
              contentViewStats[contentId].lastViewed = item.timestamp;
            }
          }
        });
        
        localContentViews = Object.values(contentViewStats);
        console.log('📊 [AnalyticsContext] 실시간 콘텐츠 분석 데이터:', localContentViews);
      }
    } catch (error) {
      console.warn('⚠️ [AnalyticsContext] 콘텐츠 분석 데이터 조회 실패:', error.message);
    }
    
    return localContentViews.sort((a, b) => b.views - a.views);
  };

  // Get author analytics (placeholder)
  const getAuthorAnalytics = (period = 'all') => {
    return [];
  };

  // Get category analytics
  const getCategoryAnalytics = (period = 'all') => {
    return Object.entries(analytics.categoryViews).map(([category, views]) => ({
      category,
      views
    })).sort((a, b) => b.views - a.views);
  };

  // Get time analytics
  const getTimeAnalytics = (period = 'all') => {
    return Object.entries(analytics.dailyStats).map(([date, stats]) => ({
      date,
      visitors: stats.visitors || 0,
      views: Object.values(stats.purposes || {}).reduce((sum, count) => sum + count, 0)
    }));
  };

  // Get hourly analytics
  const getHourlyAnalytics = () => {
    return [];
  };

  // Get access purpose analytics (실시간 데이터 포함)
  const getAccessPurposeAnalytics = async () => {
    let localPurposes = analytics.accessPurposes;
    
    // DynamoDB에서 실시간 접속 목적 데이터 조회
    try {
      const analyticsService = (await import('../services/analyticsService')).default;
      const dynamoData = await analyticsService.getAnalyticsData('visitor_purpose');
      
      if (dynamoData && dynamoData.length > 0) {
        const purposeStats = {};
        
        dynamoData.forEach(item => {
          if (item.data.purpose) {
            purposeStats[item.data.purpose] = (purposeStats[item.data.purpose] || 0) + 1;
          }
        });
        
        localPurposes = purposeStats;
        console.log('📊 [AnalyticsContext] 실시간 접속 목적 데이터:', localPurposes);
      }
    } catch (error) {
      console.warn('⚠️ [AnalyticsContext] 접속 목적 데이터 조회 실패:', error.message);
    }
    
    const totalPurposes = Object.entries(localPurposes).map(([purpose, count]) => ({
      purpose,
      count
    }));
    
    return {
      totalPurposes,
      totalCount: Object.values(localPurposes).reduce((sum, count) => sum + count, 0)
    };
  };

  // Clear analytics
  const clearAnalytics = () => {
    setAnalytics(getDefaultAnalytics());
    localStorage.removeItem('demoFactoryAnalytics');
    console.log('🧹 분석 데이터 초기화 완료');
  };

  // Debug category data
  const debugCategoryData = () => {
    console.log('🐛 카테고리 디버그 데이터:', analytics.categoryViews);
  };

  const value = {
    analytics,
    currentAccessPurpose,
    showPurposeModal,
    setShowPurposeModal,
    setAccessPurpose,
    skipPurposeSelection,
    trackVisitorWithPurpose,
    trackPageView,
    trackContentView,
    trackCategoryView,
    getAnalyticsSummary,
    getContentAnalytics,
    getAuthorAnalytics,
    getCategoryAnalytics,
    getTimeAnalytics,
    getHourlyAnalytics,
    getAccessPurposeAnalytics,
    // 실시간 데이터 새로고침 함수
    refreshAnalyticsData: async () => {
      console.log('🔄 [AnalyticsContext] 실시간 데이터 새로고침 시작...');
      // 이 함수들은 이제 비동기로 DynamoDB 데이터를 가져옴
      const [summary, contentAnalytics, purposeAnalytics] = await Promise.all([
        getAnalyticsSummary(),
        getContentAnalytics(),
        getAccessPurposeAnalytics()
      ]);
      console.log('✅ [AnalyticsContext] 실시간 데이터 새로고침 완료');
      return { summary, contentAnalytics, purposeAnalytics };
    },
    clearAnalytics,
    debugCategoryData
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Hook to use analytics context
export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

export default AnalyticsContext;