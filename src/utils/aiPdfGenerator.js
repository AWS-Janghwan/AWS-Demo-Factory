import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  generateAnalyticsInsights, 
  generateContentAnalysis, 
  generateAuthorAnalysis 
} from './bedrockClient';

// PDF 설정
const PDF_CONFIG = {
  format: 'a4',
  orientation: 'portrait',
  unit: 'mm',
  margins: {
    top: 20,
    left: 20,
    right: 20,
    bottom: 20
  },
  colors: {
    primary: '#232F3E',
    secondary: '#FF9900',
    text: '#333333',
    lightGray: '#F5F5F5',
    darkGray: '#666666'
  },
  fonts: {
    title: 16,
    subtitle: 14,
    body: 10,
    small: 8
  }
};

/**
 * 한글 텍스트를 이미지로 변환하여 PDF에 추가
 */
const addKoreanTextAsImage = async (doc, text, x, y, options = {}) => {
  const {
    fontSize = 12,
    fontWeight = 'normal',
    color = '#333333',
    maxWidth = 170,
    lineHeight = 1.5
  } = options;

  try {
    // 임시 캔버스 생성
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 폰트 설정
    ctx.font = `${fontWeight} ${fontSize}px 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    
    // 텍스트 줄바꿈 처리
    const lines = [];
    const words = text.split(' ');
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth * 3.78) { // mm to px 변환 (대략)
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word);
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    // 캔버스 크기 설정
    const totalHeight = lines.length * fontSize * lineHeight;
    canvas.width = maxWidth * 3.78;
    canvas.height = totalHeight + 20;
    
    // 배경색 설정 (투명)
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 폰트 재설정 (캔버스 크기 변경 후)
    ctx.font = `${fontWeight} ${fontSize}px 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', Arial, sans-serif`;
    ctx.fillStyle = color;
    ctx.textBaseline = 'top';
    
    // 텍스트 그리기
    lines.forEach((line, index) => {
      ctx.fillText(line, 0, index * fontSize * lineHeight);
    });
    
    // 캔버스를 이미지로 변환하여 PDF에 추가
    const imageData = canvas.toDataURL('image/png');
    doc.addImage(imageData, 'PNG', x, y, maxWidth, totalHeight / 3.78);
    
    return y + (totalHeight / 3.78) + 5;
  } catch (error) {
    console.error('한글 텍스트 이미지 변환 실패:', error);
    // 폴백: 영어로 변환하여 추가
    return addTextBlock(doc, translateToEnglish(text), y, maxWidth);
  }
};

/**
 * 한글을 영어로 변환 (개선된 번역)
 */
const translateToEnglish = (koreanText) => {
  const translations = {
    // 섹션 제목
    '전체 현황 요약': 'Overall Status Summary',
    '핵심 인사이트': 'Key Insights',
    '성과 분석': 'Performance Analysis',
    '권장사항': 'Recommendations',
    '다음 단계': 'Next Steps',
    '콘텐츠 성과 분석': 'Content Performance Analysis',
    '콘텐츠 전략 제안': 'Content Strategy Recommendations',
    '작성자 성과 분석': 'Author Performance Analysis',
    '작성자 육성 방안': 'Author Development Plan',
    
    // 통계 용어
    '총 방문자': 'Total Visitors',
    '총 페이지뷰': 'Total Page Views',
    '총 콘텐츠 조회수': 'Total Content Views',
    '분석 기간': 'Analysis Period',
    '리포트 생성': 'Report Generated',
    'AI 모델 사용': 'AI Model Used',
    '방문자': 'visitors',
    '페이지뷰': 'page views',
    '조회수': 'views',
    '콘텐츠': 'content',
    '카테고리': 'category',
    '작성자': 'author',
    
    // 시간 관련
    '시간대': 'time period',
    '주간': 'weekly',
    '월간': 'monthly',
    '일간': 'daily',
    '전체': 'all time',
    
    // 분석 관련
    '패턴': 'pattern',
    '트렌드': 'trend',
    '개선': 'improvement',
    '성공': 'success',
    '실패': 'failure',
    '증가': 'increase',
    '감소': 'decrease',
    '안정': 'stable',
    
    // 일반 용어
    '가장': 'most',
    '높은': 'high',
    '낮은': 'low',
    '많은': 'many',
    '적은': 'few',
    '좋은': 'good',
    '나쁜': 'poor',
    '우수한': 'excellent',
    '보통': 'average'
  };
  
  let result = koreanText;
  
  // 정확한 매칭부터 시작
  Object.entries(translations).forEach(([korean, english]) => {
    const regex = new RegExp(korean.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    result = result.replace(regex, english);
  });
  
  // 남은 한글 문자들을 제거하거나 대체
  result = result.replace(/[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/g, '');
  
  // 연속된 공백 정리
  result = result.replace(/\s+/g, ' ').trim();
  
  return result || 'Content analysis in Korean (translation required)';
};

/**
 * 현재 날짜/시간 포맷팅
 */
const formatDateTime = () => {
  const now = new Date();
  return now.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul'
  });
};

