// Amazon Bedrock 클라이언트 (백엔드 API 호출 방식)

const BEDROCK_API_BASE_URL = (() => {
  const bedrockUrl = process.env.REACT_APP_BEDROCK_SERVER_URL;
  if (bedrockUrl) {
    return `${bedrockUrl}/api/bedrock`;
  }
  // 배포 환경에서는 상대 경로 사용 (프록시 통해)
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/bedrock`;
  }
  return 'http://localhost:5001/api/bedrock';
})();

/**
 * 백엔드 API를 통해 Claude 4 Sonnet 호출
 * @param {string} endpoint - API 엔드포인트
 * @param {Object} data - 전송할 데이터
 * @returns {Promise<Object>} - API 응답
 */
const callBedrockAPI = async (endpoint, data, retryCount = 0) => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = [2000, 5000, 10000]; // 2초, 5초, 10초
  
  try {
    console.log(`🤖 Bedrock API 호출: ${endpoint}${retryCount > 0 ? ` (재시도 ${retryCount}/${MAX_RETRIES})` : ''}`);
    
    const response = await fetch(`${BEDROCK_API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error || `HTTP error! status: ${response.status}`;
      
      // Rate Limit 오류 시 재시도
      if ((response.status === 429 || response.status === 500) && 
          (errorMessage.includes('요청이 너무 많습니다') || errorMessage.includes('rate limit')) &&
          retryCount < MAX_RETRIES) {
        
        const delay = RETRY_DELAY[retryCount];
        console.log(`⏳ Rate Limit 감지, ${delay/1000}초 후 재시도...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return callBedrockAPI(endpoint, data, retryCount + 1);
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'API 호출 실패');
    }

    console.log('✅ Bedrock API 호출 성공');
    return result.data;
  } catch (error) {
    console.error('❌ Bedrock API 호출 실패:', error);
    
    // 네트워크 오류 처리
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Bedrock API 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요.');
    }
    
    throw error;
  }
};

/**
 * Bedrock 연결 테스트
 * @returns {Promise<boolean>} - 연결 성공 여부
 */
export const testBedrockConnection = async () => {
  try {
    const response = await fetch(`${BEDROCK_API_BASE_URL}/test`);
    const result = await response.json();
    return result.success;
  } catch (error) {
    console.error('❌ Bedrock 연결 테스트 실패:', error);
    return false;
  }
};

/**
 * 분석 데이터를 AI가 해석하여 인사이트 생성
 * @param {Object} analyticsData - 분석 데이터
 * @returns {Promise<Object>} - AI가 생성한 인사이트
 */
export const generateAnalyticsInsights = async (analyticsData) => {
  try {
    console.log('🔍 분석 데이터 AI 처리 시작...');
    
    const insights = await callBedrockAPI('/analytics-insights', {
      analyticsData: analyticsData
    });
    
    return insights;
  } catch (error) {
    console.error('❌ AI 인사이트 생성 실패:', error);
    throw error;
  }
};

/**
 * 콘텐츠별 상세 분석 생성
 * @param {Array} contentAnalytics - 콘텐츠 분석 데이터
 * @returns {Promise<string>} - AI가 생성한 콘텐츠 분석
 */
export const generateContentAnalysis = async (contentAnalytics) => {
  console.log('⚠️ generateContentAnalysis 호출 차단 - Rate Limit 방지');
  throw new Error('콘텐츠 분석은 통합 AI 인사이트에 포함되어 있습니다.');
};

/**
 * 작성자별 분석 생성
 * @param {Array} authorAnalytics - 작성자 분석 데이터
 * @returns {Promise<string>} - AI가 생성한 작성자 분석
 */
export const generateAuthorAnalysis = async (authorAnalytics) => {
  console.log('⚠️ generateAuthorAnalysis 호출 차단 - Rate Limit 방지');
  throw new Error('작성자 분석은 통합 AI 인사이트에 포함되어 있습니다.');
};

// 레거시 함수 (호환성 유지)
export const generateTextWithClaude = async (prompt, maxTokens = 4000) => {
  throw new Error('이 함수는 더 이상 사용되지 않습니다. 백엔드 API를 통해 호출해주세요.');
};

export default {
  testBedrockConnection,
  generateAnalyticsInsights,
  generateContentAnalysis,
  generateAuthorAnalysis
};
