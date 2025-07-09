// 한글-영어 매핑 (확장된 버전)
export const koreanToEnglish = {
  // 기본 용어
  '전체': 'Overall',
  '통계': 'Statistics', 
  '분석': 'Analysis',
  '리포트': 'Report',
  '생성': 'Generated',
  '오전': 'AM',
  '오후': 'PM',
  
  // 날짜/시간 관련 - 한글 제거
  '년': '',
  '월': '',
  '일': '',
  '시': '',
  '분': '',
  '. ': ' ',
  '..': '.',
  
  // 메트릭
  '총 방문자 수': 'Total Visitors',
  '총 페이지뷰': 'Total Page Views', 
  '총 콘텐츠 수': 'Total Contents',
  '활성 카테고리': 'Active Categories',
  '방문자': 'Visitors',
  '페이지뷰': 'Page Views',
  '콘텐츠': 'Contents',
  '카테고리': 'Categories',
  '지표': 'Metric',
  '값': 'Value',
  
  // 접속 목적
  '접속 목적 분석': 'Access Purpose Analysis',
  '접속 목적': 'Access Purpose',
  '목적': 'Purpose',
  '비율': 'Percentage',
  '주요 인사이트': 'Key Insights',
  '가장 일반적인 접속 목적': 'Most common access purpose',
  '분석된 총 방문자': 'Total visitors analyzed',
  
  // 콘텐츠 분석
  '콘텐츠 분석': 'Content Analysis',
  '콘텐츠 제목': 'Content Title',
  '조회수': 'Views',
  '인기 콘텐츠': 'Popular Content',
  '상위 콘텐츠': 'Top Content',
  '제목 없음': 'Untitled',
  '미분류': 'Uncategorized',
  
  // 카테고리
  '카테고리 분석': 'Category Analysis',
  '카테고리별': 'By Category',
  '분포': 'Distribution',
  
  // 시간 분석
  '시간대 분석': 'Time Analysis',
  '시간대': 'Time',
  '일별': 'Daily',
  '시간별': 'Hourly',
  '트렌드': 'Trends',
  '패턴': 'Pattern',
  '날짜': 'Date',
  '시간': 'Hour',
  '최근 7일': 'Last 7 Days',
  '일별 트렌드': 'Daily Trends',
  '시간별 분포': 'Hourly Distribution',
  
  // 카테고리명
  '제조업': 'Manufacturing',
  '금융': 'Finance', 
  '소매': 'Retail',
  '소매/CPG': 'Retail/CPG',
  '통신': 'Telecom',
  '미디어': 'Media',
  '통신/미디어': 'Telecom/Media',
  'Amazon Q Dev': 'Amazon Q Dev',
  '기타': 'Others',
  '알 수 없음': 'Unknown',
  
  // 접속 목적 값들
  'AWS Internal': 'AWS Internal',
  '고객사 데모 제공': 'Customer Demo',
  '서비스 도입 문의': 'Service Inquiry',
  '아키텍처 문의': 'Architecture Inquiry',
  '데모 관련 문의': 'Demo Inquiry',
  '비용 문의': 'Cost Inquiry',
  
  // 차트 관련
  '차트': 'Chart',
  '개요': 'Overview',
  '요약': 'Summary',
  '페이지': 'Page',
  '통계 개요 차트': 'Statistics Overview Chart',
  '접속 목적 분포': 'Access Purpose Distribution',
  '상위 콘텐츠 조회수 차트': 'Top Content Views Chart',
  '카테고리 분포 차트': 'Category Distribution Chart',
  '일별 방문자 트렌드': 'Daily Visitors Trend',
  '시간별 조회수 분포': 'Hourly Views Distribution',
  
  // 기타 공통 용어
  '없음': 'None',
  '데이터': 'Data',
  '정보': 'Information',
  '결과': 'Result',
  '총계': 'Total',
  '합계': 'Sum',
  '평균': 'Average',
  '최대': 'Maximum',
  '최소': 'Minimum'
};

// 한글 텍스트를 영어로 변환
export const translateKoreanText = (text) => {
  if (!text) return '';
  
  let translatedText = text.toString();
  
  // 정확한 매칭부터 시도 (긴 문구부터)
  const sortedKeys = Object.keys(koreanToEnglish).sort((a, b) => b.length - a.length);
  
  sortedKeys.forEach(korean => {
    if (translatedText.includes(korean)) {
      translatedText = translatedText.replace(new RegExp(korean, 'g'), koreanToEnglish[korean]);
    }
  });
  
  // 남은 한글 문자들을 제거
  translatedText = translatedText.replace(/[가-힣]/g, '');
  
  // 연속된 공백 제거
  translatedText = translatedText.replace(/\s+/g, ' ').trim();
  
  // 특수 문자 정리
  translatedText = translatedText.replace(/[\.]{2,}/g, '.');
  translatedText = translatedText.replace(/\s*:\s*/g, ': ');
  translatedText = translatedText.replace(/\s*,\s*/g, ', ');
  
  // 한국어 날짜 형식 정리 (2025. 06. 17. 오후 11:27 -> 06/17/2025 11:27 PM)
  translatedText = translatedText.replace(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2})/, '$2/$3/$1 $4:$5');
  
  return translatedText;
};

// 숫자와 기본 영어는 그대로 유지하는 안전한 변환
export const safeTranslate = (text) => {
  if (!text) return '';
  
  const textStr = text.toString();
  
  // 숫자만 있는 경우 그대로 반환
  if (/^\d+$/.test(textStr)) {
    return textStr;
  }
  
  // 영어만 있는 경우 그대로 반환
  if (/^[a-zA-Z0-9\s\-_.,!@#$%^&*()\/]+$/.test(textStr)) {
    return textStr;
  }
  
  // 한글이 포함된 경우 번역
  return translateKoreanText(textStr);
};
