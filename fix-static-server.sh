#!/bin/bash

echo "🔧 정적 파일 서버 문제 해결 스크립트"
echo "=================================="
echo "📅 실행 시간: $(date)"
echo ""

cd /data/AWS-Demo-Factory 2>/dev/null || cd .

# 1. 현재 상태 진단
echo "🔍 1단계: 현재 상태 진단"
echo "----------------------"

# 포트 3000 응답 확인
if curl -s --max-time 5 http://localhost:3000 | grep -q "Index of" 2>/dev/null; then
    echo "⚠️ 문제 확인: 포트 3000에서 파일 리스트 표시됨"
    PROBLEM_DETECTED=true
elif curl -s --max-time 5 http://localhost:3000 | grep -q "AWS Demo Factory" 2>/dev/null; then
    echo "✅ 포트 3000: React 앱 정상 동작"
    PROBLEM_DETECTED=false
else
    echo "❌ 포트 3000: 응답 없음"
    PROBLEM_DETECTED=true
fi

# 2. 모든 관련 프로세스 강제 종료
echo ""
echo "🛑 2단계: 기존 프로세스 정리"
echo "-------------------------"

# 포트별로 프로세스 강제 종료
for port in 3000 3001 5001 5002; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "🔄 포트 $port 프로세스 종료 중..."
        kill -9 $(lsof -t -i:$port) 2>/dev/null || true
        sleep 1
    fi
done

# 관련 프로세스 패턴으로 종료
pkill -f "simple-static-server" 2>/dev/null || true
pkill -f "static-server" 2>/dev/null || true
pkill -f "serve.*build" 2>/dev/null || true
pkill -f "node.*bedrock" 2>/dev/null || true
pkill -f "node.*backend" 2>/dev/null || true
pkill -f "python.*app.py" 2>/dev/null || true

echo "✅ 기존 프로세스 정리 완료"

# 3. build 디렉토리 보호 설정
echo ""
echo "🛡️ 3단계: build 디렉토리 보호"
echo "----------------------------"

if [ -d "build" ]; then
    # .htaccess 파일 생성 (Apache 보호)
    cat > build/.htaccess << 'EOF'
# Apache 설정: 직접 접근 차단
Options -Indexes
DirectoryIndex disabled
RedirectMatch 301 ^/build/(.*)$ http://localhost:3000/$1
EOF

    # nginx.conf 조각 생성 (참고용)
    cat > build/nginx-block.conf << 'EOF'
# Nginx 설정: build 디렉토리 직접 접근 차단
location /build/ {
    return 301 http://localhost:3000$request_uri;
}
location ~ ^/build/.*\.(html|js|css|png|jpg|gif|svg|ico)$ {
    return 301 http://localhost:3000$request_uri;
}
EOF

    echo "✅ build 디렉토리 보호 설정 완료"
else
    echo "❌ build 디렉토리가 없습니다. 빌드를 먼저 실행합니다."
    npm run build
fi

# 4. React 앱 빌드 확인
echo ""
echo "⚛️ 4단계: React 앱 빌드 확인"
echo "---------------------------"

if [ ! -f "build/index.html" ]; then
    echo "🔄 React 앱 빌드 중..."
    npm run build
    
    if [ -f "build/index.html" ]; then
        echo "✅ React 빌드 완료"
    else
        echo "❌ React 빌드 실패"
        exit 1
    fi
else
    echo "✅ build/index.html 존재 확인"
fi

# 5. 정적 파일 서버 시작
echo ""
echo "🚀 5단계: 정적 파일 서버 시작"
echo "----------------------------"

# 서버 시작
nohup node simple-static-server.js > static-server.log 2>&1 &
STATIC_PID=$!
echo $STATIC_PID > static-server.pid

echo "🔄 서버 시작됨 (PID: $STATIC_PID)"
echo "⏳ 서버 초기화 대기 중..."
sleep 5

# 6. 서버 상태 확인
echo ""
echo "✅ 6단계: 서버 상태 확인"
echo "----------------------"

# 프로세스 확인
if ps -p $STATIC_PID > /dev/null 2>&1; then
    echo "✅ 정적 서버 프로세스 실행 중 (PID: $STATIC_PID)"
