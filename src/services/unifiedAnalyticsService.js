/**
 * 통합 분석 데이터 수집 서비스
 * 모든 분석 데이터를 한 번에 수집하여 Bedrock API 호출 최적화
 */

import dashboardDataService from './dashboardDataService';

class UnifiedAnalyticsService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  /**
   * 모든 분석 데이터를 한 번에 수집
   * @returns {Promise<Object>} 통합된 분석 데이터
   */
  async gatherAllAnalyticsData() {
    const cacheKey = 'unified_analytics_data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('💾 [UnifiedAnalytics] 캐시된 통합 데이터 사용');
      return cached.data;
    }

    try {
      console.log('🔄 [UnifiedAnalytics] 모든 분석 데이터 통합 수집 시작...');
      
      // 모든 분석 데이터를 병렬로 수집 (한 번의 DynamoDB 조회로)
      const [
        summary,
        contentAnalytics,
        authorAnalytics,
        categoryAnalytics,
        timeAnalytics,
        hourlyAnalytics,
        accessPurposeAnalytics
      ] = await Promise.all([
        dashboardDataService.getAnalyticsSummary(),
        dashboardDataService.getContentAnalytics(),
        dashboardDataService.getAuthorAnalytics(),
        dashboardDataService.getCategoryAnalytics(),
        dashboardDataService.getTimeAnalytics(),
        dashboardDataService.getHourlyAnalytics(),
        dashboardDataService.getAccessPurposeAnalytics()
      ]);

      // 통합 데이터 구조 생성
      const unifiedData = {
        // 기본 요약 정보
        summary: {
          totalVisitors: summary.totalVisitors || 0,
          totalPageViews: summary.totalPageViews || 0,
          totalContentViews: summary.totalContentViews || 0,
          totalEvents: summary.totalEvents || 0,
          averageSessionPageViews: summary.averageSessionPageViews || 0,
          contentEngagementRate: summary.contentEngagementRate || 0,
          collectionDate: new Date().toISOString(),
          dataQuality: 'high'
        },

        // 콘텐츠 분석 데이터
        content: contentAnalytics.map(item => ({
          title: item.title || 'Unknown',
          views: item.views || 0,
          likes: item.likes || 0,
          category: item.category || 'General',
          author: item.author || 'Unknown',
          createdAt: item.createdAt || null,
          engagementScore: (item.views || 0) + (item.likes || 0) * 2
        })),

        // 작성자 분석 데이터
        authors: authorAnalytics.map(item => ({
          name: item.author || item.name || 'Unknown',
          contentCount: item.contentCount || 0,
          totalViews: item.totalViews || 0,
          totalLikes: item.totalLikes || 0,
          averageViewsPerContent: item.contentCount > 0 ? 
            Math.round((item.totalViews || 0) / item.contentCount) : 0,
          productivityScore: (item.contentCount || 0) * 10 + (item.totalViews || 0)
        })),

        // 카테고리 분석 데이터
        category: categoryAnalytics.map(item => ({
          name: item.category || item.name || 'Unknown',
          count: item.count || 0,
          views: item.views || 0,
          popularity: ((item.count || 0) + (item.views || 0)) / 2,
          growthPotential: this.calculateGrowthPotential(item)
        })),

        // 시간별 분석 데이터
        time: timeAnalytics.map(item => ({
          date: item.date || item.time || new Date().toISOString().split('T')[0],
          views: item.views || item.count || 0,
          events: item.events || 0,
          uniqueVisitors: item.uniqueVisitors || 0,
          trend: this.calculateTrend(item, timeAnalytics)
        })),

        // 시간대별 분석 데이터
        hourly: hourlyAnalytics.map(item => ({
          hour: item.hour || 0,
          views: item.views || item.count || 0,
          activity: item.activity || 'low',
          peakTime: item.views > (hourlyAnalytics.reduce((sum, h) => sum + (h.views || 0), 0) / hourlyAnalytics.length)
        })),

        // 접속 목적 분석 데이터
        accessPurpose: accessPurposeAnalytics.map(item => ({
          purpose: item.purpose || 'other',
          count: item.count || 0,
          percentage: item.percentage || 0,
          businessValue: this.calculateBusinessValue(item.purpose),
          strategicImportance: this.calculateStrategicImportance(item.purpose)
        })),

        // 메타데이터
        metadata: {
          generatedAt: new Date().toISOString(),
          dataPoints: {
            summary: 1,
            content: contentAnalytics.length,
            authors: authorAnalytics.length,
            categories: categoryAnalytics.length,
            timePoints: timeAnalytics.length,
            hourlyPoints: hourlyAnalytics.length,
            accessPurposes: accessPurposeAnalytics.length
          },
          totalDataPoints: 1 + contentAnalytics.length + authorAnalytics.length + 
                          categoryAnalytics.length + timeAnalytics.length + 
                          hourlyAnalytics.length + accessPurposeAnalytics.length,
          dataCompleteness: this.calculateDataCompleteness({
            summary, contentAnalytics, authorAnalytics, categoryAnalytics,
            timeAnalytics, hourlyAnalytics, accessPurposeAnalytics
          })
        }
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: unifiedData,
        timestamp: Date.now()
      });

      console.log(`✅ [UnifiedAnalytics] 통합 데이터 수집 완료: ${unifiedData.metadata.totalDataPoints}개 데이터 포인트`);
      console.log(`📊 [UnifiedAnalytics] 데이터 완성도: ${unifiedData.metadata.dataCompleteness}%`);

      return unifiedData;

    } catch (error) {
      console.error('❌ [UnifiedAnalytics] 통합 데이터 수집 실패:', error);
      throw error;
    }
  }

  /**
   * 성장 잠재력 계산
   */
  calculateGrowthPotential(categoryItem) {
    const count = categoryItem.count || 0;
    const views = categoryItem.views || 0;
    
    if (count === 0) return 'high'; // 새로운 카테고리는 높은 잠재력
    if (views / count > 5) return 'high'; // 높은 조회율
    if (views / count > 2) return 'medium';
    return 'low';
  }

  /**
   * 트렌드 계산
   */
  calculateTrend(currentItem, allTimeData) {
    const currentViews = currentItem.views || 0;
    const avgViews = allTimeData.reduce((sum, item) => sum + (item.views || 0), 0) / allTimeData.length;
    
    if (currentViews > avgViews * 1.2) return 'increasing';
    if (currentViews < avgViews * 0.8) return 'decreasing';
    return 'stable';
  }

  /**
   * 비즈니스 가치 계산
   */
  calculateBusinessValue(purpose) {
    const valueMap = {
      'aws-internal': 'high',
      'customer-demo': 'very-high',
      'partner-collaboration': 'high',
      'technical-evaluation': 'medium',
      'business-development': 'high',
      'education-training': 'medium',
      'research-development': 'medium',
      'other': 'low'
    };
    return valueMap[purpose] || 'low';
  }

  /**
   * 전략적 중요도 계산
   */
  calculateStrategicImportance(purpose) {
    const importanceMap = {
      'aws-internal': 'critical',
      'customer-demo': 'critical',
      'partner-collaboration': 'high',
      'business-development': 'high',
      'technical-evaluation': 'medium',
      'education-training': 'medium',
      'research-development': 'low',
      'other': 'low'
    };
    return importanceMap[purpose] || 'low';
  }

  /**
   * 데이터 완성도 계산
   */
  calculateDataCompleteness(data) {
    let totalFields = 0;
    let completedFields = 0;

    // 각 데이터 섹션의 완성도 확인
    const sections = [
      { name: 'summary', data: data.summary, weight: 20 },
      { name: 'content', data: data.contentAnalytics, weight: 20 },
      { name: 'authors', data: data.authorAnalytics, weight: 15 },
      { name: 'categories', data: data.categoryAnalytics, weight: 15 },
      { name: 'time', data: data.timeAnalytics, weight: 15 },
      { name: 'hourly', data: data.hourlyAnalytics, weight: 10 },
      { name: 'accessPurpose', data: data.accessPurposeAnalytics, weight: 5 }
    ];

    sections.forEach(section => {
      totalFields += section.weight;
      if (section.data && (Array.isArray(section.data) ? section.data.length > 0 : Object.keys(section.data).length > 0)) {
        completedFields += section.weight;
      }
    });

    return Math.round((completedFields / totalFields) * 100);
  }

  /**
   * 캐시 초기화
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ [UnifiedAnalytics] 캐시 초기화 완료');
  }
}

// 싱글톤 인스턴스 생성
const unifiedAnalyticsService = new UnifiedAnalyticsService();

export default unifiedAnalyticsService;