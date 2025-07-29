#!/bin/bash

echo "🚀 ApplicationStart 단계 시작..."
echo "⏰ 시작 시간: $(date)"

cd /data/AWS-Demo-Factory

# 현재 디렉토리 확인
echo "📁 현재 디렉토리: $(pwd)"

# 빌드 파일 존재 확인
if [ ! -f "build/index.html" ]; then
    echo "❌ build/index.html이 없습니다. 빌드를 다시 실행합니다."
    npm run build
fi

# 통합 서버 관리자 실행 권한 확인 및 설정
chmod +x unified-server-manager.sh

# 통합 서버 관리자를 통한 서버 시작
echo "🚀 통합 서버 관리자로 모든 서버 시작 중..."
echo "📍 실행 파일 확인: $(ls -la unified-server-manager.sh)"

if bash ./unified-server-manager.sh start > server-start.log 2>&1; then
    echo "✅ 모든 서버 시작 완료"
    echo "📄 서버 시작 로그:"
    tail -20 server-start.log
else
    echo "⚠️ 서버 시작 중 오류 발생"
    echo "📄 로그 파일 확인: server-start.log"
    echo "🔍 오류 내용:"
    tail -20 server-start.log
    echo "🔄 대체 방법으로 서버 시작 시도..."
    
    # 각 서버를 개별적으로 시작
    echo "📱 정적 서버 시작 (3000 포트)..."
    nohup node simple-static-server.js > logs/static.log 2>&1 &
    echo $! > pids/static.pid
    
    echo "🔌 백엔드 API 서버 시작 (3001 포트)..."
    nohup node backend-api-server.js > logs/backend.log 2>&1 &
    echo $! > pids/backend.pid
    
    echo "🤖 Bedrock API 서버 시작 (5001 포트)..."
    nohup node server/bedrock-api.js > logs/bedrock.log 2>&1 &
    echo $! > pids/bedrock.pid
    
    echo "📄 Python PDF 서버 시작 (5002 포트)..."
    cd python-pdf-server && nohup python app.py > ../logs/pdf.log 2>&1 &
    echo $! > ../pids/pdf.pid
    cd ..
    
    echo "✅ 대체 서버 시작 완료"
fi

# 짧은 대기 후 상태 확인
echo "⏳ 서버 초기화 대기 (30초)..."
sleep 30

# 통합 서버 상태 확인
echo "🔍 서버 상태 확인..."
if [ -f "unified-server-manager.sh" ]; then
    ./unified-server-manager.sh status
else
    echo "⚠️ unified-server-manager.sh 파일이 없습니다. 개별 서버 상태 확인..."
    
    # 개별 서버 상태 확인
    echo "📊 포트별 서버 상태:"
    for port in 3000 3001 5001 5002; do
        if lsof -i:$port > /dev/null 2>&1; then
            echo "✅ 포트 $port: 실행 중"
        else
            echo "❌ 포트 $port: 중지됨"
        fi
    done
    
    # 프로세스 확인
    echo "🔍 관련 프로세스:"
    ps aux | grep -E "(node|python)" | grep -v grep || echo "관련 프로세스 없음"
fi

# 배포 환경 동기화 확인
echo "🔗 배포 환경 동기화 상태 확인..."
echo "📡 백엔드 API 헬스체크:"
curl -s --max-time 10 http://localhost:3001/health 2>/dev/null | head -5 || echo "❌ 백엔드 API 응답 없음"

echo "📡 백엔드 API CORS 테스트:"
curl -X OPTIONS http://localhost:3001/api/health \
  -H "Origin: https://demofactory.cloud" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type" \
  -v 2>&1 | grep -E "(Access-Control|HTTP)" || echo "❌ CORS 테스트 실패"

echo "📡 Bedrock API 헬스체크:"
curl -s --max-time 10 http://localhost:5001/api/bedrock/test 2>/dev/null | head -5 || echo "❌ Bedrock API 응답 없음"

echo "📡 PDF 서버 헬스체크:"
curl -s --max-time 10 http://localhost:5002/health 2>/dev/null | head -5 || echo "❌ PDF 서버 응답 없음"

echo "⏰ 완료 시간: $(date)"
echo "🎉 ApplicationStart 단계 완료!" 