else
    echo "❌ 정적 서버 프로세스 종료됨"
    echo "📄 로그 확인:"
    tail -10 static-server.log 2>/dev/null || echo "로그 파일 없음"
    exit 1
fi

# HTTP 응답 확인
echo "🧪 HTTP 응답 테스트 중..."
for i in {1..10}; do
    if curl -s --max-time 3 http://localhost:3000 | grep -q "AWS Demo Factory" 2>/dev/null; then
        echo "✅ React 앱 정상 응답 확인 (시도 $i/10)"
        break
    elif curl -s --max-time 3 http://localhost:3000 | grep -q "Index of" 2>/dev/null; then
        echo "⚠️ 여전히 파일 리스트 표시됨 (시도 $i/10)"
        if [ $i -eq 10 ]; then
            echo "❌ 문제 해결 실패"
            exit 1
        fi
    else
        echo "⏳ 서버 응답 대기 중... (시도 $i/10)"
    fi
    sleep 2
done

# 7. 추가 서버들 시작
echo ""
echo "🔗 7단계: 추가 서버들 시작"
echo "------------------------"

# Bedrock API 서버
if [ -f "server/bedrock-api.js" ]; then
    nohup node server/bedrock-api.js > bedrock-server.log 2>&1 &
    BEDROCK_PID=$!
    echo $BEDROCK_PID > bedrock-server.pid
    echo "✅ Bedrock API 서버 시작됨 (PID: $BEDROCK_PID, 포트: 5001)"
fi

# 백엔드 API 서버
if [ -f "backend-api-server.js" ]; then
    nohup node backend-api-server.js > backend-api.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > backend-server.pid
    echo "✅ 백엔드 API 서버 시작됨 (PID: $BACKEND_PID, 포트: 3001)"
fi

# Python PDF 서버
if [ -d "python-pdf-server" ] && [ -f "python-pdf-server/app.py" ]; then
    cd python-pdf-server
    if [ -d "venv" ]; then
        source venv/bin/activate
        nohup python app.py > ../pdf-server.log 2>&1 &
        PDF_PID=$!
        echo $PDF_PID > ../python-pdf-server.pid
        echo "✅ Python PDF 서버 시작됨 (PID: $PDF_PID, 포트: 5002)"
    fi
    cd ..
fi

# 8. 최종 확인
echo ""
echo "🎯 8단계: 최종 상태 확인"
echo "---------------------"

sleep 3

# 각 서버 응답 확인
echo "🌐 웹 애플리케이션 (포트 3000):"
if curl -s --max-time 5 http://localhost:3000 | grep -q "AWS Demo Factory" 2>/dev/null; then
    echo "   ✅ 정상 - React 앱 응답"
elif curl -s --max-time 5 http://localhost:3000 | grep -q "Index of" 2>/dev/null; then
    echo "   ❌ 문제 - 파일 리스트 표시"
else
    echo "   ⚠️ 응답 없음"
fi

echo "🔗 백엔드 API (포트 3001):"
if curl -s --max-time 5 http://localhost:3001 > /dev/null 2>&1; then
    echo "   ✅ 정상 응답"
else
    echo "   ❌ 응답 없음"
fi

echo "🤖 Bedrock API (포트 5001):"
if curl -s --max-time 5 http://localhost:5001/api/bedrock/test > /dev/null 2>&1; then
    echo "   ✅ 정상 응답"
else
    echo "   ❌ 응답 없음"
fi

echo "🐍 Python PDF (포트 5002):"
if curl -s --max-time 5 http://localhost:5002/health > /dev/null 2>&1; then
    echo "   ✅ 정상 응답"
else
    echo "   ❌ 응답 없음"
fi

echo ""
echo "📊 실행 중인 서버 프로세스:"
ps aux | grep -E "(simple-static-server|bedrock-api|backend-api|app\.py)" | grep -v grep || echo "   관련 프로세스 없음"

echo ""
echo "🎉 정적 파일 서버 문제 해결 완료!"
echo "=================================="
echo "🌐 웹사이트 접속: http://localhost:3000"
echo "📋 로그 확인: tail -f static-server.log"
echo "🔍 상태 확인: ./check-server-status.sh"