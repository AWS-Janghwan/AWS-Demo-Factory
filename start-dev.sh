#!/bin/bash

# AWS Demo Factory 개발 서버 시작 스크립트 (AI 기능 + 한글 PDF 포함)

echo "🚀 AWS Demo Factory 개발 환경 시작..."

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# Node.js 및 Python 버전 확인
echo "📋 Node.js 버전: $(node --version)"
echo "🐍 Python 버전: $(python3 --version)"

# AWS 자격 증명 확인
echo "🔑 AWS 자격 증명 확인..."
aws configure list

# 환경 변수 로드
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✅ 환경 변수 로드 완료"
else
  echo "⚠️ .env 파일이 없습니다."
fi

# 기존 서버 프로세스 정리
echo "🧹 기존 서버 프로세스 정리..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true

# 포트별 프로세스 정리
for port in 3000 5001 5002 5004; do
  if lsof -i:$port > /dev/null 2>&1; then
    echo "🔄 포트 $port 정리 중..."
    kill -9 $(lsof -t -i:$port) 2>/dev/null || true
  fi
done

# 1. Python PDF 서버 시작 (포트 5002)
echo "🐍 Python PDF 서버 시작 중..."
cd python-pdf-server

# 가상환경 생성 (없는 경우)
if [ ! -d "venv" ]; then
    echo "📦 Python 가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화 및 의존성 설치
source venv/bin/activate
# uv 사용 가능하면 고속 설치
if command -v uv >/dev/null 2>&1; then
    echo "⚡ uv로 고속 설치 중..."
    uv pip install -r requirements.txt > /dev/null 2>&1
else
    pip install -r requirements.txt > /dev/null 2>&1
fi

# Python 서버 백그라운드 실행
python3 app.py &
PYTHON_PID=$!
echo $PYTHON_PID > ../python-pdf-server.pid
echo "✅ Python PDF 서버 시작됨 (PID: $PYTHON_PID, 포트: 5002)"

cd ..

# 2. Bedrock API 서버 시작 (포트 5001)
echo "🤖 Bedrock API 서버 시작 중..."
node server/bedrock-api.js &
BEDROCK_PID=$!
echo $BEDROCK_PID > bedrock-server.pid
echo "✅ Bedrock API 서버 시작됨 (PID: $BEDROCK_PID, 포트: 5001)"

# 3. 백엔드 서버 시작 (포트 3001)
echo "🖥️ 백엔드 서버 시작 중..."
node backend-api-server.js &
BACKEND_PID=$!
echo $BACKEND_PID > backend-server.pid
echo "✅ 백엔드 서버 시작됨 (PID: $BACKEND_PID, 포트: 3001)"

# 서버 시작 대기
sleep 5

# 서버 상태 확인
echo "🔍 서버 상태 확인 중..."

# Python PDF 서버 테스트
if curl -s http://localhost:5002/health > /dev/null; then
  echo "✅ Python PDF 서버 정상 동작"
else
  echo "⚠️ Python PDF 서버 응답 없음"
fi

# Bedrock API 테스트
if curl -s http://localhost:5001/api/bedrock/test > /dev/null; then
  echo "✅ Bedrock API 서버 정상 동작"
else
  echo "⚠️ Bedrock API 서버 응답 없음"
fi

# 백엔드 API 테스트
if curl -s http://localhost:3001/api/health > /dev/null; then
  echo "✅ 백엔드 서버 정상 동작"
else
  echo "⚠️ 백엔드 서버 응답 없음"
fi

echo ""
echo "🎉 백엔드 서버들이 시작되었습니다!"
echo ""
echo "📋 서버 정보:"
echo "  🐍 Python PDF: http://localhost:5002"
echo "  🤖 Bedrock API: http://localhost:5001"
echo "  🖥️ 백엔드 API: http://localhost:3001"
echo ""
echo "🔗 주요 URL:"
echo "  🧪 PDF 테스트: http://localhost:5002/test-pdf"
echo "  🤖 AI 기능 테스트: http://localhost:5001/api/bedrock/test"
echo "  📧 이메일 API: http://localhost:3001/api/health"
echo ""

# 종료 시그널 처리
cleanup() {
  echo ""
  echo "🛑 서버 종료 중..."
  kill $PYTHON_PID $BEDROCK_PID $BACKEND_PID 2>/dev/null || true
  rm -f python-pdf-server.pid bedrock-server.pid backend-server.pid
  echo "✅ 정리 완료"
  exit 0
}

trap cleanup EXIT INT TERM

# 4. React 개발 서버 시작 (포그라운드)
echo "⚛️ React 개발 서버 시작 중..."
echo "🌐 React 앱: http://localhost:3000"
echo "📊 관리자 대시보드: http://localhost:3000/admin"
echo ""
echo "✨ 개발 환경 준비 완료! AI 기능과 한글 PDF 생성을 포함한 모든 서버가 실행 중입니다."
echo "Press Ctrl+C to stop all servers"
echo ""

PORT=3000 npm start
