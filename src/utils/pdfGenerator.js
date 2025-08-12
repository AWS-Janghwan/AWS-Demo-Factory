import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { safeTranslate } from './koreanFont';
import { captureChartAsImage, createChartJSImage, createSimpleChart } from './chartToImage';

// 안전한 텍스트 처리 (한글 -> 영어 변환)
const safeText = (text) => {
  if (!text) return '';
  return safeTranslate(text.toString());
};

// 현재 날짜/시간 포맷팅 (영어)
const formatDateTime = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Seoul'
  });
};

// 이전 차트 캡처 함수들은 chartToImage.js로 이동됨

// 간단한 차트 그리기 함수 (백업용)
const drawSimpleChart = (doc, data, x, y, width, height, type = 'bar') => {
  if (!data || data.length === 0) return;

  const maxValue = Math.max(...data.map(item => item.value || 0));
  if (maxValue === 0) return;
  
  const barWidth = width / data.length;
  
  // 차트 배경
  doc.setFillColor(248, 249, 250);
  doc.rect(x, y, width, height, 'F');
  
  // 차트 테두리
  doc.setDrawColor(200, 200, 200);
  doc.rect(x, y, width, height);

  if (type === 'bar') {
    // 막대 차트
    data.forEach((item, index) => {
      const barHeight = (item.value / maxValue) * (height - 20);
      const barX = x + (index * barWidth) + (barWidth * 0.1);
      const barY = y + height - barHeight - 10;
      
      // 막대 그리기
      doc.setFillColor(255, 153, 0); // AWS Orange
      doc.rect(barX, barY, barWidth * 0.8, barHeight, 'F');
      
      // 값 표시
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      const textX = barX + (barWidth * 0.4);
      doc.text(item.value.toString(), textX, barY - 2, { align: 'center' });
    });
  } else if (type === 'pie') {
    // 파이 차트 (간단한 원형)
    const centerX = x + width / 2;
    const centerY = y + height / 2;
    const radius = Math.min(width, height) / 3;
    
    let currentAngle = 0;
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    
    if (total > 0) {
      data.forEach((item, index) => {
        const sliceAngle = (item.value / total) * 2 * Math.PI;
        
        // 색상 설정
        const colors = [
          [255, 153, 0],   // AWS Orange
          [35, 47, 62],    // AWS Dark Blue
          [146, 208, 80],  // Green
          [255, 192, 0],   // Yellow
          [68, 114, 196]   // Blue
        ];
        const color = colors[index % colors.length];
        doc.setFillColor(color[0], color[1], color[2]);
        
        // 원호 그리기
        const steps = Math.max(10, Math.floor(sliceAngle * 10));
        const stepAngle = sliceAngle / steps;
        
        for (let i = 0; i < steps; i++) {
          const angle1 = currentAngle + (i * stepAngle);
          const angle2 = currentAngle + ((i + 1) * stepAngle);
          
          const x1 = centerX + Math.cos(angle1) * radius;
          const y1 = centerY + Math.sin(angle1) * radius;
          const x2 = centerX + Math.cos(angle2) * radius;
          const y2 = centerY + Math.sin(angle2) * radius;
          
          // 삼각형으로 파이 조각 근사
          doc.setDrawColor(color[0], color[1], color[2]);
          doc.line(centerX, centerY, x1, y1);
          doc.line(x1, y1, x2, y2);
        }
        
        currentAngle += sliceAngle;
      });
    }
  }
};

// 텍스트 줄바꿈 처리
const splitTextToSize = (doc, text, maxWidth) => {
  const safeTextValue = safeText(text);
  return doc.splitTextToSize(safeTextValue, maxWidth);
};

