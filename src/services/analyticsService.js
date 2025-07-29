// 백엔드 API를 통한 분석 데이터 저장 서비스

// 긴급 해결: 강제로 www 없는 도메인 사용
const getBackendUrl = () => {
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    let hostname = window.location.hostname;
    
    // 강제로 www 제거
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    const url = `${protocol}//${hostname}`;
    console.log('🚑🚑 [Analytics] 긴급 해결 - www 제거:', url);
    return url;
  }
  return 'http://localhost:3001';
};

const BACKEND_API_URL = getBackendUrl();
console.log('🔗 [Analytics] 동적 API URL:', BACKEND_API_URL);

class AnalyticsService {
  constructor() {
    console.log('📊 [AnalyticsService] 분석 서비스 초기화');
  }

  // 분석 이벤트 추적
  async trackEvent(eventType, data) {
    try {
      console.log(`📊 [AnalyticsService] 이벤트 추적 시작: ${eventType}`, data);
      
      // 타임아웃 설정 (5초)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const apiUrl = getBackendUrl();
      console.log('🚑🚑 [Analytics] API 호출 URL:', `${apiUrl}/api/analytics/track`);
      const response = await fetch(`${apiUrl}/api/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventType,
          data,
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ [AnalyticsService] 이벤트 추적 성공: ${eventType}`);
        return result;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn(`⏰ [AnalyticsService] 이벤트 추적 타임아웃: ${eventType}`);
      } else {
        console.warn(`⚠️ [AnalyticsService] 이벤트 추적 실패: ${eventType}`, error.message);
      }
      // 분석 데이터 저장 실패는 사용자 경험에 영향을 주지 않도록 조용히 처리
      return { success: false, error: error.message };
    }
  }

  // 방문자 목적 추적
  async trackVisitorPurpose(purpose, userInfo = {}) {
    return this.trackEvent('visitor_purpose', {
      purpose,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      ...userInfo
    });
  }

  // 페이지 조회 추적
  async trackPageView(pageName, additionalData = {}) {
    return this.trackEvent('page_view', {
      pageName,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      ...additionalData
    });
  }

  // 콘텐츠 조회 추적
  async trackContentView(contentId, contentTitle, additionalData = {}) {
    return this.trackEvent('content_view', {
      contentId,
      contentTitle,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      ...additionalData
    });
  }

  // 카테고리 조회 추적
  async trackCategoryView(category, additionalData = {}) {
    return this.trackEvent('category_view', {
      category,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.getSessionId(),
      ...additionalData
    });
  }

  // 분석 데이터 조회
  async getAnalyticsData(eventType = null, startDate = null, endDate = null) {
    try {
      console.log('📊 [AnalyticsService] 분석 데이터 조회 시작');
      
      const params = new URLSearchParams();
      if (eventType) params.append('eventType', eventType);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      const apiUrl = getBackendUrl();
      const response = await fetch(`${apiUrl}/api/analytics/data?${params}`);
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ [AnalyticsService] 분석 데이터 조회 성공: ${result.count}건`);
        return result.data;
      } else {
        throw new Error(result.error);
      }
      
    } catch (error) {
      console.error('❌ [AnalyticsService] 분석 데이터 조회 실패:', error);
      throw error;
    }
  }

  // 세션 ID 생성/조회
  getSessionId() {
    let sessionId = sessionStorage.getItem('analyticsSessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analyticsSessionId', sessionId);
    }
    return sessionId;
  }

  // 백엔드 서버 상태 확인
  async checkBackendStatus() {
    try {
      const apiUrl = getBackendUrl();
      const response = await fetch(`${apiUrl}/api/health`);
      return response.ok;
    } catch (error) {
      console.warn('⚠️ [AnalyticsService] 백엔드 서버 연결 실패:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스 생성
const analyticsService = new AnalyticsService();

export default analyticsService;