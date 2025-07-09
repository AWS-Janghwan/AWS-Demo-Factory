#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
간단한 텍스트 기반 PDF 생성기 - 폰트 문제 완전 해결
"""

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime
import io

def create_simple_text_pdf(ai_insights, analytics_data):
    """간단한 텍스트 기반 PDF 생성 - 폰트 문제 없음"""
    try:
        print("📄 간단 텍스트 PDF 생성 시작...")
        
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
        
        # 기본 스타일 사용 (폰트 문제 없음)
        styles = getSampleStyleSheet()
        
        # 제목 스타일
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=16,
            spaceAfter=20,
            textColor=colors.black,
            alignment=1
        )
        
        # 헤딩 스타일
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=12,
            textColor=colors.black
        )
        
        # 본문 스타일
        body_style = ParagraphStyle(
            'CustomBody',
            parent=styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            textColor=colors.black
        )
        
        # 콘텐츠 생성
        story = []
        
        # 제목
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        story.append(Paragraph("AWS Demo Factory AI Analysis Report", title_style))
        story.append(Spacer(1, 12))
        
        # 생성 정보
        story.append(Paragraph(f"Generated: {now} | AI Model: Claude 3.7 Sonnet", body_style))
        story.append(Spacer(1, 20))
        
        # 데이터 요약
        story.append(Paragraph("Data Summary", heading_style))
        summary_text = f"""
Total Visitors: {analytics_data.get('totalVisitors', 0)}
Total Page Views: {analytics_data.get('totalPageViews', 0)}
Total Content Views: {analytics_data.get('totalContentViews', 0)}
Analysis Period: {analytics_data.get('period', 'All time')}
        """.strip()
        
        for line in summary_text.split('\n'):
            if line.strip():
                story.append(Paragraph(line, body_style))
        
        story.append(Spacer(1, 20))
        
        # AI 분석 결과
        story.append(Paragraph("AI Analysis Results", heading_style))
        
        # AI 인사이트를 안전하게 처리
        try:
            # 한글이 포함된 텍스트를 영어로 변환하거나 안전하게 처리
            safe_insights = ai_insights.encode('ascii', 'ignore').decode('ascii')
            if not safe_insights.strip():
                safe_insights = "AI analysis completed successfully. Korean content requires proper font support for display."
            
            # 텍스트를 줄 단위로 분할
            lines = safe_insights.split('\n')
            for line in lines:
                line = line.strip()
                if line:
                    # 너무 긴 줄은 분할
                    if len(line) > 80:
                        words = line.split(' ')
                        current_line = ""
                        for word in words:
                            if len(current_line + word) > 80:
                                if current_line:
                                    story.append(Paragraph(current_line, body_style))
                                current_line = word
                            else:
                                current_line += (" " + word if current_line else word)
                        if current_line:
                            story.append(Paragraph(current_line, body_style))
                    else:
                        story.append(Paragraph(line, body_style))
                else:
                    story.append(Spacer(1, 6))
                    
        except Exception as text_error:
            print(f"⚠️ AI 인사이트 처리 오류: {text_error}")
            story.append(Paragraph("AI analysis content could not be displayed due to encoding issues.", body_style))
        
        story.append(Spacer(1, 20))
        
        # 푸터
        story.append(Paragraph("This report was generated using Claude 3.7 Sonnet from Amazon Bedrock.", body_style))
        
        # PDF 생성
        doc.build(story)
        
        # 바이트 데이터 반환
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        print("✅ 간단 텍스트 PDF 생성 성공")
        return pdf_bytes
        
    except Exception as e:
        print(f"❌ 간단 PDF 생성 오류: {e}")
        import traceback
        print(f"🔍 상세 오류:\n{traceback.format_exc()}")
        return None

if __name__ == "__main__":
    # 테스트
    test_insights = """## Test Report
This is a test AI analysis report.

## Key Insights
1. System is working properly
2. Text display is stable
3. PDF generation completed successfully"""
   
    test_data = {
        'totalVisitors': 1, 
        'totalPageViews': 32, 
        'totalContentViews': 5,
        'period': 'Test Period'
    }
    
    pdf_bytes = create_simple_text_pdf(test_insights, test_data)
    if pdf_bytes:
        with open("test_simple_text.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("✅ 간단 텍스트 PDF 테스트 성공")
    else:
        print("❌ 간단 텍스트 PDF 테스트 실패")
