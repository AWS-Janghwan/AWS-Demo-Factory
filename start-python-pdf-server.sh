#!/bin/bash

# AWS Demo Factory - Python PDF 서버 시작 스크립트

echo "🐍 Python PDF 생성 서버 시작..."

# Python 버전 확인
echo "📋 Python 버전 확인..."
python3 --version

# 가상환경 생성 (없는 경우)
if [ ! -d "python-pdf-server/venv" ]; then
    echo "📦 Python 가상환경 생성 중..."
    cd python-pdf-server
    python3 -m venv venv
    cd ..
fi

# 가상환경 활성화
echo "🔧 가상환경 활성화..."
source python-pdf-server/venv/bin/activate

# 의존성 설치
echo "📦 Python 패키지 설치 중..."
pip install -r python-pdf-server/requirements.txt

# 서버 시작
echo "🚀 Python PDF 서버 시작 중..."
cd python-pdf-server

# 백그라운드에서 서버 실행
python3 app.py &

# 서버 PID 저장
PYTHON_PID=$!
echo $PYTHON_PID > ../python-pdf-server.pid

echo "✅ Python PDF 서버가 포트 5002에서 실행 중입니다."
echo "🔗 테스트 URL: http://localhost:5002/test-pdf"
echo "📝 서버 PID: $PYTHON_PID"
echo ""
echo "서버를 중지하려면: kill $PYTHON_PID"
echo "또는: ./stop-python-pdf-server.sh"

# 서버 상태 확인
sleep 3
echo "🔍 서버 상태 확인 중..."
curl -s http://localhost:5002/health | python3 -m json.tool || echo "서버 응답 대기 중..."
