// Amazon Bedrock API 서버
const express = require('express');
const cors = require('cors');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS 설정
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Bedrock 클라이언트 설정 - 로컬 AWS 자격 증명 사용
const bedrockClient = new BedrockRuntimeClient({
  region: 'us-west-2'
});

// Claude 3.5 Sonnet Inference Profile (US West 2)
const CLAUDE_MODEL_ID = 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

/**
 * Claude 3.5 Sonnet을 사용하여 텍스트 생성 (Inference Profile)
 */
const generateTextWithClaude = async (prompt, maxTokens = 4000) => {
  try {
    console.log('🤖 Claude 3.5 Sonnet 호출 시작...');
    console.log('📝 프롬프트 길이:', prompt.length);
    console.log('🎯 모델 ID:', CLAUDE_MODEL_ID);

    const requestBody = {
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    };

    const command = new InvokeModelCommand({
      modelId: CLAUDE_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(requestBody)
    });

    const response = await bedrockClient.send(command);
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    
    console.log('✅ Claude 3.5 Sonnet 응답 성공');
    console.log('📊 사용된 토큰:', responseBody.usage);
    
    // Claude 3.5 Sonnet 가격 계산 (us-west-2 기준)
    const inputTokens = responseBody.usage.input_tokens;
    const outputTokens = responseBody.usage.output_tokens;
    const estimatedCost = (inputTokens * 3.00 + outputTokens * 15.00) / 1000000;
    console.log('💰 예상 비용:', `$${estimatedCost.toFixed(6)}`);
    
    return responseBody.content[0].text;
  } catch (error) {
    console.error('❌ Claude 3.5 Sonnet 호출 실패:', error);
    
    // 상세한 에러 정보 제공
    if (error.name === 'ValidationException') {
      throw new Error('모델 요청 형식이 올바르지 않습니다. 파라미터를 확인해주세요.');
    } else if (error.name === 'AccessDeniedException') {
      throw new Error('Bedrock 서비스에 대한 권한이 없습니다. IAM 권한을 확인해주세요.');
    } else if (error.name === 'ThrottlingException') {
      throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
    } else if (error.name === 'ModelNotReadyException') {
      throw new Error('모델이 준비되지 않았습니다. 잠시 후 다시 시도해주세요.');
    }
    
    throw error;
  }
};

// API 엔드포인트들

/**
 * 전체 분석 인사이트 생성
 */
