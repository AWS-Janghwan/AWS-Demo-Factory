#!/bin/bash

echo "🚀 AWS Demo Factory 프로덕션 서버 시작..."

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# 기존 프로세스 종료
echo "🧹 기존 프로세스 정리 중..."
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock" 2>/dev/null || true  
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "node.*static-server" 2>/dev/null || true
pkill -f "serve.*build" 2>/dev/null || true

# 포트 정리
for port in 3000 3001 5001 5002; do
  if lsof -i:$port > /dev/null 2>&1; then
    echo "🔄 포트 $port 정리 중..."
    kill -9 $(lsof -t -i:$port) 2>/dev/null || true
  fi
done

sleep 2

# 1. Python PDF 서버 시작 (포트 5002)
echo "🐍 Python PDF 서버 시작 중..."
cd python-pdf-server

# 가상환경 확인 및 활성화
if [ ! -d "venv" ]; then
    echo "📦 Python 가상환경 생성 중..."
    # uv로 가상환경 및 패키지 설치 (고속)
    if command -v uv >/dev/null 2>&1; then
        uv venv venv
        source venv/bin/activate
        uv pip install -r requirements-fast.txt
    else
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements-minimal.txt
    fi
else
    source venv/bin/activate
fi

# Python 모듈 테스트
if python -c "import flask, flask_cors, requests; print('✅ 모든 Python 모듈 정상')" 2>/dev/null; then
    nohup python app.py > ../pdf-server.log 2>&1 &
    PDF_PID=$!
    echo $PDF_PID > ../python-pdf-server.pid
    echo "✅ Python PDF 서버 시작됨 (PID: $PDF_PID, 포트: 5002)"
else
    echo "❌ Python 모듈 오류 - PDF 서버 시작 실패"
fi

cd ..

# 2. Bedrock API 서버 시작 (포트 5001)
echo "🤖 Bedrock API 서버 시작 중..."
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

# 4. React 앱 빌드 확인 및 정적 서버 시작 (포트 3000)
echo "⚛️ React 앱 빌드 확인 중..."
if [ ! -d "build" ] || [ ! -f "build/index.html" ]; then
    echo "📦 React 앱 빌드 중..."
    npm run build
fi

if [ -f "build/index.html" ]; then
    echo "🌐 정적 파일 서버 시작 중..."
    nohup node simple-static-server.js > static-server.log 2>&1 &
    STATIC_PID=$!
    echo $STATIC_PID > static-server.pid
    echo "✅ 정적 파일 서버 시작됨 (PID: $STATIC_PID, 포트: 3000)"
else
    echo "❌ build/index.html을 찾을 수 없습니다. React 빌드를 확인하세요."
fi

# 서버 시작 대기
echo "⏳ 서버 초기화 대기 중..."
sleep 10

# 서버 상태 확인
echo "🔍 서버 상태 확인 중..."

# Python PDF 서버 테스트
if curl -s http://localhost:5002/health > /dev/null 2>&1; then
  echo "✅ Python PDF 서버 정상 동작 (포트: 5002)"
else
  echo "⚠️ Python PDF 서버 응답 없음"
fi

# Bedrock API 테스트
if curl -s http://localhost:5001/api/bedrock/test > /dev/null 2>&1; then
  echo "✅ Bedrock API 서버 정상 동작 (포트: 5001)"
else
  echo "⚠️ Bedrock API 서버 응답 없음"
fi

# 백엔드 API 테스트
if curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "✅ 백엔드 API 서버 정상 동작 (포트: 3001)"
else
  echo "⚠️ 백엔드 API 서버 응답 없음"
fi

# 정적 파일 서버 테스트
if curl -s http://localhost:3000 | grep -q "AWS Demo Factory" 2>/dev/null; then
  echo "✅ 정적 파일 서버 정상 동작 (포트: 3000)"
else
  echo "⚠️ 정적 파일 서버 응답 없음"
fi

echo ""
echo "🎉 프로덕션 서버 시작 완료!"
echo ""
echo "📋 서버 정보:"
echo "  🌐 웹 애플리케이션: http://localhost:3000"
echo "  🖥️ 백엔드 API: http://localhost:3001"
echo "  🤖 Bedrock API: http://localhost:5001"
echo "  🐍 Python PDF: http://localhost:5002"
echo ""
echo "🔗 프로덕션 URL:"
echo "  🌍 메인 사이트: https://demofactory.cloud"
echo "  💬 채팅 서비스: https://chat.demofactory.cloud"
echo ""
echo "📊 로그 파일:"
echo "  - static-server.log (정적 파일 서버)"
echo "  - backend-api.log (백엔드 API)"
echo "  - bedrock-server.log (Bedrock API)"
echo "  - pdf-server.log (Python PDF)"
echo ""
echo "✨ 모든 서버가 백그라운드에서 실행 중입니다."
