#!/bin/bash

echo "🚀 AWS Demo Factory 프로덕션 서버 시작..."

# 기존 프로세스 종료
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock-api.js" 2>/dev/null || true  
pkill -f "node.*backend-api-server.js" 2>/dev/null || true

# 1. Python PDF 서버 시작 (포트 5002)
echo "🐍 Python PDF 서버 시작 중..."
cd /data/AWS-Demo-Factory/python-pdf-server
source venv/bin/activate
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

# 잠시 대기
sleep 3

echo ""
echo "🎉 모든 백엔드 서버가 시작되었습니다!"
echo ""
echo "📋 서버 정보:"
echo "  🐍 Python PDF: http://localhost:5002"
echo "  🤖 Bedrock API: http://localhost:5001"  
echo "  🖥️ 백엔드 API: http://localhost:3001"
echo ""
echo "🔗 주요 URL:"
echo "  🧪 PDF 테스트: http://localhost:5002/test-pdf"
echo "  🤖 AI 기능 테스트: http://localhost:5001/api/bedrock/test"
echo "  📧 백엔드 API: http://localhost:3001/api/health"
echo ""

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
if curl -s http://localhost:3001/health > /dev/null; then
  echo "✅ 백엔드 API 서버 정상 동작"
else
  echo "⚠️ 백엔드 API 서버 응답 없음"
fi

echo ""
echo "✨ 프로덕션 환경 준비 완료!"