// 메인 PDF 생성 함수
export const generateAnalyticsReport = async (analyticsData) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // 새 페이지 체크 및 추가
    const checkNewPage = (requiredHeight = 30) => {
      if (yPosition + requiredHeight > pageHeight - margin) {
        doc.addPage();
        yPosition = 20;
        addHeader();
      }
    };

    // 헤더 추가
    const addHeader = () => {
      doc.setFontSize(20);
      doc.setTextColor(255, 153, 0); // AWS Orange
      doc.text('AWS Demo Factory', margin, yPosition);
      
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      yPosition += 10;
      doc.text('Analytics Report', margin, yPosition);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      yPosition += 8;
      doc.text(`Generated: ${formatDateTime()}`, margin, yPosition);
      
      // 구분선
      yPosition += 5;
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 15;
    };

    // 섹션 제목 추가
    const addSectionTitle = (title) => {
      checkNewPage(20);
      doc.setFontSize(14);
      doc.setTextColor(35, 47, 62); // AWS Dark Blue
      doc.text(safeText(title), margin, yPosition);
      yPosition += 10;
    };

    // 개선된 테이블 그리기
    const drawTable = (headers, rows, startY) => {
      const cellHeight = 8;
      const cellWidth = contentWidth / headers.length;
      let currentY = startY;

      // 헤더 그리기
      doc.setFillColor(255, 153, 0); // AWS Orange
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.rect(margin, currentY, contentWidth, cellHeight, 'F');
      
      headers.forEach((header, index) => {
        doc.text(safeText(header), margin + (index * cellWidth) + 2, currentY + 6);
      });
      
      currentY += cellHeight;

      // 데이터 행 그리기
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      
      rows.forEach((row, rowIndex) => {
        // 배경색 교대로 적용
        if (rowIndex % 2 === 0) {
          doc.setFillColor(248, 249, 250);
          doc.rect(margin, currentY, contentWidth, cellHeight, 'F');
        }
        
        row.forEach((cell, cellIndex) => {
          const cellText = safeText(cell?.toString() || '');
          const lines = splitTextToSize(doc, cellText, cellWidth - 4);
          doc.text(lines[0] || '', margin + (cellIndex * cellWidth) + 2, currentY + 6);
        });
        
        currentY += cellHeight;
      });

      return currentY + 5;
    };

    // 차트 이미지 추가 함수 (개선된 버전 - Chart.js 우선)
    const addChartImage = async (chartId, title, fallbackData, chartType = 'bar') => {
      checkNewPage(90);
      
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(safeText(title), margin, yPosition);
      yPosition += 10;
      
      console.log(`📈 Adding chart: ${title} (ID: ${chartId})`);
      
      // 전략 변경: Chart.js를 먼저 시도 (더 안정적)
      try {
        console.log(`🎨 Using Chart.js-based chart for: ${chartId}`);
        const chartJSImage = await createChartJSImage(fallbackData, chartType, 600, 400);
        doc.addImage(chartJSImage, 'PNG', margin, yPosition, contentWidth, 60);
        yPosition += 70;
        console.log(`✅ Chart.js chart added successfully: ${chartId}`);
      } catch (chartJSError) {
        console.warn(`⚠️ Chart.js failed for ${chartId}, trying DOM capture:`, chartJSError);
        
        // Chart.js 실패 시 DOM 차트 캡처 시도
        const chartImage = await captureChartAsImage(chartId);
        
        if (chartImage) {
          try {
            doc.addImage(chartImage, 'PNG', margin, yPosition, contentWidth, 70);
            yPosition += 80;
            console.log(`✅ DOM chart captured successfully: ${chartId}`);
          } catch (error) {
            console.warn(`⚠️ DOM chart failed, using simple chart:`, error);
            const canvasChart = createSimpleChart(fallbackData, chartType, 600, 400);
            doc.addImage(canvasChart, 'PNG', margin, yPosition, contentWidth, 60);
            yPosition += 70;
          }
        } else {
          // 모든 방법 실패 시 간단한 차트 사용
          console.log(`🎨 Using fallback simple chart for: ${chartId}`);
          const canvasChart = createSimpleChart(fallbackData, chartType, 600, 400);
          doc.addImage(canvasChart, 'PNG', margin, yPosition, contentWidth, 60);
          yPosition += 70;
        }
      }
      
      // 차트 아래 여백 추가
      yPosition += 10;
    };

    // PDF 생성 시작
    addHeader();

    // 1. Overall Statistics + Chart
    if (analyticsData.summary) {
      addSectionTitle('📊 Overall Statistics');
      
      const statsData = [
        ['Total Visitors', (analyticsData.summary.totalVisitors || 0).toLocaleString()],
        ['Total Page Views', (analyticsData.summary.totalPageViews || 0).toLocaleString()],
        ['Total Contents', (analyticsData.summary.totalContents || 0).toLocaleString()],
        ['Active Categories', (analyticsData.summary.totalCategories || 0).toLocaleString()]
      ];

      yPosition = drawTable(['Metric', 'Value'], statsData, yPosition);
      
      // Statistics chart - 실제 대시보드에서 사용하는 차트 ID 사용
      const chartData = [
        { label: 'Visitors', value: analyticsData.summary.totalVisitors || 0 },
        { label: 'Views', value: analyticsData.summary.totalPageViews || 0 },
        { label: 'Contents', value: analyticsData.summary.totalContents || 0 }
      ];
      
      await addChartImage('daily-trend-chart', 'Daily Trend Chart', chartData, 'bar');
    }

    // 2. Access Purpose Analysis + Pie Chart
    if (analyticsData.accessPurpose?.length > 0) {
      checkNewPage(80);
      addSectionTitle('🎯 Access Purpose Analysis');
      
      const purposeData = analyticsData.accessPurpose.map(item => [
        safeText(item.purpose || 'Unknown'),
        item.count?.toString() || '0',
        `${item.percentage || 0}%`
      ]);

      yPosition = drawTable(['Purpose', 'Visitors', 'Percentage'], purposeData, yPosition);
      
      // Pie chart - 실제 대시보드에서 사용하는 차트 ID 사용
      const pieData = analyticsData.accessPurpose.map(item => ({
        label: item.purpose,
        value: item.count || 0
      }));
      
      await addChartImage('access-purpose-pie-chart', 'Access Purpose Distribution', pieData, 'pie');
      
      // Key insights
      if (analyticsData.accessPurpose.length > 0) {
        yPosition += 5;
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Key Insights:', margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        const topPurpose = analyticsData.accessPurpose[0];
        doc.text(`• Most common access purpose: ${safeText(topPurpose.purpose)} (${topPurpose.percentage}%)`, margin + 5, yPosition);
        yPosition += 6;
        doc.text(`• Total visitors analyzed: ${analyticsData.accessPurpose.reduce((sum, item) => sum + (item.count || 0), 0)}`, margin + 5, yPosition);
        yPosition += 15;
      }
    }

    // 3. Content Analysis + Chart
    if (analyticsData.content?.length > 0) {
      checkNewPage(80);
      addSectionTitle('📄 Content Analysis');
      
      const topContent = analyticsData.content.slice(0, 10).map(item => [
        safeText(item.title || 'Untitled'),
        safeText(item.category || 'Uncategorized'),
        (item.views || 0).toString()
      ]);

      yPosition = drawTable(['Content Title', 'Category', 'Views'], topContent, yPosition);
      
      // Content views chart
      const contentChartData = analyticsData.content.slice(0, 5).map(item => ({
        label: item.title,
        value: item.views || 0
      }));
      
      await addChartImage('content-bar-chart', 'Top Content Views Chart', contentChartData, 'bar');
    }

    // 4. Category Analysis + Bar Chart
    if (analyticsData.category?.length > 0) {
      checkNewPage(80);
      addSectionTitle('📂 Category Analysis');
      
      const categoryStats = analyticsData.category.map(item => [
        safeText(item.name || item.category || 'Unknown'),
        (item.totalViews || item.views || 0).toString(),
        (item.contentCount || 0).toString(),
        (item.avgViews || 0).toString()
      ]);

      yPosition = drawTable(['Category', 'Total Views', 'Contents', 'Avg Views'], categoryStats, yPosition);
      
      // Category bar chart - 실제 대시보드에서 사용하는 차트 ID 사용
      const categoryChartData = analyticsData.category.map(item => ({
        label: item.name || item.category,
        value: item.totalViews || item.views || 0
      }));
      
      await addChartImage('category-bar-chart', 'Category Views Distribution Chart', categoryChartData, 'bar');
    }

    // 5. Time Analysis + Charts
    if (analyticsData.time?.length > 0 || analyticsData.hourly?.length > 0) {
      checkNewPage(100);
      addSectionTitle('🕐 Time Analysis');

      // Daily trends
      if (analyticsData.time?.length > 0) {
        doc.setFontSize(12);
        doc.text('Daily Trends (Last 7 Days):', margin, yPosition);
        yPosition += 8;

        const dailyStats = analyticsData.time.slice(-7).map(item => [
          item.date || '',
          (item.visitors || 0).toString(),
          (item.pageViews || 0).toString()
        ]);

        yPosition = drawTable(['Date', 'Visitors', 'Page Views'], dailyStats, yPosition);
        
        // Daily trend chart - 실제 대시보드에서 사용하는 차트 ID 사용
        const dailyChartData = analyticsData.time.slice(-7).map(item => ({
          label: item.date,
          value: item.visitors || 0
        }));
        
        await addChartImage('daily-visitors-chart', 'Daily Visitors Trend', dailyChartData, 'bar');
      }

      // Hourly analysis
      if (analyticsData.hourly?.length > 0) {
        checkNewPage(80);
        doc.setFontSize(12);
        doc.text('Hourly Distribution:', margin, yPosition);
        yPosition += 8;

        const hourlyStats = analyticsData.hourly.slice(0, 12).map(item => [
          `${item.hour || 0}:00`,
          (item.views || 0).toString()
        ]);

        yPosition = drawTable(['Hour', 'Views'], hourlyStats, yPosition);
        
        // Hourly chart
        const hourlyChartData = analyticsData.hourly.slice(0, 12).map(item => ({
          label: `${item.hour}:00`,
          value: item.views || 0
        }));
        
        await addChartImage('hourly-chart', 'Hourly Views Distribution', hourlyChartData, 'bar');
      }
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `AWS Demo Factory Analytics Report - Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );
    }

    // PDF download
    const fileName = `AWS_Demo_Factory_Analytics_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};

