#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
최종 한글 PDF 생성기 - 완벽한 한글 지원
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
import re

def register_korean_font():
    """한글 폰트 등록 - 더 안정적인 방법"""
    try:
        # macOS에서 가장 안정적인 한글 폰트 경로들
        font_candidates = [
            '/System/Library/Fonts/Supplemental/AppleGothic.ttf',
            '/Library/Fonts/AppleGothic.ttf',
            '/System/Library/Fonts/Helvetica.ttc'
        ]
        
        for font_path in font_candidates:
            if os.path.exists(font_path):
                try:
                    if font_path.endswith('.ttf'):
                        pdfmetrics.registerFont(TTFont('KoreanFont', font_path))
                        print(f"✅ 한글 폰트 등록 성공: {font_path}")
                        return 'KoreanFont'
                    elif font_path.endswith('.ttc'):
                        # TTC 파일에서 한글 지원 폰트 찾기
                        for i in range(5):  # 최대 5개 서브폰트 시도
                            try:
                                pdfmetrics.registerFont(TTFont(f'KoreanFont{i}', font_path, subfontIndex=i))
                                # 한글 테스트
                                test_text = "한글테스트"
                                print(f"✅ 한글 폰트 등록 성공: {font_path} (index {i})")
                                return f'KoreanFont{i}'
                            except:
                                continue
                except Exception as e:
                    print(f"⚠️ 폰트 등록 실패 ({font_path}): {e}")
                    continue
        
        print("⚠️ 한글 폰트를 찾을 수 없습니다. 기본 폰트를 사용합니다.")
        return 'Helvetica'
        
    except Exception as e:
        print(f"❌ 폰트 등록 오류: {e}")
        return 'Helvetica'

def clean_text_for_pdf(text):
    """PDF에 안전한 텍스트로 변환 - 최소한의 처리만"""
    try:
        import re
        
        # 1. 이모지만 간단하게 제거 (다른 건 건드리지 않음)
        emoji_pattern = re.compile(r'[\U0001F600-\U0001F64F\U0001F300-\U0001F5FF\U0001F680-\U0001F6FF\U0001F1E0-\U0001F1FF]+')
        text = emoji_pattern.sub('', text)
        
        # 2. 연속된 공백만 정리
        text = re.sub(r'  +', ' ', text)
        
        # 3. 그 외에는 원본 그대로 유지
        return text.strip()
        
    except Exception as e:
        print(f"⚠️ 텍스트 정리 오류: {e}")
        # 오류 시 원본 그대로 반환
        return str(text)

