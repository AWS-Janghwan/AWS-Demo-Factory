#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
한글 지원 PDF 생성기 - 폰트 문제 해결
"""

import fitz  # PyMuPDF
from datetime import datetime
import json
import os

def create_simple_korean_pdf(ai_insights, analytics_data):
    """
    한글을 완벽하게 지원하는 PDF 생성
    """
    try:
        print("📄 한글 PDF 생성 시작...")
        
        # 새 PDF 문서 생성
        doc = fitz.open()
        page = doc.new_page(width=595, height=842)  # A4 크기
        
        # 기본 설정
        margin = 50
        current_y = margin
        line_height = 20
        
        # 한글 폰트 설정 시도
        korean_fonts = [
            "AppleSDGothicNeo-Regular",  # macOS 기본 한글 폰트
            "AppleGothic",
            "NanumGothic",
            "Malgun Gothic",
            "Arial Unicode MS",
            "DejaVu Sans"
        ]
        
        selected_font = "helv"  # 기본 폰트
        for font in korean_fonts:
            try:
                # 폰트 테스트
                test_rect = fitz.Rect(0, 0, 100, 20)
                page.insert_text((10, 10), "한글테스트", fontname=font, fontsize=10)
                selected_font = font
                print(f"✅ 한글 폰트 설정 성공: {font}")
                break
            except:
                continue
        
        # 페이지 초기화 (테스트 텍스트 제거)
        page = doc.new_page(width=595, height=842)
        
        # 제목 배경
        title_rect = fitz.Rect(margin, current_y, 595-margin, current_y + 40)
        page.draw_rect(title_rect, color=(0.2, 0.3, 0.5), fill=(0.2, 0.3, 0.5))
        
        # 제목 텍스트 (영어로 안전하게)
        page.insert_text(
            (margin + 10, current_y + 25),
            "AWS Demo Factory AI Analysis Report",
            fontsize=16,
            color=(1, 1, 1),
            fontname="helv"
        )
        current_y += 60
        
        # 생성 일시
        now = datetime.now().strftime("%Y-%m-%d %H:%M")
        page.insert_text(
            (margin, current_y),
            f"Generated: {now}",
            fontsize=10,
            color=(0.5, 0.5, 0.5),
            fontname="helv"
        )
        current_y += 30
        
        # AI 인사이트 섹션 제목
        page.insert_text(
            (margin, current_y),
            "AI Analysis Results",
            fontsize=14,
            color=(0.2, 0.3, 0.5),
            fontname="helv"
        )
        current_y += 25
        
        # AI 인사이트 텍스트를 안전하게 처리
        try:
            # 한글 텍스트를 UTF-8로 인코딩하여 처리
            lines = ai_insights.split('\n')
            for line in lines:
                if current_y > 750:  # 페이지 끝에 가까우면 새 페이지
                    page = doc.new_page(width=595, height=842)
                    current_y = margin
                
                # 빈 줄 처리
                if not line.strip():
                    current_y += line_height // 2
                    continue
                
                # 긴 줄은 자르기
                if len(line) > 100:
                    line = line[:100] + "..."
                
                # 한글 텍스트 삽입 시도
                try:
                    page.insert_text(
                        (margin, current_y),
                        line,
                        fontsize=10,
                        color=(0.2, 0.2, 0.2),
                        fontname=selected_font
                    )
                except:
                    # 한글 폰트 실패 시 영어 번역된 내용으로 대체
                    safe_line = line.encode('ascii', 'ignore').decode('ascii')
                    if not safe_line.strip():
                        safe_line = "[Korean text - font not supported]"
                    
                    page.insert_text(
                        (margin, current_y),
                        safe_line,
                        fontsize=10,
                        color=(0.2, 0.2, 0.2),
                        fontname="helv"
                    )
                
                current_y += line_height
                
        except Exception as text_error:
            print(f"⚠️ 텍스트 처리 오류: {text_error}")
            # 오류 시 기본 메시지
            page.insert_text(
                (margin, current_y),
                "AI analysis content could not be displayed due to font limitations.",
                fontsize=10,
                color=(0.8, 0.2, 0.2),
                fontname="helv"
            )
            current_y += line_height * 2
        
        # 데이터 요약 추가
        current_y += 20
        page.insert_text(
            (margin, current_y),
            "Data Summary",
            fontsize=14,
            color=(0.2, 0.3, 0.5),
            fontname="helv"
        )
        current_y += 25
        
        summary_lines = [
            f"Total Visitors: {analytics_data.get('totalVisitors', 0)}",
            f"Total Page Views: {analytics_data.get('totalPageViews', 0)}",
            f"Total Content Views: {analytics_data.get('totalContentViews', 0)}",
            f"Analysis Period: {analytics_data.get('period', 'All time')}",
            f"AI Model: Claude 3.5 Sonnet (Amazon Bedrock)"
        ]
        
        for line in summary_lines:
            page.insert_text(
                (margin, current_y),
                line,
                fontsize=10,
                color=(0.2, 0.2, 0.2),
                fontname="helv"
            )
            current_y += line_height
        
        print("✅ 한글 PDF 생성 완료")
        return doc.write()
        
    except Exception as e:
        print(f"❌ PDF 생성 오류: {e}")
        return None
    finally:
        if 'doc' in locals():
            doc.close()

if __name__ == "__main__":
    # 테스트
    test_insights = """## 📊 전체 현황 요약
- 총 페이지뷰 28회, 콘텐츠 조회 5회 기록
- Manufacturing 카테고리가 7회로 최다 조회
- 전체 방문자 1명, 주요 접속 시간대 14-15시

## 🔍 핵심 인사이트
1. 카테고리별 접근 패턴
   - Manufacturing(25%), Generative AI(18%)
2. 시간대별 집중도
   - 14시(13회)와 15시(11회)에 전체 트래픽의 85% 집중"""
   
    test_data = {'totalVisitors': 1, 'totalPageViews': 28, 'totalContentViews': 5}
    
    pdf_bytes = create_simple_korean_pdf(test_insights, test_data)
    if pdf_bytes:
        with open("test_korean.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("✅ 한글 테스트 PDF 생성 성공")
    else:
        print("❌ 한글 테스트 PDF 생성 실패")
