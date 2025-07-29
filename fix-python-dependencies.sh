#!/bin/bash

echo "🐍 Python 의존성 설치 중..."

cd python-pdf-server

# 가상환경이 없으면 생성
if [ ! -d "venv" ]; then
    echo "📦 Python 가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 필수 패키지 설치
echo "📚 필수 패키지 설치 중..."
pip install --upgrade pip
pip install reportlab
pip install flask
pip install flask-cors
pip install boto3
pip install requests

echo "✅ Python 의존성 설치 완료"

# 설치된 패키지 확인
echo "🔍 설치된 패키지:"
pip list | grep -E "(reportlab|flask|boto3)"

cd ..