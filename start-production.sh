#!/bin/bash

echo "🚀 AWS Demo Factory 프로덕션 서버 시작..."

# 기존 프로세스 종료
echo "🛑 기존 프로세스 종료 중..."
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock-api.js" 2>/dev/null || true  
pkill -f "node.*backend-api-server.js" 2>/dev/null || true

# PID 파일 정리
rm -f python-pdf-server.pid bedrock-server.pid backend-server.pid

# 1. Python PDF 서버 시작 (포트 5002)
echo "🐍 Python PDF 서버 시작 중..."
cd /data/AWS-Demo-Factory/python-pdf-server

# 가상환경 활성화 확인
if [ ! -d "venv" ]; then
    echo "❌ Python 가상환경이 없습니다. 생성 중..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
else
    source venv/bin/activate
fi

# Flask 모듈 확인
python -c "import flask" 2>/dev/null || {
    echo "❌ Flask 모듈이 없습니다. 설치 중..."
    pip install -r requirements.txt
}

nohup python app.py > ../pdf-server.log 2>&1 &
PDF_PID=$!
echo $PDF_PID > ../python-pdf-server.pid
echo "✅ Python PDF 서버 시작됨 (PID: $PDF_PID, 포트: 5002)"

# 2. Bedrock API 서버 시작 (포트 5001)
echo "🤖 Bedrock API 서버 시작 중..."
cd /data/AWS-Demo-Factory
nohup node server/bedrock-api.js > bedrock-server.log 2>&1 &
BEDROCK_PID=$!
echo $BEDROCK_PID > bedrock-server.pid
echo "✅ Bedrock API 서버 시작됨 (PID: $BEDROCK_PID, 포트: 5001)"

# 3. 백엔드 API 서버 시작 (포트 3001)
echo "🖥️ 백엔드 API 서버 시작 중..."
nohup node backend-api-server.js > backend-api.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend-server.pid
echo "✅ 백엔드 API 서버 시작됨 (PID: $BACKEND_PID, 포트: 3001)"

# 4. 정적 파일 서버 시작 (포트 3000) - build 폴더가 있는 경우
if [ -d "build" ]; then
    echo "🌐 정적 파일 서버 시작 중..."
    nohup npx serve -s build -l 3000 > static-server.log 2>&1 &
    STATIC_PID=$!
    echo $STATIC_PID > static-server.pid
    echo "✅ 정적 파일 서버 시작됨 (PID: $STATIC_PID, 포트: 3000)"
else
    echo "⚠️ build 폴더가 없습니다. 정적 파일 서버를 시작할 수 없습니다."
fi

# 잠시 대기
sleep 5

echo ""
echo "🎉 모든 백엔드 서버가 시작되었습니다!"
echo ""
echo "📋 서버 정보:"
echo "  🐍 Python PDF: http://localhost:5002"
echo "  🤖 Bedrock API: http://localhost:5001"  
echo "  🖥️ 백엔드 API: http://localhost:3001"
if [ -d "build" ]; then
    echo "  🌐 웹 애플리케이션: http://localhost:3000"
fi
echo ""
echo "🔗 주요 URL:"
echo "  🧪 PDF 테스트: http://localhost:5002/health"
echo "  🤖 AI 기능 테스트: http://localhost:5001/api/bedrock/test"
echo "  📧 백엔드 API: http://localhost:3001/health"
echo ""

# 서버 상태 확인
echo "🔍 서버 상태 확인 중..."

# Python PDF 서버 테스트
sleep 2
if curl -s http://localhost:5002/health > /dev/null 2>&1; then
  echo "✅ Python PDF 서버 정상 동작"
else
  echo "⚠️ Python PDF 서버 응답 없음"
  echo "📋 PDF 서버 로그:"
  tail -5 pdf-server.log
fi

# Bedrock API 테스트  
if curl -s http://localhost:5001/api/bedrock/test > /dev/null 2>&1; then
  echo "✅ Bedrock API 서버 정상 동작"
else
  echo "⚠️ Bedrock API 서버 응답 없음"
fi

# 백엔드 API 테스트
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "✅ 백엔드 API 서버 정상 동작"
else
  echo "⚠️ 백엔드 API 서버 응답 없음"
fi

echo ""
echo "✨ 프로덕션 환경 준비 완료!"
echo "📊 실행 중인 프로세스:"
ps aux | grep -E "(python.*app.py|node.*bedrock|node.*backend|serve.*build)" | grep -v grep
