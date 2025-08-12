/**
 * 관리자 대시보드 데이터 서비스
 * DynamoDB에서 실시간 데이터를 조회하여 대시보드에 표시
 */

import analyticsService from './analyticsService';

class DashboardDataService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
    this.rawDataCache = null; // 원본 데이터 캐시
    this.rawDataTimestamp = null;
  }

  /**
   * 캐시된 데이터 조회
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * 데이터 캐시 저장
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * 원본 분석 데이터 한 번만 조회 (중요!)
   */
  async getRawAnalyticsData() {
    // 캐시된 데이터가 있고 5분 이내라면 재사용
    if (this.rawDataCache && this.rawDataTimestamp && 
        Date.now() - this.rawDataTimestamp < this.cacheTimeout) {
      console.log('💾 [DashboardDataService] 캐시된 원본 데이터 사용');
      return this.rawDataCache;
    }

    try {
      console.log('🔄 [DashboardDataService] 원본 분석 데이터 조회 시작... (한 번만 호출)');
      
      // DynamoDB에서 실시간 데이터 조회 (한 번만!)
      const analyticsData = await analyticsService.getAnalyticsData();
      
      // 캐시 저장
      this.rawDataCache = analyticsData;
      this.rawDataTimestamp = Date.now();
      
      console.log(`✅ [DashboardDataService] 원본 데이터 조회 완료: ${analyticsData.length}건`);
      return analyticsData;
      
    } catch (error) {
      console.error('❌ [DashboardDataService] 원본 데이터 조회 실패:', error);
      return [];
    }
  }

  /**
   * 전체 분석 요약 데이터 조회
   */
  async getAnalyticsSummary() {
    const cacheKey = 'analytics_summary';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📊 [DashboardDataService] 분석 요약 데이터 조회 시작...');
      
      // 원본 데이터 한 번만 조회
      const analyticsData = await this.getRawAnalyticsData();
      
      // 방문자 목적별 통계
      const visitorPurposes = {};
      let totalPageViews = 0;
      let totalContentViews = 0;
      let totalUniqueVisitors = new Set();

      analyticsData.forEach(item => {
        if (item.eventType === 'visitor_purpose') {
          const purpose = item.data.purpose || 'Unknown';
          // Unknown은 카운트하지 않음
          if (purpose !== 'Unknown') {
            visitorPurposes[purpose] = (visitorPurposes[purpose] || 0) + 1;
          }
          if (item.data.sessionId) {
            totalUniqueVisitors.add(item.data.sessionId);
          }
        } else if (item.eventType === 'page_view') {
          totalPageViews++;
          if (item.data.sessionId) {
            totalUniqueVisitors.add(item.data.sessionId);
          }
        } else if (item.eventType === 'content_view') {
          totalContentViews++;
          if (item.data.sessionId) {
            totalUniqueVisitors.add(item.data.sessionId);
          }
        }
      });

      const summary = {
        totalVisitors: totalUniqueVisitors.size,
        totalPageViews,
        totalContentViews,
        accessPurposes: visitorPurposes,
        totalEvents: analyticsData.length,
        lastUpdated: new Date().toISOString()
      };

      console.log('✅ [DashboardDataService] 분석 요약 완료:', summary);
      this.setCachedData(cacheKey, summary);
      return summary;
    } catch (error) {
      console.error('❌ [DashboardDataService] 분석 요약 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 콘텐츠 분석 데이터 조회
   */
  async getContentAnalytics(period = 'week') {
    const cacheKey = `content_analytics_${period}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📄 [DashboardDataService] 콘텐츠 분석 데이터 조회 시작...');
      
      // DynamoDB에서 콘텐츠 데이터와 Analytics 데이터 조회
      const [contentsData, analyticsData] = await Promise.all([
        this.getContentsFromDynamoDB(),
        this.getRawAnalyticsData()
      ]);

      // 콘텐츠별 조회수 및 좋아요 집계
      const contentStats = {};
      
      // Analytics 데이터에서 콘텐츠 조회수 집계
      analyticsData.forEach(item => {
        if (item.eventType === 'content_view' && item.data.contentId) {
          const contentId = item.data.contentId;
          if (!contentStats[contentId]) {
            contentStats[contentId] = { views: 0, likes: 0 };
          }
          contentStats[contentId].views++;
        }
      });

      // 콘텐츠 데이터와 통계 결합
      const contentAnalytics = contentsData.map(content => ({
        id: content.id,
        title: content.title,
        author: content.author,
        category: content.category,
        views: content.views || contentStats[content.id]?.views || 0,
        likes: content.likes || contentStats[content.id]?.likes || 0,
        createdAt: content.createdAt,
        tags: content.tags || []
      }));

      // 기간별 필터링
      const filteredData = this.filterByPeriod(contentAnalytics, period);
      
      // 인기순으로 정렬
      const sortedData = filteredData.sort((a, b) => (b.views + b.likes * 2) - (a.views + a.likes * 2));

      console.log('✅ [DashboardDataService] 콘텐츠 분석 완료:', sortedData.length, '개');
      this.setCachedData(cacheKey, sortedData);
      return sortedData;
    } catch (error) {
      console.error('❌ [DashboardDataService] 콘텐츠 분석 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 작성자 분석 데이터 조회
   */
  async getAuthorAnalytics() {
    const cacheKey = 'author_analytics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('✍️ [DashboardDataService] 작성자 분석 데이터 조회 시작...');
      
      const contentsData = await this.getContentsFromDynamoDB();
      
      // 작성자별 통계 집계
      const authorStats = {};
      
      contentsData.forEach(content => {
        const author = content.author || 'Unknown';
        if (!authorStats[author]) {
          authorStats[author] = {
            author: author, // AdminPage에서 사용하는 속성명
            name: author,
            contentCount: 0,
            totalViews: 0,
            totalLikes: 0,
            categories: new Set(),
            contents: [], // 콘텐츠 목록 추가
            avgViews: 0,
            avgLikes: 0
          };
        }
        
        authorStats[author].contentCount++;
        authorStats[author].totalViews += content.views || 0;
        authorStats[author].totalLikes += content.likes || 0;
        authorStats[author].contents.push({
          id: content.id,
          title: content.title,
          views: content.views || 0,
          likes: content.likes || 0,
          category: content.category
        });
        if (content.category) {
          authorStats[author].categories.add(content.category);
        }
      });

      // 평균 계산 및 배열 변환
      const authorAnalytics = Object.values(authorStats).map(author => ({
        ...author,
        categories: Array.from(author.categories),
        avgViews: author.contentCount > 0 ? Math.round(author.totalViews / author.contentCount) : 0,
        avgLikes: author.contentCount > 0 ? Math.round(author.totalLikes / author.contentCount) : 0,
        // 콘텐츠를 조회수 순으로 정렬
        contents: author.contents.sort((a, b) => (b.views || 0) - (a.views || 0))
      }));

      // 콘텐츠 수 기준으로 정렬
      const sortedData = authorAnalytics.sort((a, b) => b.totalViews - a.totalViews);

      console.log('✅ [DashboardDataService] 작성자 분석 완료:', sortedData.length, '명');
      this.setCachedData(cacheKey, sortedData);
      return sortedData;
    } catch (error) {
      console.error('❌ [DashboardDataService] 작성자 분석 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 카테고리 분석 데이터 조회
   */
  async getCategoryAnalytics() {
    const cacheKey = 'category_analytics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('📂 [DashboardDataService] 카테고리 분석 데이터 조회 시작...');
      
      const contentsData = await this.getContentsFromDynamoDB();
      
      // 카테고리별 통계 집계
      const categoryStats = {};
      
      contentsData.forEach(content => {
        const category = content.category || 'Uncategorized';
        if (!categoryStats[category]) {
          categoryStats[category] = {
            name: category,
            contentCount: 0,
            totalViews: 0,
            totalLikes: 0,
            avgViews: 0,
            avgLikes: 0
          };
        }
        
        categoryStats[category].contentCount++;
        categoryStats[category].totalViews += content.views || 0;
        categoryStats[category].totalLikes += content.likes || 0;
      });

      // 평균 계산 및 배열 변환
      const categoryAnalytics = Object.values(categoryStats).map(category => ({
        ...category,
        avgViews: category.contentCount > 0 ? Math.round(category.totalViews / category.contentCount) : 0,
        avgLikes: category.contentCount > 0 ? Math.round(category.totalLikes / category.contentCount) : 0
      }));

      // 콘텐츠 수 기준으로 정렬
      const sortedData = categoryAnalytics.sort((a, b) => b.contentCount - a.contentCount);

      console.log('✅ [DashboardDataService] 카테고리 분석 완료:', sortedData.length, '개');
      this.setCachedData(cacheKey, sortedData);
      return sortedData;
    } catch (error) {
      console.error('❌ [DashboardDataService] 카테고리 분석 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 시간별 분석 데이터 조회
   */
  async getTimeAnalytics(period = 'week') {
    const cacheKey = `time_analytics_${period}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('⏰ [DashboardDataService] 시간별 분석 데이터 조회 시작...');
      
      const analyticsData = await this.getRawAnalyticsData();
      
      // 날짜별 통계 집계
      const timeStats = {};
      
      analyticsData.forEach(item => {
        const date = new Date(item.timestamp).toISOString().split('T')[0]; // YYYY-MM-DD
        if (!timeStats[date]) {
          timeStats[date] = {
            date,
            pageViews: 0,
            contentViews: 0,
            visitors: new Set()
          };
        }
        
        if (item.eventType === 'page_view') {
          timeStats[date].pageViews++;
        } else if (item.eventType === 'content_view') {
          timeStats[date].contentViews++;
        }
        
        if (item.data.sessionId) {
          timeStats[date].visitors.add(item.data.sessionId);
        }
      });

      // Set을 숫자로 변환하고 배열로 변환
      const timeAnalytics = Object.values(timeStats).map(stat => ({
        ...stat,
        visitors: stat.visitors.size
      }));

      // 날짜순으로 정렬
      const sortedData = timeAnalytics.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // 기간별 필터링
      const filteredData = this.filterByPeriod(sortedData, period, 'date');

      console.log('✅ [DashboardDataService] 시간별 분석 완료:', filteredData.length, '일');
      this.setCachedData(cacheKey, filteredData);
      return filteredData;
    } catch (error) {
      console.error('❌ [DashboardDataService] 시간별 분석 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 시간대별 분석 데이터 조회
   */
  async getHourlyAnalytics() {
    const cacheKey = 'hourly_analytics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('🕐 [DashboardDataService] 시간대별 분석 데이터 조회 시작...');
      
      const analyticsData = await this.getRawAnalyticsData();
      
      // 시간대별 통계 집계 (0-23시)
      const hourlyStats = {};
      for (let i = 0; i < 24; i++) {
        hourlyStats[i] = {
          hour: i,
          pageViews: 0,
          contentViews: 0,
          visitors: new Set()
        };
      }
      
      analyticsData.forEach(item => {
        const hour = new Date(item.timestamp).getHours();
        
        if (item.eventType === 'page_view') {
          hourlyStats[hour].pageViews++;
        } else if (item.eventType === 'content_view') {
          hourlyStats[hour].contentViews++;
        }
        
        if (item.data.sessionId) {
          hourlyStats[hour].visitors.add(item.data.sessionId);
        }
      });

      // Set을 숫자로 변환하고 배열로 변환
      const hourlyAnalytics = Object.values(hourlyStats).map(stat => ({
        ...stat,
        visitors: stat.visitors.size,
        hourLabel: `${stat.hour}:00`
      }));

      console.log('✅ [DashboardDataService] 시간대별 분석 완료');
      this.setCachedData(cacheKey, hourlyAnalytics);
      return hourlyAnalytics;
    } catch (error) {
      console.error('❌ [DashboardDataService] 시간대별 분석 조회 실패:', error);
      throw error;
    }
  }

  /**
   * 접속 목적 분석 데이터 조회
   */
  async getAccessPurposeAnalytics() {
    const cacheKey = 'access_purpose_analytics';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      console.log('🎯 [DashboardDataService] 접속 목적 분석 데이터 조회 시작...');
      
      const analyticsData = await this.getRawAnalyticsData();
      
      // 접속 목적별 통계 집계
      const purposeStats = {};
      
      // 유효한 목적 정의 (모달에서 제공하는 3가지 + Skipped)
      const validPurposes = ['aws-internal', 'customer-demo', 'other', 'Skipped'];
      
      analyticsData.forEach(item => {
        if (item.eventType === 'visitor_purpose') {
          let purpose = item.data.purpose || 'Unknown';
          
          // Unknown은 제외
          if (purpose === 'Unknown') {
            return;
          }
          
          // 유효하지 않은 목적들을 'other'로 통합
          if (!validPurposes.includes(purpose)) {
            console.log(`🔄 [DashboardDataService] '${purpose}' -> 'other'로 통합`);
            purpose = 'other';
          }
          
          purposeStats[purpose] = (purposeStats[purpose] || 0) + 1;
        }
      });

      // 배열로 변환하고 정렬
      const accessPurposeAnalytics = Object.entries(purposeStats).map(([purpose, count]) => ({
        purpose,
        count,
        percentage: 0 // 나중에 계산
      }));

      // 총 개수 계산 및 퍼센티지 계산
      const totalCount = accessPurposeAnalytics.reduce((sum, item) => sum + item.count, 0);
      accessPurposeAnalytics.forEach(item => {
        item.percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
      });

      // 개수 기준으로 정렬
      const sortedData = accessPurposeAnalytics.sort((a, b) => b.count - a.count);

      console.log('✅ [DashboardDataService] 접속 목적 분석 완료:', sortedData.length, '개');
      this.setCachedData(cacheKey, sortedData);
      return sortedData;
    } catch (error) {
      console.error('❌ [DashboardDataService] 접속 목적 분석 조회 실패:', error);
      throw error;
    }
  }

  /**
   * DynamoDB에서 콘텐츠 데이터 조회
   */
  async getContentsFromDynamoDB() {
    try {
      // 백엔드 API를 통해 콘텐츠 데이터 조회
      const response = await fetch('http://localhost:3001/api/contents');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.contents || [];
    } catch (error) {
      console.error('❌ [DashboardDataService] 콘텐츠 데이터 조회 실패:', error);
      // 백엔드 API가 없는 경우 빈 배열 반환
      return [];
    }
  }

  /**
   * 기간별 데이터 필터링
   */
  filterByPeriod(data, period, dateField = 'createdAt') {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'day':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data; // 전체 기간
    }

    return data.filter(item => {
      const itemDate = new Date(item[dateField]);
      return itemDate >= startDate;
    });
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ [DashboardDataService] 캐시 초기화 완료');
  }

  /**
   * 모든 대시보드 데이터 새로고침
   */
  async refreshAllData() {
    console.log('🔄 [DashboardDataService] 모든 데이터 새로고침 시작...');
    this.clearCache();
    
    try {
      const [
        summary,
        contentAnalytics,
        authorAnalytics,
        categoryAnalytics,
        timeAnalytics,
        hourlyAnalytics,
        accessPurposeAnalytics
      ] = await Promise.all([
        this.getAnalyticsSummary(),
        this.getContentAnalytics(),
        this.getAuthorAnalytics(),
        this.getCategoryAnalytics(),
        this.getTimeAnalytics(),
        this.getHourlyAnalytics(),
        this.getAccessPurposeAnalytics()
      ]);

      console.log('✅ [DashboardDataService] 모든 데이터 새로고침 완료');
      return {
        summary,
        contentAnalytics,
        authorAnalytics,
        categoryAnalytics,
        timeAnalytics,
        hourlyAnalytics,
        accessPurposeAnalytics
      };
    } catch (error) {
      console.error('❌ [DashboardDataService] 데이터 새로고침 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스 생성
const dashboardDataService = new DashboardDataService();

export default dashboardDataService;