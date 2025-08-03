// Python PDF 생성 서버 연동 유틸리티

const PYTHON_PDF_API_BASE_URL = (() => {
  const pdfUrl = process.env.REACT_APP_PDF_SERVER_URL;
  if (pdfUrl) {
    return pdfUrl;
  }
  // 배포 환경에서는 상대 경로 사용 (프록시 통해)
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5002';
})();

/**
 * Python PDF 서버 상태 확인
 */
export const checkPythonPdfServerStatus = async () => {
  try {
    // 배포 환경에서는 프록시 경로 사용
    const healthUrl = PYTHON_PDF_API_BASE_URL.includes('localhost') 
      ? `${PYTHON_PDF_API_BASE_URL}/health`
      : `${PYTHON_PDF_API_BASE_URL}/api/pdf/health`;
    const response = await fetch(healthUrl);
    const result = await response.json();
    return result.status === 'healthy';
  } catch (error) {
    console.error('❌ Python PDF 서버 연결 실패:', error);
    return false;
  }
};

/**
 * AI 기반 한글 PDF 리포트 생성
 * @param {string} aiInsights - AI가 생성한 한글 인사이트
 * @param {Object} analyticsData - 분석 데이터
 * @param {string} reportType - 리포트 타입 (full, content, author)
 * @returns {Promise<Object>} - 생성 결과
 */
