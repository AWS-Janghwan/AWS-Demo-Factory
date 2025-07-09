#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HTML을 통한 한글 PDF 생성기 - WeasyPrint 사용
"""

from weasyprint import HTML, CSS
from datetime import datetime
import tempfile
import os

def create_html_content(ai_insights, analytics_data):
    """HTML 콘텐츠 생성"""
    now = datetime.now().strftime("%Y년 %m월 %d일 %H:%M")
    
    html_content = f"""
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <title>AWS Demo Factory AI 분석 리포트</title>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
            
            body {{
                font-family: 'Noto Sans KR', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif;
                line-height: 1.6;
                margin: 0;
                padding: 30px;
                color: #333;
                background: white;
                font-size: 14px;
            }}
            
            .header {{
                background: linear-gradient(135deg, #232F3E, #FF9900);
                color: white;
                padding: 25px;
                margin: -30px -30px 30px -30px;
                text-align: center;
                border-radius: 0 0 10px 10px;
            }}
            
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 700;
            }}
            
            .header .subtitle {{
                margin: 8px 0 0 0;
                font-size: 12px;
                opacity: 0.9;
            }}
            
            .section {{
                margin: 25px 0;
                padding: 20px;
                border-left: 4px solid #FF9900;
                background: #f8f9fa;
                border-radius: 5px;
            }}
            
            .section h2 {{
                color: #232F3E;
                font-size: 18px;
                margin: 0 0 15px 0;
                font-weight: 600;
            }}
            
            .insights {{
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                margin: 15px 0;
            }}
            
            .insights-content {{
                white-space: pre-wrap;
                word-wrap: break-word;
                font-family: 'Noto Sans KR', sans-serif;
                font-size: 13px;
                line-height: 1.7;
                margin: 0;
                color: #444;
            }}
            
            .summary-grid {{
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin: 15px 0;
            }}
            
            .summary-item {{
                background: white;
                padding: 15px;
                border-radius: 8px;
                text-align: center;
                box-shadow: 0 2px 6px rgba(0,0,0,0.1);
            }}
            
            .summary-item .number {{
                font-size: 20px;
                font-weight: 700;
                color: #FF9900;
                display: block;
            }}
            
            .summary-item .label {{
                font-size: 12px;
                color: #666;
                margin-top: 5px;
            }}
            
            .footer {{
                margin-top: 40px;
                padding-top: 15px;
                border-top: 2px solid #eee;
                text-align: center;
                color: #666;
                font-size: 11px;
            }}
            
            @page {{
                size: A4;
                margin: 2cm;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🤖 AWS Demo Factory AI 분석 리포트</h1>
            <div class="subtitle">생성일시: {now} | AI 모델: Claude 3.5 Sonnet (Amazon Bedrock)</div>
        </div>
        
        <div class="section">
            <h2>📊 데이터 요약</h2>
            <div class="summary-grid">
                <div class="summary-item">
                    <span class="number">{analytics_data.get('totalVisitors', 0):,}</span>
                    <div class="label">총 방문자 수</div>
                </div>
                <div class="summary-item">
                    <span class="number">{analytics_data.get('totalPageViews', 0):,}</span>
                    <div class="label">총 페이지뷰</div>
                </div>
                <div class="summary-item">
                    <span class="number">{analytics_data.get('totalContentViews', 0):,}</span>
                    <div class="label">총 콘텐츠 조회</div>
                </div>
                <div class="summary-item">
                    <span class="number">{analytics_data.get('period', '전체')}</span>
                    <div class="label">분석 기간</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🔍 AI 분석 결과</h2>
            <div class="insights">
                <div class="insights-content">{ai_insights}</div>
            </div>
        </div>
        
        <div class="footer">
            <p>본 리포트는 Amazon Bedrock의 Claude 3.5 Sonnet 모델을 사용하여 생성되었습니다.</p>
            <p>AWS Demo Factory | Amazon Web Services</p>
        </div>
    </body>
    </html>
    """
    
    return html_content

def create_korean_pdf_from_html(ai_insights, analytics_data):
    """WeasyPrint를 사용한 한글 PDF 생성"""
    try:
        print("📄 HTML → PDF 변환 시작 (WeasyPrint)...")
        
        # HTML 콘텐츠 생성
        html_content = create_html_content(ai_insights, analytics_data)
        
        # WeasyPrint로 PDF 생성
        html_doc = HTML(string=html_content)
        pdf_bytes = html_doc.write_pdf()
        
        print("✅ HTML → PDF 변환 성공")
        return pdf_bytes
        
    except Exception as e:
        print(f"❌ HTML → PDF 변환 오류: {e}")
        import traceback
        print(f"🔍 상세 오류:\n{traceback.format_exc()}")
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

3. 콘텐츠 참여도
   - test1(Generative AI) 콘텐츠가 상대적으로 높은 관심 1회 조회
   - test5(Manufacturing)가 6회로 가장 높은 참여도 기록

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
    
    pdf_bytes = create_korean_pdf_from_html(test_insights, test_data)
    if pdf_bytes:
        with open("test_weasyprint_korean.pdf", "wb") as f:
            f.write(pdf_bytes)
        print("✅ WeasyPrint 기반 한글 PDF 생성 성공")
    else:
        print("❌ WeasyPrint 기반 한글 PDF 생성 실패")
