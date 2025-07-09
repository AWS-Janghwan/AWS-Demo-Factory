#!/bin/bash

# AWS Demo Factory 개발 서버 중지 스크립트

echo "🛑 AWS Demo Factory 개발 서버 중지 중..."

# PID 파일들에서 서버 PID 읽기 및 종료
if [ -f "bedrock-server.pid" ]; then
    BEDROCK_PID=$(cat bedrock-server.pid)
    echo "🤖 Bedrock API 서버 중지 중... (PID: $BEDROCK_PID)"
    kill $BEDROCK_PID 2>/dev/null && echo "✅ Bedrock API 서버 중지됨" || echo "⚠️ Bedrock API 서버 이미 중지됨"
    rm bedrock-server.pid
fi

if [ -f "backend-server.pid" ]; then
    BACKEND_PID=$(cat backend-server.pid)
    echo "🖥️ 백엔드 서버 중지 중... (PID: $BACKEND_PID)"
    kill $BACKEND_PID 2>/dev/null && echo "✅ 백엔드 서버 중지됨" || echo "⚠️ 백엔드 서버 이미 중지됨"
    rm backend-server.pid
fi

if [ -f "react-server.pid" ]; then
    REACT_PID=$(cat react-server.pid)
    echo "⚛️ React 서버 중지 중... (PID: $REACT_PID)"
    kill $REACT_PID 2>/dev/null && echo "✅ React 서버 중지됨" || echo "⚠️ React 서버 이미 중지됨"
    rm react-server.pid
fi

# 포트별로 남은 프로세스 정리
echo "🧹 포트별 프로세스 정리 중..."
for port in 3000 5001 5004; do
  PID=$(lsof -ti:$port 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "🔄 포트 $port 사용 중인 프로세스 종료... (PID: $PID)"
    kill -9 $PID 2>/dev/null
  fi
done

# Node.js 관련 프로세스 정리
echo "🧹 Node.js 프로세스 정리 중..."
pkill -f "node.*server" 2>/dev/null || true
pkill -f "react-scripts start" 2>/dev/null || true

echo "✅ 모든 개발 서버가 중지되었습니다."
