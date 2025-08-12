// 브라우저 콘솔에서 Chart.js 직접 테스트
console.log('🧪 Chart.js 직접 테스트 시작...');

// 테스트 데이터
const testData = [
  { label: 'AWS Internal', value: 50 },
  { label: 'Customer Demo', value: 30 },
  { label: 'Other', value: 25 },
  { label: 'Skipped', value: 45 }
];

// Chart.js 테스트 함수
const testChartJS = async () => {
  try {
    // Chart.js 라이브러리 확인
    console.log('📚 Chart.js 라이브러리 확인...');
    
    // 동적으로 Chart.js import 시도
    let Chart;
    try {
      const chartModule = await import('https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js');
      Chart = chartModule.default || chartModule.Chart;
      console.log('✅ Chart.js CDN에서 로드 성공');
    } catch (importError) {
      console.log('⚠️ CDN 로드 실패, 로컬 Chart 객체 확인...');
      if (typeof window.Chart !== 'undefined') {
        Chart = window.Chart;
        console.log('✅ 로컬 Chart 객체 사용');
      } else {
        throw new Error('Chart.js를 찾을 수 없습니다');
      }
    }
    
    // Canvas 생성
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 400;
    canvas.id = 'test-chartjs-canvas';
    
    // 기존 테스트 캔버스 제거
    const existing = document.getElementById('test-chartjs-canvas');
    if (existing) existing.remove();
    
    // 페이지에 추가 (임시)
    canvas.style.position = 'fixed';
    canvas.style.top = '50px';
    canvas.style.right = '10px';
    canvas.style.zIndex = '9999';
    canvas.style.border = '2px solid blue';
    document.body.appendChild(canvas);
    
    const ctx = canvas.getContext('2d');
    
    // Chart.js 설정
    const config = {
      type: 'pie',
      data: {
        labels: testData.map(item => item.label),
        datasets: [{
          data: testData.map(item => item.value),
          backgroundColor: [
            '#FF9900', // AWS Orange
            '#232F3E', // AWS Dark Blue
            '#92D050', // Green
            '#FFC000'  // Yellow
          ],
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
            labels: {
              font: { size: 12 },
              padding: 10,
              usePointStyle: true
            }
          }
        }
      }
    };
    
    // 차트 생성
    console.log('📊 Chart.js 차트 생성 중...');
    const chart = new Chart(ctx, config);
    
    // 렌더링 완료 대기
    await new Promise(resolve => {
      chart.update('none');
      setTimeout(resolve, 1000);
    });
    
    // 이미지 데이터 추출
    const imageData = canvas.toDataURL('image/png');
    console.log('✅ Chart.js 차트 생성 성공!');
    console.log('📷 이미지 데이터 길이:', imageData.length);
    
    // 차트 정리
    chart.destroy();
    
    // 이미지로 교체
    const img = document.createElement('img');
    img.src = imageData;
    img.style.position = 'fixed';
    img.style.top = '50px';
    img.style.right = '10px';
    img.style.zIndex = '9999';
    img.style.border = '2px solid green';
    img.id = 'test-chartjs-image';
    
    // 기존 이미지 제거
    const existingImg = document.getElementById('test-chartjs-image');
    if (existingImg) existingImg.remove();
    
    canvas.remove();
    document.body.appendChild(img);
    
    console.log('✅ Chart.js 테스트 완료 - 우측 상단에 파이 차트가 표시됩니다.');
    
    // PDF 테스트
    console.log('📄 PDF 추가 테스트...');
    if (typeof window.jspdf !== 'undefined') {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();
      
      doc.setFontSize(16);
      doc.text('Chart.js Test PDF', 20, 20);
      
      try {
        doc.addImage(imageData, 'PNG', 20, 40, 160, 120);
        doc.save('chartjs-test.pdf');
        console.log('✅ Chart.js PDF 테스트 성공!');
      } catch (pdfError) {
        console.error('❌ PDF 추가 실패:', pdfError);
      }
    } else {
      console.log('⚠️ jsPDF를 찾을 수 없어 PDF 테스트를 건너뜁니다.');
    }
    
    return imageData;
    
  } catch (error) {
    console.error('❌ Chart.js 테스트 실패:', error);
    return null;
  }
};

// 테스트 실행
testChartJS().then(result => {
  if (result) {
    console.log('🎉 Chart.js 테스트 성공!');
  } else {
    console.log('💥 Chart.js 테스트 실패');
  }
});

console.log('🏁 Chart.js 테스트 스크립트 로드 완료');