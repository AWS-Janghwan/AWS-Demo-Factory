#!/bin/bash

echo "🚀 AWS Demo Factory 프로덕션 서버 시작..."

# 기존 프로세스 종료
echo "🛑 기존 프로세스 종료 중..."
pkill -f "python.*app.py" 2>/dev/null || true
pkill -f "node.*bedrock-api.js" 2>/dev/null || true  
pkill -f "node.*backend-api-server.js" 2>/dev/null || true

# PID 파일 정리
rm -f python-pdf-server.pid bedrock-server.pid backend-server.pid static-server.pid

# 로그 파일 생성 및 권한 설정
touch pdf-server.log bedrock-server.log backend-api.log static-server.log
chmod 666 *.log 2>/dev/null || true

# 1. Python PDF 서버 시작 (포트 5002)
echo "🐍 Python PDF 서버 시작 중..."
cd python-pdf-server

# 가상환경 활성화 확인
if [ ! -d "venv" ]; then
    echo "❌ Python 가상환경이 없습니다. 생성 중..."
    python3 -m venv venv
    source venv/bin/activate
    pip install --upgrade pip
    pip install flask flask-cors requests python-dotenv reportlab matplotlib pandas numpy seaborn Pillow PyMuPDF
else
    source venv/bin/activate
fi

# Flask 모듈 확인
python -c "import flask" 2>/dev/null || {
    echo "❌ Flask 모듈이 없습니다. 설치 중..."
    pip install flask flask-cors requests python-dotenv reportlab matplotlib pandas numpy seaborn Pillow PyMuPDF
}

# Python 서버 시작
nohup python app.py > ../pdf-server.log 2>&1 &
PDF_PID=$!
echo $PDF_PID > ../python-pdf-server.pid 2>/dev/null || echo "⚠️ PID 파일 쓰기 실패"
echo "✅ Python PDF 서버 시작됨 (PID: $PDF_PID, 포트: 5002)"

# 2. Bedrock API 서버 시작 (포트 5001)
echo "🤖 Bedrock API 서버 시작 중..."
cd /data/AWS-Demo-Factory
nohup node server/bedrock-api.js > bedrock-server.log 2>&1 &
BEDROCK_PID=$!
echo $BEDROCK_PID > bedrock-server.pid 2>/dev/null || echo "⚠️ PID 파일 쓰기 실패"
echo "✅ Bedrock API 서버 시작됨 (PID: $BEDROCK_PID, 포트: 5001)"

# 3. 백엔드 API 서버 시작 (포트 3001)
echo "🖥️ 백엔드 API 서버 시작 중..."
nohup node backend-api-server.js > backend-api.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend-server.pid 2>/dev/null || echo "⚠️ PID 파일 쓰기 실패"
echo "✅ 백엔드 API 서버 시작됨 (PID: $BACKEND_PID, 포트: 3001)"

# 4. 정적 파일 서버 시작 (포트 3000) - build 폴더가 있는 경우
if [ -d "build" ]; then
    echo "🌐 정적 파일 서버 시작 중..."
    nohup npx serve -s build -l 3000 > static-server.log 2>&1 &
    STATIC_PID=$!
    echo $STATIC_PID > static-server.pid 2>/dev/null || echo "⚠️ PID 파일 쓰기 실패"
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

# 포트 확인
echo "📊 포트 사용 현황:"
netstat -tlnp 2>/dev/null | grep -E ":(3000|3001|5001|5002)" || echo "  netstat 명령어 사용 불가"

# Python PDF 서버 테스트
sleep 2
if curl -s http://localhost:5002/health > /dev/null 2>&1; then
  echo "✅ Python PDF 서버 정상 동작"
elif curl -s http://localhost:5002 > /dev/null 2>&1; then
  echo "✅ Python PDF 서버 응답 (health endpoint 없음)"
else
  echo "⚠️ Python PDF 서버 응답 없음"
  echo "📋 PDF 서버 로그 (마지막 5줄):"
  tail -5 pdf-server.log 2>/dev/null || echo "  로그 파일 읽기 실패"
fi

# Bedrock API 테스트  
if curl -s http://localhost:5001/api/bedrock/test > /dev/null 2>&1; then
  echo "✅ Bedrock API 서버 정상 동작"
elif curl -s http://localhost:5001 > /dev/null 2>&1; then
  echo "✅ Bedrock API 서버 응답 (test endpoint 없음)"
else
  echo "⚠️ Bedrock API 서버 응답 없음"
fi

# 백엔드 API 테스트
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
  echo "✅ 백엔드 API 서버 정상 동작"
elif curl -s http://localhost:3001 > /dev/null 2>&1; then
  echo "✅ 백엔드 API 서버 응답 (health endpoint 없음)"
else
  echo "⚠️ 백엔드 API 서버 응답 없음"
fi

echo ""
echo "✨ 프로덕션 환경 준비 완료!"
echo "📊 실행 중인 프로세스:"
ps aux | grep -E "(python.*app.py|node.*bedrock|node.*backend|serve.*build)" | grep -v grep || echo "  프로세스 확인 실패"
