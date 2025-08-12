// 차트를 이미지로 변환하는 유틸리티
import html2canvas from 'html2canvas';

// Chart.js 동적 로드 함수
const loadChartJS = async () => {
  // 이미 로드되어 있는지 확인
  if (typeof window.Chart !== 'undefined') {
    return window.Chart;
  }
  
  // CDN에서 Chart.js 로드
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js';
    script.onload = () => {
      console.log('✅ Chart.js 동적 로드 완료');
      resolve(window.Chart);
    };
    script.onerror = () => reject(new Error('Chart.js 로드 실패'));
    document.head.appendChild(script);
  });
};

// SVG를 Canvas로 변환하는 함수
const svgToCanvas = async (svgElement) => {
  return new Promise((resolve, reject) => {
    try {
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // SVG 크기 설정
      const svgRect = svgElement.getBoundingClientRect();
      canvas.width = svgRect.width * 2; // 고해상도
      canvas.height = svgRect.height * 2;
      
      img.onload = () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/png'));
      };
      
      img.onerror = reject;
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
};

// 차트 요소를 찾고 이미지로 변환
export const captureChartAsImage = async (chartId) => {
  console.log(`🎯 Attempting to capture chart: ${chartId}`);
  
  const chartContainer = document.getElementById(chartId);
  if (!chartContainer) {
    console.warn(`❌ Chart container not found: ${chartId}`);
    return null;
  }
  
  // 차트가 렌더링될 때까지 대기
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    // 방법 1: SVG 직접 캡처 시도
    const svgElement = chartContainer.querySelector('svg');
    if (svgElement) {
      console.log(`📊 Found SVG element for ${chartId}, attempting direct capture`);
      try {
        const imageData = await svgToCanvas(svgElement);
        console.log(`✅ SVG capture successful for ${chartId}`);
        return imageData;
      } catch (svgError) {
        console.warn(`⚠️ SVG capture failed for ${chartId}:`, svgError);
      }
    }
    
    // 방법 2: html2canvas 시도 (개선된 설정)
    console.log(`🔄 Trying html2canvas for ${chartId}`);
    const canvas = await html2canvas(chartContainer, {
      backgroundColor: '#ffffff',
      scale: 2,
      logging: false,
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: true,
      removeContainer: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // 클론된 문서에서 스타일 강제 적용
        const clonedSvgs = clonedDoc.querySelectorAll('svg');
        clonedSvgs.forEach(svg => {
          svg.style.backgroundColor = 'white';
          svg.style.fontFamily = 'Arial, sans-serif';
          svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        });
      }
    });
    
    console.log(`✅ html2canvas capture successful for ${chartId}`);
    return canvas.toDataURL('image/png');
    
  } catch (error) {
    console.error(`❌ All capture methods failed for ${chartId}:`, error);
    return null;
  }
};

// Chart.js를 사용한 고품질 차트 생성 (동적 로드 버전)
export const createChartJSImage = async (data, type = 'bar', width = 600, height = 400) => {
  if (!data || data.length === 0) {
    return createSimpleChart([], type, width, height);
  }

  try {
    // Chart.js 동적 로드
    const ChartJS = await loadChartJS();
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const colorPalette = [
      '#FF9900', // AWS Orange
      '#232F3E', // AWS Dark Blue
      '#92D050', // Green
      '#FFC000', // Yellow
      '#4472C4', // Blue
      '#E74C3C', // Red
      '#9B59B6', // Purple
      '#1ABC9C', // Teal
      '#F39C12', // Orange
      '#34495E'  // Dark Blue Gray
    ];

    let chartConfig;

    if (type === 'bar') {
      chartConfig = {
        type: 'bar',
        data: {
          labels: data.map(item => item.label || item.name || 'Unknown'),
          datasets: [{
            label: 'Values',
            data: data.map(item => item.value || 0),
            backgroundColor: colorPalette[0],
            borderColor: colorPalette[1],
            borderWidth: 1
          }]
        },
        options: {
          responsive: false,
          animation: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grid: {
                color: '#E5E5E5'
              },
              ticks: {
                font: { size: 12 }
              }
            },
            x: {
              grid: {
                display: false
              },
              ticks: {
                font: { size: 10 },
                maxRotation: 45
              }
            }
          }
        }
      };
    } else if (type === 'pie') {
      chartConfig = {
        type: 'pie',
        data: {
          labels: data.map(item => item.label || item.name || item.purpose || 'Unknown'),
          datasets: [{
            data: data.map(item => item.value || item.count || 0),
            backgroundColor: colorPalette.slice(0, data.length),
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
    }

    const chart = new ChartJS(ctx, chartConfig);
    
    // 차트 렌더링 완료 대기
    await new Promise(resolve => {
      chart.update('none');
      setTimeout(resolve, 1000);
    });
    
    const imageData = canvas.toDataURL('image/png');
    chart.destroy(); // 메모리 정리
    
    console.log(`✅ Chart.js chart created successfully (${type})`);
    return imageData;
    
  } catch (error) {
    console.error(`❌ Chart.js creation failed:`, error);
    return createSimpleChart(data, type, width, height);
  }
};

// 기존 간단한 차트 생성 함수 (백업용)
export const createSimpleChart = (data, type = 'bar', width = 400, height = 300) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  // 배경 설정
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);
  
  if (!data || data.length === 0) {
    ctx.fillStyle = '#666666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('No data available', width / 2, height / 2);
    return canvas.toDataURL('image/png');
  }
  
  const margin = 40;
  const chartWidth = width - (margin * 2);
  const chartHeight = height - (margin * 2);
  
  if (type === 'bar') {
    const maxValue = Math.max(...data.map(item => item.value || 0));
    if (maxValue === 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data to display', width / 2, height / 2);
      return canvas.toDataURL('image/png');
    }
    
    const barWidth = chartWidth / data.length;
    
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * chartHeight;
      const x = margin + (index * barWidth);
      const y = margin + chartHeight - barHeight;
      
      // 막대 그리기
      ctx.fillStyle = '#FF9900'; // AWS Orange
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
      
      // 값 표시
      ctx.fillStyle = '#000000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.value.toString(), x + barWidth / 2, y - 5);
      
      // 라벨 표시
      ctx.save();
      ctx.translate(x + barWidth / 2, height - 10);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = 'right';
      const label = item.label || item.name || `Item ${index + 1}`;
      ctx.fillText(label.length > 10 ? label.substring(0, 10) + '...' : label, 0, 0);
      ctx.restore();
    });
  } else if (type === 'pie') {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(chartWidth, chartHeight) / 3;
    
    const total = data.reduce((sum, item) => sum + (item.value || item.count || 0), 0);
    if (total === 0) {
      ctx.fillStyle = '#666666';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('No data to display', width / 2, height / 2);
      return canvas.toDataURL('image/png');
    }
    
    let currentAngle = 0;
    const colors = ['#FF9900', '#232F3E', '#92D050', '#FFC000', '#4472C4'];
    
    data.forEach((item, index) => {
      const value = item.value || item.count || 0;
      const sliceAngle = (value / total) * 2 * Math.PI;
      
      // 파이 조각 그리기
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // 라벨 표시
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelX = centerX + Math.cos(labelAngle) * (radius + 30);
      const labelY = centerY + Math.sin(labelAngle) * (radius + 30);
      
      ctx.fillStyle = '#000000';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const label = item.label || item.name || item.purpose || 'Unknown';
      const percentage = Math.round((value / total) * 100);
      ctx.fillText(`${label}: ${percentage}%`, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
  }
  
  return canvas.toDataURL('image/png');
};