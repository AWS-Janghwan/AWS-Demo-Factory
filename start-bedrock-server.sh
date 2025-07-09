#!/bin/bash

# AWS Demo Factory - Bedrock API 서버 시작 스크립트

echo "🚀 AWS Demo Factory Bedrock API 서버 시작..."

# Node.js 버전 확인
echo "📋 Node.js 버전 확인..."
node --version

# AWS 자격 증명 확인
echo "🔑 AWS 자격 증명 확인..."
aws configure list

# Bedrock API 서버 시작
echo "🤖 Bedrock API 서버 시작 중..."
cd "$(dirname "$0")"

# 백그라운드에서 서버 실행
node server/bedrock-api.js &

# 서버 PID 저장
BEDROCK_PID=$!
echo $BEDROCK_PID > bedrock-server.pid

echo "✅ Bedrock API 서버가 포트 5001에서 실행 중입니다."
echo "🔗 테스트 URL: http://localhost:5001/api/bedrock/test"
echo "📝 서버 PID: $BEDROCK_PID"
echo ""
echo "서버를 중지하려면: kill $BEDROCK_PID"
echo "또는: ./stop-bedrock-server.sh"

# 서버 상태 확인
sleep 3
echo "🔍 서버 상태 확인 중..."
curl -s http://localhost:5001/api/bedrock/test | jq . || echo "서버 응답 대기 중..."
