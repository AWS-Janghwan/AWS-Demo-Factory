// Amazon Bedrock API 서버 (로컬 credentials 사용)
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');

const app = express();
const PORT = process.env.PORT || 5001;

// 로컬 AWS credentials 읽기 함수
const getLocalCredentials = () => {
  try {
    const credentialsPath = path.join(os.homedir(), '.aws', 'credentials');
    const profileName = process.env.AWS_PROFILE || 'default';
    
    if (!fs.existsSync(credentialsPath)) {
      throw new Error(`AWS credentials 파일을 찾을 수 없습니다: ${credentialsPath}`);
    }

    const content = fs.readFileSync(credentialsPath, 'utf8');
    const profiles = {};
    let currentProfile = null;

    content.split('\n').forEach(line => {
      line = line.trim();
      
      if (line.startsWith('[') && line.endsWith(']')) {
        currentProfile = line.slice(1, -1);
        profiles[currentProfile] = {};
      } else if (line.includes('=') && currentProfile) {
        const [key, value] = line.split('=').map(s => s.trim());
        profiles[currentProfile][key] = value;
      }
    });

    if (!profiles[profileName]) {
      throw new Error(`AWS 프로필 '${profileName}'을 찾을 수 없습니다`);
    }

    const profile = profiles[profileName];
    
    if (!profile.aws_access_key_id || !profile.aws_secret_access_key) {
      throw new Error('AWS 자격 증명이 완전하지 않습니다');
    }

    console.log(`✅ AWS 자격 증명 로드 성공 (프로필: ${profileName})`);
    
    return {
      accessKeyId: profile.aws_access_key_id,
      secretAccessKey: profile.aws_secret_access_key,
      region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
    };
  } catch (error) {
    console.error('❌ AWS 자격 증명 가져오기 실패:', error.message);
    
    // 환경 변수 fallback
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('⚠️ 환경 변수에서 AWS 자격 증명 사용');
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_DEFAULT_REGION || 'us-west-2'
      };
    }
    
    throw error;
  }
};

// Bedrock 클라이언트 초기화
let bedrockClient = null;

const initializeBedrockClient = () => {
  if (bedrockClient) return bedrockClient;

  try {
    console.log('🔐 Bedrock 클라이언트 초기화 중...');
    
    const credentials = getLocalCredentials();
    
    bedrockClient = new BedrockRuntimeClient({
      region: credentials.region,
      credentials: {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey
      }
    });
    
    console.log('✅ Bedrock 클라이언트 초기화 완료:', {
      region: credentials.region
    });
    
    return bedrockClient;
  } catch (error) {
    console.error('❌ Bedrock 클라이언트 초기화 실패:', error);
    throw error;
  }
};

// CORS 설정
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://demofactory.cloud',
    'https://www.demofactory.cloud'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Claude 4 Sonnet Inference Profile (US West 2)
const CLAUDE_MODEL_ID = 'us.anthropic.claude-sonnet-4-20250514-v1:0';

/**
 * Claude 3.5 Sonnet을 사용하여 텍스트 생성 (Inference Profile)
 */
