#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
차트 생성 전용 모듈 - 확실히 작동하는 차트
"""

from reportlab.graphics.shapes import Drawing, Rect, String, Line
from reportlab.lib import colors
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.graphics.charts.piecharts import Pie

def create_working_bar_chart(data, width=400, height=250):
    """확실히 작동하는 바 차트"""
    try:
        print(f"📊 바 차트 생성 시작: {data}")
        
        drawing = Drawing(width, height)
        
        if not data or not data.get('labels') or not data.get('values'):
            print("⚠️ 차트 데이터 없음")
            # 데이터 없음 표시
            drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "데이터 없음", textAnchor="middle", fontSize=14))
            return drawing
        
        labels = data['labels'][:5]  # 최대 5개
        values = data['values'][:5]
        
        print(f"📊 차트 데이터: labels={labels}, values={values}")
        
        if not values or all(v == 0 for v in values):
            print("⚠️ 모든 값이 0")
            drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "값 없음", textAnchor="middle", fontSize=14))
            return drawing
        
        # ReportLab 바 차트 생성
        chart = VerticalBarChart()
        chart.x = 50
        chart.y = 50
        chart.height = height - 100
        chart.width = width - 100
        chart.data = [values]  # 2차원 배열로 전달
        chart.categoryAxis.categoryNames = labels
        chart.valueAxis.valueMin = 0
        chart.valueAxis.valueMax = max(values) * 1.2
        
        # 바 색상 설정
        chart.bars[0].fillColor = colors.HexColor('#FF9900')
        chart.bars[0].strokeColor = colors.black
        chart.bars[0].strokeWidth = 1
        
        # 축 설정
        chart.categoryAxis.labels.boxAnchor = 'ne'
        chart.categoryAxis.labels.dx = 8
        chart.categoryAxis.labels.dy = -2
        chart.categoryAxis.labels.angle = 30
        chart.categoryAxis.labels.fontSize = 10
        
        chart.valueAxis.labels.fontSize = 10
        
        drawing.add(chart)
        
        # 제목 추가
        drawing.add(String(width//2, height-25, "카테고리별 조회수", 
                          textAnchor="middle", fontSize=14, fontName="Helvetica-Bold"))
        
        print("✅ 바 차트 생성 성공")
        return drawing
        
    except Exception as e:
        print(f"❌ 바 차트 생성 오류: {e}")
        import traceback
        print(f"상세 오류: {traceback.format_exc()}")
        
        # 오류 시 기본 차트
        drawing = Drawing(width, height)
        drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.pink, strokeColor=colors.red))
        drawing.add(String(width//2, height//2, f"차트 오류: {str(e)[:30]}", textAnchor="middle", fontSize=12))
        return drawing

def create_working_pie_chart(data, width=350, height=300):
    """확실히 작동하는 파이 차트"""
    try:
        print(f"🥧 파이 차트 생성 시작: {data}")
        
        drawing = Drawing(width, height)
        
        if not data or not data.get('labels') or not data.get('values'):
            print("⚠️ 파이 차트 데이터 없음")
            drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "데이터 없음", textAnchor="middle", fontSize=14))
            return drawing
        
        labels = data['labels'][:4]  # 최대 4개
        values = data['values'][:4]
        
        print(f"🥧 파이 차트 데이터: labels={labels}, values={values}")
        
        if not values or sum(values) == 0:
            print("⚠️ 파이 차트 값 없음")
            drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "값 없음", textAnchor="middle", fontSize=14))
            return drawing
        
        # ReportLab 파이 차트 생성
        pie = Pie()
        pie.x = width//2 - 80
        pie.y = height//2 - 60
        pie.width = 160
        pie.height = 160
        pie.data = values
        pie.labels = [f"{label}\n({value})" for label, value in zip(labels, values)]
        
        # 파이 슬라이스 설정
        pie.slices.strokeWidth = 2
        pie.slices.strokeColor = colors.white
        
        # 색상 설정
        colors_list = [
            colors.HexColor('#FF9900'),  # AWS 오렌지
            colors.HexColor('#232F3E'),  # AWS 네이비
            colors.HexColor('#4CAF50'),  # 녹색
            colors.HexColor('#2196F3')   # 파랑
        ]
        
        for i in range(len(values)):
            pie.slices[i].fillColor = colors_list[i % len(colors_list)]
        
        # 라벨 설정
        pie.slices.labelRadius = 1.2
        pie.slices.fontName = "Helvetica"
        pie.slices.fontSize = 9
        
        drawing.add(pie)
        
        # 제목 추가
        drawing.add(String(width//2, height-30, "카테고리 분포", 
                          textAnchor="middle", fontSize=14, fontName="Helvetica-Bold"))
        
        print("✅ 파이 차트 생성 성공")
        return drawing
        
    except Exception as e:
        print(f"❌ 파이 차트 생성 오류: {e}")
        import traceback
        print(f"상세 오류: {traceback.format_exc()}")
        
        # 오류 시 기본 차트
        drawing = Drawing(width, height)
        drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.pink, strokeColor=colors.red))
        drawing.add(String(width//2, height//2, f"파이차트 오류: {str(e)[:30]}", textAnchor="middle", fontSize=12))
        return drawing

def create_simple_line_chart(data, width=400, height=200):
    """간단한 라인 차트 (시간대별 데이터용)"""
    try:
        print(f"📈 라인 차트 생성 시작: {data}")
        
        drawing = Drawing(width, height)
        
        if not data or not data.get('labels') or not data.get('values'):
            drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "시간대 데이터 없음", textAnchor="middle", fontSize=14))
            return drawing
        
        labels = data['labels']
        values = data['values']
        
        if not values or max(values) == 0:
            drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.lightgrey, strokeColor=colors.black))
            drawing.add(String(width//2, height//2, "시간대 값 없음", textAnchor="middle", fontSize=14))
            return drawing
        
        # 차트 영역
        chart_x = 60
        chart_y = 40
        chart_width = width - 120
        chart_height = height - 80
        
        # 축 그리기
        drawing.add(Line(chart_x, chart_y, chart_x + chart_width, chart_y, strokeColor=colors.black))  # X축
        drawing.add(Line(chart_x, chart_y, chart_x, chart_y + chart_height, strokeColor=colors.black))  # Y축
        
        # 데이터 포인트 그리기
        max_value = max(values)
        point_width = chart_width / (len(values) - 1) if len(values) > 1 else chart_width
        
        for i, (label, value) in enumerate(zip(labels, values)):
            x = chart_x + i * point_width
            y = chart_y + (value / max_value) * chart_height if max_value > 0 else chart_y
            
            # 포인트 그리기
            drawing.add(Rect(x-3, y-3, 6, 6, fillColor=colors.HexColor('#FF9900'), strokeColor=colors.black))
            
            # 라벨
            drawing.add(String(x, chart_y - 15, str(label), textAnchor="middle", fontSize=9))
            
            # 값
            drawing.add(String(x, y + 10, str(value), textAnchor="middle", fontSize=9))
            
            # 라인 연결
            if i > 0:
                prev_x = chart_x + (i-1) * point_width
                prev_y = chart_y + (values[i-1] / max_value) * chart_height if max_value > 0 else chart_y
                drawing.add(Line(prev_x, prev_y, x, y, strokeColor=colors.HexColor('#FF9900'), strokeWidth=2))
        
        # 제목
        drawing.add(String(width//2, height-20, "시간대별 활동", 
                          textAnchor="middle", fontSize=14, fontName="Helvetica-Bold"))
        
        print("✅ 라인 차트 생성 성공")
        return drawing
        
    except Exception as e:
        print(f"❌ 라인 차트 생성 오류: {e}")
        drawing = Drawing(width, height)
        drawing.add(Rect(20, 20, width-40, height-40, fillColor=colors.pink, strokeColor=colors.red))
        drawing.add(String(width//2, height//2, f"라인차트 오류", textAnchor="middle", fontSize=12))
        return drawing

if __name__ == "__main__":
    # 테스트
    test_data = {
        'labels': ['Manufacturing', 'Generative AI', 'Retail/CPG', 'Finance'],
        'values': [9, 7, 6, 6]
    }
    
    print("차트 생성 테스트 시작...")
    bar_chart = create_working_bar_chart(test_data)
    pie_chart = create_working_pie_chart(test_data)
    print("차트 생성 테스트 완료")
