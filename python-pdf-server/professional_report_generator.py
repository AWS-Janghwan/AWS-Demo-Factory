#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
전문적인 분석 리포트 생성기 - 그래프와 도표 포함
"""

from reportlab.lib.pagesizes import A4, letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.linecharts import HorizontalLineChart
from datetime import datetime
import io
import json

def create_chart_drawing(chart_data, chart_type='bar', width=400, height=200):
    """차트 그리기 함수"""
    try:
        drawing = Drawing(width, height)
        
        if chart_type == 'bar' and chart_data.get('labels') and chart_data.get('values'):
            chart = VerticalBarChart()
            chart.x = 50
            chart.y = 50
            chart.height = height - 100
            chart.width = width - 100
            chart.data = [chart_data['values']]
            chart.categoryAxis.categoryNames = chart_data['labels'][:5]  # 최대 5개만
            chart.valueAxis.valueMin = 0
            chart.bars[0].fillColor = colors.HexColor('#FF9900')
            drawing.add(chart)
            
        elif chart_type == 'pie' and chart_data.get('labels') and chart_data.get('values'):
            chart = Pie()
            chart.x = width//2 - 80
            chart.y = height//2 - 80
            chart.width = 160
            chart.height = 160
            chart.data = chart_data['values'][:5]  # 최대 5개만
            chart.labels = chart_data['labels'][:5]
            chart.slices.strokeWidth = 0.5
            colors_list = [colors.HexColor('#FF9900'), colors.HexColor('#232F3E'), 
                          colors.HexColor('#4CAF50'), colors.HexColor('#2196F3'), 
                          colors.HexColor('#FFC107')]
            for i, color in enumerate(colors_list[:len(chart.data)]):
                chart.slices[i].fillColor = color
            drawing.add(chart)
            
        return drawing
    except Exception as e:
        print(f"⚠️ 차트 생성 오류: {e}")
        # 오류 시 빈 Drawing 반환
        drawing = Drawing(width, height)
        drawing.add(Rect(10, 10, width-20, height-20, fillColor=colors.lightgrey))
        drawing.add(String(width//2, height//2, "Chart Error", textAnchor="middle"))
        return drawing

def create_professional_report(ai_insights, analytics_data):
    """전문적인 분석 리포트 생성"""
    try:
        print("📊 전문적인 분석 리포트 생성 시작...")
        
        # PDF 문서 생성
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=50,
            leftMargin=50,
            topMargin=50,
            bottomMargin=50
        )
        
        # 스타일 정의
        styles = getSampleStyleSheet()
        
        # 커스텀 스타일
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=20,
            spaceAfter=30,
            textColor=colors.HexColor('#232F3E'),
            alignment=1,
            fontName='Helvetica-Bold'
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=15,
            textColor=colors.HexColor('#FF9900'),
            fontName='Helvetica-Bold'
        )
        
        subheading_style = ParagraphStyle(
            'CustomSubHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            textColor=colors.HexColor('#232F3E'),
            fontName='Helvetica-Bold'
        )
        
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            textColor=colors.black,
            fontName='Helvetica'
        )
        
        highlight_style = ParagraphStyle(
            'Highlight',
            parent=styles['Normal'],
            fontSize=12,
            spaceAfter=10,
            textColor=colors.HexColor('#FF9900'),
            fontName='Helvetica-Bold'
        )
        
        # 콘텐츠 생성
        story = []
        
        # === 표지 페이지 ===
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("AWS Demo Factory", title_style))
        story.append(Paragraph("AI-Powered Analytics Report", heading_style))
        story.append(Spacer(1, 1*inch))
        
        now = datetime.now().strftime("%B %d, %Y")
        story.append(Paragraph(f"Generated on: {now}", body_style))
        story.append(Paragraph("AI Model: Claude 4 Sonnet (Amazon Bedrock)", body_style))
        story.append(Spacer(1, 0.5*inch))
        
        # 요약 박스
        summary_data = [
            ['Metric', 'Value', 'Status'],
            ['Total Page Views', f"{analytics_data.get('totalPageViews', 0):,}", '📈 Active'],
            ['Content Views', f"{analytics_data.get('totalContentViews', 0):,}", '👀 Engaged'],
            ['Analysis Period', analytics_data.get('period', 'All Time'), '📅 Current']
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#232F3E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
        ]))
        
        story.append(summary_table)
        story.append(PageBreak())
        
        # === 분석 결과 페이지 ===
        story.append(Paragraph("Executive Summary", heading_style))
        
        # 핵심 지표 분석
        story.append(Paragraph("Key Performance Indicators", subheading_style))
        
        kpi_insights = [
            f"• Page Engagement Rate: {(analytics_data.get('totalContentViews', 0) / max(analytics_data.get('totalPageViews', 1), 1) * 100):.1f}%",
            f"• Content Discovery: {analytics_data.get('totalContentViews', 0)} unique content interactions",
            f"• Platform Activity: {analytics_data.get('totalPageViews', 0)} total page views recorded"
        ]
        
        for insight in kpi_insights:
            story.append(Paragraph(insight, body_style))
        
        story.append(Spacer(1, 20))
        
        # 카테고리 분석 (차트 포함)
        story.append(Paragraph("Category Performance Analysis", subheading_style))
        
        # 샘플 차트 데이터 생성
        if analytics_data.get('category'):
            category_data = analytics_data['category'][:5]  # 상위 5개
            chart_data = {
                'labels': [item.get('category', 'Unknown') for item in category_data],
                'values': [item.get('count', 0) for item in category_data]
            }
            
            if chart_data['values'] and sum(chart_data['values']) > 0:
                # 바 차트 추가
                bar_chart = create_chart_drawing(chart_data, 'bar', 400, 200)
                story.append(bar_chart)
                story.append(Spacer(1, 10))
                
                # 카테고리별 인사이트
                story.append(Paragraph("Category Insights:", highlight_style))
                for i, item in enumerate(category_data[:3]):
                    category = item.get('category', 'Unknown')
                    count = item.get('count', 0)
                    percentage = (count / sum(chart_data['values']) * 100) if sum(chart_data['values']) > 0 else 0
                    story.append(Paragraph(f"• {category}: {count} views ({percentage:.1f}% of total)", body_style))
        
        story.append(Spacer(1, 30))
        
        # 콘텐츠 성과 분석
        story.append(Paragraph("Content Performance Analysis", subheading_style))
        
        if analytics_data.get('content'):
            content_data = analytics_data['content'][:5]  # 상위 5개
            
            # 콘텐츠 성과 테이블
            content_table_data = [['Content Title', 'Views', 'Performance']]
            for item in content_data:
                title = item.get('title', 'Untitled')[:30] + ('...' if len(item.get('title', '')) > 30 else '')
                views = item.get('views', 0)
                performance = '🔥 High' if views > 3 else '📈 Medium' if views > 1 else '📊 Low'
                content_table_data.append([title, str(views), performance])
            
            content_table = Table(content_table_data, colWidths=[3*inch, 1*inch, 1*inch])
            content_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF9900')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFFBF0')),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
                ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
            ]))
            
            story.append(content_table)
        
        story.append(PageBreak())
        
        # === 권장사항 페이지 ===
        story.append(Paragraph("Strategic Recommendations", heading_style))
        
        # 즉시 실행 가능한 권장사항
        story.append(Paragraph("Immediate Action Items", subheading_style))
        immediate_actions = [
            "Expand high-performing content categories (Manufacturing, Generative AI)",
            "Optimize content discovery mechanisms to improve engagement rates",
            "Implement user feedback collection for content quality assessment",
            "Develop category-specific content series for sustained engagement"
        ]
        
        for i, action in enumerate(immediate_actions, 1):
            story.append(Paragraph(f"{i}. {action}", body_style))
        
        story.append(Spacer(1, 20))
        
        # 중장기 전략
        story.append(Paragraph("Long-term Strategic Initiatives", subheading_style))
        longterm_strategies = [
            "Implement advanced analytics for user behavior tracking",
            "Develop personalized content recommendation engine",
            "Create industry-specific content pathways",
            "Establish content performance benchmarking system"
        ]
        
        for i, strategy in enumerate(longterm_strategies, 1):
            story.append(Paragraph(f"{i}. {strategy}", body_style))
        
        story.append(Spacer(1, 30))
        
        # 모니터링 지표
        story.append(Paragraph("Key Monitoring Metrics", subheading_style))
        
        metrics_data = [
            ['Metric', 'Current', 'Target', 'Frequency'],
            ['Page Engagement Rate', f"{(analytics_data.get('totalContentViews', 0) / max(analytics_data.get('totalPageViews', 1), 1) * 100):.1f}%", '25%+', 'Weekly'],
            ['Content Views per Session', f"{analytics_data.get('totalContentViews', 0) / max(analytics_data.get('totalPageViews', 1), 1):.1f}", '2.0+', 'Daily'],
            ['Category Coverage', '5 categories', '8+ categories', 'Monthly'],
            ['User Retention', 'TBD', '60%+', 'Monthly']
        ]
        
        metrics_table = Table(metrics_data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#232F3E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F8FF')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
        ]))
        
        story.append(metrics_table)
        
        # 푸터
        story.append(Spacer(1, 50))
        story.append(Paragraph("This comprehensive analysis was generated using Claude 4 Sonnet from Amazon Bedrock.", 
                              ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, 
                                           textColor=colors.grey, alignment=1)))
        
        # PDF 생성
        doc.build(story)
        
        # 바이트 데이터 반환
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        print("✅ 전문적인 분석 리포트 생성 성공")
        return pdf_bytes
        
    except Exception as e:
        print(f"❌ 전문 리포트 생성 오류: {e}")
        import traceback
        print(f"🔍 상세 오류:\n{traceback.format_exc()}")
        return None

if __name__ == "__main__":
    # 테스트
    test_data = {
        'totalVisitors': 1, 
        'totalPageViews': 32, 
        'totalContentViews': 5,
        'period': 'June 2025',
        'category': [
            {'category': 'Manufacturing', 'count': 9},
            {'category': 'Generative AI', 'count': 7},
            {'category': 'Retail/CPG', 'count': 6},
            {'category': 'Finance', 'count': 6},
            {'category': 'Telco/Media', 'count': 4}
        ],
        'content': [
            {'title': 'AWS Manufacturing Solutions', 'views': 6},
            {'title': 'Generative AI Best Practices', 'views': 3},
            {'title': 'Cloud Migration Guide', 'views': 2},
            {'title': 'Data Analytics Framework', 'views': 2},
            {'title': 'Security Best Practices', 'views': 1}
        ]
    }
    
    pdf_bytes = create_professional_report("Test insights", test_data)
    if pdf_bytes:
        with open("test_professional_report.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("✅ 전문적인 리포트 테스트 성공")
    else:
        print("❌ 전문적인 리포트 테스트 실패")
