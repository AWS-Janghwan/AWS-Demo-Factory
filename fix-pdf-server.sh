#!/bin/bash

echo "🔧 PDF 서버 의존성 문제 해결 중..."

cd /data/AWS-Demo-Factory/python-pdf-server

# 가상환경 활성화
if [ -d "venv" ]; then
    echo "📦 기존 가상환경 활성화..."
    source venv/bin/activate
else
    echo "📦 새 가상환경 생성..."
    python3 -m venv venv
    source venv/bin/activate
fi

# requirements.txt 설치
echo "📚 Python 패키지 설치 중..."
if [ -f "requirements.txt" ]; then
    pip install -r requirements.txt
    echo "✅ requirements.txt 설치 완료"
else
    echo "📦 필수 패키지 개별 설치..."
    pip install flask flask-cors requests python-dotenv reportlab PyMuPDF numpy pandas matplotlib seaborn Pillow
    echo "✅ 필수 패키지 설치 완료"
fi

# 설치 확인
echo "🔍 설치 확인..."
python3 -c "import reportlab; print('✅ reportlab 설치 확인')" 2>/dev/null || echo "❌ reportlab 설치 실패"
python3 -c "import flask; print('✅ flask 설치 확인')" 2>/dev/null || echo "❌ flask 설치 실패"

cd ..

# PDF 서버 재시작
echo "🔄 PDF 서버 재시작..."
./unified-server-manager.sh restart pdf

echo "🎉 PDF 서버 수정 완료!"