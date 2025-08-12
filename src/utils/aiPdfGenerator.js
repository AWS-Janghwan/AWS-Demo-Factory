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
 * AI 기반 전체 분석 리포트 생성
 */
export const generateAIAnalyticsReport = async (analyticsData, existingInsights = null) => {
  try {
    console.log('🤖 AI 기반 분석 리포트 생성 시작...');
    
    // 1. AI 인사이트 생성 또는 기존 인사이트 사용
    let aiInsights;
    if (existingInsights) {
      console.log('🔄 기존 AI 인사이트 재사용...');
      aiInsights = existingInsights;
    } else {
      console.log('🔍 AI 인사이트 생성 중...');
      aiInsights = await generateAnalyticsInsights(analyticsData);
    }
    
    // 2. 추가 분석 생략 (이미 AI 인사이트에 모든 분석 포함됨)
    console.log('ℹ️ 추가 Bedrock 호출 생략 - AI 인사이트에 이미 포함됨');
    
    // 4. PDF 생성
    console.log('📄 PDF 문서 생성 중...');
    const doc = new jsPDF(PDF_CONFIG.orientation, PDF_CONFIG.unit, PDF_CONFIG.format);
    
    // 헤더 추가
    let yPos = await addEnglishHeader(doc, 'AWS Demo Factory AI Analytics Report');
    
    // Chart.js 동적 로드
    console.log('📊 Chart.js 로드 중...');
    const Chart = await loadChartJS();
    console.log('✅ Chart.js 동적 로드 완룼');
    
    // AI 인사이트를 섹션별로 분리
    const insightSections = extractInsightSections(aiInsights.summary);
    
    // 1. 전체 현황 요약 섹션
    yPos = await addEnglishSectionTitle(doc, '📊 Overall Statistics Analysis', yPos);
    if (insightSections.overview) {
      yPos = await addKoreanTextAsImage(doc, insightSections.overview, 20, yPos, {
        fontSize: 10,
        maxWidth: 170
      });
      yPos += 10;
    }
    
    // 전체 통계 차트
    if (analyticsData.summary) {
      yPos = await addChartSectionTitle(doc, 'Overall Statistics Chart', '전체 통계 차트', yPos);
      const summaryChart = await createSummaryChart(analyticsData.summary, Chart);
      if (summaryChart) {
        yPos = await addChartToDoc(doc, summaryChart, yPos, '전체 통계');
      }
      yPos += 20;
    }
    
    // 2. 접속 목적 분석 섹션
    yPos = await addEnglishSectionTitle(doc, '🎯 Access Purpose Analysis', yPos);
    if (insightSections.accessPurpose) {
      yPos = await addKoreanTextAsImage(doc, insightSections.accessPurpose, 20, yPos, {
        fontSize: 10,
        maxWidth: 170
      });
      yPos += 10;
    }
    
    // 접속 목적 차트
    if (analyticsData.accessPurpose && analyticsData.accessPurpose.length > 0) {
      yPos = await addChartSectionTitle(doc, 'Access Purpose Chart', '접속 목적 차트', yPos);
      const purposeChart = await createAccessPurposeChart(analyticsData.accessPurpose, Chart);
      if (purposeChart) {
        yPos = await addChartToDoc(doc, purposeChart, yPos, '접속 목적 분석');
      }
      yPos += 20;
    }
    
    // 3. 콘텐츠 분석 섹션
    yPos = await addEnglishSectionTitle(doc, '📄 Content Analysis', yPos);
    if (insightSections.content) {
      yPos = await addKoreanTextAsImage(doc, insightSections.content, 20, yPos, {
        fontSize: 10,
        maxWidth: 170
      });
      yPos += 10;
    }
    
    // 콘텐츠 분석 차트
    if (analyticsData.content && analyticsData.content.length > 0) {
      yPos = await addChartSectionTitle(doc, 'Content Analysis Chart', '콘텐츠 분석 차트', yPos);
      const contentChart = await createContentChart(analyticsData.content, Chart);
      if (contentChart) {
        yPos = await addChartToDoc(doc, contentChart, yPos, '콘텐츠 분석');
      }
      yPos += 20;
    }
    
    // 4. 카테고리 분석 섹션
    yPos = await addEnglishSectionTitle(doc, '📂 Category Analysis', yPos);
    if (insightSections.category) {
      yPos = await addKoreanTextAsImage(doc, insightSections.category, 20, yPos, {
        fontSize: 10,
        maxWidth: 170
      });
      yPos += 10;
    }
    
    // 카테고리 분석 차트
    if (analyticsData.category && analyticsData.category.length > 0) {
      yPos = await addChartSectionTitle(doc, 'Category Analysis Chart', '카테고리 분석 차트', yPos);
      const categoryChart = await createCategoryChart(analyticsData.category, Chart);
      if (categoryChart) {
        yPos = await addChartToDoc(doc, categoryChart, yPos, '카테고리 분석');
      }
      yPos += 20;
    }
    
    // 5. 시간별 분석 섹션
    yPos = await addEnglishSectionTitle(doc, '⏰ Time Analysis', yPos);
    if (insightSections.time) {
      yPos = await addKoreanTextAsImage(doc, insightSections.time, 20, yPos, {
        fontSize: 10,
        maxWidth: 170
      });
      yPos += 10;
    }
    
    // 시간별 분석 차트
    if (analyticsData.time && analyticsData.time.length > 0) {
      yPos = await addChartSectionTitle(doc, 'Time Analysis Chart', '시간별 분석 차트', yPos);
      const timeChart = await createTimeChart(analyticsData.time, Chart);
      if (timeChart) {
        yPos = await addChartToDoc(doc, timeChart, yPos, '시간별 분석');
      }
      yPos += 20;
    }
    
    // 6. 전략적 권장사항 섹션
    if (insightSections.recommendations) {
      yPos = await addEnglishSectionTitle(doc, '💡 Strategic Recommendations', yPos);
      yPos = await addKoreanTextAsImage(doc, insightSections.recommendations, 20, yPos, {
        fontSize: 10,
        maxWidth: 170
      });
    }
    
    // 푸터 추가
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 280);
    doc.text('AWS Demo Factory AI Analytics Report', 150, 280);
    
    // PDF 저장
    const fileName = `AWS_Demo_Factory_AI_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.pdf`;
    doc.save(fileName);
    
    console.log('✅ AI PDF 생성 완료:', fileName);
    
    return {
      success: true,
      fileName: fileName,
      message: 'AI 기반 분석 리포트가 성공적으로 생성되었습니다.'
    };
    
  } catch (error) {
    console.error('❌ AI PDF 리포트 생성 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 차트만 포함된 분석 리포트 생성 (AI 인사이트 없음)
 */
export const generateChartOnlyReport = async (analyticsData, insightsText = null) => {
  try {
    console.log('📊 차트 전용 분석 리포트 생성 시작...');
    
    // Chart.js 동적 로드
    const Chart = await loadChartJS();
    console.log('✅ Chart.js 동적 로드 완료');
    
    // PDF 문서 생성
    const doc = new jsPDF(PDF_CONFIG.orientation, PDF_CONFIG.unit, PDF_CONFIG.format);
    
    // 헤더 추가 (영문으로)
    let yPos = await addEnglishHeader(doc, 'AWS Demo Factory Analytics Report');
    
    // AI 인사이트가 있으면 추가 (한글 텍스트는 이미지로 변환)
    if (insightsText) {
      yPos = await addEnglishSectionTitle(doc, 'AI Generated Insights', yPos);
      yPos = await addKoreanTextAsImage(doc, insightsText.substring(0, 500) + '...', 20, yPos, {
        fontSize: 10,
        maxWidth: 170
      });
      yPos += 20;
    }
    
    // 1. 전체 통계 차트
    if (analyticsData.summary) {
      yPos = await addChartSectionTitle(doc, 'Overall Statistics', '전체 통계', yPos);
      const summaryChart = await createSummaryChart(analyticsData.summary, Chart);
      if (summaryChart) {
        yPos = await addChartToDoc(doc, summaryChart, yPos, '전체 통계');
      }
      yPos += 10;
    }
    
    // 2. 접속 목적 차트
    if (analyticsData.accessPurpose && analyticsData.accessPurpose.length > 0) {
      yPos = await addChartSectionTitle(doc, 'Access Purpose Analysis', '접속 목적 분석', yPos);
      const purposeChart = await createAccessPurposeChart(analyticsData.accessPurpose, Chart);
      if (purposeChart) {
        yPos = await addChartToDoc(doc, purposeChart, yPos, '접속 목적 분석');
      }
      yPos += 10;
    }
    
    // 3. 콘텐츠 분석 차트
    if (analyticsData.content && analyticsData.content.length > 0) {
      yPos = await addChartSectionTitle(doc, 'Content Analysis', '콘텐츠 분석', yPos);
      const contentChart = await createContentChart(analyticsData.content, Chart);
      if (contentChart) {
        yPos = await addChartToDoc(doc, contentChart, yPos, '콘텐츠 분석');
      }
      yPos += 10;
    }
    
    // 4. 카테고리 분석 차트
    if (analyticsData.category && analyticsData.category.length > 0) {
      yPos = await addChartSectionTitle(doc, 'Category Analysis', '카테고리 분석', yPos);
      const categoryChart = await createCategoryChart(analyticsData.category, Chart);
      if (categoryChart) {
        yPos = await addChartToDoc(doc, categoryChart, yPos, '카테고리 분석');
      }
      yPos += 10;
    }
    
    // 5. 시간별 분석 차트
    if (analyticsData.time && analyticsData.time.length > 0) {
      yPos = await addChartSectionTitle(doc, 'Time Analysis', '시간별 분석', yPos);
      const timeChart = await createTimeChart(analyticsData.time, Chart);
      if (timeChart) {
        yPos = await addChartToDoc(doc, timeChart, yPos, '시간별 분석');
      }
    }
    
    // 푸터 추가
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on ${new Date().toLocaleString()}`, 20, 280);
    doc.text('AWS Demo Factory Analytics Report', 150, 280);
    
    // PDF 저장
    const fileName = `AWS_Demo_Factory_Chart_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.pdf`;
    doc.save(fileName);
    
    console.log('✅ 차트 전용 PDF 생성 완료:', fileName);
    
    return {
      success: true,
      fileName: fileName,
      message: '차트가 포함된 분석 리포트가 성공적으로 생성되었습니다.'
    };
    
  } catch (error) {
    console.error('❌ 차트 전용 PDF 생성 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 영문 헤더 추가
 */
const addEnglishHeader = async (doc, title) => {
  // 배경색 설정
  doc.setFillColor(35, 47, 62); // AWS Dark Blue
  doc.rect(0, 0, 210, 40, 'F');
  
  // 제목
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text(title, 20, 25);
  
  // 생성 날짜
  doc.setFontSize(10);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
  
  return 50;
};

/**
 * 영문 섹션 타이틀 추가
 */
const addEnglishSectionTitle = async (doc, title, yPos) => {
  // 페이지 넘김 체크
  if (yPos > 250) {
    doc.addPage();
    yPos = 30;
  }
  
  doc.setTextColor(255, 153, 0); // AWS Orange
  doc.setFontSize(14);
  doc.text(title, 20, yPos);
  
  return yPos + 15;
};

/**
 * Markdown 텍스트를 파싱하여 스타일링 적용
 */
const parseMarkdownText = (text) => {
  // Markdown 요소들을 스타일링과 함께 파싱
  const lines = text.split('\n');
  const parsedLines = [];
  
  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      parsedLines.push({ type: 'space', content: '', style: {} });
      return;
    }
    
    // 헤더 처리
    if (trimmed.startsWith('# ')) {
      parsedLines.push({
        type: 'header1',
        content: trimmed.substring(2),
        style: { fontSize: 16, fontWeight: 'bold', color: '#FF9900', marginBottom: 8 }
      });
    } else if (trimmed.startsWith('## ')) {
      parsedLines.push({
        type: 'header2',
        content: trimmed.substring(3),
        style: { fontSize: 14, fontWeight: 'bold', color: '#232F3E', marginBottom: 6 }
      });
    } else if (trimmed.startsWith('### ')) {
      parsedLines.push({
        type: 'header3',
        content: trimmed.substring(4),
        style: { fontSize: 12, fontWeight: 'bold', color: '#333333', marginBottom: 4 }
      });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      // 리스트 아이템
      parsedLines.push({
        type: 'listItem',
        content: '• ' + trimmed.substring(2),
        style: { fontSize: 10, marginLeft: 10, marginBottom: 2 }
      });
    } else if (trimmed.match(/^\d+\. /)) {
      // 숫자 리스트
      parsedLines.push({
        type: 'numberedItem',
        content: trimmed,
        style: { fontSize: 10, marginLeft: 10, marginBottom: 2 }
      });
    } else {
      // 일반 텍스트
      let content = trimmed;
      let style = { fontSize: 10, marginBottom: 3 };
      
      // 볼드 처리
      if (content.includes('**')) {
        style.fontWeight = 'bold';
        content = content.replace(/\*\*(.*?)\*\*/g, '$1');
      }
      
      parsedLines.push({
        type: 'paragraph',
        content: content,
        style: style
      });
    }
  });
  
  return parsedLines;
};

/**
 * 개선된 한글 텍스트를 이미지로 변환하여 PDF에 추가 (Markdown 지원)
 */
const addKoreanTextAsImage = async (doc, text, x, y, options = {}) => {
  const {
    fontSize = 12,
    fontWeight = 'normal',
    color = '#333333',
    maxWidth = 170,
    lineHeight = 1.5
  } = options;

  console.log(`🇰🇷 한글 텍스트 이미지 변환 시작:`, {
    text: text.substring(0, 50) + '...',
    fontSize,
    maxWidth,
    position: { x, y }
  });

  try {
    // Markdown 파싱
    const parsedLines = parseMarkdownText(text);
    console.log(`📋 Markdown 파싱 완료: ${parsedLines.length}줄`);
    
    // 한글이 포함되어 있는지 확인
    const hasKorean = /[가-힣]/.test(text);
    if (!hasKorean) {
      console.log('ℹ️ 한글이 없어서 기본 텍스트로 처리');
      doc.setTextColor(parseInt(color.slice(1, 3), 16), parseInt(color.slice(3, 5), 16), parseInt(color.slice(5, 7), 16));
      doc.setFontSize(fontSize);
      doc.text(text, x, y);
      return y + fontSize + 5;
    }
    
    // 텍스트를 줄 단위로 분할 (더 지능적으로)
    const lines = [];
    const words = text.split(/\s+/);
    let currentLine = '';
    
    // 임시 캔버스로 텍스트 크기 측정
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    tempCtx.font = `${fontWeight} ${fontSize}px 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', sans-serif`;
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const metrics = tempCtx.measureText(testLine);
      
      if (metrics.width > maxWidth * 2.83) { // mm to px 변환 (1mm = 2.83px)
        if (currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          lines.push(word); // 단어가 너무 길어도 강제로 추가
        }
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
    
    console.log(`📏 텍스트 줄 분할 완료: ${lines.length}줄`);
    
    let currentY = y;
    
    for (let i = 0; i < parsedLines.length; i++) {
      const lineData = parsedLines[i];
      if (lineData.content || lineData.type === 'space') {
        
        if (lineData.type === 'space') {
          currentY += 5; // 빈 줄 처리
          continue;
        }
        
        console.log(`🎨 ${i + 1}번째 줄 렌더링 (${lineData.type}): "${lineData.content.substring(0, 30)}..."`);
        
        // 스타일 적용
        const currentFontSize = lineData.style.fontSize || fontSize;
        const currentColor = lineData.style.color || color;
        const currentFontWeight = lineData.style.fontWeight || fontWeight;
        const marginLeft = lineData.style.marginLeft || 0;
        const marginBottom = lineData.style.marginBottom || 2;
        
        // 각 줄을 이미지로 변환
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 캔버스 크기 설정 (고해상도)
        const scale = 4;
        canvas.width = maxWidth * 2.83 * scale;
        canvas.height = currentFontSize * lineHeight * 2.83 * scale;
        
        // 고품질 렌더링 설정
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        // 텍스트 스타일 설정
        ctx.font = `${currentFontWeight} ${currentFontSize * scale}px 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans KR', '맑은 고딕', sans-serif`;
        ctx.fillStyle = currentColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.textRenderingOptimization = 'optimizeQuality';
        
        // 배경을 흰색으로 설정
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 텍스트 그리기
        ctx.fillStyle = currentColor;
        ctx.fillText(lineData.content, (10 + marginLeft) * scale, 5 * scale);
        
        // 이미지를 PDF에 추가
        const imageData = canvas.toDataURL('image/png', 1.0);
        const imageHeight = currentFontSize * lineHeight;
        doc.addImage(imageData, 'PNG', x + marginLeft, currentY, maxWidth - marginLeft, imageHeight);
        
        console.log(`✅ ${i + 1}번째 줄 PDF 추가 완료 (${lineData.type}, y: ${currentY})`);
        
        currentY += imageHeight + marginBottom;
        
        // 페이지 넘김 체크
        if (currentY > 270) {
          doc.addPage();
          currentY = 30;
          console.log('📄 새 페이지 추가');
        }
      }
    }
    
    console.log(`✅ 한글 텍스트 이미지 변환 완료 (y: ${currentY})`);
    return currentY + 5;
    
  } catch (error) {
    console.error('❌ 한글 텍스트 이미지 변환 실패:', error);
    
    // 실패 시 영문으로 대체
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(options.fontSize || 12);
    doc.text('[Korean text - encoding issue]', x, y);
    
    return y + 15;
  }
};

/**
 * 차트 섹션 타이틀을 영문과 한글로 추가
 */
const addChartSectionTitle = async (doc, englishTitle, koreanTitle, yPos) => {
  console.log(`🏷️ 섹션 타이틀 추가: ${englishTitle} / ${koreanTitle}`);
  
  // 페이지 넘김 체크
  if (yPos > 240) {
    doc.addPage();
    yPos = 30;
  }
  
  // 영문 타이틀
  doc.setTextColor(255, 153, 0); // AWS Orange
  doc.setFontSize(14);
  doc.text(englishTitle, 20, yPos);
  console.log(`✅ 영문 타이틀 추가 완료: ${englishTitle}`);
  
  // 한글 타이틀 (이미지로 변환)
  if (koreanTitle) {
    console.log(`🇰🇷 한글 타이틀 이미지 변환 시작: ${koreanTitle}`);
    try {
      yPos = await addKoreanTextAsImage(doc, koreanTitle, 20, yPos + 5, {
        fontSize: 12,
        color: '#666666'
      });
      console.log(`✅ 한글 타이틀 이미지 변환 완료: ${koreanTitle}`);
    } catch (error) {
      console.error(`❌ 한글 타이틀 이미지 변환 실패: ${koreanTitle}`, error);
      // 실패 시 영문으로 대체
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.text(`[Korean: ${koreanTitle}]`, 20, yPos + 5);
      yPos += 15;
    }
  }
  
  return yPos + 10;
};

/**
 * Chart.js 동적 로드
 */
const loadChartJS = () => {
  return new Promise((resolve, reject) => {
    if (typeof window.Chart !== 'undefined') {
      resolve(window.Chart);
      return;
    }
    
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
    script.onload = () => {
      console.log('✅ Chart.js 로드 완료');
      resolve(window.Chart);
    };
    script.onerror = () => reject(new Error('Chart.js 로드 실패'));
    document.head.appendChild(script);
  });
};

/**
 * 차트를 PDF에 추가
 */
const addChartToDoc = async (doc, chartCanvas, yPos, title) => {
  try {
    // 차트 이미지 생성
    const imageData = chartCanvas.toDataURL('image/png');
    
    // 페이지 넘김 체크
    if (yPos > 200) {
      doc.addPage();
      yPos = 30;
    }
    
    // 차트 이미지 추가
    doc.addImage(imageData, 'PNG', 20, yPos, 170, 100);
    
    console.log(`✅ ${title} 차트 PDF 추가 완료`);
    
    return yPos + 110;
    
  } catch (error) {
    console.error(`❌ ${title} 차트 PDF 추가 실패:`, error);
    return yPos + 10;
  }
};

/**
 * 전체 통계 차트 생성
 */
const createSummaryChart = async (summaryData, Chart) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Page Views', 'Content Views', 'Unique Visitors'],
        datasets: [{
          label: 'Statistics',
          data: [
            summaryData.totalPageViews || 0,
            summaryData.totalContentViews || 0,
            summaryData.uniqueVisitors || 0
          ],
          backgroundColor: ['#FF9900', '#232F3E', '#92D050'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
    
    // 렌더링 완료 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ 전체 통계 차트 생성 완료');
    return canvas;
    
  } catch (error) {
    console.error('❌ 전체 통계 차트 생성 실패:', error);
    return null;
  }
};

/**
 * 접속 목적 차트 생성
 */
const createAccessPurposeChart = async (purposeData, Chart) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    const chart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: purposeData.map(item => item.purpose || item.label),
        datasets: [{
          data: purposeData.map(item => item.count || item.value),
          backgroundColor: ['#FF9900', '#232F3E', '#92D050', '#FFC000'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 12 } }
          }
        }
      }
    });
    
    // 렌더링 완료 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ 접속 목적 차트 생성 완료');
    return canvas;
    
  } catch (error) {
    console.error('❌ 접속 목적 차트 생성 실패:', error);
    return null;
  }
};