/**
 * 차트 캡처 함수
 */
const captureChart = async (elementId) => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.warn(`Chart element not found: ${elementId}`);
    return null;
  }
  
  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      width: element.offsetWidth,
      height: element.offsetHeight
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Chart capture error:', error);
    return null;
  }
};

/**
 * PDF에 헤더 추가 (한글 지원 - 번역 우선)
 */
const addHeader = async (doc, title) => {
  // AWS 로고 영역 (텍스트로 대체)
  doc.setFillColor(PDF_CONFIG.colors.primary);
  doc.rect(PDF_CONFIG.margins.left, PDF_CONFIG.margins.top, 170, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(PDF_CONFIG.fonts.title);
  doc.text('AWS Demo Factory', PDF_CONFIG.margins.left + 5, PDF_CONFIG.margins.top + 10);
  
  // 제목 처리 (한글 번역)
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title);
  let processedTitle = title;
  
  if (hasKorean) {
    processedTitle = translateToEnglish(title);
  }
  
  doc.setTextColor(PDF_CONFIG.colors.text);
  doc.setFontSize(PDF_CONFIG.fonts.subtitle);
  doc.text(processedTitle, PDF_CONFIG.margins.left, PDF_CONFIG.margins.top + 25);
  
  // 생성 일시
  doc.setFontSize(PDF_CONFIG.fonts.small);
  doc.setTextColor(PDF_CONFIG.colors.darkGray);
  doc.text(`Generated: ${formatDateTime()}`, PDF_CONFIG.margins.left, PDF_CONFIG.margins.top + 35);
  
  return PDF_CONFIG.margins.top + 45;
};

/**
 * PDF에 섹션 제목 추가 (한글 지원 - 번역 우선)
 */
const addSectionTitle = async (doc, title, yPosition) => {
  doc.setFillColor(PDF_CONFIG.colors.lightGray);
  doc.rect(PDF_CONFIG.margins.left, yPosition, 170, 8, 'F');
  
  // 한글이 포함된 경우 영어로 번역
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(title);
  let processedTitle = title;
  
  if (hasKorean) {
    processedTitle = translateToEnglish(title);
    console.log('제목 번역:', title, '->', processedTitle);
  }
  
  doc.setTextColor(PDF_CONFIG.colors.primary);
  doc.setFontSize(PDF_CONFIG.fonts.subtitle);
  doc.text(processedTitle, PDF_CONFIG.margins.left + 3, yPosition + 6);
  
  return yPosition + 15;
};

/**
 * PDF에 텍스트 블록 추가 (한글 지원 - 번역 우선)
 */
const addTextBlock = async (doc, text, yPosition, maxWidth = 170) => {
  // 한글이 포함된 경우 영어로 번역
  const hasKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/.test(text);
  
  let processedText = text;
  if (hasKorean) {
    processedText = translateToEnglish(text);
    console.log('한글 텍스트 번역:', text.substring(0, 50) + '...');
  }
  
  // 영어 텍스트로 PDF에 추가
  doc.setTextColor(PDF_CONFIG.colors.text);
  doc.setFontSize(PDF_CONFIG.fonts.body);
  
  const lines = doc.splitTextToSize(processedText, maxWidth);
  doc.text(lines, PDF_CONFIG.margins.left, yPosition);
  
  return yPosition + (lines.length * 4) + 5;
};

/**
 * PDF에 차트 이미지 추가
 */
