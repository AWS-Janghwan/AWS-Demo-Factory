#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ReportLab을 사용한 완벽한 한글 PDF 생성기
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from datetime import datetime
import io
import os

def register_korean_fonts():
    """한글 폰트 등록"""
    try:
        # macOS 시스템 폰트 경로들
        font_paths = [
            '/System/Library/Fonts/AppleSDGothicNeo.ttc',
            '/System/Library/Fonts/Helvetica.ttc',
            '/Library/Fonts/AppleGothic.ttf',
            '/System/Library/Fonts/Supplemental/AppleGothic.ttf'
        ]
        
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    if font_path.endswith('.ttc'):
                        # TTC 파일의 경우 첫 번째 폰트 사용
                        pdfmetrics.registerFont(TTFont('Korean', font_path, subfontIndex=0))
                    else:
                        pdfmetrics.registerFont(TTFont('Korean', font_path))
                    print(f"✅ 한글 폰트 등록 성공: {font_path}")
                    return True
                except Exception as e:
                    print(f"⚠️ 폰트 등록 실패 ({font_path}): {e}")
                    continue
        
        print("⚠️ 시스템 한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.")
        return False
        
    except Exception as e:
        print(f"❌ 폰트 등록 오류: {e}")
        return False

def create_korean_pdf_with_reportlab(ai_insights, analytics_data):
    """ReportLab을 사용한 한글 PDF 생성"""
    try:
        print("📄 ReportLab 한글 PDF 생성 시작...")
        
        # 한글 폰트 등록
        korean_font_available = register_korean_fonts()
        font_name = 'Korean' if korean_font_available else 'Helvetica'
        
        # PDF 문서 생성
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=72,
            leftMargin=72,
            topMargin=72,
            bottomMargin=18
        )
        
        # 스타일 정의
        styles = getSampleStyleSheet()
        
        # 한글 제목 스타일
        title_style = ParagraphStyle(
            'KoreanTitle',
            parent=styles['Title'],
            fontName=font_name,
            fontSize=20,
            spaceAfter=30,
            textColor=colors.HexColor('#232F3E'),
            alignment=1  # 중앙 정렬
        )
        
        # 한글 헤딩 스타일
        heading_style = ParagraphStyle(
            'KoreanHeading',
            parent=styles['Heading2'],
            fontName=font_name,
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#FF9900'),
            leftIndent=0
        )
        
        # 한글 본문 스타일
        body_style = ParagraphStyle(
            'KoreanBody',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=11,
            spaceAfter=6,
            leftIndent=0,
            rightIndent=0,
            wordWrap='LTR'
        )
        
        # 콘텐츠 생성
        story = []
        
        # 제목
        now = datetime.now().strftime("%Y년 %m월 %d일 %H:%M")
        title_text = "🤖 AWS Demo Factory AI 분석 리포트"
        if not korean_font_available:
            title_text = "AWS Demo Factory AI Analysis Report"
        
        story.append(Paragraph(title_text, title_style))
        story.append(Spacer(1, 12))
        
        # 생성 정보
        info_text = f"생성일시: {now} | AI 모델: Claude 3.5 Sonnet (Amazon Bedrock)"
        if not korean_font_available:
            info_text = f"Generated: {now} | AI Model: Claude 3.5 Sonnet (Amazon Bedrock)"
        
        story.append(Paragraph(info_text, body_style))
        story.append(Spacer(1, 20))
        
        # 데이터 요약 섹션
        summary_title = "📊 데이터 요약" if korean_font_available else "📊 Data Summary"
        story.append(Paragraph(summary_title, heading_style))
        
        # 요약 테이블 데이터
        if korean_font_available:
            summary_data = [
                ['항목', '값'],
                ['총 방문자 수', f"{analytics_data.get('totalVisitors', 0):,}명"],
                ['총 페이지뷰', f"{analytics_data.get('totalPageViews', 0):,}회"],
                ['총 콘텐츠 조회', f"{analytics_data.get('totalContentViews', 0):,}회"],
                ['분석 기간', analytics_data.get('period', '전체')]
            ]
        else:
            summary_data = [
                ['Item', 'Value'],
                ['Total Visitors', f"{analytics_data.get('totalVisitors', 0):,}"],
                ['Total Page Views', f"{analytics_data.get('totalPageViews', 0):,}"],
                ['Total Content Views', f"{analytics_data.get('totalContentViews', 0):,}"],
                ['Analysis Period', analytics_data.get('period', 'All time')]
            ]
        
        # 테이블 생성
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF9900')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # AI 분석 결과 섹션
        insights_title = "🔍 AI 분석 결과" if korean_font_available else "🔍 AI Analysis Results"
        story.append(Paragraph(insights_title, heading_style))
        
        # AI 인사이트 텍스트 처리
        insights_lines = ai_insights.split('\\n')
        for line in insights_lines:
            if line.strip():
                # 한글 폰트가 없는 경우 영어로 대체
                if not korean_font_available and any(ord(char) > 127 for char in line):
                    line = "[Korean content - requires Korean font support]"
                
                story.append(Paragraph(line, body_style))
            else:
                story.append(Spacer(1, 6))
        
        story.append(Spacer(1, 30))
        
        # 푸터
        footer_text = "본 리포트는 Amazon Bedrock의 Claude 3.5 Sonnet 모델을 사용하여 생성되었습니다."
        if not korean_font_available:
            footer_text = "This report was generated using Claude 3.5 Sonnet model from Amazon Bedrock."
        
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=9,
            textColor=colors.grey,
            alignment=1  # 중앙 정렬
        )
        
        story.append(Paragraph(footer_text, footer_style))
        
        # PDF 생성
        doc.build(story)
        
        # 바이트 데이터 반환
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        print("✅ ReportLab 한글 PDF 생성 성공")
        return pdf_bytes
        
    except Exception as e:
        print(f"❌ ReportLab PDF 생성 오류: {e}")
        import traceback
        print(f"🔍 상세 오류:\\n{traceback.format_exc()}")
        return None

if __name__ == "__main__":
    # 테스트
    test_insights = """## 📊 전체 현황 요약
- 총 페이지뷰 28회, 콘텐츠 조회 5회 기록
- Manufacturing 카테고리가 7회로 최다 조회
- 전체 방문자(janghwan@amazon.com) 1명, 주요 접속 시간대 14-17시

## 🔍 핵심 인사이트
1. 카테고리별 접근 패턴
   - Manufacturing(25%), Generative AI(18%), Retail/CPG(14%), Finance(14%) 순
   - B2B 중심의 기술 솔루션에 대한 높은 관심도 확인

2. 시간대별 이용 패턴
   - 14시(13회)와 15시(11회)에 전체 트래픽의 85% 집중
   - 업무 시간 내 집중적인 학습 및 정보 탐색 패턴

## 💡 권장사항
- 인기 카테고리의 콘텐츠를 확충하세요
  * 특히 Manufacturing 분야의 심화 콘텐츠 개발 필요
  * Generative AI 관련 최신 트렌드 콘텐츠 추가 권장"""
   
    test_data = {
        'totalVisitors': 1, 
        'totalPageViews': 28, 
        'totalContentViews': 5,
        'period': '2025년 6월'
    }
    
    pdf_bytes = create_korean_pdf_with_reportlab(test_insights, test_data)
    if pdf_bytes:
        with open("test_reportlab_korean.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("✅ ReportLab 기반 한글 PDF 테스트 성공")
    else:
        print("❌ ReportLab 기반 한글 PDF 테스트 실패")
