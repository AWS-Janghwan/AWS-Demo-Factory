// AI 기반 분석 리포트 생성 유틸리티

import { generateAnalyticsInsights } from './bedrockClient';

/**
 * AI 기반 분석 리포트 생성
 * @param {Object} analyticsData - 분석 데이터
 * @returns {Promise<Object>} - AI 인사이트 결과
 */
// AI 인사이트 캐시 시스템
const insightsCache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10분 캐시

// 데이터 해시 생성 (동일한 데이터 식별용)
const generateDataHash = (data) => {
  const str = JSON.stringify({
    totalVisitors: data.summary?.totalVisitors,
    totalPageViews: data.summary?.totalPageViews,
    totalContentViews: data.summary?.totalContentViews,
    contentCount: data.content?.length,
    categoryCount: data.category?.length,
    timeRange: data.time?.length
  });
  return btoa(str).substring(0, 16); // 간단한 해시
};

export const generateAIAnalyticsReport = async (analyticsData) => {
  try {
    console.log('🤖 AI 분석 리포트 생성 시작...');
    console.log('📊 입력 데이터:', analyticsData);
    
    // 데이터 해시 생성
    const dataHash = generateDataHash(analyticsData);
    console.log('🔑 데이터 해시:', dataHash);
    
    // 캐시된 AI 인사이트 확인
    const cached = insightsCache.get(dataHash);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('💾 AI 인사이트 캐시 사용 (Bedrock API 호출 생략)');
      return cached.data;
    }
    
    console.log('🔄 새로운 AI 인사이트 생성 시도...');
    
    // Bedrock API를 통해 AI 인사이트 생성
    const aiInsights = await generateAnalyticsInsights(analyticsData);
    
    console.log('✅ AI 인사이트 생성 완료');
    console.log('📝 인사이트 데이터:', aiInsights);
    
    // 응답 구조 확인 및 정규화
    let normalizedInsights;
    
    if (typeof aiInsights === 'string') {
      // 문자열로 받은 경우
      normalizedInsights = {
        summary: aiInsights,
        generatedAt: new Date().toISOString(),
        modelUsed: 'Claude 4 Sonnet',
        dataProcessed: Object.keys(analyticsData).length
      };
    } else if (aiInsights && typeof aiInsights === 'object') {
      // 객체로 받은 경우
      normalizedInsights = {
        summary: aiInsights.summary || aiInsights.data || aiInsights.content || JSON.stringify(aiInsights),
        generatedAt: aiInsights.generatedAt || new Date().toISOString(),
        modelUsed: aiInsights.modelUsed || 'Claude 4 Sonnet',
        dataProcessed: aiInsights.dataProcessed || Object.keys(analyticsData).length
      };
    } else {
      throw new Error('AI 인사이트 데이터 형식이 올바르지 않습니다.');
    }
    
    console.log('📋 정규화된 인사이트:', normalizedInsights);
    
    // AI 인사이트 캐시 저장
    const result = {
      success: true,
      data: normalizedInsights
    };
    
    insightsCache.set(dataHash, {
      data: result,
      timestamp: Date.now()
    });
    
    console.log('💾 AI 인사이트 캐시 저장 완료');
    
    return result;
    
  } catch (error) {
    console.error('❌ AI 분석 리포트 생성 실패:', error);
    
    // 상세한 오류 정보 제공
    let errorMessage = error.message;
    
    if (error.message.includes('fetch')) {
      errorMessage = 'Bedrock API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.';
    } else if (error.message.includes('AccessDenied')) {
      errorMessage = 'AWS Bedrock 서비스에 대한 권한이 없습니다. IAM 권한을 확인해주세요.';
    } else if (error.message.includes('ModelNotReady')) {
      errorMessage = 'AI 모델이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.';
    }
    
    return {
      success: false,
      error: errorMessage,
      details: error.message
    };
  }
};

/**
 * AI 인사이트 데이터 검증
 * @param {any} insights - 검증할 인사이트 데이터
 * @returns {boolean} - 유효성 여부
 */
export const validateAIInsights = (insights) => {
  if (!insights) {
    console.warn('⚠️ AI 인사이트가 null 또는 undefined입니다.');
    return false;
  }
  
  if (typeof insights === 'string' && insights.trim().length > 0) {
    return true;
  }
  
  if (typeof insights === 'object' && (insights.summary || insights.data || insights.content)) {
    return true;
  }
  
  console.warn('⚠️ AI 인사이트 형식이 올바르지 않습니다:', insights);
  return false;
};

/**
 * AI 인사이트에서 텍스트 추출
 * @param {any} insights - AI 인사이트 데이터
 * @returns {string} - 추출된 텍스트
 */
export const extractInsightsText = (insights) => {
  if (typeof insights === 'string') {
    return insights;
  }
  
  if (typeof insights === 'object' && insights) {
    return insights.summary || insights.data || insights.content || JSON.stringify(insights);
  }
  
  return '인사이트 데이터를 추출할 수 없습니다.';
};

export default {
  generateAIAnalyticsReport,
  validateAIInsights,
  extractInsightsText
};