const addChartImage = async (doc, chartId, yPosition, title) => {
  const chartImage = await captureChart(chartId);
  if (chartImage) {
    // 차트 제목
    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setTextColor(PDF_CONFIG.colors.darkGray);
    doc.text(title, PDF_CONFIG.margins.left, yPosition);
    yPosition += 8;
    
    // 차트 이미지
    doc.addImage(chartImage, 'PNG', PDF_CONFIG.margins.left, yPosition, 170, 80);
    return yPosition + 90;
  }
  return yPosition;
};

/**
 * 새 페이지 추가 및 헤더 설정 (한글 지원)
 */
const addNewPage = async (doc, title) => {
  doc.addPage();
  return await addHeader(doc, title);
};

/**
 * AI 기반 전체 분석 리포트 생성
 */
export const generateAIAnalyticsReport = async (analyticsData) => {
  try {
    console.log('🤖 AI 기반 분석 리포트 생성 시작...');
    
    // 1. AI 인사이트 생성
    console.log('🔍 AI 인사이트 생성 중...');
    const aiInsights = await generateAnalyticsInsights(analyticsData);
    
    // 2. 콘텐츠 분석 생성 (데이터가 있는 경우)
    let contentAnalysis = null;
    if (analyticsData.content && analyticsData.content.length > 0) {
      console.log('📄 콘텐츠 분석 생성 중...');
      contentAnalysis = await generateContentAnalysis(analyticsData.content);
    }
    
    // 3. 작성자 분석 생성 (데이터가 있는 경우)
    let authorAnalysis = null;
    if (analyticsData.authors && analyticsData.authors.length > 0) {
      console.log('✍️ 작성자 분석 생성 중...');
      authorAnalysis = await generateAuthorAnalysis(analyticsData.authors);
    }
    
    // 4. PDF 생성
    console.log('📄 PDF 문서 생성 중...');
    const doc = new jsPDF(PDF_CONFIG.orientation, PDF_CONFIG.unit, PDF_CONFIG.format);
    
    // 헤더 추가
    let yPos = await addHeader(doc, 'AI Analytics Report');
    
    // AI 인사이트 섹션
    yPos = await addSectionTitle(doc, '🤖 AI Generated Insights', yPos);
    yPos = await addTextBlock(doc, aiInsights.summary, yPos);
    
    // 페이지 넘김 체크
    if (yPos > 250) {
      yPos = await addNewPage(doc, 'AI Analytics Report');
    }
    
    // 데이터 요약 섹션
    yPos = await addSectionTitle(doc, '📊 Data Summary', yPos + 10);
    
    const dataSummary = `
Total Visitors: ${analyticsData.summary?.totalVisitors || 0}
Total Page Views: ${analyticsData.summary?.totalPageViews || 0}
Total Content Views: ${analyticsData.summary?.totalContentViews || 0}
Analysis Period: ${analyticsData.period || 'All Time'}
Report Generated: ${formatDateTime()}
AI Model Used: ${aiInsights.modelUsed}
    `.trim();
    
    yPos = await addTextBlock(doc, dataSummary, yPos);
    
    // 차트 추가 (가능한 경우)
    if (yPos > 200) {
      yPos = await addNewPage(doc, 'AI Analytics Report - Charts');
    }
    
    // 접속 목적 차트
    yPos = await addChartImage(doc, 'purpose-pie-chart', yPos + 10, 'Access Purpose Distribution');
    
    // 콘텐츠 분석 섹션 (새 페이지)
    if (contentAnalysis) {
      yPos = await addNewPage(doc, 'AI Analytics Report - Content Analysis');
      yPos = await addSectionTitle(doc, '📄 AI Content Analysis', yPos);
      yPos = await addTextBlock(doc, contentAnalysis, yPos);
      
      // 콘텐츠 차트 추가
      if (yPos > 200) {
        yPos = await addNewPage(doc, 'AI Analytics Report - Content Charts');
      }
      yPos = await addChartImage(doc, 'content-bar-chart', yPos + 10, 'Top Content Performance');
    }
    
    // 작성자 분석 섹션 (새 페이지)
    if (authorAnalysis) {
      yPos = await addNewPage(doc, 'AI Analytics Report - Author Analysis');
      yPos = await addSectionTitle(doc, '✍️ AI Author Analysis', yPos);
      yPos = await addTextBlock(doc, authorAnalysis, yPos);
      
      // 작성자 차트 추가
      if (yPos > 200) {
        yPos = await addNewPage(doc, 'AI Analytics Report - Author Charts');
      }
      yPos = await addChartImage(doc, 'author-bar-chart', yPos + 10, 'Top Authors Performance');
    }
    
    // 마지막 페이지 - 권장사항 및 다음 단계
    yPos = await addNewPage(doc, 'AI Analytics Report - Recommendations');
    yPos = await addSectionTitle(doc, '💡 AI Recommendations & Next Steps', yPos);
    
    const recommendations = `
This report was generated using Amazon Bedrock's Claude 4 Sonnet model to provide 
intelligent insights based on your AWS Demo Factory analytics data.

Key Benefits of AI-Powered Analytics:
• Automated pattern recognition and trend analysis
• Actionable insights based on data patterns
• Personalized recommendations for content strategy
• Predictive analysis for future performance

For more detailed analysis or custom insights, please contact your AWS solutions architect.

Report Generation Details:
• AI Model: Claude 4 Sonnet (us-west-2)
• Data Points Analyzed: ${aiInsights.dataProcessed}
• Generation Time: ${formatDateTime()}
• Report Version: AI-Enhanced v1.0
    `.trim();
    
    yPos = await addTextBlock(doc, recommendations, yPos);
    
    // PDF 저장
    const fileName = `AWS_Demo_Factory_AI_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    console.log('✅ AI 기반 PDF 리포트 생성 완료!');
    return {
      success: true,
      fileName,
      insights: aiInsights,
      contentAnalysis,
      authorAnalysis
    };
    
  } catch (error) {
    console.error('❌ AI PDF 리포트 생성 실패:', error);
    return {
      success: false,
      error: error.message,
      fallback: 'AI 분석에 실패했습니다. 기본 리포트를 생성하시겠습니까?'
    };
  }
};

/**
 * AI 기반 콘텐츠 분석 리포트 생성
 */
export const generateAIContentReport = async (contentData) => {
  try {
    console.log('📄 AI 콘텐츠 리포트 생성 시작...');
    
    const contentAnalysis = await generateContentAnalysis(contentData);
    
    const doc = new jsPDF(PDF_CONFIG.orientation, PDF_CONFIG.unit, PDF_CONFIG.format);
    let yPos = await addHeader(doc, 'AI Content Analysis Report');
    
    yPos = await addSectionTitle(doc, '📄 AI Content Insights', yPos);
    yPos = await addTextBlock(doc, contentAnalysis, yPos);
    
    // 콘텐츠 차트 추가
    if (yPos > 200) {
      yPos = await addNewPage(doc, 'AI Content Analysis - Charts');
    }
    yPos = await addChartImage(doc, 'content-bar-chart', yPos + 10, 'Content Performance Analysis');
    
    const fileName = `AWS_Demo_Factory_AI_Content_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName, analysis: contentAnalysis };
  } catch (error) {
    console.error('❌ AI 콘텐츠 리포트 생성 실패:', error);
    return { success: false, error: error.message };
  }
};

