#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AWS Demo Factory - AI 기반 한글 PDF 리포트 생성기
PyMuPDF + Matplotlib를 사용한 고품질 한글 PDF 생성
"""

import fitz  # PyMuPDF
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import pandas as pd
import numpy as np
import seaborn as sns
from datetime import datetime
import json
import io
import base64
from pathlib import Path
import os

# 한글 폰트 설정 - macOS 시스템 폰트 사용
try:
    # macOS 시스템 폰트 경로
    font_paths = [
        '/System/Library/Fonts/AppleGothic.ttf',
        '/System/Library/Fonts/Helvetica.ttc',
        '/Library/Fonts/Arial.ttf'
    ]
    
    korean_font = None
    for font_path in font_paths:
        if os.path.exists(font_path):
            korean_font = font_path
            break
    
    if korean_font:
        plt.rcParams['font.family'] = ['AppleGothic', 'Helvetica', 'Arial']
    else:
        plt.rcParams['font.family'] = ['DejaVu Sans']
        
    plt.rcParams['axes.unicode_minus'] = False
    print(f"✅ 폰트 설정 완료: {korean_font or 'DejaVu Sans'}")
    
except Exception as e:
    print(f"⚠️ 폰트 설정 경고: {e}")
    plt.rcParams['font.family'] = ['DejaVu Sans']

class KoreanPDFGenerator:
    def __init__(self):
        self.doc = None
        self.page_width = 595  # A4 width in points
        self.page_height = 842  # A4 height in points
        self.margin = 50
        self.current_y = self.margin
        
    def create_new_document(self):
        """새 PDF 문서 생성"""
        self.doc = fitz.open()
        return self.doc
    
    def add_page(self):
        """새 페이지 추가"""
        page = self.doc.new_page(width=self.page_width, height=self.page_height)
        self.current_y = self.margin
        return page
    
    def safe_insert_text(self, page, point, text, fontsize=10, color=(0, 0, 0), fontname=None):
        """안전한 텍스트 삽입 - 폰트 오류 방지"""
        try:
            # 기본 폰트명 설정
            if fontname is None:
                fontname = "helv"  # Helvetica 기본 폰트
            
            # 첫 번째 시도: 지정된 폰트
            page.insert_text(point, text, fontsize=fontsize, color=color, fontname=fontname)
            
        except Exception as e:
            try:
                # 두 번째 시도: 기본 폰트
                page.insert_text(point, text, fontsize=fontsize, color=color, fontname="helv")
                
            except Exception as e2:
                try:
                    # 세 번째 시도: 폰트명 없이
                    page.insert_text(point, text, fontsize=fontsize, color=color)
                    
                except Exception as e3:
                    # 최종 시도: 최소한의 옵션으로
                    page.insert_text(point, text)
                    print(f"⚠️ 텍스트 삽입 경고 (최소 옵션 사용): {e3}")
    
    def add_header(self, page, title):
        """페이지 헤더 추가 - 안전한 텍스트 삽입"""
        # AWS Demo Factory 로고 영역
        rect = fitz.Rect(self.margin, self.margin, self.page_width - self.margin, self.margin + 40)
        page.draw_rect(rect, color=(0.137, 0.184, 0.243), fill=(0.137, 0.184, 0.243))
        
        # 제목 텍스트
        self.safe_insert_text(
            page,
            (self.margin + 10, self.margin + 25),
            "AWS Demo Factory",
            fontsize=16,
            color=(1, 1, 1),
            fontname="helv"
        )
        
        # 부제목
        self.safe_insert_text(
            page,
            (self.margin, self.margin + 55),
            title,
            fontsize=14,
            color=(0.137, 0.184, 0.243),
            fontname="helv"
        )
        
        # 생성 일시
        now = datetime.now().strftime("%Y년 %m월 %d일 %H:%M")
        self.safe_insert_text(
            page,
            (self.margin, self.margin + 75),
            f"생성일시: {now}",
            fontsize=10,
            color=(0.4, 0.4, 0.4),
            fontname="helv"
        )
        
        self.current_y = self.margin + 100
        return self.current_y
    
    def add_section_title(self, page, title):
        """섹션 제목 추가 - 안전한 텍스트 삽입"""
        # 배경 박스
        rect = fitz.Rect(self.margin, self.current_y, self.page_width - self.margin, self.current_y + 25)
        page.draw_rect(rect, color=(0.96, 0.96, 0.96), fill=(0.96, 0.96, 0.96))
        
        # 제목 텍스트
        self.safe_insert_text(
            page,
            (self.margin + 10, self.current_y + 18),
            title,
            fontsize=12,
            color=(0.137, 0.184, 0.243),
            fontname="helv"
        )
        
        self.current_y += 35
        return self.current_y
    
    def add_text_block(self, page, text, max_width=None):
        """텍스트 블록 추가 (자동 줄바꿈) - 안전한 텍스트 삽입"""
        if max_width is None:
            max_width = self.page_width - 2 * self.margin
        
        # 텍스트를 줄 단위로 분할
        lines = text.split('\n')
        line_height = 15
        
        for line in lines:
            if not line.strip():
                self.current_y += line_height // 2
                continue
                
            # 페이지 넘김 체크
            if self.current_y + line_height > self.page_height - self.margin:
                page = self.add_page()
                self.add_header(page, "AI 분석 리포트 (계속)")
            
            # 긴 줄 처리 (간단한 단어 단위 분할)
            words = line.split(' ')
            current_line = ""
            
            for word in words:
                test_line = current_line + (" " if current_line else "") + word
                # 대략적인 텍스트 너비 계산 (정확하지 않지만 실용적)
                if len(test_line) * 6 > max_width:  # 대략적인 문자 너비
                    if current_line:
                        self.safe_insert_text(
                            page,
                            (self.margin, self.current_y),
                            current_line,
                            fontsize=10,
                            color=(0.2, 0.2, 0.2),
                            fontname="helv"
                        )
                        self.current_y += line_height
                        current_line = word
                    else:
                        # 단어가 너무 긴 경우
                        self.safe_insert_text(
                            page,
                            (self.margin, self.current_y),
                            word,
                            fontsize=10,
                            color=(0.2, 0.2, 0.2),
                            fontname="helv"
                        )
                        self.current_y += line_height
                        current_line = ""
                else:
                    current_line = test_line
            
            if current_line:
                self.safe_insert_text(
                    page,
                    (self.margin, self.current_y),
                    current_line,
                    fontsize=10,
                    color=(0.2, 0.2, 0.2),
                    fontname="helv"
                )
                self.current_y += line_height
        
        self.current_y += 10  # 블록 간 여백
        return self.current_y
    
    def create_chart(self, chart_data, chart_type='bar', title='차트'):
        """차트 생성 및 이미지 반환 - 오류 처리 강화"""
        try:
            plt.figure(figsize=(10, 6))
            plt.rcParams['font.family'] = ['AppleGothic', 'Helvetica', 'Arial', 'DejaVu Sans']
            
            # 데이터 검증
            if not chart_data or 'labels' not in chart_data or 'values' not in chart_data:
                print(f"⚠️ 차트 데이터가 올바르지 않습니다: {chart_data}")
                return None
            
            labels = chart_data['labels']
            values = chart_data['values']
            
            if not labels or not values or len(labels) != len(values):
                print(f"⚠️ 차트 데이터 길이가 일치하지 않습니다: labels={len(labels)}, values={len(values)}")
                return None
            
            if chart_type == 'bar':
                plt.bar(labels, values)
                plt.xlabel('항목')
                plt.ylabel('값')
            elif chart_type == 'pie':
                plt.pie(values, labels=labels, autopct='%1.1f%%')
            elif chart_type == 'line':
                plt.plot(labels, values, marker='o')
                plt.xlabel('시간')
                plt.ylabel('값')
            else:
                # 기본값으로 bar 차트
                plt.bar(labels, values)
                plt.xlabel('항목')
                plt.ylabel('값')
            
            plt.title(title, fontsize=14, pad=20)
            if chart_type != 'pie':  # pie 차트가 아닌 경우에만 회전
                plt.xticks(rotation=45)
            plt.tight_layout()
            
            # 이미지를 바이트로 변환
            img_buffer = io.BytesIO()
            plt.savefig(img_buffer, format='png', dpi=150, bbox_inches='tight')
            img_buffer.seek(0)
            
            image_bytes = img_buffer.getvalue()
            plt.close()  # 메모리 누수 방지
            
            return image_bytes
            
        except Exception as e:
            print(f"❌ 차트 생성 오류: {e}")
            plt.close()  # 오류 시에도 figure 정리
            return None
    
    def add_chart_to_page(self, page, chart_data, chart_type='bar', title='차트'):
        """페이지에 차트 추가 - 오류 처리 강화"""
        try:
            # 페이지 공간 체크
            if self.current_y + 200 > self.page_height - self.margin:
                page = self.add_page()
                self.add_header(page, "AI 분석 리포트 (계속)")
            
            # 차트 생성
            chart_image = self.create_chart(chart_data, chart_type, title)
            
            if chart_image is None:
                print(f"⚠️ 차트 생성 실패, 텍스트로 대체: {title}")
                # 차트 생성 실패 시 텍스트로 대체
                self.add_section_title(page, f"📊 {title}")
                fallback_text = f"차트 데이터: {chart_data.get('labels', [])} / {chart_data.get('values', [])}"
                self.add_text_block(page, fallback_text)
                return page
            
            # 차트를 PDF에 삽입
            img_rect = fitz.Rect(
                self.margin, 
                self.current_y, 
                self.page_width - self.margin, 
                self.current_y + 180
            )
            
            page.insert_image(img_rect, stream=chart_image)
            self.current_y += 200
            
            return page
            
        except Exception as e:
            print(f"❌ 차트 페이지 추가 오류: {e}")
            # 오류 시 텍스트로 대체
            self.add_section_title(page, f"📊 {title} (차트 생성 실패)")
            error_text = f"차트를 생성할 수 없습니다. 데이터: {chart_data}"
            self.add_text_block(page, error_text)
            return page
    
    def generate_ai_report(self, ai_insights, analytics_data):
        """AI 기반 리포트 생성 - 상세 로그 추가"""
        try:
            print(f"📄 AI 리포트 생성 시작...")
            print(f"🤖 AI 인사이트 길이: {len(ai_insights)} chars")
            print(f"📊 분석 데이터 키: {list(analytics_data.keys()) if isinstance(analytics_data, dict) else type(analytics_data)}")
            
            # 새 문서 생성
            self.create_new_document()
            if not self.doc:
                raise Exception("PDF 문서 생성 실패")
            
            page = self.add_page()
            if not page:
                raise Exception("PDF 페이지 생성 실패")
            
            print("✅ PDF 문서 및 페이지 생성 완료")
            
            # 헤더 추가
            self.add_header(page, "🤖 AI 기반 데이터 분석 리포트")
            print("✅ 헤더 추가 완료")
            
            # AI 인사이트 섹션
            self.add_section_title(page, "🔍 AI 분석 결과")
            self.add_text_block(page, ai_insights)
            print("✅ AI 인사이트 섹션 추가 완료")
            
            # 데이터 요약 섹션
            self.add_section_title(page, "📊 데이터 요약")
            summary_text = f"""