/**
 * 콘텐츠 분석 차트 생성
 */
const createContentChart = async (contentData, Chart) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    const topContent = contentData.slice(0, 5); // 상위 5개만
    
    const chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topContent.map(item => (item.title || item.name || 'Unknown').substring(0, 20) + '...'),
        datasets: [{
          label: 'Views',
          data: topContent.map(item => item.views || item.count || 0),
          backgroundColor: '#FF9900',
          borderColor: '#232F3E',
          borderWidth: 1
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true },
          x: {
            ticks: {
              maxRotation: 45,
              font: { size: 10 }
            }
          }
        }
      }
    });
    
    // 렌더링 완료 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ 콘텐츠 분석 차트 생성 완료');
    return canvas;
    
  } catch (error) {
    console.error('❌ 콘텐츠 분석 차트 생성 실패:', error);
    return null;
  }
};

/**
 * 카테고리 분석 차트 생성
 */
const createCategoryChart = async (categoryData, Chart) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    const chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categoryData.map(item => item.category || item.name),
        datasets: [{
          data: categoryData.map(item => item.count || item.value),
          backgroundColor: ['#FF9900', '#232F3E', '#92D050', '#FFC000', '#E88B00'],
          borderColor: '#ffffff',
          borderWidth: 2
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 12 } }
          }
        }
      }
    });
    
    // 렌더링 완료 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ 카테고리 분석 차트 생성 완료');
    return canvas;
    
  } catch (error) {
    console.error('❌ 카테고리 분석 차트 생성 실패:', error);
    return null;
  }
};

