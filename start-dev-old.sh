#!/bin/bash

echo "🚀 Starting AWS Demo Factory with SES Email Service..."

# AWS 자격 증명 설정 - .env 파일에서 가져오기
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo "✅ AWS credentials loaded from .env file"
else
  echo "⚠️  Warning: .env file not found. Please set AWS credentials manually."
fi

# 이미 실행 중인 프로세스 확인 및 종료
echo "🔍 Checking for existing processes..."

# 포트 3000 (React) 정리
if lsof -i:3000 > /dev/null 2>&1; then
  echo "🔄 Killing process on port 3000 (React)"
  kill -9 $(lsof -t -i:3000) 2>/dev/null || true
fi

# 포트 5000 (기존 서버) 정리
if lsof -i:5000 > /dev/null 2>&1; then
  echo "🔄 Killing process on port 5000"
  kill -9 $(lsof -t -i:5000) 2>/dev/null || true
fi

# 포트 5004 (SES 서버) 정리
if lsof -i:5004 > /dev/null 2>&1; then
  echo "🔄 Killing process on port 5004 (SES Server)"
  kill -9 $(lsof -t -i:5004) 2>/dev/null || true
fi

# AWS SES 서버 백그라운드 시작
echo "📧 Starting AWS SES Email Server (Port 5004)..."
node working-server.js &
SES_PID=$!

# 서버 시작 대기
sleep 2

# SES 서버 상태 확인
if curl -s http://localhost:5004/api/health > /dev/null; then
  echo "✅ AWS SES Server is running successfully!"
else
  echo "❌ Failed to start AWS SES Server"
  kill $SES_PID 2>/dev/null || true
  exit 1
fi

# React 개발 서버 시작
echo "⚛️  Starting React Development Server (Port 3000)..."
echo "🌐 Frontend: http://localhost:3000"
echo "📧 SES API: http://localhost:5004"
echo ""
echo "📝 Ready to handle inquiries with AWS SES email delivery!"
echo "Press Ctrl+C to stop both servers"
echo ""

# 종료 시 SES 서버도 함께 종료하는 트랩 설정
cleanup() {
  echo ""
  echo "🛑 Shutting down servers..."
  kill $SES_PID 2>/dev/null || true
  echo "✅ Cleanup completed"
  exit 0
}

trap cleanup EXIT INT TERM

# React 서버 실행 (포그라운드)
PORT=3000 npm start