export const generateKoreanPdfReport = async (aiInsights, analyticsData, reportType = 'full') => {
  try {
    console.log('📄 한글 PDF 리포트 생성 요청...');
    console.log('🤖 AI 인사이트 길이:', aiInsights.length);
    console.log('📊 분석 데이터:', Object.keys(analyticsData));
    
    const response = await fetch(`${PYTHON_PDF_API_BASE_URL}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        aiInsights,
        analyticsData,
        reportType
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'PDF 생성 실패');
    }

    console.log('✅ 한글 PDF 생성 성공');
    console.log('📄 파일명:', result.filename);
    console.log('📊 파일 크기:', (result.size / 1024).toFixed(2), 'KB');
    
    return result;
  } catch (error) {
    console.error('❌ 한글 PDF 생성 실패:', error);
    throw error;
  }
};

/**
 * Base64 PDF 데이터를 파일로 다운로드
 * @param {string} pdfBase64 - Base64 인코딩된 PDF 데이터
 * @param {string} filename - 파일명
 */
export const downloadPdfFromBase64 = (pdfBase64, filename) => {
  try {
    // Base64를 Blob으로 변환
    const byteCharacters = atob(pdfBase64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'application/pdf' });
    
    // 다운로드 링크 생성 및 클릭
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    
    // 정리
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    console.log('✅ PDF 다운로드 완료:', filename);
  } catch (error) {
    console.error('❌ PDF 다운로드 실패:', error);
    throw error;
  }
};

/**
 * 차트 데이터를 Python 서버 형식으로 변환 - 완전 수정
 * @param {Array} contentAnalytics - 콘텐츠 분석 데이터
 * @param {Array} authorAnalytics - 작성자 분석 데이터
 * @param {Object} categoryAnalytics - 카테고리 분석 데이터
 * @returns {Array} - 차트 데이터 배열
 */
export const prepareChartDataForPython = (contentAnalytics, authorAnalytics, categoryAnalytics) => {
  const chartData = [];
  
  try {
    console.log('📊 차트 데이터 준비 시작...');
    console.log('📋 입력 데이터:', { 
      contentCount: contentAnalytics?.length || 0, 
      authorCount: authorAnalytics?.length || 0, 
      categoryKeys: categoryAnalytics ? Object.keys(categoryAnalytics) : [],
      contentSample: contentAnalytics?.[0],
      authorSample: authorAnalytics?.[0],
      categorySample: categoryAnalytics
    });
    
    // 1. 콘텐츠 차트 - 실제 데이터 구조에 맞게 수정
    if (contentAnalytics && Array.isArray(contentAnalytics) && contentAnalytics.length > 0) {
      const validContent = contentAnalytics
        .filter(item => item && (item.title || item.name) && typeof (item.views || item.totalViews) === 'number')
        .slice(0, 10);
      
      if (validContent.length > 0) {
        chartData.push({
          type: 'bar',
          title: '상위 콘텐츠 조회수',
          data: {
            labels: validContent.map(item => {
              const title = item.title || item.name || '제목 없음';
              return title.length > 15 ? title.substring(0, 15) + '...' : title;
            }),
            values: validContent.map(item => item.views || item.totalViews || 0)
          }
        });
        console.log('✅ 콘텐츠 차트 준비 완료:', validContent.length, '개');
      }
    }
    
    // 2. 작성자 차트 - 실제 데이터 구조에 맞게 수정
    if (authorAnalytics && Array.isArray(authorAnalytics) && authorAnalytics.length > 0) {
      const validAuthors = authorAnalytics
        .filter(item => item && item.author && typeof (item.contentCount || item.count) === 'number')
        .slice(0, 10);
      
      if (validAuthors.length > 0) {
        chartData.push({
          type: 'bar',
          title: '작성자별 콘텐츠 수',
          data: {
            labels: validAuthors.map(item => item.author || '작성자 미상'),
            values: validAuthors.map(item => item.contentCount || item.count || 0)
          }
        });
        console.log('✅ 작성자 차트 준비 완료:', validAuthors.length, '개');
      }
    }
    
    // 3. 카테고리 차트 - 배열 형태로도 처리
    if (categoryAnalytics) {
      let categories = [];
      
      if (Array.isArray(categoryAnalytics)) {
        // 배열 형태인 경우
        categories = categoryAnalytics
          .filter(item => item && item.category && typeof item.count === 'number' && item.count > 0)
          .sort((a, b) => b.count - a.count);
        
        if (categories.length > 0) {
          chartData.push({
            type: 'pie',
            title: '카테고리별 분포',
            data: {
              labels: categories.map(item => item.category),
              values: categories.map(item => item.count)
            }
          });
          console.log('✅ 카테고리 차트 준비 완료 (배열):', categories.length, '개');
        }
      } else if (typeof categoryAnalytics === 'object') {
        // 객체 형태인 경우
        categories = Object.entries(categoryAnalytics)
          .filter(([key, value]) => key !== 'total' && typeof value === 'number' && value > 0)
          .sort(([,a], [,b]) => b - a);
        
        if (categories.length > 0) {
          chartData.push({
            type: 'pie',
            title: '카테고리별 분포',
            data: {
              labels: categories.map(([category]) => category),
              values: categories.map(([, count]) => count)
            }
          });
          console.log('✅ 카테고리 차트 준비 완료 (객체):', categories.length, '개');
        }
      }
    }
    
    // 4. 기본 차트 데이터 생성 (데이터가 없는 경우)
    if (chartData.length === 0) {
      console.log('⚠️ 유효한 차트 데이터가 없어 기본 차트를 생성합니다.');
      chartData.push({
        type: 'bar',
        title: '기본 데이터 현황',
        data: {
          labels: ['콘텐츠', '작성자', '카테고리'],
          values: [
            contentAnalytics?.length || 0,
            authorAnalytics?.length || 0,
            Array.isArray(categoryAnalytics) ? categoryAnalytics.length : Object.keys(categoryAnalytics || {}).length
          ]
        }
      });
      console.log('✅ 기본 차트 생성 완료');
    }
    
    console.log('📊 차트 데이터 준비 완료:', chartData.length, '개');
    console.log('📋 생성된 차트:', chartData.map(c => c.title));
    
    return chartData;
    
  } catch (error) {
    console.error('❌ 차트 데이터 준비 실패:', error);
    
    // 오류 시 최소한의 기본 차트 반환
    return [{
      type: 'bar',
      title: '기본 현황',
      data: {
        labels: ['데이터'],
        values: [1]
      }
    }];
  }
};

/**
 * 통합 AI 리포트 생성 및 다운로드
 * @param {Object} analyticsData - 전체 분석 데이터
 * @param {string} aiInsights - AI 인사이트
 * @returns {Promise<boolean>} - 성공 여부
 */
export const generateAndDownloadAIReport = async (analyticsData, aiInsights) => {
  try {
    // 차트 데이터 준비
    const chartData = prepareChartDataForPython(
      analyticsData.content,
      analyticsData.authors,
      analyticsData.category
    );
    
    // Python 서버용 데이터 구성
    const pythonData = {
      totalVisitors: analyticsData.summary?.totalVisitors || 0,
      totalPageViews: analyticsData.summary?.totalPageViews || 0,
      totalContentViews: analyticsData.summary?.totalContentViews || 0,
      period: '전체 기간',
      chartData: chartData
    };
    
    // PDF 생성
    const result = await generateKoreanPdfReport(aiInsights, pythonData, 'full');
    
    // 다운로드
    downloadPdfFromBase64(result.pdf_data, result.filename);
    
    return true;
  } catch (error) {
    console.error('❌ AI 리포트 생성 및 다운로드 실패:', error);
    throw error;
  }
};

export default {
  checkPythonPdfServerStatus,
  generateKoreanPdfReport,
  downloadPdfFromBase64,
  prepareChartDataForPython,
  generateAndDownloadAIReport
};