const generateTextWithClaude = async (prompt, maxTokens = 4000) => {
  try {
    console.log('🤖 Claude 4 Sonnet 호출 시작...');
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
    
    console.log('✅ Claude 4 Sonnet 응답 성공');
    console.log('📊 사용된 토큰:', responseBody.usage);
    
    // Claude 4 Sonnet 가격 계산 (us-west-2 기준)
    const inputTokens = responseBody.usage.input_tokens;
    const outputTokens = responseBody.usage.output_tokens;
    const estimatedCost = (inputTokens * 3.00 + outputTokens * 15.00) / 1000000;
    console.log('💰 예상 비용:', `$${estimatedCost.toFixed(6)}`);
    
    return responseBody.content[0].text;
  } catch (error) {
    console.error('❌ Claude 4 Sonnet 호출 실패:', error);
    
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
 * 전체 분석 인사이트 생성 - 증강된 컨텍스트와 데이터
 */
app.post('/api/bedrock/analytics-insights', async (req, res) => {
  try {
    const { analyticsData } = req.body;
    
    // 데이터 증강 및 컨텍스트 생성
    const enhancedContext = generateEnhancedAnalyticsContext(analyticsData);
    
    const prompt = `
당신은 AWS 클라우드 전문가이자 데이터 분석 전문가입니다. AWS Demo Factory 웹사이트의 종합적인 데이터를 분석하여 전략적 인사이트가 담긴 전문 리포트를 작성해주세요.

## 🏢 비즈니스 컨텍스트
AWS Demo Factory는 AWS의 최신 기술 트렌드와 데모, 튜토리얼, 베스트 프랙티스를 제공하는 엔터프라이즈급 웹 플랫폼입니다.
- 주요 사용자: AWS 고객, 파트너, 내부 직원
- 목적: 기술 지식 공유, 솔루션 데모, 비즈니스 가치 창출
- 카테고리: Manufacturing, Retail/CPG, Telco/Media, Finance, Amazon Q Dev

## 📊 현재 성과 데이터
${enhancedContext.performanceMetrics}

## 🎯 사용자 행동 분석
${enhancedContext.userBehaviorAnalysis}

## 📈 트렌드 및 패턴
${enhancedContext.trendsAndPatterns}

## 🏭 산업별 인사이트
${enhancedContext.industryInsights}

## ⏰ 시간대별 활동 패턴
${enhancedContext.timeBasedPatterns}

다음 구조로 **전략적이고 실행 가능한 한국어 전문 리포트**를 작성해주세요:

## 📊 전체 현황 요약
- **핵심 성과 지표**: 총 페이지뷰, 콘텐츠 조회수, 사용자 참여도 분석
- **비즈니스 임팩트**: 현재 성과가 비즈니스 목표에 미치는 영향
- **경쟁 우위 요소**: 타 플랫폼 대비 차별화 포인트
- **성장 동력**: 주요 성장 촉진 요인 및 기여도

## 🔍 핵심 인사이트 (데이터 기반)
1. **사용자 관심 분야 심층 분석**
   - 가장 관심도가 높은 AWS 서비스 및 솔루션 영역
   - 산업별 관심도 차이 및 특성
   - 신규 vs 기존 사용자 관심사 비교

2. **콘텐츠 소비 패턴 분석**
   - 사용자들의 콘텐츠 탐색 경로 및 선호도
   - 체류 시간과 참여도 상관관계
   - 콘텐츠 품질 지표 및 만족도 추정

3. **시간대별 사용자 특성**
   - 접속 시간대별 사용자 행동 차이
   - 업무 시간 vs 개인 시간 이용 패턴
   - 지역별/시간대별 접속 특성

4. **비즈니스 가치 창출 분석**
   - ROI 관점에서의 콘텐츠 효과성
   - 사용자 전환율 및 참여도 개선 기회
   - 플랫폼 가치 제안 강화 방안

## 💡 전략적 권장사항 (우선순위별)
### 🚀 즉시 실행 가능 (1-2주)
1. **고성과 콘텐츠 확산**: 인기 콘텐츠 기반 시리즈 확장
2. **사용자 경험 최적화**: 접속 패턴 기반 UX 개선
3. **콘텐츠 추천 알고리즘**: 개인화된 콘텐츠 추천 시스템

### 📈 단기 전략 (1-3개월)
1. **산업별 맞춤 콘텐츠**: 각 산업 특성에 맞는 전문 콘텐츠 개발
2. **인터랙티브 기능**: 사용자 참여도 향상을 위한 기능 추가
3. **성과 측정 체계**: 더 정교한 분석 및 KPI 설정

### 🎯 중장기 전략 (3-12개월)
1. **AI 기반 개인화**: 머신러닝을 활용한 개인화 서비스
2. **커뮤니티 플랫폼**: 사용자 간 지식 공유 생태계 구축
3. **글로벌 확장**: 다국어 지원 및 지역별 맞춤 서비스

## 📊 예상 효과 및 ROI
- **사용자 참여도**: 예상 개선율 및 구체적 수치
- **콘텐츠 효과성**: 조회수 및 체류시간 개선 전망
- **비즈니스 임팩트**: 매출 기여도 및 비용 절감 효과
- **경쟁 우위**: 시장 포지셔닝 강화 방안

## 🎯 실행 로드맵
각 권장사항별로 구체적인 실행 계획, 필요 리소스, 예상 일정, 성공 지표를 포함하여 작성해주세요.

**중요**: 모든 인사이트는 제공된 실제 데이터를 근거로 하되, AWS 클라우드 생태계와 엔터프라이즈 비즈니스 관점에서 전략적 가치를 제시해주세요.
`;

    const insights = await generateTextWithClaude(prompt, 4000);
    
    res.json({
      success: true,
      data: {
        summary: insights,
        generatedAt: new Date().toISOString(),
        modelUsed: 'Claude 3.5 Sonnet (Enhanced)',
        dataProcessed: Object.keys(analyticsData).length,
        enhancementLevel: 'Advanced Context & Industry Insights'
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
 * 분석 데이터 증강 및 컨텍스트 생성 함수
 */
function generateEnhancedAnalyticsContext(analyticsData) {
  const summary = analyticsData.summary || {};
  const content = analyticsData.content || [];
  const category = analyticsData.category || [];
  const time = analyticsData.time || [];
  const purposes = analyticsData.purposes || {};
  
  // 성과 지표 분석
  const performanceMetrics = `
**핵심 지표**:
- 총 페이지뷰: ${summary.totalPageViews?.toLocaleString() || 0}회
- 총 콘텐츠 조회: ${summary.totalContentViews?.toLocaleString() || 0}회
- 평균 세션당 페이지뷰: ${summary.totalPageViews && summary.totalContentViews ? 
    (summary.totalPageViews / Math.max(summary.totalContentViews, 1)).toFixed(2) : 'N/A'}
- 콘텐츠 참여율: ${summary.totalContentViews && summary.totalPageViews ? 
    ((summary.totalContentViews / summary.totalPageViews) * 100).toFixed(1) : 'N/A'}%

**상위 성과 콘텐츠 (TOP 5)**:
${content.slice(0, 5).map((item, index) => 
  `${index + 1}. "${item.title}" - ${item.views}회 조회 (${item.category || 'General'})`
).join('\n')}
`;

  // 사용자 행동 분석
  const userBehaviorAnalysis = `
**방문 목적 분석**:
${Object.entries(purposes).map(([purpose, count]) => 
  `- ${purpose}: ${count}회 (${((count / Object.values(purposes).reduce((a, b) => a + b, 1)) * 100).toFixed(1)}%)`
).join('\n')}

**콘텐츠 소비 패턴**:
- 평균 콘텐츠당 조회수: ${content.length > 0 ? 
    (content.reduce((sum, item) => sum + (item.views || 0), 0) / content.length).toFixed(0) : 0}회
- 고성과 콘텐츠 비율: ${content.length > 0 ? 
    ((content.filter(item => (item.views || 0) > 100).length / content.length) * 100).toFixed(1) : 0}%
- 콘텐츠 다양성 지수: ${content.length}개 콘텐츠 중 ${new Set(content.map(item => item.category)).size}개 카테고리
`;

  // 트렌드 및 패턴
  const trendsAndPatterns = `
**카테고리별 성과 분석**:
${category.slice(0, 5).map((cat, index) => {
    const percentage = category.length > 0 ? 
      ((cat.views || 0) / category.reduce((sum, c) => sum + (c.views || 0), 1) * 100).toFixed(1) : 0;
    return `${index + 1}. ${cat.name}: ${cat.views || 0}회 (${percentage}%)`;
}).join('\n')}

**성장 동력 분석**:
- 주요 성장 카테고리: ${category.length > 0 ? category[0]?.name || 'N/A' : 'N/A'}
- 신규 관심 영역: ${category.slice(1, 3).map(c => c.name).join(', ') || 'N/A'}
- 콘텐츠 품질 트렌드: ${content.length > 0 && content[0]?.views > 50 ? '상승' : '안정'}
`;

  // 산업별 인사이트
  const industryInsights = `
**AWS 서비스별 관심도**:
- Manufacturing: ${category.find(c => c.name?.includes('Manufacturing'))?.views || 0}회
- Retail/CPG: ${category.find(c => c.name?.includes('Retail'))?.views || 0}회
- Telco/Media: ${category.find(c => c.name?.includes('Telco'))?.views || 0}회
- Finance: ${category.find(c => c.name?.includes('Finance'))?.views || 0}회
- Amazon Q Dev: ${category.find(c => c.name?.includes('Amazon Q'))?.views || 0}회

**기술 트렌드 분석**:
- AI/ML 관련 콘텐츠: ${content.filter(c => 
    c.title?.toLowerCase().includes('ai') || 
    c.title?.toLowerCase().includes('ml') || 
    c.title?.toLowerCase().includes('bedrock')
  ).length}개
- 서버리스 관련: ${content.filter(c => 
    c.title?.toLowerCase().includes('lambda') || 
    c.title?.toLowerCase().includes('serverless')
  ).length}개
- 데이터 분석 관련: ${content.filter(c => 
    c.title?.toLowerCase().includes('data') || 
    c.title?.toLowerCase().includes('analytics')
  ).length}개
`;

  // 시간대별 활동 패턴
  const timeBasedPatterns = `
**접속 시간대 분석**:
${time.slice(0, 5).map((timeSlot, index) => 
  `${index + 1}. ${timeSlot.hour || timeSlot.time}시: ${timeSlot.views || timeSlot.count}회`
).join('\n')}

**사용자 활동 패턴**:
- 피크 시간대: ${time.length > 0 ? time[0]?.hour || time[0]?.time || 'N/A' : 'N/A'}시
- 활동 집중도: ${time.length > 0 && time[0]?.views ? 
    (time[0].views / time.reduce((sum, t) => sum + (t.views || t.count || 0), 1) * 100).toFixed(1) : 'N/A'}%
- 업무시간 vs 개인시간 비율: ${time.length > 0 ? '분석 가능' : '데이터 부족'}
`;

  return {
    performanceMetrics,
    userBehaviorAnalysis,
    trendsAndPatterns,
    industryInsights,
    timeBasedPatterns
  };
}

/**
 * 콘텐츠 분석 생성 - 전략적 콘텐츠 인사이트
 */
app.post('/api/bedrock/content-analysis', async (req, res) => {
  try {
    const { contentAnalytics } = req.body;
    
    // 콘텐츠 데이터 증강
    const enhancedContentContext = generateEnhancedContentContext(contentAnalytics);
    
    const prompt = `
당신은 AWS 클라우드 전문가이자 콘텐츠 전략 전문가입니다. AWS Demo Factory의 콘텐츠 성과 데이터를 분석하여 전략적 콘텐츠 최적화 방안을 제시하는 전문 리포트를 작성해주세요.

## 🏢 플랫폼 컨텍스트
AWS Demo Factory는 엔터프라이즈 고객을 대상으로 하는 기술 지식 공유 플랫폼입니다.
- 목표: AWS 서비스 활용도 증대, 고객 성공 사례 공유, 기술 역량 강화
- 사용자: 기업 의사결정자, 기술 담당자, AWS 파트너, 개발자
- 콘텐츠 유형: 데모, 튜토리얼, 베스트 프랙티스, 사례 연구

## 📊 콘텐츠 성과 데이터 분석
${enhancedContentContext.performanceAnalysis}

## 🎯 콘텐츠 품질 지표
${enhancedContentContext.qualityMetrics}

## 📈 카테고리별 성과 분석
${enhancedContentContext.categoryPerformance}

## 🔍 사용자 참여도 분석
${enhancedContentContext.engagementAnalysis}

## 🏭 산업별 콘텐츠 수요 분석
${enhancedContentContext.industryDemand}

다음 구조로 **전략적이고 실행 가능한 콘텐츠 최적화 리포트**를 작성해주세요:

## 📈 콘텐츠 성과 종합 분석
1. **TOP 성과 콘텐츠 심층 분석**
   - 높은 조회수를 기록한 콘텐츠의 공통 성공 요인
   - 제목, 카테고리, 콘텐츠 유형별 성과 패턴
   - 사용자 참여도와 비즈니스 가치 연관성

2. **카테고리별 전략적 분석**
   - 각 AWS 서비스 카테고리별 사용자 관심도 및 성과 차이
   - 산업별 콘텐츠 수요와 공급 갭 분석
   - 신규 트렌드 및 성장 잠재력 평가

3. **콘텐츠 품질 및 효과성 평가**
   - 조회수, 체류시간, 참여도 등 종합적 품질 지표
   - 콘텐츠 생명주기 및 지속적 가치 창출 분석
   - ROI 관점에서의 콘텐츠 효과성 측정

## 🎯 전략적 콘텐츠 인사이트
1. **성공 패턴 및 베스트 프랙티스**
   - 높은 성과를 보이는 콘텐츠의 공통 특성 및 성공 공식
   - 제목 최적화, 구조화, 시각적 요소 활용 방안
   - 사용자 여정 단계별 콘텐츠 전략

2. **개선 기회 및 잠재력 분석**
   - 성과가 아쉬운 콘텐츠의 개선 포인트 및 최적화 방안
   - 미개척 영역 및 새로운 콘텐츠 기회 발굴
   - 경쟁 우위 확보를 위한 차별화 전략

3. **사용자 중심 콘텐츠 전략**
   - 사용자 페르소나별 맞춤형 콘텐츠 전략
   - 사용자 여정 단계별 콘텐츠 매핑 및 최적화
   - 개인화 및 추천 시스템 활용 방안

## 💡 실행 가능한 콘텐츠 전략 (우선순위별)
### 🚀 즉시 실행 (1-2주)
1. **고성과 콘텐츠 시리즈화**: 인기 콘텐츠 기반 연관 콘텐츠 제작
2. **제목 및 메타데이터 최적화**: SEO 및 사용자 관심 유도 개선
3. **콘텐츠 재구성**: 기존 콘텐츠의 가독성 및 구조 개선

### 📈 단기 전략 (1-3개월)
1. **산업별 전문 콘텐츠**: 각 산업 특성에 맞는 심화 콘텐츠 개발
2. **인터랙티브 콘텐츠**: 데모, 시뮬레이션, 실습 가이드 확대
3. **멀티미디어 콘텐츠**: 비디오, 인포그래픽, 팟캐스트 등 다양화

### 🎯 중장기 전략 (3-12개월)
1. **AI 기반 콘텐츠 생성**: 자동화된 콘텐츠 제작 및 최적화
2. **커뮤니티 기반 콘텐츠**: 사용자 생성 콘텐츠 및 협업 플랫폼
3. **개인화 콘텐츠 엔진**: 사용자별 맞춤형 콘텐츠 추천 시스템

## 📊 예상 효과 및 성과 지표
- **콘텐츠 조회수**: 예상 증가율 및 목표 수치
- **사용자 참여도**: 체류시간, 상호작용 개선 전망
- **비즈니스 전환율**: 리드 생성, 고객 전환 기여도
- **브랜드 가치**: 사고 리더십 및 시장 포지셔닝 강화

## 🎯 콘텐츠 로드맵 및 실행 계획
각 전략별로 구체적인 실행 단계, 필요 리소스, 담당자, 일정, KPI를 포함하여 작성해주세요.

**중요**: 모든 권장사항은 실제 성과 데이터를 기반으로 하되, AWS 생태계와 엔터프라이즈 비즈니스 관점에서 실용적 가치를 제시해주세요.
`;

    const analysis = await generateTextWithClaude(prompt, 4000);
    
    res.json({
      success: true,
      data: analysis,
      generatedAt: new Date().toISOString(),
      modelUsed: 'Claude 3.5 Sonnet (Enhanced)',
      enhancementLevel: 'Strategic Content Insights'
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
 * 콘텐츠 데이터 증강 및 컨텍스트 생성 함수
 */
function generateEnhancedContentContext(contentAnalytics) {
  const contents = Array.isArray(contentAnalytics) ? contentAnalytics : [];
  
  // 성과 분석
  const performanceAnalysis = `
**전체 콘텐츠 현황**:
- 총 콘텐츠 수: ${contents.length}개
- 총 조회수: ${contents.reduce((sum, item) => sum + (item.views || 0), 0).toLocaleString()}회
- 평균 조회수: ${contents.length > 0 ? Math.round(contents.reduce((sum, item) => sum + (item.views || 0), 0) / contents.length) : 0}회
- 중간값 조회수: ${contents.length > 0 ? getMedian(contents.map(item => item.views || 0)) : 0}회

**성과 분포**:
- 고성과 콘텐츠 (100회 이상): ${contents.filter(item => (item.views || 0) >= 100).length}개 (${contents.length > 0 ? ((contents.filter(item => (item.views || 0) >= 100).length / contents.length) * 100).toFixed(1) : 0}%)
- 중간 성과 콘텐츠 (10-99회): ${contents.filter(item => (item.views || 0) >= 10 && (item.views || 0) < 100).length}개
- 저성과 콘텐츠 (10회 미만): ${contents.filter(item => (item.views || 0) < 10).length}개
`;

  // 품질 지표
  const qualityMetrics = `
**TOP 10 성과 콘텐츠**:
${contents.slice(0, 10).map((item, index) => 
  `${index + 1}. "${item.title || 'Untitled'}" - ${(item.views || 0).toLocaleString()}회 (${item.category || 'General'})`
).join('\n')}

**콘텐츠 품질 지표**:
- 제목 평균 길이: ${contents.length > 0 ? Math.round(contents.reduce((sum, item) => sum + (item.title?.length || 0), 0) / contents.length) : 0}자
- 카테고리 다양성: ${new Set(contents.map(item => item.category)).size}개 카테고리
- 최신성: ${contents.filter(item => item.createdAt && new Date(item.createdAt) > new Date(Date.now() - 30*24*60*60*1000)).length}개 (최근 30일)
`;

  // 카테고리별 성과
  const categoryStats = {};
  contents.forEach(item => {
    const category = item.category || 'General';
    if (!categoryStats[category]) {
      categoryStats[category] = { count: 0, totalViews: 0, items: [] };
    }
    categoryStats[category].count++;
    categoryStats[category].totalViews += (item.views || 0);
    categoryStats[category].items.push(item);
  });

  const categoryPerformance = `
**카테고리별 성과 분석**:
${Object.entries(categoryStats)
  .sort(([,a], [,b]) => b.totalViews - a.totalViews)
  .slice(0, 8)
  .map(([category, stats]) => 
    `- ${category}: ${stats.count}개 콘텐츠, ${stats.totalViews.toLocaleString()}회 조회 (평균 ${Math.round(stats.totalViews / stats.count)}회)`
  ).join('\n')}
`;

  // 참여도 분석
  const engagementAnalysis = `
**사용자 참여도 패턴**:
- 높은 참여도 콘텐츠 특성: ${contents.filter(item => (item.views || 0) > 50).length > 0 ? '실습 가이드, 데모 중심' : '데이터 부족'}
- 제목 키워드 분석: ${getMostCommonWords(contents.map(item => item.title || '').join(' '))}
- 콘텐츠 길이 vs 성과: ${contents.length > 0 ? '분석 가능' : '데이터 부족'}
`;

  // 산업별 수요 분석
  const industryDemand = `
**AWS 서비스별 콘텐츠 수요**:
- AI/ML (Bedrock, SageMaker): ${contents.filter(item => 
    (item.title?.toLowerCase().includes('ai') || 
     item.title?.toLowerCase().includes('ml') || 
     item.title?.toLowerCase().includes('bedrock') ||
     item.title?.toLowerCase().includes('sagemaker'))
  ).length}개
- 서버리스 (Lambda, API Gateway): ${contents.filter(item => 
    (item.title?.toLowerCase().includes('lambda') || 
     item.title?.toLowerCase().includes('serverless') ||
     item.title?.toLowerCase().includes('api gateway'))
  ).length}개
- 데이터 분석 (Redshift, Athena): ${contents.filter(item => 
    (item.title?.toLowerCase().includes('data') || 
     item.title?.toLowerCase().includes('redshift') ||
     item.title?.toLowerCase().includes('athena'))
  ).length}개
- 컨테이너 (ECS, EKS): ${contents.filter(item => 
    (item.title?.toLowerCase().includes('container') || 
     item.title?.toLowerCase().includes('ecs') ||
     item.title?.toLowerCase().includes('eks'))
  ).length}개
`;

  return {
    performanceAnalysis,
    qualityMetrics,
    categoryPerformance,
    engagementAnalysis,
    industryDemand
  };
}

// 유틸리티 함수들
function getMedian(numbers) {
  const sorted = numbers.sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? 
    (sorted[middle - 1] + sorted[middle]) / 2 : 
    sorted[middle];
}

function getMostCommonWords(text) {
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const frequency = {};
  words.forEach(word => {
    if (word.length > 2) { // 3글자 이상만
      frequency[word] = (frequency[word] || 0) + 1;
    }
  });
  
  return Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([word, count]) => `${word}(${count})`)
    .join(', ');
}

/**
 * 작성자 분석 생성 - 인재 육성 및 성과 최적화
 */
app.post('/api/bedrock/author-analysis', async (req, res) => {
  try {
    const { authorAnalytics } = req.body;
    
    // 작성자 데이터 증강
    const enhancedAuthorContext = generateEnhancedAuthorContext(authorAnalytics);
    
    const prompt = `
당신은 AWS 클라우드 전문가이자 인재 개발 전문가입니다. AWS Demo Factory의 작성자별 성과 데이터를 분석하여 인재 육성, 콘텐츠 품질 향상, 조직 역량 강화를 위한 전략적 리포트를 작성해주세요.

## 🏢 조직 컨텍스트
AWS Demo Factory는 기술 전문가들이 지식을 공유하고 고객 가치를 창출하는 플랫폼입니다.
- 목표: 기술 역량 강화, 지식 공유 문화 확산, 고객 성공 지원
- 작성자 유형: AWS 솔루션 아키텍트, 기술 전문가, 파트너, 고객 성공 매니저
- 성과 지표: 콘텐츠 품질, 사용자 참여도, 지식 전파 효과

## 👥 작성자 성과 데이터 분석
${enhancedAuthorContext.performanceOverview}

## 🏆 TOP 퍼포머 분석
${enhancedAuthorContext.topPerformers}

## 📊 생산성 및 품질 지표
${enhancedAuthorContext.productivityMetrics}

## 🎯 전문성 및 영향력 분석
${enhancedAuthorContext.expertiseAnalysis}

## 📈 성장 패턴 및 트렌드
${enhancedAuthorContext.growthPatterns}

다음 구조로 **전략적 인재 육성 및 성과 최적화 리포트**를 작성해주세요:

## 🏆 작성자 성과 종합 분석
1. **TOP 퍼포머 심층 분석**
   - 가장 높은 성과를 보이는 작성자들의 성공 요인 및 특징
   - 콘텐츠 품질, 사용자 참여도, 전문성 수준 종합 평가
   - 성공 패턴 및 베스트 프랙티스 도출

2. **작성자별 전문성 및 강점 분야**
   - 각 작성자의 핵심 전문 영역 및 기술 스택
   - AWS 서비스별 전문성 분포 및 커버리지 분석
   - 조직 내 지식 자산 및 역량 맵핑

3. **콘텐츠 품질 및 일관성 평가**
   - 작성자별 콘텐츠 품질 지표 및 안정성 분석
   - 사용자 피드백 및 참여도 패턴 분석
   - 지속적 품질 향상 및 일관성 유지 방안

## 📊 생산성 및 효율성 분석
1. **콘텐츠 생산 패턴 분석**
   - 작성자별 콘텐츠 생산 빈도, 일관성, 계절성 분석
   - 생산성 대비 품질 효율성 평가
   - 최적 작업 패턴 및 리듬 도출

2. **협업 및 지식 공유 효과**
   - 작성자 간 협업 패턴 및 시너지 효과
   - 멘토링 및 지식 전수 활동 분석
   - 팀워크 및 조직 학습 기여도 평가

3. **사용자 반응 및 비즈니스 임팩트**
   - 작성자별 사용자 참여도 및 만족도 분석
   - 비즈니스 목표 달성 기여도 측정
   - ROI 관점에서의 작성자 가치 평가

## 💡 전략적 인재 육성 방안 (우선순위별)
### 🚀 즉시 실행 (1-2주)
1. **TOP 퍼포머 노하우 공유**: 성공 사례 및 베스트 프랙티스 전파
2. **개별 피드백 및 코칭**: 맞춤형 성과 개선 가이드 제공
3. **인센티브 및 인정 시스템**: 우수 작성자 포상 및 동기 부여

### 📈 단기 전략 (1-3개월)
1. **역량별 맞춤 교육**: 개별 작성자 강점/약점 기반 교육 프로그램
2. **멘토링 시스템**: 경험자-신규자 간 체계적 멘토링 구축
3. **협업 프로젝트**: 작성자 간 협업을 통한 시너지 창출

### 🎯 중장기 전략 (3-12개월)
1. **전문성 개발 로드맵**: 개별 작성자별 장기 성장 계획 수립
2. **지식 관리 시스템**: 체계적 지식 축적 및 활용 플랫폼 구축
3. **조직 학습 문화**: 지속적 학습 및 혁신 문화 정착

## 📊 예상 효과 및 성과 지표
- **콘텐츠 품질**: 평균 품질 점수 및 일관성 개선 목표
- **생산성**: 작성자별 생산성 향상 및 효율성 증대 전망
- **사용자 만족도**: 콘텐츠 만족도 및 참여도 개선 목표
- **조직 역량**: 전체 조직의 기술 역량 및 경쟁력 강화 효과

## 🎯 인재 육성 실행 계획
### 개별 작성자별 맞춤 계획
- 강점 영역 확장 방안
- 약점 보완 및 개선 계획
- 전문성 개발 로드맵
- 성과 목표 및 KPI 설정

### 조직 차원 개선 방안
- 지식 공유 프로세스 최적화
- 협업 도구 및 시스템 개선
- 성과 평가 및 보상 체계 개선
- 학습 문화 및 환경 조성

**중요**: 모든 분석과 권장사항은 실제 성과 데이터를 기반으로 하되, 개별 작성자의 성장과 조직 전체의 역량 강화를 동시에 고려하여 제시해주세요.
`;

    const analysis = await generateTextWithClaude(prompt, 4000);
    
    res.json({
      success: true,
      data: analysis,
      generatedAt: new Date().toISOString(),
      modelUsed: 'Claude 3.5 Sonnet (Enhanced)',
      enhancementLevel: 'Strategic Talent Development'
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
 * 작성자 데이터 증강 및 컨텍스트 생성 함수
 */
function generateEnhancedAuthorContext(authorAnalytics) {
  const authors = Array.isArray(authorAnalytics) ? authorAnalytics : [];
  
  // 성과 개요
  const performanceOverview = `
**전체 작성자 현황**:
- 총 작성자 수: ${authors.length}명
- 총 콘텐츠 수: ${authors.reduce((sum, author) => sum + (author.contentCount || 0), 0)}개
- 총 조회수: ${authors.reduce((sum, author) => sum + (author.totalViews || 0), 0).toLocaleString()}회
- 평균 작성자당 콘텐츠: ${authors.length > 0 ? Math.round(authors.reduce((sum, author) => sum + (author.contentCount || 0), 0) / authors.length) : 0}개
- 평균 작성자당 조회수: ${authors.length > 0 ? Math.round(authors.reduce((sum, author) => sum + (author.totalViews || 0), 0) / authors.length).toLocaleString() : 0}회

**성과 분포**:
- 고성과 작성자 (1000회 이상): ${authors.filter(author => (author.totalViews || 0) >= 1000).length}명
- 중간 성과 작성자 (100-999회): ${authors.filter(author => (author.totalViews || 0) >= 100 && (author.totalViews || 0) < 1000).length}명
- 신규/저성과 작성자 (100회 미만): ${authors.filter(author => (author.totalViews || 0) < 100).length}명
`;

  // TOP 퍼포머
  const topPerformers = `
**TOP 10 성과 작성자**:
${authors.slice(0, 10).map((author, index) => {
    const avgViews = author.contentCount > 0 ? Math.round((author.totalViews || 0) / author.contentCount) : 0;
    return `${index + 1}. ${author.name || author.author || 'Unknown'} - ${(author.totalViews || 0).toLocaleString()}회 (${author.contentCount || 0}개 콘텐츠, 평균 ${avgViews}회)`;
}).join('\n')}

**성과 우수자 특징**:
- 평균 콘텐츠 수: ${authors.slice(0, 5).length > 0 ? Math.round(authors.slice(0, 5).reduce((sum, author) => sum + (author.contentCount || 0), 0) / 5) : 0}개
- 평균 조회수: ${authors.slice(0, 5).length > 0 ? Math.round(authors.slice(0, 5).reduce((sum, author) => sum + (author.totalViews || 0), 0) / 5).toLocaleString() : 0}회
- 콘텐츠당 평균 조회수: ${authors.slice(0, 5).length > 0 ? Math.round(authors.slice(0, 5).reduce((sum, author) => sum + ((author.totalViews || 0) / Math.max(author.contentCount || 1, 1)), 0) / 5) : 0}회
`;

  // 생산성 지표
  const productivityMetrics = `
**생산성 분석**:
- 가장 활발한 작성자: ${authors.length > 0 ? authors.reduce((max, author) => (author.contentCount || 0) > (max.contentCount || 0) ? author : max, authors[0])?.name || 'N/A' : 'N/A'}
- 최고 효율성 작성자: ${authors.length > 0 ? authors.reduce((max, author) => {
    const maxEfficiency = (max.totalViews || 0) / Math.max(max.contentCount || 1, 1);
    const authorEfficiency = (author.totalViews || 0) / Math.max(author.contentCount || 1, 1);
    return authorEfficiency > maxEfficiency ? author : max;
  }, authors[0])?.name || 'N/A' : 'N/A'}

**품질 일관성**:
- 안정적 성과 작성자: ${authors.filter(author => (author.contentCount || 0) >= 3 && ((author.totalViews || 0) / Math.max(author.contentCount || 1, 1)) >= 50).length}명
- 성장 잠재력 작성자: ${authors.filter(author => (author.contentCount || 0) >= 2 && (author.totalViews || 0) < 500).length}명
`;

  // 전문성 분석
  const expertiseAnalysis = `
**전문 영역 분포** (추정):
- AI/ML 전문가: ${authors.filter(author => 
    author.name?.toLowerCase().includes('ai') || 
    author.name?.toLowerCase().includes('ml') ||
    (author.topCategories && author.topCategories.some(cat => cat.toLowerCase().includes('ai')))
  ).length}명
- 인프라 전문가: ${authors.filter(author => 
    author.name?.toLowerCase().includes('infra') || 
    author.name?.toLowerCase().includes('ec2') ||
    (author.topCategories && author.topCategories.some(cat => cat.toLowerCase().includes('compute')))
  ).length}명
- 데이터 전문가: ${authors.filter(author => 
    author.name?.toLowerCase().includes('data') || 
    (author.topCategories && author.topCategories.some(cat => cat.toLowerCase().includes('data')))
  ).length}명
- 보안 전문가: ${authors.filter(author => 
    author.name?.toLowerCase().includes('security') ||
    (author.topCategories && author.topCategories.some(cat => cat.toLowerCase().includes('security')))
  ).length}명

**영향력 지표**:
- 높은 영향력 (500회 이상): ${authors.filter(author => (author.totalViews || 0) >= 500).length}명
- 중간 영향력 (100-499회): ${authors.filter(author => (author.totalViews || 0) >= 100 && (author.totalViews || 0) < 500).length}명
- 신규 기여자 (100회 미만): ${authors.filter(author => (author.totalViews || 0) < 100).length}명
`;

  // 성장 패턴
  const growthPatterns = `
**성장 패턴 분석**:
- 지속적 기여자: ${authors.filter(author => (author.contentCount || 0) >= 5).length}명
- 집중적 기여자: ${authors.filter(author => (author.contentCount || 0) >= 3 && (author.contentCount || 0) < 5).length}명
- occasional 기여자: ${authors.filter(author => (author.contentCount || 0) < 3).length}명

**협업 및 멘토링 기회**:
- 멘토 후보 (고성과): ${authors.filter(author => (author.totalViews || 0) >= 1000 && (author.contentCount || 0) >= 3).length}명
- 멘티 후보 (성장 잠재력): ${authors.filter(author => (author.contentCount || 0) >= 1 && (author.totalViews || 0) < 200).length}명
- 협업 파트너: ${authors.filter(author => (author.contentCount || 0) >= 2 && (author.totalViews || 0) >= 200).length}명
`;

  return {
    performanceOverview,
    topPerformers,
    productivityMetrics,
    expertiseAnalysis,
    growthPatterns
  };
}

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
      message: 'Claude 4 Sonnet 연결 성공',
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
  console.log(`🤖 Claude 4 Sonnet (${CLAUDE_MODEL_ID}) 준비 완료`);
  console.log(`🌍 리전: us-west-2 (Inference Profile)`);
  console.log(`🔗 테스트 URL: http://localhost:${PORT}/api/bedrock/test`);
  console.log(`📊 분석 API: http://localhost:${PORT}/api/bedrock/analytics-insights`);
});

module.exports = app;