총 방문자 수: {analytics_data.get('totalVisitors', 0):,}명
총 페이지뷰: {analytics_data.get('totalPageViews', 0):,}회
총 콘텐츠 조회수: {analytics_data.get('totalContentViews', 0):,}회
분석 기간: {analytics_data.get('period', '전체')}
AI 모델: Claude 3.5 Sonnet (Amazon Bedrock)
            """.strip()
            self.add_text_block(page, summary_text)
            print("✅ 데이터 요약 섹션 추가 완료")
            
            # 차트 섹션 (데이터가 있는 경우)
            if 'chartData' in analytics_data and analytics_data['chartData']:
                print(f"📊 차트 데이터 처리 시작: {len(analytics_data['chartData'])}개")
                
                try:
                    for i, chart_info in enumerate(analytics_data['chartData']):
                        print(f"📊 차트 {i+1} 처리 중: {chart_info.get('title', '제목없음')}")
                        print(f"📋 차트 데이터: {chart_info}")
                        
                        if self.current_y > 200:  # 페이지 공간 부족시 새 페이지
                            page = self.add_page()
                            self.add_header(page, "AI 분석 리포트 (차트)")
                        
                        page = self.add_chart_to_page(
                            page, 
                            chart_info['data'], 
                            chart_info.get('type', 'bar'),
                            chart_info.get('title', '차트')
                        )
                        print(f"✅ 차트 {i+1} 추가 완료")
                        
                except Exception as chart_error:
                    print(f"⚠️ 차트 생성 경고: {chart_error}")
                    # 차트 생성 실패해도 계속 진행
                    import traceback
                    print(f"🔍 차트 오류 상세:\n{traceback.format_exc()}")
            else:
                print("📊 차트 데이터 없음")
            
            print("✅ AI 리포트 생성 완료")
            return self.doc
            
        except Exception as e:
            print(f"❌ AI 리포트 생성 오류: {e}")
            import traceback
            print(f"🔍 오류 상세:\n{traceback.format_exc()}")
            
            # 문서가 생성된 경우 정리
            if self.doc:
                try:
                    self.doc.close()
                except:
                    pass
                self.doc = None
            raise e
    
    def save_document(self, filename):
        """문서 저장"""
        if self.doc:
            self.doc.save(filename)
            return filename
        return None
    
    def get_document_bytes(self):
        """문서를 바이트로 반환"""
        if self.doc:
            return self.doc.write()
        return None

def generate_korean_pdf_report(ai_insights, analytics_data, output_path=None):
    """
    한글 PDF 리포트 생성 메인 함수 - 오류 처리 강화
    
    Args:
        ai_insights (str): AI가 생성한 한글 인사이트
        analytics_data (dict): 분석 데이터
        output_path (str): 출력 파일 경로 (선택사항)
    
    Returns:
        bytes: PDF 문서 바이트 데이터
    """
    generator = None
    
    try:
        print(f"📄 PDF 생성 시작...")
        print(f"🤖 AI 인사이트 길이: {len(ai_insights)} chars")
        print(f"📊 분석 데이터: {list(analytics_data.keys())}")
        
        generator = KoreanPDFGenerator()
        
        # PDF 생성
        doc = generator.generate_ai_report(ai_insights, analytics_data)
        
        if not doc:
            raise Exception("PDF 문서 생성 실패 - 문서가 None입니다")
        
        # 파일로 저장 (선택사항)
        if output_path:
            try:
                generator.save_document(output_path)
                print(f"✅ PDF 파일 저장 완료: {output_path}")
            except Exception as save_error:
                print(f"⚠️ 파일 저장 경고: {save_error}")
                # 파일 저장 실패해도 바이트 데이터는 반환
        
        # 바이트 데이터 반환
        pdf_bytes = generator.get_document_bytes()
        
        if not pdf_bytes:
            raise Exception("PDF 바이트 데이터 생성 실패")
        
        print(f"✅ PDF 생성 성공! 크기: {len(pdf_bytes)} bytes")
        return pdf_bytes
        
    except Exception as e:
        print(f"❌ PDF 생성 오류: {e}")
        print(f"📋 오류 상세: {type(e).__name__}: {str(e)}")
        return None
        
    finally:
        # 리소스 정리
        if generator and generator.doc:
            try:
                generator.doc.close()
            except Exception as cleanup_error:
                print(f"⚠️ 리소스 정리 경고: {cleanup_error}")
            generator.doc = None

# 테스트용 메인 함수
if __name__ == "__main__":
    # 테스트 데이터
    test_insights = """