app.post('/api/bedrock/analytics-insights', async (req, res) => {
  try {
    const { analyticsData } = req.body;
    
    const prompt = `
AWS Demo Factory 웹사이트 데이터를 분석하여 한국어로 리포트를 작성해주세요.

분석 데이터:
- 총 페이지뷰: ${analyticsData.summary?.totalPageViews || 0}회
- 총 콘텐츠 조회: ${analyticsData.summary?.totalContentViews || 0}회
- 상위 콘텐츠: ${JSON.stringify(analyticsData.content?.slice(0, 3) || [])}
- 카테고리 분석: ${JSON.stringify(analyticsData.category?.slice(0, 5) || [])}
- 시간대 분석: ${JSON.stringify(analyticsData.time?.slice(0, 5) || [])}
- 방문 목적 분석: ${JSON.stringify(analyticsData.purposes || {})}

다음 형식으로 전문적이고 실용적인 한국어 리포트를 작성해주세요:

## 📊 전체 현황 요약
- 총 페이지뷰와 콘텐츠 조회수 분석
- 가장 인기있는 카테고리와 콘텐츠 TOP 3
- 주요 접속 시간대 및 사용자 행동 패턴
- 방문 목적별 사용자 분포

## 🔍 핵심 인사이트
1. **사용자 관심 분야**: 가장 관심도가 높은 AWS 서비스 및 솔루션 영역
2. **콘텐츠 이용 패턴**: 사용자들의 콘텐츠 소비 행동과 선호도
3. **시간대별 특성**: 접속 시간대별 사용자 특성 및 활동 패턴
4. **비즈니스 임팩트**: 현재 성과와 개선 기회 영역

## 💡 전략적 권장사항
1. **콘텐츠 전략**: 인기 카테고리 기반 콘텐츠 확충 방안
2. **사용자 경험**: 접속 패턴 기반 UX 최적화 방안
3. **마케팅 전략**: 효과적인 사용자 참여 증대 방법
4. **운영 최적화**: 리소스 효율성 향상 방안

각 섹션은 구체적인 데이터와 함께 실행 가능한 인사이트로 작성해주세요.
`;

    const insights = await generateTextWithClaude(prompt, 3000);
    
    res.json({
      success: true,
      data: {
        summary: insights,
        generatedAt: new Date().toISOString(),
        modelUsed: 'Claude 3.5 Sonnet',
        dataProcessed: Object.keys(analyticsData).length
      }
    });
  } catch (error) {
    console.error('❌ AI 인사이트 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 콘텐츠 분석 생성
 */
/**
 * 콘텐츠 분석 생성
 */
app.post('/api/bedrock/content-analysis', async (req, res) => {
  try {
    const { contentAnalytics } = req.body;
    
    const prompt = `
AWS Demo Factory의 콘텐츠 성과 데이터를 분석하여 전문적인 한국어 리포트를 작성해주세요.

## 📊 콘텐츠 데이터:
${JSON.stringify(contentAnalytics.slice(0, 10), null, 2)}

다음 구조로 **한국어 전문 분석 리포트**를 작성해주세요:

## 📈 콘텐츠 성과 분석
1. **TOP 성과 콘텐츠**: 가장 높은 조회수를 기록한 콘텐츠의 특징과 성공 요인
2. **카테고리별 성과**: 각 AWS 서비스 카테고리별 사용자 관심도 및 성과 차이
3. **콘텐츠 품질 지표**: 조회수, 참여도, 체류시간 등 종합적 품질 평가

## 🎯 콘텐츠 전략 인사이트
1. **성공 패턴 분석**: 높은 성과를 보이는 콘텐츠의 공통 특성
2. **개선 기회**: 잠재력은 있지만 성과가 아쉬운 콘텐츠 영역
3. **트렌드 분석**: 사용자 관심도 변화 및 새로운 수요 영역

## 💡 실행 가능한 권장사항
1. **콘텐츠 최적화**: 기존 콘텐츠 개선 방안
2. **신규 콘텐츠**: 우선순위가 높은 새로운 콘텐츠 주제
3. **배포 전략**: 효과적인 콘텐츠 홍보 및 배포 방법

각 항목은 구체적인 데이터 근거와 함께 실행 가능한 액션 아이템을 포함해주세요.
`;

    const analysis = await generateTextWithClaude(prompt, 3000);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('❌ 콘텐츠 분석 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * 작성자 분석 생성
 */
/**
 * 작성자 분석 생성
 */
app.post('/api/bedrock/author-analysis', async (req, res) => {
  try {
    const { authorAnalytics } = req.body;
    
    const prompt = `
AWS Demo Factory의 작성자별 성과 데이터를 분석하여 인재 육성 및 콘텐츠 품질 향상을 위한 한국어 리포트를 작성해주세요.

## 👥 작성자 성과 데이터:
${JSON.stringify(authorAnalytics.slice(0, 10), null, 2)}

다음 구조로 **한국어 전문 분석 리포트**를 작성해주세요:

## 🏆 작성자 성과 분석
1. **TOP 퍼포머**: 가장 높은 성과를 보이는 작성자들의 특징과 성공 요인
2. **콘텐츠 품질 지표**: 작성자별 조회수, 참여도, 콘텐츠 완성도 분석
3. **전문성 영역**: 각 작성자의 강점 분야 및 전문성 수준 평가

## 📊 생산성 및 품질 분석
1. **콘텐츠 생산량**: 작성자별 콘텐츠 생산 빈도 및 일관성
2. **품질 일관성**: 작성자별 콘텐츠 품질의 안정성 및 향상도
3. **사용자 반응**: 작성자별 사용자 참여도 및 피드백 패턴

## 💡 인재 육성 전략
1. **우수 사례 공유**: TOP 퍼포머의 노하우 전파 방안
2. **역량 개발**: 개별 작성자별 맞춤형 성장 계획
3. **협업 강화**: 작성자 간 지식 공유 및 멘토링 체계
4. **동기 부여**: 작성자 참여도 및 만족도 향상 방안

각 항목은 구체적인 데이터 분석과 실행 가능한 액션 플랜을 포함해주세요.
`;

    const analysis = await generateTextWithClaude(prompt, 3000);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('❌ 작성자 분석 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Bedrock 연결 테스트
 */
app.get('/api/bedrock/test', async (req, res) => {
  try {
    console.log('🧪 Bedrock 연결 테스트 시작...');
    
    const testPrompt = "안녕하세요! AWS Demo Factory의 AI 분석 기능 테스트입니다. Claude 3.5 Sonnet이 정상적으로 작동하는지 확인하기 위한 테스트입니다. 간단한 한국어 인사말로 응답해주세요.";
    const response = await generateTextWithClaude(testPrompt, 200);
    
    console.log('✅ Bedrock 테스트 성공');
    
    res.json({
      success: true,
      message: 'Claude 3.5 Sonnet 연결 성공',
      model: CLAUDE_MODEL_ID,
      region: 'us-west-2',
      response: response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Bedrock 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      model: CLAUDE_MODEL_ID,
      region: 'us-west-2',
      timestamp: new Date().toISOString()
    });
  }
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`🚀 Bedrock API 서버가 포트 ${PORT}에서 실행 중입니다.`);
  console.log(`🤖 Claude 3.5 Sonnet (${CLAUDE_MODEL_ID}) 준비 완료`);
  console.log(`🌍 리전: us-west-2 (Inference Profile)`);
  console.log(`🔗 테스트 URL: http://localhost:${PORT}/api/bedrock/test`);
  console.log(`📊 분석 API: http://localhost:${PORT}/api/bedrock/analytics-insights`);
});

module.exports = app;