// Simple summary report generation
export const generateSummaryReport = async (summary) => {
  try {
    const doc = new jsPDF('p', 'mm', 'a4');

    const margin = 20;
    let yPosition = 30;

    // Title
    doc.setFontSize(18);
    doc.setTextColor(255, 153, 0);
    doc.text('AWS Demo Factory - Summary Report', margin, yPosition);

    yPosition += 20;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);

    // Summary statistics
    const stats = [
      `Total Visitors: ${(summary.totalVisitors || 0).toLocaleString()}`,
      `Total Page Views: ${(summary.totalPageViews || 0).toLocaleString()}`,
      `Total Contents: ${(summary.totalContents || 0).toLocaleString()}`,
      `Active Categories: ${(summary.totalCategories || 0).toLocaleString()}`,
      `Report Generated: ${formatDateTime()}`
    ];

    stats.forEach(stat => {
      doc.text(safeText(stat), margin, yPosition);
      yPosition += 8;
    });

    // Summary chart
    const summaryChartData = [
      { label: 'Visitors', value: summary.totalVisitors || 0 },
      { label: 'Views', value: summary.totalPageViews || 0 },
      { label: 'Contents', value: summary.totalContents || 0 }
    ];
    
    yPosition += 10;
    doc.setFontSize(14);
    doc.text('Summary Chart', margin, yPosition);
    yPosition += 10;
    
    drawSimpleChart(doc, summaryChartData, margin, yPosition, 170, 50, 'bar');

    const fileName = `AWS_Demo_Factory_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);

    return { success: true, fileName };
  } catch (error) {
    console.error('PDF generation error:', error);
    return { success: false, error: error.message };
  }
};
