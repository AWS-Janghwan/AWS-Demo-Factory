#!/bin/bash

echo "🐍 Python 패키지 백그라운드 설치 시작..."
echo "⏰ 시작 시간: $(date)"

cd /data/AWS-Demo-Factory/python-pdf-server

# 가상환경 활성화
source venv/bin/activate

# 추가 패키지 설치 (백그라운드에서)
echo "📦 추가 Python 패키지 설치 중..."

# uv 사용 가능하면 고속 설치
if command -v uv >/dev/null 2>&1; then
    echo "⚡ uv로 고속 설치 중..."
    uv pip install -r requirements.txt 2>/dev/null || {
        echo "⚠️ uv 전체 설치 실패, 최소 패키지만 설치..."
        uv pip install python-dotenv reportlab 2>/dev/null || true
    }
else
    pip install --quiet python-dotenv reportlab PyMuPDF matplotlib pandas numpy pillow seaborn 2>/dev/null || {
        echo "⚠️ 일부 패키지 설치 실패, 필수 패키지만 재시도..."
        pip install python-dotenv reportlab 2>/dev/null || true
    }
fi

# 설치 완료 확인
python -c "import flask, flask_cors, requests" 2>/dev/null && echo "✅ 기본 Python 모듈 정상" || echo "❌ 기본 Python 모듈 오류"
python -c "import reportlab" 2>/dev/null && echo "✅ PDF 생성 모듈 정상" || echo "⚠️ PDF 생성 모듈 누락"

echo "⏰ 완료 시간: $(date)"
echo "🎉 Python 패키지 백그라운드 설치 완료!"