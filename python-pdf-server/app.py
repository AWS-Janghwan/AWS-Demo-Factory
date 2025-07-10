#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AWS Demo Factory - 고급 한글 분석 리포트 생성 서버
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import json
import base64
import io
from datetime import datetime
from advanced_korean_report import create_advanced_korean_report

app = Flask(__name__)
CORS(app, origins=[
    'http://localhost:3000', 
    'http://localhost:3001',
    'https://demofactory.cloud',
    'https://www.demofactory.cloud'
])

@app.route('/health', methods=['GET'])
def health_check():
    """서버 상태 확인"""
    return jsonify({
        'status': 'healthy',
        'service': 'AWS Demo Factory PDF Generator',
        'timestamp': datetime.now().isoformat(),
        'version': '8.0.0 - Advanced Korean Report with Working Charts'
    })

@app.route('/generate-pdf', methods=['POST'])
def generate_pdf():
    """고급 한글 분석 리포트 생성"""
    try:
        print("📊 고급 한글 분석 리포트 생성 요청 받음")
        
        # 요청 데이터 파싱
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': '요청 데이터가 없습니다.'
            }), 400
        
        ai_insights = data.get('aiInsights', '')
        analytics_data = data.get('analyticsData', {})
        
        print(f"🤖 AI 인사이트 길이: {len(ai_insights)}")
        print(f"📊 분석 데이터: {list(analytics_data.keys()) if isinstance(analytics_data, dict) else type(analytics_data)}")
        
        # 고급 한글 분석 리포트 생성
        pdf_bytes = create_advanced_korean_report(ai_insights, analytics_data)
        
        if not pdf_bytes:
            return jsonify({
                'success': False,
                'error': 'PDF 생성에 실패했습니다.'
            }), 500
        
        # Base64 인코딩
        pdf_base64 = base64.b64encode(pdf_bytes).decode('utf-8')
        
        # 파일명 생성
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"AWS_Demo_Factory_고급분석리포트_{timestamp}.pdf"
        
        print(f"✅ 고급 한글 리포트 생성 성공: {len(pdf_bytes)} bytes")
        
        return jsonify({
            'success': True,
            'filename': filename,
            'pdf_data': pdf_base64,
            'size': len(pdf_bytes),
            'generated_at': datetime.now().isoformat(),
            'generator': 'Advanced Korean Analytics Report Generator v8.0'
        })
        
    except Exception as e:
        print(f"❌ PDF 생성 오류: {e}")
        import traceback
        print(f"🔍 상세 오류:\n{traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'error': f'서버 오류: {str(e)}'
        }), 500

@app.route('/test-pdf', methods=['GET'])
def test_pdf():
    """고급 한글 리포트 테스트"""
    try:
        test_insights = "카테고리별 세분화된 분석과 시각적 차트가 포함된 종합 리포트입니다."
        
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
                {'title': 'AWS 제조업 솔루션 종합 가이드', 'views': 6},
                {'title': 'Generative AI 실무 적용 사례', 'views': 3},
                {'title': '클라우드 마이그레이션 전략 수립', 'views': 2},
                {'title': '데이터 분석 프레임워크 구축', 'views': 2},
                {'title': '보안 아키텍처 설계 가이드', 'views': 1}
            ],
            'time': [
                {'hour': 14, 'count': 13},
                {'hour': 15, 'count': 11},
                {'hour': 16, 'count': 4},
                {'hour': 17, 'count': 3},
                {'hour': 18, 'count': 1}
            ]
        }
        
        pdf_bytes = create_advanced_korean_report(test_insights, test_data)
        
        if pdf_bytes:
            pdf_io = io.BytesIO(pdf_bytes)
            pdf_io.seek(0)
            
            return send_file(
                pdf_io,
                mimetype='application/pdf',
                as_attachment=True,
                download_name='고급_한글_분석_리포트.pdf'
            )
        else:
            return jsonify({'error': 'PDF 생성 실패'}), 500
            
    except Exception as e:
        print(f"❌ 테스트 PDF 오류: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 고급 한글 분석 리포트 생성 서버 시작...")
    print("📊 카테고리별 세분화 + 확실한 차트 + 완벽한 한글")
    print("🔗 서버 URL: http://localhost:5002")
    print("🧪 테스트 URL: http://localhost:5002/test-pdf")
    
    app.run(
        host='0.0.0.0',
        port=5002,
        debug=True
    )