/**
 * AI 기반 작성자 분석 리포트 생성
 */
export const generateAIAuthorReport = async (authorData) => {
  try {
    console.log('✍️ AI 작성자 리포트 생성 시작...');
    
    const authorAnalysis = await generateAuthorAnalysis(authorData);
    
    const doc = new jsPDF(PDF_CONFIG.orientation, PDF_CONFIG.unit, PDF_CONFIG.format);
    let yPos = await addHeader(doc, 'AI Author Analysis Report');
    
    yPos = await addSectionTitle(doc, '✍️ AI Author Insights', yPos);
    yPos = await addTextBlock(doc, authorAnalysis, yPos);
    
    // 작성자 차트 추가
    if (yPos > 200) {
      yPos = await addNewPage(doc, 'AI Author Analysis - Charts');
    }
    yPos = await addChartImage(doc, 'author-bar-chart', yPos + 10, 'Author Performance Analysis');
    
    const fileName = `AWS_Demo_Factory_AI_Author_Report_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    return { success: true, fileName, analysis: authorAnalysis };
  } catch (error) {
    console.error('❌ AI 작성자 리포트 생성 실패:', error);
    return { success: false, error: error.message };
  }
};

const aiPdfGenerator = {
  generateAIAnalyticsReport,
  generateAIContentReport,
  generateAIAuthorReport
};

export default aiPdfGenerator;