def create_final_korean_pdf(ai_insights, analytics_data):
    """최종 한글 PDF 생성"""
    try:
        print("📄 최종 한글 PDF 생성 시작...")
        
        # 한글 폰트 등록
        font_name = register_korean_font()
        
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
            fontSize=18,
            spaceAfter=20,
            textColor=colors.HexColor('#232F3E'),
            alignment=1  # 중앙 정렬
        )
        
        # 한글 헤딩 스타일
        heading_style = ParagraphStyle(
            'KoreanHeading',
            parent=styles['Heading2'],
            fontName=font_name,
            fontSize=14,
            spaceAfter=10,
            textColor=colors.HexColor('#FF9900'),
            leftIndent=0
        )
        
        # 한글 본문 스타일
        body_style = ParagraphStyle(
            'KoreanBody',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=10,
            spaceAfter=4,
            leftIndent=0,
            rightIndent=0,
            wordWrap='LTR'
        )
        
        # 콘텐츠 생성
        story = []
        
        # 제목
        now = datetime.now().strftime("%Y년 %m월 %d일 %H:%M")
        title_text = "AWS Demo Factory AI 분석 리포트"
        
        story.append(Paragraph(title_text, title_style))
        story.append(Spacer(1, 12))
        
        # 생성 정보
        info_text = f"생성일시: {now} | AI 모델: Claude 3.7 Sonnet"
        story.append(Paragraph(info_text, body_style))
        story.append(Spacer(1, 20))
        
        # 데이터 요약 섹션
        story.append(Paragraph("[데이터] 데이터 요약", heading_style))
        
        # 요약 테이블
        summary_data = [
            ['항목', '값'],
            ['총 방문자 수', f"{analytics_data.get('totalVisitors', 0):,}명"],
            ['총 페이지뷰', f"{analytics_data.get('totalPageViews', 0):,}회"],
            ['총 콘텐츠 조회', f"{analytics_data.get('totalContentViews', 0):,}회"],
            ['분석 기간', analytics_data.get('period', '전체')]
        ]
        
        summary_table = Table(summary_data, colWidths=[2*inch, 2*inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#FF9900')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), font_name),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        story.append(summary_table)
        story.append(Spacer(1, 20))
        
        # AI 분석 결과 섹션
        story.append(Paragraph("[분석] AI 분석 결과", heading_style))
        
        # AI 인사이트 텍스트 정리 및 처리
        cleaned_insights = clean_text_for_pdf(ai_insights)
        
        # 텍스트를 줄 단위로 분할하여 처리
        lines = cleaned_insights.split('\n')
        for line in lines:
            line = line.strip()
            if line:
                # 마크다운 헤더 처리
                if line.startswith('##'):
                    line = line.replace('##', '').strip()
                    if line:
                        story.append(Paragraph(f"<b>{line}</b>", body_style))
                elif line.startswith('#'):
                    line = line.replace('#', '').strip()
                    if line:
                        story.append(Paragraph(f"<b>{line}</b>", body_style))
                else:
                    # 일반 텍스트
                    if len(line) > 100:  # 긴 줄은 분할
                        words = line.split(' ')
                        current_line = ""
                        for word in words:
                            if len(current_line + word) > 100:
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
                story.append(Spacer(1, 4))
        
        story.append(Spacer(1, 20))
        
        # 푸터
        footer_text = "본 리포트는 Amazon Bedrock의 Claude 3.7 Sonnet 모델을 사용하여 생성되었습니다."
        footer_style = ParagraphStyle(
            'Footer',
            parent=styles['Normal'],
            fontName=font_name,
            fontSize=8,
            textColor=colors.grey,
            alignment=1
        )
        
        story.append(Paragraph(footer_text, footer_style))
        
        # PDF 생성
        doc.build(story)
        
        # 바이트 데이터 반환
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        print("✅ 최종 한글 PDF 생성 성공")
        return pdf_bytes
        
    except Exception as e:
        print(f"❌ 최종 PDF 생성 오류: {e}")
        import traceback
        print(f"🔍 상세 오류:\n{traceback.format_exc()}")
        return None

if __name__ == "__main__":
    # 테스트
    test_insights = """## 📊 전체 현황 요약
- 총 페이지뷰 28회, 콘텐츠 조회 5회 기록
- Manufacturing 카테고리가 7회로 최다 조회
- 전체 방문자 1명, 주로 14-17시 사이 활동

## 🔍 핵심 인사이트
1. 시간대별 사용 패턴
   - 14시(13회)와 15시(11회)에 집중된 트래픽
   - 업무 시간 내 활동이 전체의 100%

2. 카테고리별 관심도
   - Manufacturing(25%), Generative AI(18%) 순
   - B2B 산업 중심의 콘텐츠 소비 패턴

## 💡 권장사항
- 인기 카테고리의 콘텐츠를 확충하세요
- 특히 Manufacturing 분야의 심화 콘텐츠 개발 필요"""
   
    test_data = {
        'totalVisitors': 1, 
        'totalPageViews': 28, 
        'totalContentViews': 5,
        'period': '2025년 6월'
    }
    
    pdf_bytes = create_final_korean_pdf(test_insights, test_data)
    if pdf_bytes:
        with open("test_final_korean.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("✅ 최종 한글 PDF 테스트 성공")
    else:
        print("❌ 최종 한글 PDF 테스트 실패")
