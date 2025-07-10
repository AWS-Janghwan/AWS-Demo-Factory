#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
향상된 한글 분석 리포트 생성기 - 차트 포함 + 한글 지원
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.graphics.shapes import Drawing, Rect, String, Circle
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import io
import os

def register_korean_font():
    """안전한 한글 폰트 등록"""
    try:
        # macOS 시스템 폰트 시도
        font_paths = [
            '/System/Library/Fonts/Supplemental/AppleGothic.ttf',
            '/Library/Fonts/AppleGothic.ttf'
        ]
        
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    pdfmetrics.registerFont(TTFont('KoreanFont', font_path))
                    print(f"✅ 한글 폰트 등록 성공: {font_path}")
                    return 'KoreanFont'
                except Exception as e:
                    print(f"⚠️ 폰트 등록 실패: {e}")
                    continue
        
        print("⚠️ 한글 폰트를 찾을 수 없어 기본 폰트 사용")
        return 'Helvetica'
        
    except Exception as e:
        print(f"❌ 폰트 등록 오류: {e}")
        return 'Helvetica'

def create_simple_bar_chart(data, width=400, height=200):
    """간단한 바 차트 생성"""
    try:
        drawing = Drawing(width, height)
        
        if not data or not data.get('labels') or not data.get('values'):
            # 데이터가 없으면 빈 차트
            drawing.add(Rect(10, 10, width-20, height-20, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "차트 데이터 없음", textAnchor="middle", fontSize=12))
            return drawing
        
        labels = data['labels'][:5]  # 최대 5개
        values = data['values'][:5]
        
        if not values or max(values) == 0:
            drawing.add(Rect(10, 10, width-20, height-20, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "데이터 값 없음", textAnchor="middle", fontSize=12))
            return drawing
        
        # 차트 영역 설정
        chart_x = 60
        chart_y = 40
        chart_width = width - 120
        chart_height = height - 80
        
        # 바 차트 그리기
        bar_width = chart_width // len(values)
        max_value = max(values)
        
        colors_list = [colors.HexColor('#FF9900'), colors.HexColor('#232F3E'), 
                      colors.HexColor('#4CAF50'), colors.HexColor('#2196F3'), 
                      colors.HexColor('#FFC107')]
        
        for i, (label, value) in enumerate(zip(labels, values)):
            # 바 높이 계산
            bar_height = (value / max_value) * chart_height if max_value > 0 else 0
            
            # 바 그리기
            bar_x = chart_x + i * bar_width + bar_width * 0.1
            bar_rect_width = bar_width * 0.8
            
            drawing.add(Rect(bar_x, chart_y, bar_rect_width, bar_height, 
                            fillColor=colors_list[i % len(colors_list)], 
                            strokeColor=colors.black, strokeWidth=1))
            
            # 값 표시
            drawing.add(String(bar_x + bar_rect_width/2, chart_y + bar_height + 5, 
                              str(value), textAnchor="middle", fontSize=10))
            
            # 라벨 표시 (짧게)
            short_label = label[:8] + '...' if len(label) > 8 else label
            drawing.add(String(bar_x + bar_rect_width/2, chart_y - 15, 
                              short_label, textAnchor="middle", fontSize=9))
        
        # 제목
        drawing.add(String(width//2, height - 20, "카테고리별 조회수", textAnchor="middle", fontSize=12, fontName="Helvetica-Bold"))
        
        return drawing
        
    except Exception as e:
        print(f"⚠️ 바 차트 생성 오류: {e}")
        # 오류 시 기본 차트
        drawing = Drawing(width, height)
        drawing.add(Rect(10, 10, width-20, height-20, fillColor=colors.lightgrey, strokeColor=colors.black))
        drawing.add(String(width//2, height//2, "차트 생성 오류", textAnchor="middle", fontSize=12))
        return drawing

def create_simple_pie_chart(data, width=300, height=300):
    """간단한 파이 차트 생성"""
    try:
        drawing = Drawing(width, height)
        
        if not data or not data.get('labels') or not data.get('values'):
            drawing.add(Circle(width//2, height//2, 80, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "데이터 없음", textAnchor="middle", fontSize=12))
            return drawing
        
        labels = data['labels'][:4]  # 최대 4개
        values = data['values'][:4]
        
        if not values or sum(values) == 0:
            drawing.add(Circle(width//2, height//2, 80, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "값 없음", textAnchor="middle", fontSize=12))
            return drawing
        
        # 파이 차트 생성
        pie = Pie()
        pie.x = width//2 - 80
        pie.y = height//2 - 80
        pie.width = 160
        pie.height = 160
        pie.data = values
        pie.labels = [f"{label}\n({value})" for label, value in zip(labels, values)]
        pie.slices.strokeWidth = 1
        pie.slices.strokeColor = colors.white
        
        # 색상 설정
        colors_list = [colors.HexColor('#FF9900'), colors.HexColor('#232F3E'), 
                      colors.HexColor('#4CAF50'), colors.HexColor('#2196F3')]
        
        for i in range(len(values)):
            pie.slices[i].fillColor = colors_list[i % len(colors_list)]
        
        drawing.add(pie)
        
        # 제목
        drawing.add(String(width//2, height - 30, "카테고리 분포", textAnchor="middle", fontSize=12, fontName="Helvetica-Bold"))
        
        return drawing
        
    except Exception as e:
        print(f"⚠️ 파이 차트 생성 오류: {e}")
        # 오류 시 기본 차트
        drawing = Drawing(width, height)
        drawing.add(Circle(width//2, height//2, 80, fillColor=colors.lightgrey, strokeColor=colors.black))
        drawing.add(String(width//2, height//2, "차트 오류", textAnchor="middle", fontSize=12))
        return drawing

def create_enhanced_korean_report(ai_insights, analytics_data):
    """향상된 한글 분석 리포트 생성"""
    try:
        print("📊 향상된 한글 분석 리포트 생성 시작...")
        
        # 한글 폰트 등록
        korean_font = register_korean_font()
        
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
        
        # 한글 스타일
        title_style = ParagraphStyle(
            'KoreanTitle',
            parent=styles['Title'],
            fontSize=20,
            spaceAfter=30,
            textColor=colors.HexColor('#232F3E'),
            alignment=1,
            fontName=korean_font
        )
        
        heading_style = ParagraphStyle(
            'KoreanHeading',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=15,
            textColor=colors.HexColor('#FF9900'),
            fontName=korean_font
        )
        
        subheading_style = ParagraphStyle(
            'KoreanSubHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=10,
            textColor=colors.HexColor('#232F3E'),
            fontName=korean_font
        )
        
        body_style = ParagraphStyle(
            'KoreanBody',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=8,
            textColor=colors.black,
            fontName=korean_font
        )
        
        # 콘텐츠 생성
        story = []
        
        # === 표지 페이지 ===
        story.append(Spacer(1, 2*inch))
        story.append(Paragraph("AWS Demo Factory", title_style))
        story.append(Paragraph("AI 기반 분석 리포트", heading_style))
        story.append(Spacer(1, 1*inch))
        
        now = datetime.now().strftime("%Y년 %m월 %d일")
        story.append(Paragraph(f"생성일: {now}", body_style))
        story.append(Paragraph("AI 모델: Claude 4 Sonnet (Amazon Bedrock)", body_style))
        story.append(Spacer(1, 0.5*inch))
        
        # 요약 테이블
        summary_data = [
            ['지표', '값', '상태'],
            ['총 페이지뷰', f"{analytics_data.get('totalPageViews', 0):,}회", '📈 활성'],
            ['콘텐츠 조회', f"{analytics_data.get('totalContentViews', 0):,}회", '👀 참여'],
            ['분석 기간', analytics_data.get('period', '전체 기간'), '📅 현재']
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 1.5*inch, 1.5*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#232F3E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), korean_font),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('FONTSIZE', (0, 1), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8F9FA')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(summary_table)
        story.append(PageBreak())
        
        # === 분석 결과 페이지 ===
        story.append(Paragraph("핵심 분석 결과", heading_style))
        
        # 주요 지표 분석
        story.append(Paragraph("주요 성과 지표", subheading_style))
        
        engagement_rate = (analytics_data.get('totalContentViews', 0) / max(analytics_data.get('totalPageViews', 1), 1) * 100)
        
        kpi_insights = [
            f"• 페이지 참여율: {engagement_rate:.1f}%",
            f"• 콘텐츠 발견율: {analytics_data.get('totalContentViews', 0)}건의 고유 상호작용",
            f"• 플랫폼 활동도: {analytics_data.get('totalPageViews', 0)}회의 총 페이지 조회"
        ]
        
        for insight in kpi_insights:
            story.append(Paragraph(insight, body_style))
        
        story.append(Spacer(1, 20))
        
        # 카테고리 분석 (차트 포함)
        story.append(Paragraph("카테고리별 성과 분석", subheading_style))
        
        # 차트 데이터 준비
        if analytics_data.get('category'):
            category_data = analytics_data['category'][:5]
            chart_data = {
                'labels': [item.get('category', '미분류') for item in category_data],
                'values': [item.get('count', 0) for item in category_data]
            }
            
            if chart_data['values'] and sum(chart_data['values']) > 0:
                # 바 차트 추가
                bar_chart = create_simple_bar_chart(chart_data, 450, 250)
                story.append(bar_chart)
                story.append(Spacer(1, 15))
                
                # 파이 차트 추가
                pie_chart = create_simple_pie_chart(chart_data, 350, 250)
                story.append(pie_chart)
                story.append(Spacer(1, 15))
                
                # 카테고리별 인사이트
                story.append(Paragraph("카테고리 인사이트:", subheading_style))
                total_views = sum(chart_data['values'])
                for i, item in enumerate(category_data[:3]):
                    category = item.get('category', '미분류')
                    count = item.get('count', 0)
                    percentage = (count / total_views * 100) if total_views > 0 else 0
                    story.append(Paragraph(f"• {category}: {count}회 조회 (전체의 {percentage:.1f}%)", body_style))
        
        story.append(Spacer(1, 30))
        
        # 콘텐츠 성과 분석
        story.append(Paragraph("콘텐츠 성과 분석", subheading_style))
        
        if analytics_data.get('content'):
            content_data = analytics_data['content'][:5]
            
            # 콘텐츠 성과 테이블
            content_table_data = [['콘텐츠 제목', '조회수', '성과 등급']]
            for item in content_data:
                title = item.get('title', '제목 없음')[:25] + ('...' if len(item.get('title', '')) > 25 else '')
                views = item.get('views', 0)
                performance = '🔥 높음' if views > 3 else '📈 보통' if views > 1 else '📊 낮음'
                content_table_data.append([title, f"{views}회", performance])
            
            content_table = Table(content_table_data, colWidths=[3*inch, 1*inch, 1*inch])
            content_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF9900')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, -1), korean_font),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
                ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFFBF0')),
                ('GRID', (0, 0), (-1, -1), 1, colors.grey),
            ]))
            
            story.append(content_table)
        
        story.append(PageBreak())
        
        # === 권장사항 페이지 ===
        story.append(Paragraph("전략적 권장사항", heading_style))
        
        # 즉시 실행 가능한 권장사항
        story.append(Paragraph("즉시 실행 가능한 개선사항", subheading_style))
        immediate_actions = [
            "고성과 콘텐츠 카테고리 확장 (Manufacturing, Generative AI)",
            "콘텐츠 발견 메커니즘 최적화로 참여율 향상",
            "콘텐츠 품질 평가를 위한 사용자 피드백 수집 시스템 구축",
            "지속적인 참여를 위한 카테고리별 콘텐츠 시리즈 개발"
        ]
        
        for i, action in enumerate(immediate_actions, 1):
            story.append(Paragraph(f"{i}. {action}", body_style))
        
        story.append(Spacer(1, 20))
        
        # 중장기 전략
        story.append(Paragraph("중장기 전략 계획", subheading_style))
        longterm_strategies = [
            "사용자 행동 추적을 위한 고급 분석 시스템 구현",
            "개인화된 콘텐츠 추천 엔진 개발",
            "산업별 특화 콘텐츠 경로 구축",
            "콘텐츠 성과 벤치마킹 시스템 구축"
        ]
        
        for i, strategy in enumerate(longterm_strategies, 1):
            story.append(Paragraph(f"{i}. {strategy}", body_style))
        
        story.append(Spacer(1, 30))
        
        # 모니터링 지표
        story.append(Paragraph("핵심 모니터링 지표", subheading_style))
        
        metrics_data = [
            ['지표', '현재값', '목표값', '측정주기'],
            ['페이지 참여율', f"{engagement_rate:.1f}%", '25%+', '주간'],
            ['세션당 콘텐츠 조회', f"{analytics_data.get('totalContentViews', 0) / max(analytics_data.get('totalPageViews', 1), 1):.1f}회", '2.0회+', '일간'],
            ['카테고리 커버리지', '5개 카테고리', '8개+ 카테고리', '월간'],
            ['사용자 재방문율', '측정 예정', '60%+', '월간']
        ]
        
        metrics_table = Table(metrics_data, colWidths=[2*inch, 1*inch, 1*inch, 1*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#232F3E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), korean_font),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 10),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F0F8FF')),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        story.append(metrics_table)
        
        # 푸터
        story.append(Spacer(1, 50))
        story.append(Paragraph("본 종합 분석은 Amazon Bedrock의 Claude 4 Sonnet 모델을 사용하여 생성되었습니다.", 
                              ParagraphStyle('Footer', parent=styles['Normal'], fontSize=9, 
                                           textColor=colors.grey, alignment=1, fontName=korean_font)))
        
        # PDF 생성
        doc.build(story)
        
        # 바이트 데이터 반환
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        print("✅ 향상된 한글 분석 리포트 생성 성공")
        return pdf_bytes
        
    except Exception as e:
        print(f"❌ 향상된 리포트 생성 오류: {e}")
        import traceback
        print(f"🔍 상세 오류:\n{traceback.format_exc()}")
        return None

if __name__ == "__main__":
    # 테스트
    test_data = {
        'totalVisitors': 1, 
        'totalPageViews': 32, 
        'totalContentViews': 5,
        'period': '2025년 6월',
        'category': [
            {'category': 'Manufacturing', 'count': 9},
            {'category': 'Generative AI', 'count': 7},
            {'category': 'Retail/CPG', 'count': 6},
            {'category': 'Finance', 'count': 6},
            {'category': 'Telco/Media', 'count': 4}
        ],
        'content': [
            {'title': 'AWS 제조업 솔루션 가이드', 'views': 6},
            {'title': 'Generative AI 모범 사례', 'views': 3},
            {'title': '클라우드 마이그레이션 전략', 'views': 2},
            {'title': '데이터 분석 프레임워크', 'views': 2},
            {'title': '보안 구현 가이드', 'views': 1}
        ]
    }
    
    pdf_bytes = create_enhanced_korean_report("테스트 인사이트", test_data)
    if pdf_bytes:
        with open("test_enhanced_korean_report.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("✅ 향상된 한글 리포트 테스트 성공")
    else:
        print("❌ 향상된 한글 리포트 테스트 실패")
