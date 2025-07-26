#!/bin/bash

echo "🔍 AWS Demo Factory 서버 상태 확인"
echo "=================================="
echo "📅 확인 시간: $(date)"
echo ""

# 1. 실행 중인 프로세스 확인
echo "🔄 실행 중인 프로세스:"
echo "--------------------"
ps aux | grep -E "(node|python)" | grep -E "(bedrock|backend|static|simple|app\.py)" | grep -v grep || echo "관련 프로세스 없음"
echo ""

# 2. 포트 사용 현황 확인
echo "🌐 포트 사용 현황:"
echo "----------------"
for port in 3000 3001 5001 5002; do
    if lsof -i:$port > /dev/null 2>&1; then
        echo "✅ 포트 $port: 사용 중"
        lsof -i:$port | grep LISTEN
    else
        echo "❌ 포트 $port: 사용 안함"
    fi
done
echo ""

# 3. 서버 응답 테스트
echo "🧪 서버 응답 테스트:"
echo "------------------"

# 포트 3000 (웹 애플리케이션)
if curl -s --max-time 5 http://localhost:3000 | grep -q "AWS Demo Factory" 2>/dev/null; then
    echo "✅ 포트 3000: React 앱 정상 응답"
elif curl -s --max-time 5 http://localhost:3000 | grep -q "Index of" 2>/dev/null; then
    echo "⚠️ 포트 3000: 파일 리스트 표시됨 (문제 상황)"
elif curl -s --max-time 5 http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️ 포트 3000: 응답 있음 (내용 확인 필요)"
else
    echo "❌ 포트 3000: 응답 없음"
fi

# 포트 3001 (백엔드 API)
if curl -s --max-time 5 http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ 포트 3001: 백엔드 API 응답"
else
    echo "❌ 포트 3001: 백엔드 API 응답 없음"
fi

# 포트 5001 (Bedrock API)
if curl -s --max-time 5 http://localhost:5001/api/bedrock/test > /dev/null 2>&1; then
    echo "✅ 포트 5001: Bedrock API 응답"
else
    echo "❌ 포트 5001: Bedrock API 응답 없음"
fi

# 포트 5002 (Python PDF)
if curl -s --max-time 5 http://localhost:5002/health > /dev/null 2>&1; then
    echo "✅ 포트 5002: Python PDF 서버 응답"
else
    echo "❌ 포트 5002: Python PDF 서버 응답 없음"
fi

echo ""

# 4. 파일 시스템 확인
echo "📁 파일 시스템 확인:"
echo "------------------"
echo "📂 현재 디렉토리: $(pwd)"
echo "📄 build/index.html: $([ -f 'build/index.html' ] && echo '존재' || echo '없음')"
echo "📂 build 디렉토리: $([ -d 'build' ] && echo '존재' || echo '없음')"
if [ -d 'build' ]; then
    echo "📊 build 파일 수: $(ls -1 build/ | wc -l)개"
fi
echo ""

# 5. 로그 파일 확인
echo "📋 로그 파일 상태:"
echo "----------------"
for log in static-server.log backend-api.log bedrock-server.log pdf-server.log server-start.log; do
    if [ -f "$log" ]; then
        echo "📄 $log: 존재 ($(wc -l < "$log") 줄)"
        echo "   최근 로그: $(tail -1 "$log" 2>/dev/null || echo '내용 없음')"
    else
        echo "❌ $log: 없음"
    fi
done
echo ""

# 6. PID 파일 확인
echo "🆔 PID 파일 확인:"
echo "---------------"
for pid in static-server.pid backend-server.pid bedrock-server.pid python-pdf-server.pid; do
    if [ -f "$pid" ]; then
        PID_NUM=$(cat "$pid" 2>/dev/null)
        if ps -p "$PID_NUM" > /dev/null 2>&1; then
            echo "✅ $pid: PID $PID_NUM (실행 중)"
        else
            echo "⚠️ $pid: PID $PID_NUM (종료됨)"
        fi
    else
        echo "❌ $pid: 없음"
    fi
done
echo ""

# 7. 웹 서버 설정 확인 (nginx/apache)
echo "🌐 웹 서버 확인:"
echo "-------------"
if command -v nginx > /dev/null 2>&1; then
    echo "📦 Nginx: 설치됨"
    if pgrep nginx > /dev/null; then
        echo "✅ Nginx: 실행 중"
    else
        echo "❌ Nginx: 중지됨"
    fi
else
    echo "❌ Nginx: 설치되지 않음"
fi

if command -v apache2 > /dev/null 2>&1 || command -v httpd > /dev/null 2>&1; then
    echo "📦 Apache: 설치됨"
    if pgrep -f "apache2\|httpd" > /dev/null; then
        echo "✅ Apache: 실행 중"
    else
        echo "❌ Apache: 중지됨"
    fi
else
    echo "❌ Apache: 설치되지 않음"
fi

echo ""
echo "🎯 권장 조치사항:"
echo "================"

# 포트 3000에서 파일 리스트가 보이는 경우
if curl -s --max-time 5 http://localhost:3000 | grep -q "Index of" 2>/dev/null; then
    echo "⚠️ 문제: 포트 3000에서 파일 리스트가 표시됨"
    echo "🔧 해결책:"
    echo "   1. 정적 파일 서버 재시작: ./start-production.sh"
    echo "   2. 웹 서버 설정 확인 (nginx/apache)"
    echo "   3. 포트 3000 프로세스 확인 및 재시작"
elif ! curl -s --max-time 5 http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️ 문제: 포트 3000에서 응답 없음"
    echo "🔧 해결책:"
    echo "   1. 서버 시작: ./start-production.sh"
    echo "   2. 빌드 파일 확인: npm run build"
    echo "   3. 로그 파일 확인: tail -f static-server.log"
else
    echo "✅ 포트 3000 상태 양호"
fi

echo ""
echo "🔍 상세 진단을 위한 명령어:"
echo "========================="
echo "curl -I http://localhost:3000  # HTTP 헤더 확인"
echo "curl -s http://localhost:3000 | head -10  # 응답 내용 확인"
echo "tail -f static-server.log  # 실시간 로그 확인"
echo "netstat -tlnp | grep :3000  # 포트 3000 상세 정보"

echo ""
echo "=================================="
echo "✅ 서버 상태 확인 완료"