/**
 * 시간별 분석 차트 생성
 */
const createTimeChart = async (timeData, Chart) => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    
    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: timeData.map(item => item.date || item.time),
        datasets: [{
          label: 'Daily Views',
          data: timeData.map(item => item.views || item.count),
          borderColor: '#FF9900',
          backgroundColor: 'rgba(255, 153, 0, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: false,
        animation: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true },
          x: {
            ticks: {
              maxRotation: 45,
              font: { size: 10 }
            }
          }
        }
      }
    });
    
    // 렌더링 완료 대기
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ 시간별 분석 차트 생성 완료');
    return canvas;
    
  } catch (error) {
    console.error('❌ 시간별 분석 차트 생성 실패:', error);
    return null;
  }
};

/**
 * AI 기반 콘텐츠 분석 리포트 생성
 */
export const generateAIContentReport = async (contentData) => {
  try {
    console.log('📄 AI 콘텐츠 리포트 생성 시작...');
    
    const analysis = await generateContentAnalysis(contentData);
    const doc = new jsPDF(PDF_CONFIG.orientation, PDF_CONFIG.unit, PDF_CONFIG.format);
    
    let yPos = await addEnglishHeader(doc, 'AWS Demo Factory Content Analysis Report');
    
    yPos = await addEnglishSectionTitle(doc, '📄 Content Analysis', yPos);
    yPos = await addKoreanTextAsImage(doc, analysis.summary, 20, yPos, {
      fontSize: 10,
      maxWidth: 170
    });
    
    const fileName = `AWS_Demo_Factory_Content_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.pdf`;
    doc.save(fileName);
    
    return {
      success: true,
      fileName: fileName,
      message: 'AI 콘텐츠 분석 리포트가 성공적으로 생성되었습니다.'
    };
    
  } catch (error) {
    console.error('❌ AI 콘텐츠 리포트 생성 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * AI 기반 작성자 분석 리포트 생성
 */
export const generateAIAuthorReport = async (authorData) => {
  try {
    console.log('✍️ AI 작성자 리포트 생성 시작...');
    
    const analysis = await generateAuthorAnalysis(authorData);
    const doc = new jsPDF(PDF_CONFIG.orientation, PDF_CONFIG.unit, PDF_CONFIG.format);
    
    let yPos = await addEnglishHeader(doc, 'AWS Demo Factory Author Analysis Report');
    
    yPos = await addEnglishSectionTitle(doc, '✍️ Author Analysis', yPos);
    yPos = await addKoreanTextAsImage(doc, analysis.summary, 20, yPos, {
      fontSize: 10,
      maxWidth: 170
    });
    
    const fileName = `AWS_Demo_Factory_Author_Report_${new Date().toISOString().slice(0, 19).replace(/:/g, '')}.pdf`;
    doc.save(fileName);
    
    return {
      success: true,
      fileName: fileName,
      message: 'AI 작성자 분석 리포트가 성공적으로 생성되었습니다.'
    };
    
  } catch (error) {
    console.error('❌ AI 작성자 리포트 생성 실패:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * AI 인사이트를 섹션별로 분리하는 함수
 */
const extractInsightSections = (fullInsight) => {
  try {
    console.log('📋 AI 인사이트 섹션 분리 시작...');
    
    const sections = {
      overview: '',
      accessPurpose: '',
      content: '',
      category: '',
      time: '',
      recommendations: ''
    };
    
    // 전체 현황 요약 추출
    const overviewMatch = fullInsight.match(/## 📊 전체 현황 요약([\s\S]*?)(?=## |🔍|$)/i);
    if (overviewMatch) {
      sections.overview = overviewMatch[1].trim();
    }
    
    // 핵심 인사이트 중 사용자 관심 분야 분석 (접속 목적과 유사)
    const userInterestMatch = fullInsight.match(/### 1\. 사용자 관심 분야 심층 분석([\s\S]*?)(?=### 2\.|## |💡|$)/i);
    if (userInterestMatch) {
      sections.accessPurpose = userInterestMatch[1].trim();
    }
    
    // 콘텐츠 소비 패턴 분석
    const contentMatch = fullInsight.match(/### 2\. 콘텐츠 소비 패턴 분석([\s\S]*?)(?=### 3\.|## |💡|$)/i);
    if (contentMatch) {
      sections.content = contentMatch[1].trim();
    }
    
    // 시간대별 사용자 특성 (카테고리 대신 시간 분석으로 사용)
    const timeMatch = fullInsight.match(/### 3\. 시간대별 사용자 특성([\s\S]*?)(?=### 4\.|## |💡|$)/i);
    if (timeMatch) {
      sections.time = timeMatch[1].trim();
    }
    
    // 비즈니스 가치 창출 분석 (카테고리 분석으로 사용)
    const businessMatch = fullInsight.match(/### 4\. 비즈니스 가치 창출 분석([\s\S]*?)(?=## |💡|$)/i);
    if (businessMatch) {
      sections.category = businessMatch[1].trim();
    }
    
    // 전략적 권장사항 추출
    const recommendationsMatch = fullInsight.match(/## 💡 전략적 권장사항([\s\S]*?)(?=## 📊|🎯|$)/i);
    if (recommendationsMatch) {
      sections.recommendations = recommendationsMatch[1].trim();
    }
    
    console.log('✅ AI 인사이트 섹션 분리 완료');
    console.log('📋 분리된 섹션:', {
      overview: sections.overview ? '있음' : '없음',
      accessPurpose: sections.accessPurpose ? '있음' : '없음',
      content: sections.content ? '있음' : '없음',
      category: sections.category ? '있음' : '없음',
      time: sections.time ? '있음' : '없음',
      recommendations: sections.recommendations ? '있음' : '없음'
    });
    
    return sections;
    
  } catch (error) {
    console.error('❌ AI 인사이트 섹션 분리 실패:', error);
    // 오류 시 전체 인사이트를 overview에 넣어 fallback
    return {
      overview: fullInsight,
      accessPurpose: '',
      content: '',
      category: '',
      time: '',
      recommendations: ''
    };
  }
};

const aiPdfGenerator = {
  generateAIAnalyticsReport,
  generateChartOnlyReport,
  generateAIContentReport,
  generateAIAuthorReport
};

export default aiPdfGenerator;