## 📊 전체 현황 요약
AWS Demo Factory 웹사이트의 분석 결과, 총 28명의 방문자가 5개의 콘텐츠를 조회했습니다.

## 🔍 핵심 인사이트
1. **피크 시간대 집중**: 14:00-15:00 시간대에 전체 방문의 85.7%가 집중되어 있어 특정 시간대 선호도가 뚜렷합니다.
2. **카테고리별 선호도**: Manufacturing 분야가 전체 조회의 25%를 차지하며 가장 높은 관심도를 보입니다.
3. **콘텐츠 다양성 부족**: 현재 5개 콘텐츠 중 'test1'이라는 테스트 콘텐츠가 1개 포함되어 있어 실제 콘텐츠의 다양성이 제한적입니다.

## 💡 권장사항
1. 피크 시간대인 오후 2-3시에 새로운 콘텐츠 업로드 및 마케팅 활동 집중
2. Manufacturing 분야의 고품질 콘텐츠 확충
3. 테스트 콘텐츠 제거 및 실제 가치 있는 콘텐츠로 대체
    """
    
    test_data = {
        'totalVisitors': 28,
        'totalPageViews': 45,
        'totalContentViews': 12,
        'period': '최근 7일',
        'chartData': [
            {
                'type': 'bar',
                'title': '카테고리별 조회수',
                'data': {
                    'labels': ['Manufacturing', 'Retail/CPG', 'Finance', 'Telco/Media'],
                    'values': [7, 4, 2, 3]
                }
            },
            {
                'type': 'pie',
                'title': '접속 목적 분포',
                'data': {
                    'labels': ['AWS Internal', '고객사 데모', '기타'],
                    'values': [15, 8, 5]
                }
            }
        ]
    }
    
    # PDF 생성 테스트
    pdf_bytes = generate_korean_pdf_report(test_insights, test_data, "test_report.pdf")
    
    if pdf_bytes:
        print(f"✅ 테스트 PDF 생성 성공! 크기: {len(pdf_bytes)} bytes")
    else:
        print("❌ 테스트 PDF 생성 실패")
